# 杠杆：距离怎样换来省力

这是模板内的可运行示例。生成新课件时，替换 src/lesson.ts 和 src/model.ts，并更新本说明；保留公共运行器，按需求调整场景帮助函数与样式。

学习目标：区分力与力臂；用力矩平衡解释省力；理解理想机械省力不省功。

模型：无质量刚性杆、无摩擦支点、垂直作用力、静态平衡。负载 20N，负载臂 1m；施力臂 1–4m。F = 20 / d。距离单位 m，力单位 N。

来源：https://openstax.org/books/physics/pages/9-3-simple-machines

启动：Node.js 22.12+，在本目录执行 npm ci，然后 npm run dev。构建：npm run build；预览构建：npm run preview。测试：npm test。

dist 需通过 HTTP 静态服务器访问；默认浏览器运行无需在线服务。所有界面资源随构建打包。
