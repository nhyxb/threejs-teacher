# 机制实验室 · Three.js Teacher

**中文** · [English](README.en.md)

把一个知识点，变成能观察、能操作、能验证的 3D 课件。

![机制实验室概念封面：CPU、缓存、内存与一对啮合齿轮](docs/images/mechanism-lab-cover.webp)

> 两张配图均为 AI 生成的概念插图，不是应用截图。实际功能与界面以本仓库的可运行示例为准。

`threejs-teacher` 是供 AI 编程工具使用的技能：你描述想学的内容，AI 完成知识核验、分步脚本、Three.js 场景、参数交互和验证，并交付独立网页工程。

**生成课件发生在 AI 编程工具中；生成后的网页无需 AI API、账号或后端即可运行。** 当前示例与默认界面使用中文，本项目文档提供中英两版。

## 能做什么

- **让机制可见**：用结构拆解、运动、数据路径和同步数值解释因果，必要时配合二维图示。
- **让学习者动手**：旋转观察、暂停、拖动进度、切换步骤、改变参数、预测并验证结果。
- **保持界面简单**：默认只显示大场景、当前一句重点、播放与步进；参数、数据和完整讲解按需展开。
- **让状态可重现**：画面与数值来自同一模型，回退、重播和参数重置保持一致。
- **方便迁移**：标准 `SKILL.md`、相对路径参考和自包含模板，不依赖专有 MCP。

## 快速开始

需要 **Node.js 22.12+**、npm，以及支持 WebGL 2 的现代浏览器。以下命令均从仓库根目录执行。

### CPU 缓存课件

```sh
npm ci --prefix examples/cpu-cache
npm run dev
```

默认打开 `http://127.0.0.1:5173/`。若端口被占用，以终端输出的地址为准。

### 齿轮传动课件

```sh
npm ci --prefix examples/gear-ratio
npm run dev:gears
```

默认地址为 `http://127.0.0.1:5174/`。两个示例可以在不同终端同时运行。

根目录仅提供便捷脚本；课件依赖需要安装到各自目录。无需先在根目录安装同一套依赖。

## 已有课件

| 课件 | 学习内容 | 可以改变什么 | 说明 |
| --- | --- | --- | --- |
| [CPU 缓存](examples/cpu-cache/lesson.md) | 命中与未命中、整块搬入、局部性、LRU 替换 | 两行/四行容量、连续/交错访问 | 单层只读、全相联教学模型 |
| [齿轮传动](examples/gear-ratio/lesson.md) | 转向、齿数比、输入与输出转速 | 两轮齿数、输入 rpm、输入方向 | 理想外啮合直齿轮 |
| [模板内的杠杆示例](skills/threejs-teacher/assets/starter/lesson.md) | 力臂与力矩平衡 | 施力臂长度 | 供新课件替换的可运行起点 |

![缓存机制概念图：内存保留源数据，将整块副本送入缓存，再把一个元素交给处理核心](docs/images/cpu-cache-concept.webp)

缓存示例把不可见的数据读取变成可观察的过程：一次未命中搬入整块数据，后续读取可能直接命中。图中的位置、尺寸和路径为概念表达，不代表真实芯片布局。

## 安装和调用技能

把整个 [`skills/threejs-teacher`](skills/threejs-teacher/SKILL.md) 目录复制到你的工具支持的技能目录，保留 `references/`、`scripts/` 和 `assets/`。

| 工具 | 个人安装位置 | 调用方式 |
| --- | --- | --- |
| Codex | `~/.agents/skills/threejs-teacher/`，或已有的 `~/.codex/skills/` | `$threejs-teacher` |
| Claude Code | `~/.claude/skills/threejs-teacher/` | `/threejs-teacher` |
| Gemini CLI | `~/.gemini/skills/threejs-teacher/` 或 `~/.agents/skills/threejs-teacher/` | 启用技能后，在请求中指定 `threejs-teacher` |

不同工具的发现和刷新方式可能不同，详见 [安装适配说明](skills/threejs-teacher/references/installation.md)。这些是安装方式说明，不表示本仓库已经自动配置了你的工具。

调用示例：

```text
使用 threejs-teacher，给我做一个零基础交互课件，讲清楚电磁感应。
用 Three.js 展示线圈、磁铁和电流方向，让我改变磁铁运动方向，
先预测，再验证。界面保持简单，交付源码、静态网页和验证结果。
```

工具需能读写文件和执行命令。浏览器能力用于视觉验收；只有纯聊天能力的工具无法独立完成构建和运行验证。也可以直接让编程工具读取 `SKILL.md`，再按流程执行。

## 创建新课件

```sh
node skills/threejs-teacher/scripts/create-lesson.mjs examples/my-lesson
npm ci --prefix examples/my-lesson
npm --prefix examples/my-lesson run dev
```

脚本只写入不存在或空的目录，不覆盖已有内容。新工程先包含杠杆示例；这一步是创建模板，不会自行调用 AI 生成新主题。

让 AI 按技能流程替换以下内容：

| 文件 | 职责 |
| --- | --- |
| `src/lesson.ts` | 学习目标、步骤、参数、预测题和三维场景 |
| `src/model.ts` | 与渲染分离的机制计算或事件序列 |
| `src/model.test.ts` | 核心逻辑与关键边界验证 |
| `lesson.md` | 事实来源、简化假设、运行方式与验收结果 |

公共运行器提供播放、镜头、折叠界面和状态同步。接口与动态预测题用法见 [模板接口](skills/threejs-teacher/references/runtime.md)，教学方法见 [教学设计](skills/threejs-teacher/references/teaching-design.md)。

## 验证与构建

安装对应示例的依赖后，在根目录执行：

```sh
npm run test:cpu
npm run test:gears
npm run build:cpu
npm run build:gears
```

构建会先进行 TypeScript 检查。静态网页分别输出到各课件的 `dist/`，使用相对资源路径，可由 HTTP 静态服务器托管。此处不依赖 GitHub Pages 或其他特定托管平台。

预览 CPU 生产构建：

```sh
npm --prefix examples/cpu-cache run preview
```

模型已覆盖 CPU 的 5 项与齿轮的 7 项测试；还检查了步骤、暂停、回退、参数重置、动态预测，以及桌面、平板、手机布局。实际记录见 [验证报告](docs/Verification.md)。生成其他知识点后，需要重新验证其模型和画面。

## 项目结构

```text
skills/threejs-teacher/   技能、参考资料、创建脚本与自包含模板
examples/cpu-cache/       CPU 缓存课件
examples/gear-ratio/      齿轮传动课件
docs/images/             README 配图与生成提示词
docs/                    配图、提示词和验证说明
```

## 模型与资源说明

- CPU 示例忽略多级缓存、预取、并行、写入与一致性，不预测真实硬件性能。
- 齿轮示例忽略摩擦、间隙、惯性与负载，齿形不用于制造。
- 默认流程不包含配音、视频导出或课程管理系统。
- 课件的公式、单位和简化条件应注明来源；不能把视觉隐喻当作真实机制。
- 配图由内置图像工具生成，提示词记录在 [`docs/images/prompts.json`](docs/images/prompts.json)；README 使用本地 WebP，不依赖外链图片。

## 许可证

项目尚未指定根目录许可证。第三方资源保留各自许可：

- [Three.js — MIT](examples/cpu-cache/public/licenses/three-MIT.txt)
- [IBM Plex — SIL Open Font License](examples/cpu-cache/public/licenses/IBM-Plex-OFL.txt)
