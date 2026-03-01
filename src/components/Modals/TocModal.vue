<template>
  <div class="modal-overlay" v-if="store.showToc" @click.self="store.showToc = false">
    <div class="modal-container toc-modal-container">
      <div class="modal-header">
        <h2>目录</h2>
        <button class="icon-btn modal-close" @click="store.showToc = false">
          <icon-material-symbols-close />
        </button>
      </div>

      <!-- Search Box -->
      <div class="toc-search-wrap">
        <div class="search-input-inner">
          <icon-material-symbols-search class="search-icon" />
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="搜索章节标题..." 
            class="toc-search-input"
            @keydown.esc.stop="searchQuery = ''"
          >
          <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">
            <icon-material-symbols-cancel />
          </button>
        </div>
      </div>

      <div class="modal-body" style="padding: 0; max-height: 60vh; overflow-y: auto;">
        <div class="toc-list">
          <div v-if="filteredChapters.length === 0" style="padding: 40px 20px; text-align: center; color: var(--text-muted);">
            <icon-material-symbols-search-off style="font-size: 48px; opacity: 0.2; display: block; margin-bottom: 12px; margin-left: auto; margin-right: auto;" />
            {{ searchQuery ? '未找到相关章节' : '暂无目录数据' }}
          </div>
          <div v-for="(chapter, idx) in filteredChapters" :key="idx"
               class="toc-item"
               @click="jumpToChapter(chapter.page)"
               :class="{ active: isChapterActive(chapter, idx) }">
            <div class="toc-item-content">
               <span class="chapter-title">{{ chapter.title }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStore } from '@/store/appStore';

const store = useAppStore();
const searchQuery = ref('');

const filteredChapters = computed(() => {
  if (!searchQuery.value.trim()) return store.chapters;
  const q = searchQuery.value.toLowerCase();
  return store.chapters.filter(c => c.title.toLowerCase().includes(q));
});

function isChapterActive(chapter: any, filteredIdx: number) {
  // Simple check: is current page within this chapter's range in the ORIGINAL chapters array
  const originalIdx = store.chapters.indexOf(chapter);
  if (originalIdx === -1) return false;
  
  return store.currentPage >= chapter.page && 
         (originalIdx === store.chapters.length - 1 || store.currentPage < store.chapters[originalIdx + 1].page);
}

function jumpToChapter(page: number) {
  store.triggerTypewriter = true;
  store.currentPage = page;
  store.showToc = false;
  // Trigger update/save
  if (store.activeNovelIndex !== null) {
    store.novels[store.activeNovelIndex].currentPage = page;
    store._saveNovelsMeta();
  }
}
</script>

<style scoped lang="less">
.toc-modal-container {
  max-width: 450px !important;
}

/* Scrollbar styling */
.modal-body {
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 10px;
    &:hover {
      background: var(--text-muted);
    }
  }
}

.toc-search-wrap {
  padding: 0 16px 12px;
  
  .search-input-inner {
    position: relative;
    display: flex;
    align-items: center;
    background: var(--bg-input);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 0 12px;
    transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
    
    &:focus-within {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(138, 180, 248, 0.15);
    }
  }
  
  .search-icon {
    font-size: 18px;
    color: var(--text-muted);
    margin-right: 8px;
  }
  
  .toc-search-input {
    flex: 1;
    height: 38px;
    background: transparent;
    border: none;
    outline: none;
    color: var(--text-primary);
    font-size: 13px;
    font-family: inherit;
    
    &::placeholder {
      color: var(--text-muted);
      opacity: 0.7;
    }
  }
  
  .clear-btn {
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    color: var(--text-muted);
    
    &:hover {
      color: var(--text-primary);
    }
    
    .material-symbols-outlined {
      font-size: 16px;
    }
  }
}

.toc-list {
  padding: 0 8px 8px;
}

.toc-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  margin-bottom: 2px;

  &:hover {
    background-color: var(--bg-surface-hover);
    transform: translateX(4px);
  }

  &.active {
    background-color: rgba(138, 180, 248, 0.1);
    color: var(--accent);
    font-weight: 500;
  }
  
  .toc-item-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  
  .chapter-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .chapter-page {
    font-size: 11px;
    color: var(--text-muted);
    font-family: monospace;
    flex-shrink: 0;
  }
}
</style>
