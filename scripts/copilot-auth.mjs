// GitHub Copilot 设备码登录与令牌管理
// 登录链路：GitHub 设备码授权 → ghu_ 访问令牌（约 8 小时，可用 ghr_ 刷新令牌续期）
//          → 调 copilot_internal/v2/token 换取约 30 分钟有效的 Copilot API 令牌
// 令牌只写入系统钥匙串（复用 provider 钥匙串存储），不会进入数据库或日志。
const CLIENT_ID = 'Iv1.b507a08c87ecfe98'; // GitHub Copilot 官方客户端（VS Code）
const DEVICE_URL = 'https://github.com/login/device/code';
const TOKEN_URL = 'https://github.com/login/oauth/access_token';
const COPILOT_TOKEN_URL = 'https://api.github.com/copilot_internal/v2/token';
const USER_AGENT = 'GitHubCopilotChat/0.22.0';
const COPILOT_HEADERS = {
  'Editor-Version': 'vscode/1.95.0',
  'Editor-Plugin-Version': 'copilot-chat/0.22.0',
  'Copilot-Integration-Id': 'vscode-chat',
  'User-Agent': USER_AGENT,
  Accept: 'application/json'
};

export function copilotAuth(store, providerId = 'github-copilot') {
  const cache = { bearer: '', expiresAt: 0 };

  async function readStore() {
    try { const parsed = JSON.parse((await store.read(providerId)) || ''); return parsed && parsed.ghu ? parsed : null; }
    catch { return null; }
  }
  async function writeStore(value) { await store.save(providerId, JSON.stringify(value ?? {})); }

  async function refreshGithubToken(refreshToken) {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
      body: JSON.stringify({ client_id: CLIENT_ID, grant_type: 'refresh_token', refresh_token: refreshToken })
    });
    const data = await res.json().catch(() => ({}));
    if (!data.access_token) throw new Error('GitHub 授权已过期，请重新登录 GitHub Copilot');
    return {
      ghu: data.access_token,
      ghr: data.refresh_token || refreshToken,
      ghuExpiresAt: Date.now() + (Number(data.expires_in) || 28800) * 1000
    };
  }

  async function fetchCopilotToken(ghu) {
    const res = await fetch(COPILOT_TOKEN_URL, { headers: { Authorization: `token ${ghu}`, ...COPILOT_HEADERS } });
    if (res.status === 401) throw new Error('GitHub 授权已失效，请重新登录 GitHub Copilot');
    if (!res.ok) throw new Error(`获取 Copilot 令牌失败：HTTP ${res.status}`);
    const data = await res.json();
    if (!data.token) throw new Error('账号似乎没有 GitHub Copilot 订阅权限，请确认后重试');
    return data;
  }

  async function getBearer() {
    const stored = await readStore();
    if (!stored) throw new Error('尚未登录 GitHub Copilot，请在配置中心完成授权');
    let { ghu, ghr, ghuExpiresAt } = stored;
    if (Date.now() > (Number(ghuExpiresAt) || 0) - 5 * 60 * 1000) {
      if (!ghr) throw new Error('GitHub 授权已过期，请重新登录 GitHub Copilot');
      const refreshed = await refreshGithubToken(ghr);
      ghu = refreshed.ghu; ghr = refreshed.ghr; ghuExpiresAt = refreshed.ghuExpiresAt;
      await writeStore({ ghu, ghr, ghuExpiresAt, mask: stored.mask });
    }
    if (!cache.bearer || Date.now() > cache.expiresAt - 60 * 1000) {
      const token = await fetchCopilotToken(ghu);
      cache.bearer = token.token;
      cache.expiresAt = (Number(token.expires_at) || Math.floor(Date.now() / 1000) + 1500) * 1000;
    }
    return { bearer: cache.bearer, headers: { ...COPILOT_HEADERS, Authorization: `Bearer ${cache.bearer}` } };
  }

  async function status() {
    const stored = await readStore();
    return { loggedIn: Boolean(stored), mask: (stored && stored.mask) || '', providerId };
  }

  async function start() {
    const res = await fetch(DEVICE_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
      body: JSON.stringify({ client_id: CLIENT_ID, scope: 'read:user' })
    });
    if (!res.ok) throw new Error(`发起 GitHub 登录失败：HTTP ${res.status}`);
    const data = await res.json();
    if (!data.device_code) throw new Error('GitHub 登录响应异常，请稍后重试');
    return {
      deviceCode: data.device_code,
      userCode: data.user_code,
      verificationUri: data.verification_uri || 'https://github.com/login/device',
      interval: Math.max(3, Number(data.interval) || 5),
      expiresIn: Number(data.expires_in) || 900
    };
  }

  async function poll(deviceCode) {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
      body: JSON.stringify({ client_id: CLIENT_ID, device_code: deviceCode, grant_type: 'urn:ietf:params:oauth:grant-type:device_code' })
    });
    const data = await res.json().catch(() => ({}));
    if (data.access_token) {
      const ghu = data.access_token, ghr = data.refresh_token || '';
      const ghuExpiresAt = Date.now() + (Number(data.expires_in) || 28800) * 1000;
      const mask = `${ghu.slice(0, 7)}••••${ghu.slice(-4)}`;
      await writeStore({ ghu, ghr, ghuExpiresAt, mask });
      cache.bearer = ''; cache.expiresAt = 0;
      return { status: 'success', mask };
    }
    const error = data.error || 'unknown';
    if (error === 'authorization_pending') return { status: 'pending' };
    if (error === 'slow_down') return { status: 'pending', slowDown: true };
    if (error === 'expired_token') return { status: 'expired', message: '设备码已过期，请重新发起登录' };
    return { status: 'error', message: data.error_description || 'GitHub 授权失败，请重试' };
  }

  async function logout() {
    await writeStore({});
    cache.bearer = ''; cache.expiresAt = 0;
    return { ok: true };
  }

  return { status, start, poll, logout, getBearer };
}
