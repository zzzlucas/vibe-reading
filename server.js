require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Redis = require('ioredis');

const app = express();
const PORT = process.env.PORT || 3000;

const redisUrl = process.env.REDIS_URL || 'redis://default:jq0kCQS7k1o2JkoPs5ioZEuMoFae5o0k@redis-14849.crce194.ap-seast-1-1.ec2.cloud.redislabs.com:14849';
const redis = new Redis(redisUrl);

// Prefix for isolating data environments in standard Vercel setup
const envPrefix = process.env.VERCEL_ENV || 'development';

// ===== Static serving =====
const distDir = path.join(__dirname, 'dist');
const staticDir = fs.existsSync(distDir) ? distDir : __dirname;
const isProd = fs.existsSync(distDir);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ===== PWA Service Worker must NOT be cached by the browser =====
// If the browser caches sw.js, it will never detect the new version after a build.
app.use((req, res, next) => {
  const swFiles = ['/sw.js', '/workbox-', '/registerSW.js'];
  if (swFiles.some(f => req.path.startsWith(f))) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

app.use(express.static(staticDir));

// ===== Global API Signature Middleware =====
// Prevents Postman/script abuse by verifying a time-based HMAC-like request signature
// on every /api/ call in production. Development mode bypasses this for convenience.
function _apiSignatureHash(payload, deviceId) {
  const salt = "f!nD_dEep#82";
  const raw = `${salt}:${payload}:@:${deviceId}`;
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    h1 = Math.imul(h1 ^ char, 2654435761);
    h2 = Math.imul(h2 ^ char, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const p3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
  const p4 = ((~h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
  const p5 = ((h1 ^ ~h2) >>> 0).toString(16).padStart(8, '0');
  const p6 = ((h1 + h2) >>> 0).toString(16).padStart(8, '0');
  const p7 = ((h1 - h2) >>> 0).toString(16).padStart(8, '0');
  const p8 = ((h2 - h1) >>> 0).toString(16).padStart(8, '0');
  return p1 + p2 + p3 + p4 + p5 + p6 + p7 + p8;
}

app.use('/api', (req, res, next) => {
  // Skip verification in development mode
  if (envPrefix === 'development') return next();

  const deviceId = req.headers['x-device-id'];
  const timestamp = parseInt(req.headers['x-timestamp'] || '0', 10);
  const signature = req.headers['x-signature'];

  // Require all three headers
  if (!deviceId || !timestamp || !signature) {
    return res.status(403).json({ error: '无效的请求来源' });
  }

  // Timestamp must be within a 90-second window (prevents replay attacks)
  const now = Date.now();
  if (Math.abs(now - timestamp) > 90000) {
    return res.status(403).json({ error: '请求已过期，请重试' });
  }

  // Verify signature: hash of "timestamp:path" keyed by deviceId
  const urlObj = new URL(req.url, 'http://localhost');
  const path = urlObj.pathname;
  const expectedSig = _apiSignatureHash(`${timestamp}:${path}`, deviceId);
  if (signature !== expectedSig) {
    return res.status(403).json({ error: '签名校验不通过' });
  }

  next();
});



// ===== Card Key System =====

async function readKeys() {
  try {
    const data = await redis.get(`${envPrefix}:cardkeys`);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

async function writeKeys(keys) {
  await redis.set(`${envPrefix}:cardkeys`, JSON.stringify(keys));
}

async function readTokens() {
  try {
    const data = await redis.get(`${envPrefix}:tokens`);
    return data ? JSON.parse(data) : {};
  } catch { return {}; }
}

async function writeTokens(tokens) {
  await redis.set(`${envPrefix}:tokens`, JSON.stringify(tokens));
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ===== Invite System =====

async function readInvites() {
  try {
    const data = await redis.get(`${envPrefix}:invites`);
    return data ? JSON.parse(data) : {};
  } catch { return {}; }
}

async function writeInvites(invites) {
  await redis.set(`${envPrefix}:invites`, JSON.stringify(invites));
}

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * GET /api/invite/info?deviceId=xxx
 * Returns: { inviteCode, count, rewardToken }
 */
app.get('/api/invite/info', async (req, res) => {
  const { deviceId } = req.query;
  if (!deviceId) return res.status(400).json({ error: 'Missing deviceId' });

  const invites = await readInvites();
  if (!invites[deviceId]) {
    invites[deviceId] = {
      inviteCode: generateInviteCode(),
      invitedBy: null,
      invitedDevices: [],
      rewardToken: null,
      isValid: false
    };
    await writeInvites(invites);
  }

  const user = invites[deviceId];
  
  // Check if eligible for reward
  if (user.invitedDevices.length >= 3 && !user.rewardToken) {
    const token = generateToken();
    const tokens = await readTokens();
    tokens[token] = {
      code: 'INVITE_REWARD',
      activatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    };
    await writeTokens(tokens);
    user.rewardToken = token;
    await writeInvites(invites);
  }

  res.json({
    inviteCode: user.inviteCode,
    count: user.invitedDevices.length,
    rewardToken: user.rewardToken
  });
});

/**
 * POST /api/invite/use
 * Body: { inviteCode: "XXX", deviceId: "YYY" }
 */
app.post('/api/invite/use', async (req, res) => {
  const { inviteCode, deviceId } = req.body;
  if (!inviteCode || !deviceId) return res.status(400).json({ error: 'Missing logic parameters' });

  if (envPrefix !== 'development' && deviceId.startsWith('mock_')) {
    return res.status(403).json({ error: '生产环境不允许使用模拟设备进行邀请测试' });
  }

  const code = inviteCode.trim().toUpperCase();
  const invites = await readInvites();

  const MAX_INVITES_PER_IP = 2;
  
  // Ensure current device exists
  if (!invites[deviceId]) {
    invites[deviceId] = {
      inviteCode: generateInviteCode(),
      invitedBy: null,
      invitedDevices: [],
      rewardToken: null,
      isValid: false
    };
  }

  if (invites[deviceId].invitedBy) {
    return res.status(400).json({ error: '您已经使用过邀请码了' });
  }

  // Find inviter
  const inviterId = Object.keys(invites).find(id => invites[id].inviteCode === code);
  if (!inviterId) {
    return res.status(404).json({ error: '无效的邀请码' });
  }

  if (inviterId === deviceId) {
    return res.status(400).json({ error: '不能使用自己的邀请码' });
  }

  const forwardedFor = req.headers['x-forwarded-for'];
  const realIp = typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : req.ip;
  const requesterIp = realIp || 'unknown';
  
  // Check IP limit across all invites
  let ipCount = 0;
  for (const id in invites) {
    if (invites[id].invitedBy && invites[id].ip === requesterIp) {
      ipCount++;
    }
  }

  if (envPrefix === 'development' && deviceId.startsWith('mock_')) {
    // bypass IP limits for mock devices in dev environment to allow unlimited testing
  } else if (ipCount >= MAX_INVITES_PER_IP) {
    return res.status(403).json({ error: '当前网络环境限制，无法接受更多邀请' });
  }

  // Bind
  invites[deviceId].invitedBy = code;
  invites[deviceId].ip = requesterIp;
  // Does not add to the inviter's invitedDevices array until validity criteria are met
  
  await writeInvites(invites);
  res.json({ success: true, message: '成功受邀注册！开始阅读并体验功能以助力好友吧！' });
});

/**
 * POST /api/invite/validate
 * Body: { deviceId: "YYY" }
 * Called when the frontend determines the user has met the usage criteria.
 */
function _generateSecurityHash(chars, deviceId) {
  const salt = "f!nD_dEep#82";
  const raw = `${salt}:${chars}:@:${deviceId}`;
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      h1 = Math.imul(h1 ^ char, 2654435761);
      h2 = Math.imul(h2 ^ char, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const p3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
  const p4 = ((~h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
  const p5 = ((h1 ^ ~h2) >>> 0).toString(16).padStart(8, '0');
  const p6 = ((h1 + h2) >>> 0).toString(16).padStart(8, '0');
  const p7 = ((h1 - h2) >>> 0).toString(16).padStart(8, '0');
  const p8 = ((h2 - h1) >>> 0).toString(16).padStart(8, '0');
  return p1 + p2 + p3 + p4 + p5 + p6 + p7 + p8;
}

app.post('/api/invite/validate', async (req, res) => {
  const { deviceId, activeTime, verifyToken } = req.body;
  if (!deviceId) return res.status(400).json({ error: 'Missing logic parameters' });

  if (envPrefix !== 'development') {
    if (deviceId.startsWith('mock_')) {
      return res.status(403).json({ error: '生产环境不允许使用模拟设备进行邀请测试' });
    }
    // Anti-bot validation
    if (!activeTime || typeof activeTime !== 'number' || activeTime < 180) {
      return res.status(403).json({ error: '阅读时长未达标，无法激活验证' });
    }
    const expectedToken = _generateSecurityHash(activeTime, deviceId);
    if (verifyToken !== expectedToken) {
      return res.status(403).json({ error: '非法激活请求，签名校验不通过' });
    }
  }

  const invites = await readInvites();
  if (!invites[deviceId] || !invites[deviceId].invitedBy) {
    return res.json({ success: false, reason: '未受邀' });
  }

  if (invites[deviceId].isValid) {
    return res.json({ success: true, alreadyValid: true }); // Already validated
  }

  // Find inviter
  const inviterId = Object.keys(invites).find(id => invites[id].inviteCode === invites[deviceId].invitedBy);
  if (!inviterId) return res.json({ success: false, reason: '未找到邀请人' });

  // Mark valid and add to inviter's array
  invites[deviceId].isValid = true;
  if (!invites[inviterId].invitedDevices.includes(deviceId)) {
    invites[inviterId].invitedDevices.push(deviceId);
  }

  await writeInvites(invites);
  res.json({ success: true });
});



/**
 * POST /api/activate
 * Body: { code: "XXXX" }
 * Response: { success: true, token: "xxx" }  or  { error: "..." }
 */
app.post('/api/activate', async (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: '请输入卡密' });
  }

  const normalizedCode = code.trim().toUpperCase();
  const keys = await readKeys();
  const keyIndex = keys.findIndex(k => k.code.toUpperCase() === normalizedCode);

  if (keyIndex === -1) {
    return res.status(404).json({ error: '卡密不存在，请检查是否输入正确' });
  }

  const key = keys[keyIndex];

  if (key.used) {
    const usedAt = key.usedAt
      ? new Date(key.usedAt).toLocaleDateString('zh-CN')
      : '未知时间';
    return res.status(409).json({ error: `该卡密已于 ${usedAt} 被使用` });
  }

  // Activate: mark as used, generate session token
  const token = generateToken();
  keys[keyIndex].used = true;
  keys[keyIndex].usedAt = new Date().toISOString();
  keys[keyIndex].usedBy = req.ip || 'unknown';
  await writeKeys(keys);

  // Store token with expiry (365 days)
  const tokens = await readTokens();
  tokens[token] = {
    code: normalizedCode,
    activatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  };
  await writeTokens(tokens);

  console.log(`[Activate] Code "${normalizedCode}" activated from ${req.ip}`);
  res.json({ success: true, token, message: '激活成功！享受您的阅读时光 🎉' });
});

/**
 * POST /api/verify
 * Body: { token: "xxx" }
 * Response: { valid: true }  or  { valid: false, reason: "..." }
 */
app.post('/api/verify', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.json({ valid: false, reason: '未提供令牌' });

  const tokens = await readTokens();
  const entry = tokens[token];

  if (!entry) {
    return res.json({ valid: false, reason: '令牌不存在' });
  }

  if (new Date() > new Date(entry.expiresAt)) {
    return res.json({ valid: false, reason: '令牌已过期' });
  }

  res.json({ valid: true, activatedAt: entry.activatedAt, expiresAt: entry.expiresAt });
});

/**
 * POST /api/track
 * Body: { event: "...", deviceId: "YYY", meta: {} }
 */
app.post('/api/track', async (req, res) => {
  const { event, deviceId, meta } = req.body;
  if (!event || !deviceId) return res.json({ success: false });

  // Log to console for debugging or Vercel metrics only. 
  // Redis tracking removed to save KV quota.
  const ip = req.ip || 'unknown';
  console.log(`[TRACK] ${event} from ${deviceId} (${ip})`);

  res.json({ success: true });
});

// ===== SMTP / Feedback =====
const transporter = nodemailer.createTransport({
  host: 'smtp.163.com',
  port: 465,
  secure: true,
  auth: {
    user: 'lucasishere@163.com',
    pass: 'HPWMHIESJEGEFDGT'
  }
});

app.post('/api/feedback', async (req, res) => {
  const { message, contact, type, debug } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: '反馈内容不能为空' });
  }

  const typeLabels = {
    bug: '🐛 报 Bug',
    feature: '💡 提需求',
    payment: '💰 付费问题'
  };

  try {
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #efefef; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <h2 style="color: #4285f4; border-bottom: 2px solid #4285f4; padding-bottom: 10px;">📬 FindDeep 用户反馈</h2>
        
        <div style="margin: 16px 0;">
          <span style="background: #f1f3f4; padding: 4px 12px; border-radius: 20px; font-size: 13px; color: #5f6368; font-weight: bold;">
            ${typeLabels[type] || '📝 普通反馈'}
          </span>
        </div>

        <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #4285f4;">
          <p style="color: #333; line-height: 1.8; white-space: pre-wrap; margin: 0;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        </div>

        ${contact ? `<p style="color: #666; font-size: 14px; margin-bottom: 20px;">📧 <b>联系方式：</b>${contact.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>` : ''}
        
        <div style="background: #fff; border: 1px dashed #ced4da; border-radius: 8px; padding: 12px; font-size: 12px; color: #6c757d;">
          <p style="margin: 0 0 8px 0; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">🔍 案发现场 (Debug Info)</p>
          <ul style="list-style: none; padding: 0; margin: 0; line-height: 1.6;">
            <li>🎨 <b>皮肤风格:</b> ${debug?.skin || 'unknown'}</li>
            <li>📏 <b>屏幕尺寸:</b> ${debug?.screenSize || 'unknown'}</li>
            <li>🌟 <b>Pro 状态:</b> ${debug?.isPro ? '已激活' : '免费版'}</li>
            <li>🕒 <b>客户端时间:</b> ${debug?.timestamp || 'unknown'}</li>
            <li style="word-break: break-all; margin-top: 4px; color: #adb5bd; font-family: monospace;">🖥️ <b>UserAgent:</b> ${debug?.userAgent || 'unknown'}</li>
          </ul>
        </div>

        <p style="color: #ccc; font-size: 11px; margin-top: 24px; text-align: center;">发送于 ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
      </div>
    `;

    await transporter.sendMail({
      from: '"FindDeep Bot" <lucasishere@163.com>',
      to: 'zehcoid@foxmail.com',
      subject: `[${typeLabels[type] || '反馈'}] ${message.substring(0, 40)}${message.length > 40 ? '...' : ''}`,
      html: htmlContent
    });

    res.json({ success: true, message: '反馈已发送，感谢！' });
  } catch (error) {
    console.error('Email send failed:', error);
    res.status(500).json({ error: '发送失败，请稍后重试' });
  }
});

// ===== Catch-all for SPA routing =====
app.get('*', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

// ===== Start =====
if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(PORT, () => {
    console.log(`\n  🚀 FindDeep Server is running`);
    console.log(`  📖 Open http://localhost:${PORT} to start reading`);
    console.log(`  🔑 Card key system: ENABLED`);
    if (isProd) {
      console.log(`  🔒 Serving obfuscated build from /dist`);
    } else {
      console.log(`  🛠  Dev mode (source files)`);
    }
    console.log('');
  });
}
