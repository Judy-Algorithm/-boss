# GitHub → Vercel → 扫码试玩

游戏已完成 GitHub / Vercel 部署适配，仓库地址为 https://github.com/Judy-Algorithm/-boss 。Vercel 导入和线上部署按本文操作；本地运行方式继续保留。

## 1. 本地检查

使用 Node.js 22（Vercel 也已固定到 22.x），在项目的 `game/` 目录执行：

```sh
npm ci
npm test
npm run build
npm run check:deploy
```

`check:deploy` 检查四个云函数入口、构建页面、模型清单、代码中引用的静态资源、单文件体积，以及真实本机 Key 是否进入公开产物。不会打印 Key。

继续本地开发执行 `npm run dev`，打开终端显示的 localhost 地址。`.env.local` 仍供本地服务使用，不能传到 GitHub。

## 2. 自己推送到 GitHub

推荐把整个 `3DGame` 文件夹作为仓库，保留其下的 `game/` 层级，使用 Git 或 GitHub Desktop 推送。先确认暂存列表：

- 应包含：`game/src/`、`game/server/`、`game/api/`、`game/public/`、`game/scripts/`、`game/tests/`、`game/package.json`、`game/package-lock.json`、`game/vite.config.js`、`game/vercel.json`、`game/index.html`、`game/it-motion.html` 和文档、忽略规则、空白环境模板。
- 不应包含：`.env.local`、其他实际 `.env` 文件、`node_modules/`、`dist/`、`.openai/`、`.vercel/`、根目录 `assets/`、`work/`、`validation/`。这些都有忽略规则，原件仍保存在本机。
- **必须保留 `game/public/`**，其中有实际运行的 GLB、图片和音乐；不能只传源码。

如果使用 GitHub 网页上传，网页不会自动应用本机 `.gitignore`，需要手动排除上述本机文件。不要把含 Key 的整个目录直接拖进去。

## 3. Vercel 导入仓库

导入刚推送的 GitHub 仓库，设置：

| 配置 | 值 |
| --- | --- |
| Root Directory | **`game`** |
| Framework Preset | Vite |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js | 22.x，由 package.json 固定 |

`game/vercel.json` 已保存构建及函数配置；它会在选择 `game` 为 Root Directory 后生效。不要把仓库根目录的脚本包装层当成 Vercel 项目目录。

如果只把 `game/` 的内容作为仓库根目录上传，则 Root Directory 选 `.`；其余设置相同。

## 4. 配置 AI 环境变量

在 Vercel 项目环境变量中添加以下三个变量；正式发布启用 Production，若需要预览环境测试再同时启用 Preview：

| 名称 | 内容 |
| --- | --- |
| `AI_API_KEY` | 你自己的模型 API Key，手动从本机配置复制，不放在代码或文档里 |
| `AI_BASE_URL` | `https://vibetoken.cn/v1` |
| `AI_MODEL` | `deepseek/deepseek-v4.1-flash-1017`，或账户内可用的精确聊天模型 ID |

这些是服务端变量，**不要加 `VITE_` 前缀**。首次部署前填好；以后修改环境变量需要重新部署才会生效。本机 `.env.local` 不会自动同步到 Vercel。

四个已适配的 Node.js Functions：

| 地址 | 用途 |
| --- | --- |
| `GET /api/ai/status` | 仅报告是否配置完整，不回传 Key 或配置值 |
| `POST /api/private-chat` | 私聊及私聊敲击/投喂 |
| `POST /api/game-dialogue` | 正常游戏的冒头、敲击、投喂台词 |
| `POST /api/round-review` | 根据本局表现生成结算鼓励 |

三类生成均支持 SSE 流式逐字显示。Vercel 和本地 Vite 复用同一套人设、计分校验、提示词、错误处理与生成逻辑；AI 不改变计分或称号区间。服务端读取已解析的 Vercel 请求正文，也支持本地原始请求流。

函数最长运行时间配置为30秒，上游生成仍使用现有12秒超时。内存限流按实例工作，Vercel 扩容后不是全局额度硬上限。AI 调用继续消耗模型账户余额。

## 5. 部署后验收，再生成二维码

1. 打开正式网址，确认首页、十名角色、背景、道具及音乐资源都能加载。
2. 打开正式网址的 `/api/ai/status`，应显示 `{"configured":true}`；这只验证变量齐全，仍需实际触发一次 AI 回复。
3. 开一局，检查得分、负分、流式角色台词、结算称号与 AI 鼓励；返回后打开私聊，测试发消息、投喂、敲击。
4. 在手机浏览器、微信扫码及移动网络下测试加载速度和触控。首次播放音乐需玩家点开始，这是浏览器音频交互要求。
5. 确认正式生产网址无需登录 Vercel 即可访问，使用该网址生成二维码。避免使用受部署保护的预览网址。以后更新同一个正式域名，二维码无需更换。

人物自定义、音乐设置和称号轮换记录保存在各玩家自己的浏览器中；本机已有的设置不会自动变成所有玩家的默认值。若要统一默认设定，应修改源码中的默认角色资料。

## 常见问题

- 页面能打开但 AI 未配置：检查 Root Directory 是不是 `game`、三个服务端环境变量是否生效，以及变量修改后是否重新部署。
- `/api/...` 返回 HTML 或404：检查 `game/api/` 是否上传。不要只上传 `dist/`，也不要添加把所有请求都重写到 `index.html` 的规则。
- AI 未连通：检查模型 ID、账户额度及 Vercel 函数日志。日志中不要输出 Key、Authorization 或完整环境变量。
- 手机模型缺失：确认 `game/public/models/` 全部提交，文件名大小写没有改变。

官方参考：[Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)、[Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js)、[环境变量](https://vercel.com/docs/environment-variables)。
