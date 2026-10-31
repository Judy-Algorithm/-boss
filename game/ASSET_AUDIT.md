# 《鼠鼠大BOSS》资产盘点与复用记录

日期：2026-10-31（上海时间）。原始资产均保留，未覆盖原文件，未发起新的 Hyper3D 生成。

## 发布资源与命名映射

| 游戏 ID / URL | 名称 | 原文件 | 原尺寸 X×Y×Z | 三角面 | 发布大小 |
|---|---|---|---|---:|---:|
| `overtime_boss.glb` | 加班大魔王 | `assets/models/overtime_boss/base_basic_shaded.glb` | 1.675×1.899×1.821 | 20,000 | 0.89 MB |
| `deadline_officer.glb` | DDL催命官 | `assets/models/deadline_officer/base_basic_shaded.glb` | 1.681×1.900×1.302 | 20,000 | 1.11 MB |
| `slacker_ally.glb` | 摸鱼同盟 | `assets/models/slacker_ally/base_basic_shaded.glb` | 1.643×1.905×1.846 | 20,000 | 1.05 MB |
| `blame_shifter.glb` | 甩锅大师 | `assets/models/blame_shifter/base_basic_shaded.glb` | 1.609×1.897×1.798 | 20,000 | 1.08 MB |
| `passing_intern.glb` | 路过的实习生 | `assets/models/passing_intern/base_basic_shaded.glb` | 1.293×1.829×1.896 | 20,000 | 1.08 MB |
| `it_rescuer.glb` | IT救援侠 | `assets/models/it_rescuer/base_basic_shaded.glb` | 1.891×1.168×0.519 | 20,000 | 1.47 MB |
| `hr_specialist.glb` | HR小姐姐 | `assets/models/hr_specialist/base_basic_shaded.glb` | 1.709×1.886×1.504 | 20,000 | 1.10 MB |
| `finance_manager.glb` | 财务大姐 | `assets/models/finance_manager/base_basic_shaded.glb` | 1.490×1.902×1.546 | 20,000 | 1.17 MB |
| `office_orange_cat.glb` | 公司橘猫 | `assets/models/office_orange_cat/base_basic_shaded.glb` | 1.525×1.902×1.579 | 20,000 | 0.91 MB |
| `promise_maker.glb` | 画饼大师 | `assets/models/promise_maker/base_basic_shaded.glb` | 1.507×1.889×1.895 | 20,000 | 1.07 MB |
| `star_hammer.glb` | 粉色星星锤 | `assets/models/star_hammer/model.glb` | 0.207×0.170×0.350 | 11,380 | 0.20 MB |
| `heart_chocolates.glb` | 爱心巧克力 | `assets/models/heart_chocolates/base_basic_shaded.glb` | 1.897×1.550×1.695 | 20,000 | 1.03 MB |
| `partition_panel.glb` | 工位隔板组合 | `assets/models/cubicle_partitions/model.glb` | 1.600×1.146×1.250 | 23,636 | 0.63 MB |
| `desk.glb` | 卡通办公桌 | `assets/models/desk/model.glb` | 1.450×0.730×0.710 | 17,304 | 0.40 MB |
| `monitor.glb` | 电脑显示器 | `assets/models/monitor/model.glb` | 0.500×0.400×0.125 | 13,804 | 0.29 MB |
| `office_chair.glb` | 办公椅 | `assets/models/office_chair/model.glb` | 0.584×0.880×0.570 | 98,328 | 2.10 MB |
| `plant_tall.glb` | 盆栽（高款） | `assets/models/plant_tall/base_basic_shaded.glb` | 1.609×1.897×1.610 | 15,000 | 0.78 MB |
| `plant_small.glb` | 盆栽（矮款） | `assets/models/plant_small/base_basic_shaded.glb` | 1.494×1.896×1.605 | 15,000 | 0.79 MB |
| `filing_cabinet.glb` | 文件柜 | `assets/models/filing_cabinet/model.glb` | 0.650×1.100×0.420 | 17,352 | 0.42 MB |
| `bookshelf.glb` | 书架 | `assets/models/bookshelf/model.glb` | 0.950×1.350×0.320 | 40,924 | 0.97 MB |
| `water_dispenser.glb` | 饮水机 | `assets/models/water_dispenser/model.glb` | 0.320×1.150×0.340 | 37,076 | 0.78 MB |
| `sofa.glb` | 沙发 | `assets/models/sofa/base_basic_shaded.glb` | 1.896×0.979×1.131 | 20,000 | 0.84 MB |
| `printer.glb` | 打印机 | `assets/models/printer/model.glb` | 0.500×0.480×0.460 | 19,328 | 0.46 MB |
| `coffee_machine.glb` | 咖啡机 | `assets/models/coffee_machine/model.glb` | 0.321×0.400×0.305 | 23,748 | 0.63 MB |

