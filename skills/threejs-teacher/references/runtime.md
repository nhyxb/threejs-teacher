# 模板接口与制作约定

模板是完整静态网页工程，不是专有预览工具代码。Node.js 22.12+；`npm ci` 安装锁定依赖，`npm run dev` 启动，`npm run build` 类型检查并构建，`npm run preview` 验证产物，`npm test` 执行模型测试。构建已使用 `--base=./`，支持静态服务器上的子目录。

## 替换范围

- `src/lesson.ts`：导出 `lesson: LessonModule`，设置标题、学习目标、模型说明、来源、步骤、参数和 createScene。
- `src/model.ts` 与模型测试：独立于 Three.js，计算真实教学结果。
- `src/runtime.ts`：通用时钟、镜头、标签、交互和 HTML 说明。需要新能力时可以修改，但不要复制控制器到每个步骤。
- `src/scene-kit.ts`：基础建模帮助函数；按主题新增合适几何，不限制只能使用盒子。
- `src/style.css`：通用课件界面。按主题调整必要视觉，保持中文可读和手机可用。

## 最小契约

完整类型定义在模板 `src/types.ts`。

`createScene({scene, world, camera, label})` 一次创建对象，返回：

```ts
{
  updateAt({ stepId, time, params, revealed }): Snapshot,
  dispose(): void
}
```

`time` 是当前步骤内秒数，范围 `[0, step.duration]`。参数在 `lesson.parameters` 声明默认值，支持 select/range。Snapshot 包含当前状态、原因、指标，可选键值行和事件序列；它与场景必须由同一派生状态生成。HTML 渲染会转义文本。

`label(text, [x,y,z], className?)` 返回绑定三维坐标的 HTML 标签，可 `setText`、`setVisible`、更改 position。常用类名 major、data-label；标签默认不参与鼠标事件，不是点击对象。对象选择需要 Raycaster 或单独 DOM 控制项时自行实现。

每步可指定相机 position 与 target。切换步骤恢复该步视角；播放不接管用户旋转。步进默认从零暂停，用户主动开始。进度滑块可精确回到任意时刻。参数变化把时间重置为零并暂停，模型重算。控制器不擅自切换到下一步。

界面为单列，参数、实验数据、完整讲解与资料默认收起。“详细讲解与资料”内可直接跳到指定步骤；最后一步预测题自动展开。原生 details 折叠不暂停或重置模拟，展开后显示当前真实状态。

预测题 `question` 可直接给出 Question，或提供 `(params) => Question`，让题干、选项与答案随参数更新。参数变化会重新生成题目并清除旧反馈。动态题目须验证参数边界下仍有唯一正确答案；若画面会泄露答案，可在用户作答前隐藏结果，仍保持题目信息充分。

`revealed` 是当前步骤是否已提交预测答案的可选视图状态。答题后为 true，切步、重播或参数变化后为 false。场景可依据它隐藏待预测结果；不要伪造一小段时间推进来表示“已作答”。

LessonModule 可选 `sceneCaption` 说明场景中的颜色/标记，`timeNote` 说明模拟时间与现实时间的关系。rpm 等有明确物理时间含义的课件应区分模拟秒数和观看速度，不能沿用硬件路径演示的时间说明。

## 模拟与资源

离散过程先生成不可变事件序列，再根据时间选择事件和阶段。连续过程优先解析公式；数值积分需要固定步长重放或缓存状态，不能依赖真实帧间隔。任何随机初始条件都固定种子并保存。

场景对象一次创建，更新位置、缩放、可见性与材质；避免每帧创建几何体、材质、DOM 或整条模拟轨迹。缓存轨迹以参数为键；退出时在 dispose 释放自建监听器/纹理等资源。通用运行器释放场景几何和材质、OrbitControls、renderer、标签与 ResizeObserver。

默认限制 DPR、使用简单阴影和本地字体；不接入视频、TTS、外部渲染服务。WebGL 失败显示明确说明，正文仍可阅读。新增可访问交互须检查键盘焦点和触屏命中区域。
