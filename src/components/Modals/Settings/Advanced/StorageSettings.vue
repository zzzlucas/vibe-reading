<template>
  <div class="advanced-sub-group">
    <div class="sub-group-title">
       <icon-material-symbols-database />
       <span>存储管理</span>
    </div>
    <div class="setting-item no-border">
      <div class="setting-label">
        <div class="label-with-desc">
          <!-- 总体积 -->
          <div style="display: flex; align-items: center; gap: 8px;">
             <span>总体积: </span>
             <span style="color: var(--accent); font-weight: 600;">{{ totalSizeFormatted }}</span>
          </div>
          <!-- 阅读作品 -->
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
             <span class="desc-text">阅读作品体积: </span>
             <span class="desc-text" style="color: var(--text-secondary);">{{ worksTotalSize }}</span>
             <span class="desc-text">({{ realNovels.length }} 本)</span>
          </div>
          <!-- 预设对话 -->
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
             <span class="desc-text">预设对话体积: </span>
             <span class="desc-text" style="color: var(--text-secondary);">{{ dummyTotalSize }}</span>
             <span class="desc-text">({{ dummyNovels.length }} 条记录)</span>
          </div>
          <!-- AI 对话 -->
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
             <span class="desc-text">AI对话体积: </span>
             <span class="desc-text" style="color: var(--text-secondary);">{{ aiChatsTotalSize }}</span>
             <span class="desc-text">({{ aiChatNovels.length }} 条记录)</span>
          </div>
        </div>
      </div>
      <div class="setting-control">
        <button class="setting-btn danger-text" @click="handleClearAll">清空全部数据</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '@/store/appStore';
import { ContentDB } from '@/utils/db';

const store = useAppStore();

const realNovels = computed(() => store.novels.filter(n => n.type === 'works'));
const aiChatNovels = computed(() => store.novels.filter(n => n.type === 'ai'));
const dummyNovels = computed(() => store.novels.filter(n => n.type === 'fake'));

const totalSizeFormatted = computed(() => {
  const bytes = store.novels.reduce((acc, novel) => acc + (novel.size || 0), 0);
  return formatFileSize(bytes);
});

const worksTotalSize = computed(() => {
  const bytes = realNovels.value.reduce((acc, novel) => acc + (novel.size || 0), 0);
  return formatFileSize(bytes);
});

const aiChatsTotalSize = computed(() => {
  const bytes = aiChatNovels.value.reduce((acc, novel) => acc + (novel.size || 0), 0);
  return formatFileSize(bytes);
});

const dummyTotalSize = computed(() => {
  const bytes = dummyNovels.value.reduce((acc, novel) => acc + (novel.size || 0), 0);
  return formatFileSize(bytes);
});

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function handleClearAll() {
  if (await store.confirmDialog('警告：此操作将删除所有本地内容（含书架作品、阅读进度、自定义设置，以及激活状态）。确定继续？', '严重警告')) {
    if (await store.confirmDialog('数据无法恢复，真的要全部清空吗？', '终极确认')) {
      await clearCache();
    }
  }
}

async function clearCache() {
  await ContentDB.clear();
  Object.keys(localStorage).filter(k => k.startsWith('deep_reader_')).forEach(k => localStorage.removeItem(k));
  
  store.novels = [];
  store.activeId = null;
  store.currentPage = 0;
  store.totalPages = 0;
  store.pages = [];
  store.chapters = [];
  store.isPro = false;
  
  store.showToast('本地所有数据已彻底清除');
  setTimeout(() => window.location.reload(), 1500);
}
</script>
