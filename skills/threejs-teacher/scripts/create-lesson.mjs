#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const destination = process.argv[2];
if (!destination || process.argv.length !== 3) {
  console.error('用法：node <skill>/scripts/create-lesson.mjs <新课件目录>'); process.exit(1);
}
const target = resolve(destination);
if (existsSync(target) && readdirSync(target).length > 0) {
  console.error('目标目录非空，未写入任何文件：' + target); process.exit(1);
}
const source = resolve(dirname(fileURLToPath(import.meta.url)), '../assets/starter');
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true, filter: path => !['node_modules', 'dist', '.DS_Store'].includes(basename(path)) });
console.log('已创建独立课件：' + target);
console.log('下一步：替换 src/lesson.ts、src/model.ts 和模型测试；更新 lesson.md；执行 npm ci、npm test、npm run build。');
