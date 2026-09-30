#!/usr/bin/env python3
"""
iskill-music-beats — 音乐节拍点分析

检测 BGM 的节拍（beats）、BPM、节拍强度，输出 JSON 供下游剪辑技能
（如 iskill-video-clipper）把转场/切点对准节拍。

用法:
  python beat_detect.py <audio文件> [--json out.json] [--click click.wav]
                        [--start 0] [--end 60] [--top 24]

输出 JSON 结构:
{
  "file": "...",
  "duration": 12.3,          # 实际分析的音频时长（秒）
  "bpm": 128.0,
  "beat_interval": 0.469,    # 平均节拍间隔（秒）
  "beats": [{"t": 0.47, "strength": 0.82}, ...],   # 全部节拍点
  "strong_beats": [0.47, ...],  # 强节拍（强度>=中位数），适合放转场
  "cut_candidates": [2.34, ...] # 按 --top 挑出的最佳转场点（强节拍等距采样）
}

依赖: librosa + soundfile（managed venv 里已装；缺了就 pip install librosa）
"""
import argparse
import json
import math
import sys

import numpy as np

try:
    import soundfile as sf
except ImportError:
    sf = None


def fail(msg: str, code: int = 1):
    print(f"[beat_detect] 错误: {msg}", file=sys.stderr)
    sys.exit(code)


def make_click(beats, strength, sr=44100, click_dur=0.05):
    """生成节拍确认音轨：每个节拍一声短促 sine blip，强节拍频率更高。"""
    if sf is None:
        return None
    beats = [float(t) for t in np.atleast_1d(beats)]
    strength = [float(s) for s in np.atleast_1d(strength)]
    if not beats:
        return None
    total = int((beats[-1] + 0.5) * sr)
    audio = np.zeros(total, dtype=np.float32)
    n = int(click_dur * sr)
    for t, s in zip(beats, strength):
        start = int(t * sr)
        if start + n > total:
            n_i = total - start
        else:
            n_i = n
        if n_i <= 0:
            continue
        freq = 1600.0 if s >= np.median(strength) else 1000.0
        env = np.exp(-np.linspace(0, 8, n_i))  # 快速衰减
        wave = np.sin(2 * np.pi * freq * np.arange(n_i) / sr) * env * 0.6
        audio[start:start + n_i] += wave.astype(np.float32)
    peak = np.max(np.abs(audio)) or 1.0
    return audio / peak * 0.9


def pick_cut_candidates(beats, strength, top):
    """从强节拍中等距挑 top 个候选转场点（避开首尾 0.5s）。"""
    strong = [(t, s) for t, s in zip(beats, strength)
              if 0.5 <= t and s >= np.median(strength)]
    if not strong:
        strong = [(t, s) for t, s in zip(beats, strength) if 0.5 <= t]
    if not strong:
        return []
    if len(strong) <= top:
        return [round(t, 3) for t, _ in strong]
    # 等距采样 top 个
    idx = np.linspace(0, len(strong) - 1, top).round().astype(int)
    return [round(strong[i][0], 3) for i in sorted(set(idx))]


def main():
    ap = argparse.ArgumentParser(description="音乐节拍点分析 → beats.json")
    ap.add_argument("audio", help="音频/视频文件（有音轨即可）")
    ap.add_argument("--json", dest="json_out", help="输出 JSON 路径（默认 <audio>.beats.json）")
    ap.add_argument("--click", help="可选：生成节拍确认音轨 wav（blip 对齐节拍，听一遍即知检测准不准）")
    ap.add_argument("--start", type=float, default=0.0, help="只分析音频的 start 秒之后")
    ap.add_argument("--end", type=float, default=0.0, help="只分析到 end 秒（0=到结尾）。BGM 只用前 30-60s 时可截断加速")
    ap.add_argument("--top", type=int, default=24, help="cut_candidates 候选转场点数量（默认 24）")
    args = ap.parse_args()

    import librosa

    path = args.audio
    offset = max(args.start, 0.0)
    duration_total = librosa.get_duration(path=path)
    if duration_total is None or math.isnan(duration_total):
        fail("无法读取音频时长，文件可能损坏或无音轨")
    if offset >= duration_total - 0.5:
        fail(f"--start {offset} 超出音频时长 {duration_total:.1f}s")

    # load: offset 截断加速；单声道足够（节拍检测不需要立体声）
    y, sr = librosa.load(path, sr=22050, mono=True,
                         offset=offset,
                         duration=(args.end - offset) if args.end > offset else None)
    if len(y) < sr * 2:
        fail("有效音频不足 2 秒")

    # 节拍追踪
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr, units="frames")
    if len(beat_frames) < 2:
        # 兜底：纯氛围/无明确节奏的曲子，退化为 onset 强峰
        oenv = librosa.onset.onset_strength(y=y, sr=sr)
        peaks = librosa.util.peak_pick(oenv, pre_max=6, post_max=6, pre_avg=12, post_avg=12, delta=0.4, wait=12)
        beat_times = librosa.frames_to_time(peaks, sr=sr)
        bpm = 0.0
        note = "无明确节拍（氛围/自由节奏曲），已退化为 onset 强峰作为切点参考"
    else:
        beat_times = librosa.frames_to_time(beat_frames, sr=sr)
        bpm = float(np.atleast_1d(tempo)[0])
        note = ""

    # 每个节拍的强度 = 该点附近 onset 包络均值
    oenv = librosa.onset.onset_strength(y=y, sr=sr)
    frame_per_sec = sr / 512  # onset 默认 hop=512
    strengths = []
    for t in beat_times:
        f = int(t * frame_per_sec)
        lo, hi = max(0, f - 2), min(len(oenv), f + 3)
        strengths.append(float(np.mean(oenv[lo:hi])) if hi > lo else 0.0)

    beat_times_abs = [round(float(t) + offset, 3) for t in beat_times]
    interval = round(float(np.mean(np.diff(beat_times))), 3) if len(beat_times) > 1 else 0.0

    result = {
        "file": path,
        "analyzed_from": round(offset, 3),
        "duration": round(duration_total, 3),
        "analyzed_duration": round(float(len(y) / sr), 3),
        "bpm": round(bpm, 1),
        "beat_interval": interval,
        "beats": [{"t": t, "strength": round(s, 3)}
                  for t, s in zip(beat_times_abs, strengths)],
        "strong_beats": [t for t, s in zip(beat_times_abs, strengths)
                         if s >= float(np.median(strengths))] if beat_times_abs else [],
        "cut_candidates": pick_cut_candidates(beat_times_abs, strengths, args.top),
        "note": note,
    }

    out_path = args.json_out or (path.rsplit(".", 1)[0] + ".beats.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    if args.click:
        click_audio = make_click(beat_times, np.array(strengths) if strengths else np.array([0.0]))
        if click_audio is not None:
            sf.write(args.click, click_audio, 22050)
            print(f"[beat_detect] 节拍确认音轨 → {args.click}")

    print(json.dumps({k: result[k] for k in
                      ("file", "bpm", "beat_interval", "note")},
                     ensure_ascii=False))
    print(f"[beat_detect] 节拍 {len(result['beats'])} 个 | 强节拍 {len(result['strong_beats'])} 个"
          f" | 候选转场点 {len(result['cut_candidates'])} 个")
    print(f"[beat_detect] JSON → {out_path}")


if __name__ == "__main__":
    main()
