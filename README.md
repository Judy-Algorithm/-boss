# 鼠鼠大BOSS

手机竖屏 Three.js / Vite 办公室小游戏，支持十名角色、敲击/投喂、角色自定义、AI 台词、私聊与 AI 结算评语。

运行项目位于 **`game/`**，模型、贴图、头像、背景、字体与音频均在 `game/public/`。

```sh
cd game
npm ci
npm run dev
```

AI 本地配置：将 `game/.env.local.example` 复制为 `game/.env.local`，仅在本机填写 Key。

准备 GitHub / Vercel：[部署步骤](game/DEPLOYMENT.md)。Vercel 的 **Root Directory 选 `game`**。

Git 忽略规则已排除依赖、构建产物、密钥、本机托管信息、原始生成资产及调试输出；保留游戏运行所需的 `game/public/`。原始本机文件没有被删除。
