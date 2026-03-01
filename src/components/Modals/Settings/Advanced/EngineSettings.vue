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

    <div class="setting-item">
      <div class="setting-label">
        <icon-material-symbols-auto-stories />
        <div class="label-with-desc">
          <span>每页加载字数</span>
          <span class="desc-text">影响分页速度，建议 2k~5k</span>
        </div>
      </div>
      <div class="setting-control setting-control-col">
        <div class="slider-row">
          <input type="range" v-model.number="charsPerPageLocal" @change="debouncedCharsChange" min="500" max="15000" step="100" class="slider">
          <span>{{ charsPerPageLocal }}</span>
        </div>
        <div class="preset-btns">
          <button class="preset-btn" :class="{ active: charsPerPageLocal === 2000 }" @click="setChars(2000)">2k</button>
          <button class="preset-btn" :class="{ active: charsPerPageLocal === 5000 }" @click="setChars(5000)">5k</button>
          <button class="preset-btn" :class="{ active: charsPerPageLocal === 10000 }" @click="setChars(10000)">1w</button>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAppStore } from '@/store/appStore';

const store = useAppStore();
const charsPerPageLocal = ref(store.settings.charsPerPage);

function setChars(val: number) {
  charsPerPageLocal.value = val;
  store.settings.charsPerPage = val;
  reloadCurrentNovel();
}

function debouncedCharsChange() {
  store.settings.charsPerPage = charsPerPageLocal.value;
  reloadCurrentNovel();
}

async function reloadCurrentNovel() {
  if (store.activeNovelIndex !== null) {
    await store.openNovel(store.activeNovelIndex);
  }
}
</script>
