# ReadTadpole（阅读蝌蚪）

**readfrog lite · 阅读蛙青春版** — 开源的 AI 浏览器扩展，做双语网页翻译与视频字幕。

本仓库是 [阅读蛙（read-frog）](https://github.com/mengxi-ream/read-frog) 的精简版，只保留核心的网页与字幕翻译。

## 🔗 上游完整版

**完整版：[mengxi-ream/read-frog](https://github.com/mengxi-ream/read-frog)** — 功能齐全、持续维护。

本仓库不接收 issue、PR 或其他贡献；问题反馈、功能建议与参与开发，请统一前往上游仓库。

## 📦 安装

从 [Releases](https://github.com/YsLtr/read-tadpole/releases) 下载对应浏览器的 zip：`read-tadpole-<版本>-chrome.zip`、`-edge.zip`、`-firefox.zip`。

zip 根目录就是扩展本体（直接是 `manifest.json`、`assets/` 等），解压后：

- **Chrome / Edge**：打开 `chrome://extensions`，开启「开发者模式」→「加载已解压的扩展程序」→ 选中解压出来的目录。
- **Firefox**：打开 `about:debugging#/runtime/this-firefox` →「临时载入附加组件」→ 选目录里的 `manifest.json`。

从源码构建见 [AGENTS.md](./AGENTS.md)。

## ✨ Features

- **双语网页翻译**：原文与译文对照，支持仅译文模式、悬停翻译短段落、按语言或站点自动翻译。
- **视频字幕翻译**：YouTube、Netflix、X 的字幕逐句翻译，可下载原文与译文字幕；没有字幕的视频可用 AI 生成。
- **划词工具条**：选中即翻译，可自定义 AI 动作（词典、句子分析、改写等），结果可在弹窗内固定、拖动、调整大小。
- **输入框翻译**：在网页评论框、编辑器里直接翻译你正在写的内容。
- **朗读（TTS）**：用系统语音朗读原文或译文，可按语言挑选音色。
- **自定义样式与站点规则**：译文外观（含自定义 CSS）、站点适配规则、快捷键与界面语言均可调。

## 🎨 品牌素材

图标与应用内标志都由脚本生成，改配色或改形状后重跑即可，不要手改 PNG：

```bash
python scripts/generate-icons.py     # public/icon/*.png 与 src/assets/icons/read-tadpole.png
python scripts/refresh-demo-art.py   # src/assets/demo/*.png 里的标志
```

蝌蚪（圆头 + 渐细摆尾）用深青画在米白底上；工具栏激活态换成品牌金底，对比度仍在 4.9:1 以上。

## 📜 License

[GPL-3.0](./LICENSE)
