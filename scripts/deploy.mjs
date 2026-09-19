import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdirSync, createWriteStream } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
mkdirSync('logs', { recursive: true });
const log = createWriteStream('logs/deploy.log', { flags: 'a' });
const port = Number(process.env.PORT || 3344);
const host = process.env.HOST || '127.0.0.1';
function say(message) { console.log(message); log.write(`${new Date().toISOString()} ${message}\n`); }
function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, env: process.env, ...options });
    for (const [stream, output] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
      stream?.on('data', data => { output.write(data); log.write(data); });
    }
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`${command} 退出码 ${code}`)));
  });
}
try {
  if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('请安装 Node.js 24 LTS 或更高版本，然后重新启动。');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT 必须是 1–65535 的整数。');
  await import('node:sqlite');
  await new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', error => reject(new Error(`端口 ${port} 无法使用：${error.code}。请关闭已有服务或设置其他 PORT。`)));
    probe.listen(port, host, () => probe.close(resolve));
  });
  say('正在安装锁定依赖，首次启动需要联网…');
  if (process.platform === 'win32') {
    await run(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm ci --include=dev --no-audit --no-fund']);
  } else await run('npm', ['ci', '--include=dev', '--no-audit', '--no-fund']);
  say('正在校验并构建网站…');
  await run(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '--noEmit']);
  await run(process.execPath, [join(root, 'node_modules/vite/bin/vite.js'), 'build']);
  say(`正在启动：http://127.0.0.1:${port}；关闭此窗口可停止服务。`);
  const server = spawn(process.execPath, ['server.mjs', '--production'], { cwd: root, env: { ...process.env, HOST: host }, stdio: ['inherit', 'pipe', 'pipe'] });
  let opened = false;
  server.stdout.on('data', data => {
    process.stdout.write(data); log.write(data);
    if (!opened && data.toString().includes('AI测试工作台 已启动') && process.env.TESTPILOT_NO_BROWSER !== '1') {
      opened = true;
      const url = `http://127.0.0.1:${port}`;
      const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer.exe' : 'xdg-open';
      const browser = spawn(command, [url], { stdio: 'ignore' });
      browser.on('error', () => say(`请手动打开 ${url}`));
    }
  });
  server.stderr.on('data', data => { process.stderr.write(data); log.write(data); });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal));
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.once('exit', (code, signal) => code === 0 || signal ? resolve() : reject(new Error(`服务退出码 ${code}`)));
  });
} catch (error) {
  say(`部署失败：${error.message}\n详细日志：${join(root, 'logs/deploy.log')}`);
  process.exitCode = 1;
} finally { log.end(); }
