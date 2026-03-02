<template>
    <div class="setting-item">
      <div class="setting-label" style="flex:1">
        <icon-material-symbols-translate />
        <div style="display:flex;flex-direction:column;align-items:flex-start">
          <span>文件编码</span>
          <span style="font-size:12px;color:var(--text-muted);font-weight:normal">如果不出现乱码，请保持自动检测</span>
        </div>
      </div>
      <div class="setting-control">
        <select v-model="store.encoding" class="encoding-select">
          <option value="auto">自动检测 (推荐)</option>
          <option value="utf-8">UTF-8</option>
          <option value="gbk">GBK / GB2312</option>
          <option value="utf-16le">UTF-16 LE</option>
          <option value="utf-16be">UTF-16 BE</option>
          <option value="big5">Big5 (繁体)</option>
        </select>
      </div>
    </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/store/appStore';

const store = useAppStore();
</script>
