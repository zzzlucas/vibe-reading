const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * 卡密生成工具 (增强版)
 * 使用方法: 
 * 1. 生成 10 个卡密: node generateKeys.js 10
 * 2. 默认生成 1 个: node generateKeys.js
 */

const KEYS_FILE = path.join(__dirname, 'cardkeys.json');
const EXPORT_TEXT_FILE = path.join(__dirname, 'new_keys_export.txt');

function generateKeyCode() {
  // 更加简洁的纯随机格式: XXXX-XXXX-XXXX-XXXX
  const part = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${part()}-${part()}-${part()}-${part()}`;
}

function readKeys() {
  try {
    if (fs.existsSync(KEYS_FILE)) {
      return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('读取记录文件失败:', e);
  }
  return [];
}

function writeKeys(keys) {
  try {
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('写入记录文件失败:', e);
    return false;
  }
}

function main() {
  // 3. 数字可以自定义输入：从命令行读取参数，默认为 1
  const count = parseInt(process.argv[2]) || 1;
  const existingKeys = readKeys();
  const newCodes = [];

  for (let i = 0; i < count; i++) {
    const code = generateKeyCode();
    existingKeys.push({
      code: code,
      used: false,
      createdAt: new Date().toISOString(),
      usedAt: null,
      usedBy: null
    });
    newCodes.push(code);
  }

  if (writeKeys(existingKeys)) {
    // 2. 增加一个更简单的文件，只有 code，方便复制
    // 每次生成都会覆盖此文件，仅保留最新生成的一批
    fs.writeFileSync(EXPORT_TEXT_FILE, newCodes.join('\n'), 'utf-8');

    console.log(`\n✅ 成功生成 ${count} 个新卡密！`);
    console.log('-----------------------------------');
    newCodes.forEach((code, index) => {
      console.log(`${index + 1}. ${code}`);
    });
    console.log('-----------------------------------');
    console.log(`完整记录已更新: ${KEYS_FILE}`);
    console.log(`便捷导出文件: ${EXPORT_TEXT_FILE} (仅包含本次生成的卡密) \n`);
  }
}

main();
