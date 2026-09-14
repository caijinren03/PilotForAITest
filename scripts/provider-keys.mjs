import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
const exec = promisify(execFile);
function dpapi(mode, value) {
  const script = `Add-Type -AssemblyName System.Security; $s=[Console]::In.ReadToEnd(); $bytes=[Convert]::FromBase64String($s); $out=[Security.Cryptography.ProtectedData]::${mode}($bytes,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write([Convert]::ToBase64String($out))`;
  return new Promise((resolve, reject) => {
    const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], { windowsHide: true });
    let output = '';
    child.on('error', reject);
    child.stdout.on('data', d => output += d);
    child.stderr.resume();
    child.stdin.on('error', reject);
    child.on('close', code => code === 0 ? resolve(Buffer.from(output.trim(), 'base64')) : reject(new Error('Windows 用户密钥加密失败，请检查 PowerShell 和当前用户权限。')));
    child.stdin.end(value.toString('base64'));
  });
}
export function providerKeys(dataDir) {
  function path(id) {
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error('无效的模型配置编号');
    return join(dataDir, 'keys', `${id}.dpapi`);
  }
  return {
    async save(id, secret) {
      if (!secret) return;
      if (process.platform === 'darwin') {
        try { await exec('/usr/bin/security', ['add-generic-password', '-U', '-a', id, '-s', 'TestPilot-LLM', '-w', secret]); }
        catch { throw new Error('macOS 钥匙串保存失败，请检查钥匙串是否解锁及访问权限。'); }
      } else if (process.platform === 'win32') {
        const destination = path(id);
        const encrypted = await dpapi('Protect', Buffer.from(secret));
        await mkdir(join(dataDir, 'keys'), { recursive: true });
        const temporary = `${destination}.${randomUUID()}.tmp`;
        await writeFile(temporary, encrypted, { mode: 0o600 });
        await rename(temporary, destination);
      } else throw new Error('当前密钥存储仅支持 macOS 和 Windows。');
    },
    async read(id) {
      if (process.platform === 'darwin') {
        try { return (await exec('/usr/bin/security', ['find-generic-password', '-a', id, '-s', 'TestPilot-LLM', '-w'])).stdout.trim(); }
        catch { return ''; }
      }
      if (process.platform === 'win32') {
        let encrypted;
        try { encrypted = await readFile(path(id)); } catch (error) { if (error.code === 'ENOENT') return ''; throw error; }
        return (await dpapi('Unprotect', encrypted)).toString('utf8');
      }
      return '';
    }
  };
}