所有游戏 URL 位于 `/models/`。映射以 `public/models/manifest.json` 的 `models` 数组为准。

## 已发现的问题与缺失

- **IT 救援侠的原 GLB 不可用作单角色。** 原输入 `work/hyper3d/references/06_it_rescuer.png` 是完整十人拼图。它的网格为多个并排角色组合，尺寸异常（1.891×1.168×0.519），材质中可见 BOSS、HR 等多个角色。原 GLB 和纹理均保留；manifest 的 `unusableReason` 明确标记，游戏应显示眼镜/耳机/扳手造型的 IT 占位。后续需要正确单人图重新生成或人工修复，这次没有提交付费生成。
- 已逐张查看其余 9 个角色参考图，均为与名称对应的单人/单猫裁图。角色仅有静态模型，**没有骨骼或内嵌动画**；冒头、晃动、缩回应由整体变换动画完成。
- 现有角色中部分带着原参考图里的道具和局部桌面，不能视为干净全身可绑定模型；本版按“可用完整模型”弹出。
- 10 名角色、锤子、巧克力、桌子、隔板的所需 GLB 路径均已本地准备；无需独立贴图下载。颜色纹理均嵌入 GLB，锤子/部分家具采用纯材质颜色。
- 本地尚无获授权背景音乐、人声台词和音效文件；主游戏可使用 Web Audio 合成音效/音乐，人物台词先显示文字。
- 家具生成结果中植物/沙发另有 PBR 版本，仅下载和保留用于本版的 shaded 版本；它们不属于主线缺失依赖。

## 家具 12 项生成结果

| 原生成编号 | 本地 ID | 本地保留文件 | 发布策略 |
|---:|---|---|---|
| 01 | `cubicle_partitions` | model.glb | 发布为 partition_panel.glb |
| 02 | `desk` | model.glb | 本地完整画面复用 |
| 03 | `monitor` | model.glb | 本地完整画面复用 |
| 04 | `office_chair` | model.glb | 本地完整画面复用 |
| 05 | `plant_tall` | base_basic_shaded.glb | 本地完整画面复用 |
| 06 | `plant_small` | base_basic_shaded.glb | 本地完整画面复用 |
| 07 | `filing_cabinet` | model.glb | 本地完整画面复用 |
| 08 | `bookshelf` | model.glb | 本地完整画面复用 |
| 09 | `water_dispenser` | model.glb | 本地完整画面复用 |
| 10 | `sofa` | base_basic_shaded.glb | 本地完整画面复用 |
| 11 | `printer` | model.glb | 本地完整画面复用 |
| 12 | `coffee_machine` | model.glb | 本地完整画面复用 |

## 优化与技术验证

- 全部 24 份副本合计 **21.26 MB**；IT 资产被标记不可用，跳过加载后正常可用资源约 **19.79 MB**。
- 角色和巧克力优先复用 shaded 版本，只保留一张颜色贴图；系统 `sips` 将颜色图从原分辨率等比缩至最长边 512，仍以内嵌 PNG 保持材质与 UV。原始 PBR/shaded 文件均未改动。
- 几何、法线、UV、索引及节点变换保持原样。没有为赶工引入额外优化依赖，没有使用 Draco/KTX2 解码要求；每名正常角色约 20,000 面，9 名约 180,000 面。进一步减面需视觉复核，不应直接丢弃三角形。
- 逐份验证 24 个输出的 GLB bufferView 范围、4 字节对齐、几何字节与原版一致、无外部 image URI，均通过。详见 `work/game-assets/verification.json`。
- 完整原文件大小、面数、纹理尺寸的机器可读清单：`work/game-assets/full-inventory.json`。
- 桌子与隔板根节点分别带 Y 平移 −0.365 / −0.573；manifest 的 bounds 为 accessor 局部几何范围，游戏必须用 `Box3.setFromObject()` 计算最终范围，居中并统一落地。不要只根据原 accessor 数值放置。
- 本阶段没有修改模型朝向；当前源 GLB 没有角色节点旋转。正面方向、隔板遮挡与后排触控要在游戏斜俯视相机中检查。
- 纹理已可解码、引用完整并与原 UV 保持一致；本审计不能替代手机 GPU 上的帧率和视觉检查。实际渲染、低端真机性能及网络加载表现由集成验收确认。

