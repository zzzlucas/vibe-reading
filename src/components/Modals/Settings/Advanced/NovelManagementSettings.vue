<template>
  <div class="advanced-sub-group">
    <div class="sub-group-title">
       <icon-material-symbols-folder-open />
       <span>作品文件管理</span>
       <span class="advanced-tip" style="margin-left: 8px; font-weight: normal; font-size: 11px; opacity: 0.8;">仅管理您手动加载的作品文件</span>
    </div>
    <div class="setting-item no-border" style="flex-direction:column;align-items:flex-start">
      <div class="saved-novels-list" style="width: 100%; margin-top: 8px;">
        <div v-if="realNovels.length === 0" class="empty-state">暂无已保存的作品</div>
        <div v-for="item in realNovels" :key="item.novel.name" class="saved-novel-item">
          <div class="novel-item-info" @click="loadNovelAndClose(item.index)">
            <icon-material-symbols-description />
            <span class="novel-item-name">{{ item.novel.displayName || item.novel.name.replace(/\.txt$/i, '') }}</span>
            <span class="novel-item-size">{{ formatFileSize(item.novel.size) }}</span>
          </div>
          <div class="novel-item-actions">
            <button class="novel-delete-btn" @click="deleteNovel(item.index)" title="删除">
              <icon-material-symbols-close />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '@/store/appStore';

const store = useAppStore();

const realNovels = computed(() => {
  return store.novels
    .map((novel, index) => ({ novel, index }))
    .filter(item => item.novel.type === 'works');
});

function loadNovelAndClose(index: number) {
  store.openNovel(index);
  store.showSettings = false;
}

async function deleteNovel(index: number) {
  if (await store.confirmDialog(`确定要删除「${store.novels[index].displayName || store.novels[index].name}」吗？`, '删除作品')) {
    store.deleteNovel(index);
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
</script>
