/**
 * ssw.cn 服务器上的预览服务守护进程（DECISIONS §117，安装步骤见 docs/DEPLOY-SETUP.md）。
 *
 * 由 Windows 计划任务开机启动，常驻运行，负责：
 * - 启动 ./server/entry.mjs（`npm run build:island-server` 的产物），只监听本机 127.0.0.1:4330，
 *   nginx 把 /tina-island/ 转给它。
 * - 它退出了就 5 秒后重启。
 * - ./server/ 里的文件有变化（发布流程用 robocopy 更新）就重启它，发布流程不需要停止/启动服务的权限。
 *
 * 改了这个文件本身，要在服务器上重启计划任务才生效（发布流程只更新 ./server/）。
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, watch } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SERVER = join(HERE, 'server');
const ENTRY = join(SERVER, 'entry.mjs');
// Node 适配器按 ../client 找静态文件目录，不存在会启动失败；静态文件由 nginx 提供，这里放空目录。
mkdirSync(join(HERE, 'client'), { recursive: true });
mkdirSync(SERVER, { recursive: true });

const log = (msg) => console.log(`${new Date().toISOString()} [supervisor] ${msg}`);

let child = null;
// 同一时刻最多一个待执行的启动；子进程在跑时不会再起第二个（否则抢端口）。
let startTimer = null;
// 主动重启（文件更新）时为 true：退出后立即启动；意外退出则等 5 秒，避免反复崩溃刷屏。
let restarting = false;

function scheduleStart(delay) {
  clearTimeout(startTimer);
  startTimer = setTimeout(start, delay);
}

function start() {
  if (child) return;
  if (!existsSync(ENTRY)) {
    log(`${ENTRY} not found, waiting for the first deploy`);
    return;
  }
  log('starting island server');
  const proc = spawn(process.execPath, [ENTRY], {
    cwd: HERE,
    stdio: 'inherit',
    env: { ...process.env, HOST: '127.0.0.1', PORT: '4330' },
  });
  child = proc;
  proc.on('exit', (code, signal) => {
    if (child === proc) child = null;
    log(`island server exited (code ${code}, signal ${signal})`);
    scheduleStart(restarting ? 0 : 5000);
    restarting = false;
  });
}

// robocopy 会连续改很多文件：最后一次变化之后等 5 秒再重启，避免拿到一半新一半旧的文件。
// 有子进程就结束它，它的 exit 回调负责再启动；没有就直接安排启动。
let changeTimer = null;
watch(SERVER, { recursive: true }, () => {
  clearTimeout(changeTimer);
  changeTimer = setTimeout(() => {
    log('files changed, restarting');
    if (child) {
      restarting = true;
      child.kill();
    } else scheduleStart(0);
  }, 5000);
});

start();
