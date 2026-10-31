# IT 救援侠动画样板

开发入口：<http://localhost:5173/it-motion.html>。独立稳定预览：<http://localhost:5175/it-motion.html>。只在本地运行，与主游戏场景调整分开。

## 本次资产

- 新的正面空手 A 姿势参考图：`assets/references/it-animation/it-neutral-a-pose-v1.png`。由内置 image_gen 按原 IT 外观制作，双眼睁开，闭嘴微笑。提示词与生成来源见 `work/it-animation-upgrade/provenance.json`。
- 人物：`assets/models/it_rescuer_animation_body/`，骨骼版：`assets/models/it_rescuer_animation_rigged/`。52 根骨骼、30,000 三角面；几何移动版 `game/public/models/it_rescuer_animation_rigged.glb` 约 3.41 MB，样板实际使用 PBR 版 `it_rescuer_animation_pbr.glb` 约 3.84 MB，以便灯光正常表现头发、皮肤与衣服。
- 道具：`assets/models/it_rescuer_split/`。Hyper3D BANG 拆分，独立使用笔记本部件 0 和扳手部件 3、4；不使用被拆出的原手部片段。握柄的小缺口由局部几何连接补齐。
- 所有新资产另存，旧角色与旧骨骼文件均保留。主游戏的资产清单不由本次样板改写。

## 动作实现

`src/it-character-controller.js` 使用真实骨骼与双关节 IK 控制两只手。低头办公包含呼吸与轻微活动，冒头后头部会朝指针方向转动；奖励时先伸手接取，另一手举起扳手，再点头回应、坐回。手指使用骨骼弯曲，扳手保持刚性。

`src/it-expressions.js` 给新模型增加局部眨眼、嘴角和惊喜形变。它们是第一版轻量表情，不包含口型、独立眼球追踪或电影级面部绑定。`?qa=1` 可单独检查闭眼、微笑与惊喜，也可录制一轮动作。

`src/it-detached-props.js` 负责道具拆出与尺寸；笔记本放在侧边，额外显示器不使用。`src/it-motion-lab.js` 负责完整互动顺序和 0.28 秒奖励飞行。

## 验证

- 专项测试：`node --test tests/it-animation-upgrade.test.js`，覆盖空手骨架、IK 到达误差、局部表情和 10 轮连续反馈、身体与前台面的穿插检查。
- 独立构建：`./node_modules/.bin/vite build --config vite.it-motion.config.js`，产物 `dist-it-motion/`。无需部署。
- 本页是动作验收样板；主游戏仍由另一项场景任务维护。推广其他角色前，需要逐人检查各自道具、关节和表情。

稳定预览启动：`./node_modules/.bin/vite preview --config vite.it-motion.config.js --host 127.0.0.1 --port 5175 --strictPort`。5175 使用独立构建，避免另一对话的源码热更新打断动作验收。
