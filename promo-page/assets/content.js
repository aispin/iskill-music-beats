/* ============================================================================
 * iskill-music-beats · 落地页内容
 * 事实来源：本技能 SKILL.md / scripts/beat_detect.py
 * ==========================================================================*/
window.PROMO = {
  name: "ISKILL-MUSIC-BEATS",
  brand: "#7c5cff",
  brand2: "#f472b6",
  repo: "https://github.com/aispin/iskill-music-beats",
  repoLabel: "aispin/iskill-music-beats",
  license: "MIT",

  /* Python + librosa/soundfile，无平台专属命令 → all */
  platform: "all",

  lang: {
    /* ── 中文 ───────────────────────────────────────────────────────── */
    zh: {
      meta: {
        title: "ISKILL-MUSIC-BEATS · 让转场卡在鼓点上",
        description: "检测 BGM 的 BPM 与节拍时间轴，输出机器可读的 beats.json（节拍 + 强度 + 候选转场点），供剪辑技能把转场 / 切点对准节拍。"
      },
      a11y: { skip: "跳到主要内容" },
      ui: { copy: "复制", copied: "已复制", failed: "复制失败" },
      nav: { features: "能力", shots: "截图", how: "上手", faq: "问答" },

      hero: {
        badge: "AI 技能",
        titlePre: "让每一次转场，",
        titleAccent: "都卡在鼓点上",
        titlePost: "",
        sub: "检测 BGM 的 BPM 与节拍时间轴，输出机器可读的 beats.json —— 包含全部节拍点、强度、强节拍和候选转场点。下游剪辑技能（如 iskill-video-clipper）据此把画面切点和 xfade 转场对准节拍。基于 librosa，本地运行、免费。",
        ctaPrimary: "复制安装提示词",
        ctaSecondary: "看源码",
        meta1: "本地运行",
        meta2: "输出机器可读 JSON",
        meta3: "MIT 许可"
      },
      terminal: {
        title: "zsh — iskill-music-beats",
        lines: [
          [{ t: "$ ", c: "p" }, { t: "python scripts/beat_detect.py bgm.m4a --end 60 --click bgm.click.wav", c: "k" }],
          [{ t: "[beat_detect] 节拍确认音轨 → ", c: "s" }, { t: "bgm.click.wav", c: "s" }],
          [{ t: '{"file": "bgm.m4a", "bpm": 128.0, "beat_interval": 0.469, "note": ""}', c: "s" }],
          [{ t: "[beat_detect] 节拍 ", c: "s" }, { t: "128", c: "k" }, { t: " 个 | 强节拍 ", c: "s" }, { t: "61", c: "k" }, { t: " 个 | 候选转场点 ", c: "s" }, { t: "24", c: "k" }, { t: " 个", c: "s" }],
          [{ t: "[beat_detect] JSON → ", c: "s" }, { t: "bgm.beats.json", c: "s" }]
        ]
      },

      stats: [
        { value: "80–160 BPM", label: "librosa 最准区间", note: "常规流行 / 电子曲；氛围曲会退化并写进 note" },
        { value: "22050 Hz", label: "分析采样率", note: "单声道足够，调高只会拖慢速度" },
        { value: "3 层", label: "节拍分层", note: "beats / strong_beats / cut_candidates" },
        { value: "24", label: "候选转场点（默认 --top）", note: "强节拍等距采样，--top 可调" }
      ],

      compare: {
        eyebrow: "对比",
        title: "以前 vs 现在",
        sub: "",
        before: {
          title: "凭耳朵卡点",
          items: [
            "在时间线上反复拖，凭感觉找鼓点，来回试",
            "转场总是差半拍，成片「踩不准」",
            "换个 BGM 又得从头听一遍"
          ]
        },
        after: {
          title: "用这个技能",
          items: [
            "一次分析输出 beats.json，BPM 与时间轴一目了然",
            "strong_beats / cut_candidates 直接当切点候选池",
            "--click 生成确认音轨，并播一遍就能验证没漂"
          ]
        }
      },

      features: {
        eyebrow: "能力",
        title: "它能做什么",
        sub: "",
        items: [
          { icon: "gauge", title: "BPM + 时间轴", desc: "一次给出 bpm、beat_interval 与每个节拍点（带强度），机器与人都能读。" },
          { icon: "layers", title: "三层节拍输出", desc: "beats 全量、strong_beats 优先放转场、cut_candidates 直接当分镜切点候选池。" },
          { icon: "bolt", title: "卡点换算约定", desc: "段边界取 beat_interval 的整数倍；xfade 要对准节拍 t 就用 offset = t − T/2。" },
          { icon: "refresh", title: "截断提速 + 退化兜底", desc: "--end 60 只分析前 60s 大幅提速；无明确节拍的氛围曲自动退化为 onset 强峰，并在 note 里说明。" },
          { icon: "monitor", title: "确认音轨", desc: "--click 生成节拍 blip（强节拍高频、弱节拍低频），与成片并播即可确认没漂。" },
          { icon: "branch", title: "对接下游剪辑", desc: "beats.json 是给 iskill-video-clipper 等技能消费的接口，卡点逻辑写死在约定里。" }
        ]
      },

      showcase: {
        eyebrow: "实拍",
        title: "看一眼真东西",
        sub: "",
        items: []
      },

      steps: {
        eyebrow: "上手",
        title: "三步跑起来",
        sub: "",
        items: [
          { title: "交给 AI 装", desc: "把这句话粘进对话框，agent 会自己拉代码、读文档，再告诉你用法。", codeKey: "install" },
          { title: "确认 librosa", desc: "librosa 与 soundfile 已装在 managed venv；缺了就用这条补上。", codeName: "shell", code: "/Users/lv/.workbuddy/binaries/python/envs/default/bin/pip install -q librosa soundfile" },
          { title: "分析一条 BGM", desc: "只分析前 60s 更快，同时生成节拍确认音轨。", codeName: "shell", code: "/Users/lv/.workbuddy/binaries/python/envs/default/bin/python scripts/beat_detect.py bgm.m4a --end 60 --click bgm.click.wav" }
        ]
      },

      faq: {
        eyebrow: "问答",
        title: "常见问题",
        items: [
          { q: "需要联网或 API key 吗？", a: "都不需要。基于 librosa 在本地运行，免费、离线可跑。" },
          { q: "Windows / Linux 能用吗？", a: "可以。脚本是纯 Python（librosa + soundfile），没有平台专属命令；只要有能 import librosa 的 Python 环境即可。" },
          { q: "无鼓点的氛围曲准吗？", a: "librosa 的 <code>beat_track</code> 对 80–160 BPM 的常规曲很准，对氛围 / pad 类会退化。脚本会自动兜底为 onset 强峰，并在 <code>note</code> 字段里给出警告，记得转告使用者。" },
          { q: "用 --end 截断后，时间戳要自己加偏移吗？", a: "不用。输出的 <code>t</code> 已经把 <code>analyzed_from</code> 的偏移加回去了，直接用绝对时间，别再做减法。" },
          { q: "采样率要调到 44.1kHz 吗？", a: "不必要。22050Hz 单声道分析已经够用，调高只会拖慢速度。" },
          { q: "能分析视频里的音轨吗？", a: "可以。ffmpeg 提取出的 BGM（m4a/mp3/wav）和从视频取出的音轨都能直接喂给脚本。" }
        ]
      },

      cta: { title: "把 BGM 的鼓点交出来", desc: "一行命令拿到 beats.json，转场对准节拍。", primary: "去 GitHub 看看", secondary: "复制安装提示词" },
      footer: { license: "MIT 许可", madeWith: "由 iskill-promo-page 生成" }
    },

    /* ── English ────────────────────────────────────────────────────── */
    en: {
      meta: {
        title: "ISKILL-MUSIC-BEATS · Land every transition on the beat",
        description: "Detect a BGM's BPM and beat timeline and emit machine-readable beats.json (beats + strength + cut candidates) so editing skills can snap transitions to the beat."
      },
      a11y: { skip: "Skip to content" },
      ui: { copy: "Copy", copied: "Copied", failed: "Copy failed" },
      nav: { features: "Features", shots: "Screens", how: "Get started", faq: "FAQ" },

      hero: {
        badge: "AI skill",
        titlePre: "Land every transition ",
        titleAccent: "on the beat",
        titlePost: "",
        sub: "Analyse a BGM's BPM and beat timeline into a machine-readable beats.json — every beat with its strength, the strong beats, and a pool of cut candidates. Downstream editing skills (like iskill-video-clipper) use it to snap cuts and xfade transitions onto the beat. Built on librosa, runs locally and free.",
        ctaPrimary: "Copy install prompt",
        ctaSecondary: "View source",
        meta1: "Runs locally",
        meta2: "Machine-readable JSON",
        meta3: "MIT licensed"
      },
      terminal: {
        title: "zsh — iskill-music-beats",
        lines: [
          [{ t: "$ ", c: "p" }, { t: "python scripts/beat_detect.py bgm.m4a --end 60 --click bgm.click.wav", c: "k" }],
          [{ t: "[beat_detect] click track → ", c: "s" }, { t: "bgm.click.wav", c: "s" }],
          [{ t: '{"file": "bgm.m4a", "bpm": 128.0, "beat_interval": 0.469, "note": ""}', c: "s" }],
          [{ t: "[beat_detect] beats ", c: "s" }, { t: "128", c: "k" }, { t: " | strong ", c: "s" }, { t: "61", c: "k" }, { t: " | cut candidates ", c: "s" }, { t: "24", c: "k" }],
          [{ t: "[beat_detect] JSON → ", c: "s" }, { t: "bgm.beats.json", c: "s" }]
        ]
      },

      stats: [
        { value: "80–160 BPM", label: "librosa's sweet spot", note: "pop / electronic; ambient tracks degrade and say so in note" },
        { value: "22050 Hz", label: "analysis sample rate", note: "mono is enough — higher only slows it down" },
        { value: "3 layers", label: "of beat output", note: "beats / strong_beats / cut_candidates" },
        { value: "24", label: "cut candidates (default --top)", note: "evenly sampled strong beats; tune with --top" }
      ],

      compare: {
        eyebrow: "Comparison",
        title: "Before vs after",
        sub: "",
        before: {
          title: "Cutting by ear",
          items: [
            "Scrub the timeline hunting for the drop, trial and error",
            "Transitions land half a beat off; the edit never quite locks",
            "Swap the BGM and it is back to listening from scratch"
          ]
        },
        after: {
          title: "With this skill",
          items: [
            "One pass emits beats.json with BPM and full timeline",
            "strong_beats / cut_candidates become a ready pool of cut points",
            "--click generates a confirmation track; play them together to check for drift"
          ]
        }
      },

      features: {
        eyebrow: "Features",
        title: "What it does",
        sub: "",
        items: [
          { icon: "gauge", title: "BPM + timeline", desc: "One run gives bpm, beat_interval and every beat point with its strength — readable by machines and humans alike." },
          { icon: "layers", title: "Three layers of beats", desc: "beats in full, strong_beats for transitions, cut_candidates as a direct pool of edit points." },
          { icon: "bolt", title: "Snapping conventions", desc: "Take segment lengths as integer multiples of beat_interval; to land an xfade on beat t, use offset = t − T/2." },
          { icon: "refresh", title: "Truncate to speed up, degrade safely", desc: "--end 60 analyses only the first 60s for a big speed-up; beatless ambient tracks fall back to onset peaks, flagged in note." },
          { icon: "monitor", title: "Confirmation track", desc: "--click writes a blip per beat (high for strong, low for weak); play it against the cut to confirm no drift." },
          { icon: "branch", title: "Built for downstream editors", desc: "beats.json is the contract consumed by iskill-video-clipper and friends, with the snapping maths baked in." }
        ]
      },

      showcase: {
        eyebrow: "Screens",
        title: "See the real thing",
        sub: "",
        items: []
      },

      steps: {
        eyebrow: "Get started",
        title: "Up and running in three steps",
        sub: "",
        items: [
          { title: "Let your agent install it", desc: "Paste the line into the chat — it clones the repo, reads the docs, and tells you how to use it.", codeKey: "install" },
          { title: "Confirm librosa", desc: "librosa and soundfile are already in the managed venv; if missing, run this.", codeName: "shell", code: "/Users/lv/.workbuddy/binaries/python/envs/default/bin/pip install -q librosa soundfile" },
          { title: "Analyse a BGM", desc: "Only the first 60s is much faster, and generate a confirmation click track at the same time.", codeName: "shell", code: "/Users/lv/.workbuddy/binaries/python/envs/default/bin/python scripts/beat_detect.py bgm.m4a --end 60 --click bgm.click.wav" }
        ]
      },

      faq: {
        eyebrow: "FAQ",
        title: "Frequently asked",
        items: [
          { q: "Does it need network or an API key?", a: "Neither. It runs on librosa locally — free and offline." },
          { q: "Does it work on Windows / Linux?", a: "Yes. The script is pure Python (librosa + soundfile) with no platform-specific commands; any Python environment that can import librosa will do." },
          { q: "How accurate is it on beatless ambient music?", a: "librosa's <code>beat_track</code> is accurate for typical 80–160 BPM tracks and degrades on ambient/pad material. The script falls back to onset peaks and warns you in the <code>note</code> field — relay that to the user." },
          { q: "Do I add an offset after truncating with --end?", a: "No. The emitted <code>t</code> values already have the <code>analyzed_from</code> offset added, so use the absolute times as-is — do not subtract again." },
          { q: "Should I raise the sample rate to 44.1kHz?", a: "No need. 22050 Hz mono is enough for analysis; raising it only slows things down." },
          { q: "Can it analyse audio from a video?", a: "Yes. BGM extracted by ffmpeg (m4a/mp3/wav) and audio tracks pulled from video can both be fed in directly." }
        ]
      },

      cta: { title: "Get the beats out of that BGM", desc: "One command for beats.json, then snap your transitions.", primary: "Open on GitHub", secondary: "Copy install prompt" },
      footer: { license: "MIT licensed", madeWith: "Built with iskill-promo-page" }
    }
  }
};
