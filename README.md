# iskill-music-beats

当用户要分析音乐/BGM 的节拍点、BPM，或 iskill-video-clipper 剪辑时有 BGM 需要把转场/切点对准节拍（卡点视频）时使用。触发词：节拍分析、卡点、beat、BPM、对拍、音乐节拍。输出 beats.json（节拍时间轴+强度+候选转场点）与可选节拍确认音轨（click）。基于 librosa，本地运行免费。

完整用法见 [SKILL.md](SKILL.md)。

> 依赖同步：本仓库含 iskill 共享真源的 vendored 副本（清单见 `package.json` 的 `iskillDeps`），**不要手改**。使用前请同时安装 iskill-dep-sync：对 agent 说「请帮我安装 Skill：aispin/iskill-dep-sync」；用法见 SKILL.md「依赖同步」节。
