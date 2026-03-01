const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

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

// ===== Card Key System =====
const KEYS_FILE = path.join(__dirname, 'cardkeys.json');
const TOKENS_FILE = path.join(__dirname, 'tokens.json');

function readKeys() {
  try {
    return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeKeys(keys) {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2), 'utf-8');
}

function readTokens() {
  try {
    return JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writeTokens(tokens) {
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2), 'utf-8');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * POST /api/activate
 * Body: { code: "XXXX" }
 * Response: { success: true, token: "xxx" }  or  { error: "..." }
 */
app.post('/api/activate', (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: '请输入卡密' });
  }

  const normalizedCode = code.trim().toUpperCase();
  const keys = readKeys();
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
  writeKeys(keys);

  // Store token with expiry (365 days)
  const tokens = readTokens();
  tokens[token] = {
    code: normalizedCode,
    activatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  };
  writeTokens(tokens);

  console.log(`[Activate] Code "${normalizedCode}" activated from ${req.ip}`);
  res.json({ success: true, token, message: '激活成功！享受您的阅读时光 🎉' });
});

/**
 * POST /api/verify
 * Body: { token: "xxx" }
 * Response: { valid: true }  or  { valid: false, reason: "..." }
 */
app.post('/api/verify', (req, res) => {
  const { token } = req.body;
  if (!token) return res.json({ valid: false, reason: '未提供令牌' });

  const tokens = readTokens();
  const entry = tokens[token];

  if (!entry) {
    return res.json({ valid: false, reason: '令牌不存在' });
  }

  if (new Date() > new Date(entry.expiresAt)) {
    return res.json({ valid: false, reason: '令牌已过期' });
  }

  res.json({ valid: true, activatedAt: entry.activatedAt, expiresAt: entry.expiresAt });
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
