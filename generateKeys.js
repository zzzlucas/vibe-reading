require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://default:jq0kCQS7k1o2JkoPs5ioZEuMoFae5o0k@redis-14849.crce194.ap-seast-1-1.ec2.cloud.redislabs.com:14849';
const envPrefix = process.env.VERCEL_ENV || 'development';
const redis = new Redis(redisUrl);

/**
 * 卡密生成工具 (增强云端版)
 * 使用方法: 
 * 1. 生成 10 个卡密: npm run generate-keys
 * 2. 默认生成 1 个: npm run generate-one-key
 */
const EXPORT_TEXT_FILE = path.join(__dirname, `new_keys_export_${envPrefix}.txt`);

function generateKeyCode() {
  const part = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${part()}-${part()}-${part()}-${part()}`;
}

async function readKeys() {
  try {
    const data = await redis.get(`${envPrefix}:cardkeys`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('读取云端记录失败:', e);
  }
  return [];
}

async function writeKeys(keys) {
  try {
    await redis.set(`${envPrefix}:cardkeys`, JSON.stringify(keys));
    return true;
  } catch (e) {
    console.error('写入云端记录失败:', e);
    return false;
  }
}

async function main() {
  const count = parseInt(process.argv[2]) || 1;
  const existingKeys = await readKeys();
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

  if (await writeKeys(existingKeys)) {
    fs.writeFileSync(EXPORT_TEXT_FILE, newCodes.join('\n'), 'utf-8');

    console.log(`\n✅ 成功生成 ${count} 个新卡密！`);
    console.log('-----------------------------------');
    newCodes.forEach((code, index) => {
      console.log(`${index + 1}. ${code}`);
    });
    console.log('-----------------------------------');
    console.log(`云端数据库已同步更新: [${envPrefix}:cardkeys]`);
    console.log(`便捷导出文件: ${EXPORT_TEXT_FILE} (仅包含本次生成的卡密) \n`);
  }
  
  process.exit(0); // 结束进程断开 redis 链接
}

main();
