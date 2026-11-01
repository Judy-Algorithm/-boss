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

微信原生3D版位于 **`wechat/`**，支持中英文切换：[运行与上架步骤](wechat/README.md)。在根目录执行 `npm run build:wechat` 后，微信开发者工具以“小游戏”导入 `wechat/`。网页版首页也有 `English / 中文` 开关，`?lang=en` 可直接打开英文版；网页AI台词和结算会随选择请求英文回复。

Git 忽略规则已排除依赖、构建产物、密钥、本机托管信息、原始生成资产及调试输出；保留游戏运行所需的 `game/public/`。原始本机文件没有被删除。
