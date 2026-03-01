/**
 * Post-build deep obfuscation script (CommonJS)
 * Run: node obfuscate.js  (after npm run build)
 */
const { readdirSync, readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const DIST_ASSETS = './dist/assets';

const options = {
  stringArray: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayCallsTransform: true,
  stringArrayCallsTransformThreshold: 0.6,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.8,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.4,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.2,
  numbersToExpressions: true,
  splitStrings: true,
  splitStringsChunkLength: 8,
  transformObjectKeys: false,
  unicodeEscapeSequence: false,
  selfDefending: false,
  debugProtection: false,
  sourceMap: false,
  compact: true,
  renameGlobals: false,
  target: 'browser'
};

function obfuscate() {
  console.log('\n\u{1F512} Starting deep obfuscation...');

  let files;
  try {
    files = readdirSync(DIST_ASSETS);
  } catch (e) {
    console.error('\u274C dist/assets not found. Run `npm run build` first.');
    process.exit(1);
  }

  const jsFiles = files.filter(f => f.endsWith('.js'));
  console.log(`   Found ${jsFiles.length} JS file(s)`);

  for (const file of jsFiles) {
    const filePath = join(DIST_ASSETS, file);
    const source = readFileSync(filePath, 'utf-8');
    const originalSize = (source.length / 1024).toFixed(1);

    process.stdout.write(`   Processing ${file} (${originalSize} KB)...`);

    const result = JavaScriptObfuscator.obfuscate(source, options);
    const obfuscated = result.getObfuscatedCode();
    const newSize = (obfuscated.length / 1024).toFixed(1);

    writeFileSync(filePath, obfuscated, 'utf-8');
    console.log(` \u2705 ${originalSize} KB -> ${newSize} KB`);
  }

  console.log('\n\u2728 Obfuscation complete! dist/ is ready for deployment.\n');
}

obfuscate();
