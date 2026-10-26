# 在不同 AI 编程工具中使用

技能目录包含 SKILL.md、references、scripts、assets，必须整体搬运。核心不依赖宿主特有指令、MCP 或绝对路径。

| 工具 | 个人技能目录 | 调用示例 |
| --- | --- | --- |
| Codex | `~/.agents/skills/threejs-teacher/`（已有 `~/.codex/skills/` 也可） | `$threejs-teacher 用三维课件讲解 CPU 缓存` |
| Claude Code | `~/.claude/skills/threejs-teacher/` | `/threejs-teacher 用三维课件讲解电磁感应` |
| Gemini CLI | `~/.gemini/skills/threejs-teacher/` 或 `~/.agents/skills/threejs-teacher/` | 按其技能发现界面启用后，要求使用 threejs-teacher |

项目范围可使用对应的 `.agents/skills/`、`.claude/skills/`、`.gemini/skills/`。安装后按宿主要求刷新技能列表或开启新会话；不同版本的发现行为以官方文档为准。

若工具不能自动发现技能，但能读本地文件、编辑并运行代码，可明确让它读取该目录的 SKILL.md 并按流程完成课件。只支持纯聊天且不能执行代码的工具无法独立完成构建和浏览器验收。

推荐调用：

> 使用 threejs-teacher，做一个零基础能操作的课件，解释“CPU 的缓存命中和未命中”。用文字分步引导，让我能改变访问顺序并看到结果。输出源码、静态网页和实际验证结果。

生成课件时不需要再次读取原参考视频。无自动浏览器时如实标记未完成视觉验收；无网络时说明依赖安装或知识核验限制。

参考文档（2026-10-26 查阅）：
- https://developers.openai.com/plugins/build/skills
- https://code.claude.com/docs/en/skills
- https://geminicli.com/docs/cli/skills/
