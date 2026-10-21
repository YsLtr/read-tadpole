# ReadTadpole（阅读蝌蚪）

**readfrog lite · 阅读蛙青春版** — 开源的 AI 浏览器扩展，做双语网页翻译与视频字幕。

ReadTadpole 把网页、YouTube / Netflix / X 上的内容翻成你的母语，保留原文对照，让你在真实语境里读外语。翻译走你自己配置的 AI 服务商（内置模型、纯翻译服务或自建端点），扩展本身不锁死任何一家。

## ✨ Features

- **双语网页翻译**：原文与译文对照，支持仅译文模式、悬停翻译短段落、按语言或站点自动翻译。
- **视频字幕翻译**：YouTube、Netflix、X 的字幕逐句翻译，可下载原文与译文字幕；没有字幕的视频可用 AI 生成。
- **划词工具条**：选中即翻译，可自定义 AI 动作（词典、句子分析、改写等），结果可在弹窗内固定、拖动、调整大小。
- **输入框翻译**：在网页评论框、编辑器里直接翻译你正在写的内容。
- **朗读（TTS）**：用系统语音朗读原文或译文，可按语言挑选音色。
- **自定义样式与站点规则**：译文外观（含自定义 CSS）、站点适配规则、快捷键与界面语言均可调。

## 🚀 Getting Started

### Prerequisites

- Node.js 22+
- pnpm 12

### Installation

源码构建：

```bash
pnpm install
pnpm build
```

然后在 `chrome://extensions` 打开开发者模式，选择「加载已解压的扩展程序」，指向 `.output/chrome-mv3`。

### Development

```bash
pnpm install
pnpm dev            # 开发模式，wxt 自动加载扩展
pnpm build          # 生产构建（Chrome）
pnpm build:edge     # Edge
pnpm build:firefox  # Firefox
pnpm zip            # 打包成商店上传用的 zip
```

## 🤝 Contributing

- 提交信息遵循 conventional commit（如 `fix(subtitles): ...`），PR 标题同样使用该格式。
- 面向用户的改动请在 `.changeset/` 下补一条 `@read-tadpole/extension` 的 changeset。
- 构建说明见 [AGENTS.md](./AGENTS.md)。

### 品牌素材

图标与应用内标志都由脚本生成，改配色或改形状后重跑即可，不要手改 PNG：

```bash
python scripts/generate-icons.py     # public/icon/*.png 与 src/assets/icons/read-tadpole.png
python scripts/refresh-demo-art.py   # src/assets/demo/*.png 里的标志
```

蝌蚪（圆头 + 渐细摆尾）用深青画在米白底上；工具栏激活态换成品牌金底，对比度仍在 4.9:1 以上。

## 📜 License

[GPL-3.0](./LICENSE)