## 使用的工具

- Python 标准库：GLB 解析、下载结果复用、容器重打包、哈希与引用验证。
- macOS `sips`：仅对新游戏副本进行贴图缩小。
- `curl`：从已有 Hyper3D 结果下载 12 个家具 GLB；使用重试应对暂时网络失败。未输出签名下载 URL。
- Three.js/Vite：由主游戏集成；本资产任务未修改 npm 依赖。

准备脚本在 `work/game-assets/prepare_assets.py`。它拒绝覆盖内容不同的既有副本；修改优化策略时请输出到新文件名，并保留原件。

## 完整办公室组合补充（第二次资产交付）

依照用户最新要求，剩余 10 项家具也已准备游戏副本并写入 manifest，用于本地组合完整办公室，不发布。现在共 24 份 GLB，总计 21.26 MB；跳过 IT 无效组合模型后的可加载资源约 19.80 MB。所有原 GLB 保留。

家具使用 +Y 向上，纯色家具的命名前/后网格中心核对均确认正面为 **+Z**：显示器玻璃、办公桌抽屉、隔板前墙、椅子开放座面、文件柜正面、书架开放面、饮水机水龙头、打印机纸屉、咖啡机控制面板均朝 +Z。主相机位于 +Z 时可保持 0 弧度；侧墙家具用 ±π/2 向室内转。隔板前墙位于 +Z，角色应位于前墙后方的 −Z 区域。植物朝向可自由；沙发由图像生成，+Z 正面需集成时视觉确认。

建议按米制尺度统一：以 desk 宽 1.45 / 高 0.73 为基准，partition 宽 1.6、墙高 1.146，单工位宽建议 1.8。家具应整体等比缩放，不要将每个家具分别都归一为 1 高。显示器宽约 0.5、椅子总高约 0.9、文件柜高约 1.1、书架高约 1.4、饮水机高约 1.1、咖啡机高约 0.45；植物和沙发按空间组合视觉调整。高柜/书架放后墙或边缘，桌面小物放在桌面局部坐标，避免遮住后排脸部。

| 家具 | 网格/预计原绘制次数 | 材质数 | 贴图 | 三角面 | 合批建议 |
|---|---:|---:|---:|---:|---|
| desk | 54 | 4 | 0 | 17,304 | 顶点颜色合成单网格 |
| partition_panel | 52 | 6 | 0 | 23,636 | 顶点颜色合成单网格 |
| monitor | 11 | 5 | 0 | 13,804 | 顶点颜色合成单网格 |
| office_chair | 56 | 6 | 0 | 98,328 | 高面数；先合批，再使用经过外观检查的 LOD |
| filing_cabinet | 38 | 5 | 0 | 17,352 | 顶点颜色合成单网格 |
| bookshelf | 121 | 11 | 0 | 40,924 | 优先合批，避免 121 次 draw call |
| water_dispenser | 39 | 6 | 0 | 37,076 | 顶点颜色合成单网格 |
| printer | 37 | 9 | 0 | 19,328 | 顶点颜色合成单网格 |
| coffee_machine | 45 | 8 | 0 | 23,748 | 顶点颜色合成单网格 |
| plant_tall | 1 | 1 | 1 | 15,000 | 保留纹理网格 |
| plant_small | 1 | 1 | 1 | 15,000 | 保留纹理网格 |
| sofa | 1 | 1 | 1 | 20,000 | 保留纹理网格 |

纯色家具可将 mesh.geometry 克隆后 applyMatrix4(mesh.matrixWorld)，统一 position/normal/color 属性，填充材质的线性色值。现有家具没有 COLOR_0，使用 material.color；移除不用的 UV，处理 indexed/non-indexed 一致后 mergeGeometries。以一个白色、vertexColors=true 的 MeshStandardMaterial 渲染，roughness 约 0.7。代价是各部位的金属度/粗糙度差异会统一，手机办公室小比例合理；银色把手仍通过颜色保留。若保留差异，按材质分组可降至每家具约 4–11 次绘制。多个相同工位可进一步 InstancedMesh，阴影只让关键几何投射。

办公室椅子原始 98k 面，复制 10 把接近 100 万面，合批只能降低调用次数，不降低面数。现有 Three.js 包含 meshopt_simplifier.module.js，后续可不增加依赖做带误差约束的 LOD；此清单中的 GLB 仍保持原网格，没有未经视觉检验的破坏性减面。

## 手机椅子 LOD

