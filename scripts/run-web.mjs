// 根脚本转发到 apps/web；app 尚未创建时给出可读错误（plan-002 将创建 apps/web）
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appDir = path.join(root, 'apps', 'web');
const script = process.argv[2];

if (!script || !['dev', 'build'].includes(script)) {
  console.error(`用法: node scripts/run-web.mjs <dev|build>`);
  process.exit(1);
}
if (!existsSync(path.join(appDir, 'package.json'))) {
  console.error(`[错误] apps/web 尚未创建（将由 plan-002 创建），无法运行 npm run ${script}。`);
  console.error(`        请先完成 plan-001 的 "npm run assets"，再等待 plan-002 落地。`);
  process.exit(1);
}

const result = spawnSync('npm', ['run', script, '--workspace', 'apps/web'], {
  stdio: 'inherit',
  shell: true,
  windowsHide: true,
});
process.exit(result.status ?? 1);
