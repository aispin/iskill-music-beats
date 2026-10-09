---
name: iskill-music-beats
summary: 音乐节拍点分析——检测 BGM 的 BPM、节拍时间轴与强节拍，输出 JSON 供剪辑技能卡点。
description: 当用户要分析音乐/BGM 的节拍点、BPM，或 iskill-video-clipper 剪辑时有 BGM 需要把转场/切点对准节拍（卡点视频）时使用。触发词：节拍分析、卡点、beat、BPM、对拍、音乐节拍。输出 beats.json（节拍时间轴+强度+候选转场点）与可选节拍确认音轨（click）。基于 librosa，本地运行免费。
---

# iskill-music-beats

检测音乐节拍点，输出机器可读的 `beats.json`，供下游剪辑技能（iskill-video-clipper）把**转场/切点卡在节拍上**。

```
六步工作流：… → [6]成片(iskill-video-clipper)
              └─ 有 BGM 时 ← 本 skill（转场对准节拍点）
```

## 一次性环境

librosa 已装在 managed venv（`/Users/lv/.workbuddy/binaries/python/envs/default`）。若缺失：

```bash
/Users/lv/.workbuddy/binaries/python/envs/default/bin/pip install -q librosa soundfile
```

## 快速开始

```bash
PY=/Users/lv/.workbuddy/binaries/python/envs/default/bin/python
# 基本用法：BGM 全曲分析
$PY scripts/beat_detect.py bgm.m4a

# 只分析前 60s（BGM 循环铺底时够用，速度快很多）
$PY scripts/beat_detect.py bgm.m4a --end 60

# 生成节拍确认音轨（每个节拍一声 blip，强节拍高频、弱节拍低频）
$PY scripts/beat_detect.py bgm.m4a --click bgm.click.wav

# 指定输出与候选转场点数量
$PY scripts/beat_detect.py bgm.m4a --json beats.json --top 16
```

## 输出 JSON 结构

```json
{
  "file": "bgm.m4a",
  "analyzed_from": 0.0,
  "duration": 183.5,
  "bpm": 128.0,
  "beat_interval": 0.469,
  "beats": [{"t": 0.47, "strength": 0.82}, ...],
  "strong_beats": [0.47, 2.35, ...],
  "cut_candidates": [2.34, 4.69, ...],
  "note": ""
}
```

- **beats**：全部节拍点（秒）+ 强度（该点 onset 包络均值，越大越"重"）
- **strong_beats**：强度 ≥ 中位数的节拍，**优先放转场**
- **cut_candidates**：等距采样 top N 个强节拍，直接当分镜切点候选池
- **note**：非空时是警告（如"无明确节拍的氛围曲，已退化为 onset 强峰"），要转告用户
- **beat_interval**：平均节拍间隔——按倍数取段长（1x/2x/4x）可做出"整拍"节奏感

## 下游卡点约定（供 iskill-video-clipper 等调用）

1. **段边界卡节拍**：分镜每段时长不要自由发挥，取 `beat_interval` 的整数倍，段边界对齐最近的 `strong_beats`/`cut_candidates`
2. **xfade 转场对准节拍**：xfade 的转场中心落在 `offset + T/2`，要转场打在节拍 `t_b` 上 → `offset = t_b - T/2`（T 为转场时长，clamp ≥ 0）
3. **硬切卡点**：concat 硬切的段边界直接用 `cut_candidates`
4. **验证**：`--click` 生成确认音轨，与成片并播一遍（或看抽帧转场是否落拍）确认没漂
5. 无节拍曲（氛围/pad 类）：退化的 onset 强峰依然可用作"画面动势点"，但不必强求卡点，fade 转场更自然

## 已知实锤

- librosa `beat_track` 对 80-160 BPM 的常规流行/电子曲很准；对无鼓点的氛围曲会退化（脚本已自动兜底并在 note 里说明）
- `--end` 截断分析大幅提速；但**段边界换算要用绝对时间**——脚本输出的 t 已经加回 `analyzed_from` 偏移，直接用，不要再减
- ffmpeg 提取的 BGM（m4a/mp3/wav）和视频文件（取音轨）都能直接喂
- 22050Hz 单声道分析足够，不要改高采样率拖慢速度

## 依赖同步

本仓库 `promo-page/assets/{app.js,style.css,icons.js}` 是 [iskill-promo-page](https://github.com/aispin/iskill-promo-page)
模板引擎的 vendored 副本（锁定版本见 `package.json` 的 `iskillDeps`），**不要手改**——
去真源仓库改并升 `@iskill-version`，再用 iskill-utils 同步回来。本机未装该工具时，先安装：对 agent 说「请帮我安装 Skill：aispin/iskill-utils」，或按下方自举命令现场拉取：

```bash
T="$HOME/.workbuddy/skills/iskill-utils/scripts/skill-deps.mjs"
[ -f "$T" ] || { TMP="$(mktemp -d)"; curl -fsSL "https://raw.githubusercontent.com/aispin/iskill-utils/HEAD/scripts/skill-deps.mjs" -o "$TMP/skill-deps.mjs"; T="$TMP/skill-deps.mjs"; }
node "$T" check "$(pwd)"     # 漂移检测；node "$T" sync "$(pwd)" 恢复/升级；node "$T" env "$(pwd)" 冷启动自检
```