新文件 `public/models/office_chair_mobile.glb`，原始 `assets/models/office_chair/model.glb` 与第一份游戏副本 `public/models/office_chair.glb` 均保留；manifest 的 office_chair.url 改指新 LOD。

- 三角面从 98,328 减至 **14,482**（降低 85.3%），顶点数 9,854，新文件 422,516 字节。
- 使用现有 Three.js 内附 meshoptimizer 1.1 的离线 WASM，不新增 npm 依赖、无联网或生成任务。
- 按每个原网格分别减面，保留全部 56 个网格、6 种材质、原节点变换和法线/UV；便于主程序继续合批。
- 目标相对误差 0.02，算法报告的最大相对误差 **0.01993354**。这是按每个网格尺度归一化、包含加权法线的简化误差，不等于整把椅子外观逐点距离的保证。
- 保守误差对照：0.005 得到 27,056 面，0.01 得到 19,690 面；为满足手机 1 万–1.5 万面目标采用 0.02。
- 检查输出容器、索引/属性范围与材质/节点保持通过。主场景应核对坐垫轮廓、扶手、脚轮；未经过真机视觉核对前不把该误差视为验收通过。
- 详情 `work/game-assets/chair-lod-report.json`；准备程序 `work/game-assets/chair_lod.mjs`，拒绝覆盖现存 LOD。

## 家具 LOD 第二批

原副本全部保留，manifest 已改指 `_mobile.glb` 新副本。使用现有离线 meshoptimizer，保持材质、节点、法线/UV。索引及属性数量验证通过，集成视觉检查待完成。

| 家具 | 原三角面 | 新三角面 | 最大算法相对误差 | 新大小 |
|---|---:|---:|---:|---:|
| desk | 17,304 | 4,924 | 0.00996 | 0.182 MB |
| partition_panel | 23,636 | 5,364 | 0.01978 | 0.227 MB |
| monitor | 13,804 | 5,598 | 0.00100 | 0.135 MB |
| bookshelf | 40,924 | 7,372 | 0.00997 | 0.307 MB |
| water_dispenser | 37,076 | 8,762 | 0.00298 | 0.279 MB |

相对误差按每个源网格归一化，包含法线权重，不能直接等同整件家具的空间偏移。生成脚本 `work/game-assets/furniture_lod.mjs`，各自报告位于 `work/game-assets/<id>-lod-report.json`。

## 更新：IT 救援侠已补齐（2026-10-31）
此前关于 IT 使用拼图占位的结论仅针对旧资产。新单人模型来自 `4ccf4497-7a32-49d0-a08b-8f73169fe9e5`，已另存 `assets/models/it_rescuer_v2/`。
骨骼版本来自 `b1f7d7af-2a51-45cc-a0ce-7bd512021d5c`，另存 `assets/models/it_rescuer_rigged/`；52 joints、1 skin、3 个源动画，30,000 triangles。本地移动版 `it_rescuer_rigged.glb` 3,503,904 bytes（实际以 manifest 为准），贴图最大512。manifest 的 `it_rescuer` 已映射到新骨骼版本，旧拼图文件保留、不再加载。
游戏自定义骨骼动作使用 AnimationMixer，扳手与电脑仍是原蒙皮网格内的道具部分，需要分离资产才能实现独立放下或交换。

## 工位结构更新
当前游戏工位使用 `src/workstation.js` 本地重建的开放式座位结构，旧 desk / partition_panel / monitor / office_chair 原文件保留，当前不再把它们组合进人物座位。现有角色、工具、绿植和周边家具继续复用。新增工位没有外部下载或素材授权依赖。

## 更新：九名 NPC 骨骼版（2026-10-31）
- 加班大魔王、DDL催命官、摸鱼同盟、甩锅大师、实习生、HR、财务、公司橘猫、画饼大师均已完成 Hyper3D human/core 绑定，每名52关节、一个蒙皮网格，保留20,000三角面。
- 原模型未覆盖；新源文件：`assets/models/npc_rigged/<角色>/base_basic_shaded.glb`；移动文件：`game/public/models/<角色>_rigged.glb`，贴图最大512。
- 对多数大头人物的 Spine2→Head 权重错配，运行时在独立几何副本上修正；保留身体和手臂原有权重。任务ID和结果页见 `work/npc-animation-upgrade/jobs.json`。
- `plant_small_mobile.glb` 由现有盆栽离线简化为3,120三角面，保留内嵌贴图和材质；原15,000三角面的文件保留。
- 不包含九名人物的独立面部表情资产及道具重新拆分。这批完成的是实际身体骨骼、不同角色回应、尺寸校准与工位外观。
