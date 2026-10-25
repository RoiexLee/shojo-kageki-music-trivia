import { spawn } from 'node:child_process';

/** spawn 数组传参（禁 shell 字符串拼接，歌名含 〜 ! 空格安全） */
export function run(bin, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { windowsHide: true });
    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${bin} 退出码 ${code}\n${stderr.slice(-2000)}`));
    });
  });
}

/** ffprobe 取时长（秒）；失败返回 null */
export async function probeDurationSec(file) {
  return new Promise((resolve) => {
    const child = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      file,
    ], { windowsHide: true });
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.on('error', () => resolve(null));
    child.on('close', (code) => {
      const v = parseFloat(out.trim());
      resolve(code === 0 && Number.isFinite(v) ? v : null);
    });
  });
}
