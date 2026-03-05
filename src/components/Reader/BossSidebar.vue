<template>
  <aside class="fake-sidebar" :class="[store.style]">
    <div class="fake-sidebar-inner">
       <div v-for="(item, i) in fakeSidebarTasks" :key="i" class="fake-item" :class="{ 'has-title': item.isTitle, 'is-gemini': store.style === 'gemini', 'is-chatgpt': store.style === 'chatgpt' }">
          <template v-if="item.isTitle">
             <div class="fake-title" :class="[store.style]">{{ item.text }}</div>
          </template>
          <template v-else>
             <div class="fake-dot" :class="[store.style]"></div>
             <div class="fake-text">{{ item.text }}</div>
          </template>
       </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '@/store/appStore';
import { FAKE_TASKS_IT, FAKE_TASKS_GENERAL, FAKE_TASKS_DESIGN } from '@/config/dummyPools';

const store = useAppStore();





const fakeSidebarTasks = computed(() => {
    let rawItems: string[] = [];
    if (store.settings.fakeSidebarMode === 'custom' && store.settings.fakeSidebarContent) {
        rawItems = store.settings.fakeSidebarContent.split('\n').map(l => l.trim()).filter(l => l);
    } else {
        const novelInfo = (store.activeNovelIndex !== null ? store.novels[store.activeNovelIndex] : null) || { id: 'default' };
        const seedValue = novelInfo.id + (store.fakeSidebarRefreshSeed * 1000);
        const rand = (i: number) => {
            let h = 0;
            const str = seedValue + i;
            for (let j = 0; j < str.length; j++) {
              h = ((h << 5) - h) + str.charCodeAt(j);
              h |= 0;
            }
            const x = Math.sin(h) * 10000;
            return x - Math.floor(x);
        };
        
        let poolToUse = FAKE_TASKS_IT;
        if (store.settings.fakeSidebarMode === 'random_general') poolToUse = FAKE_TASKS_GENERAL;
        else if (store.settings.fakeSidebarMode === 'random_design') poolToUse = FAKE_TASKS_DESIGN;
        
        const shuffled = [...poolToUse].sort((a, b) => rand(poolToUse.indexOf(a)) - 0.5);
        
        let count = store.settings.fakeSidebarItemCount || 15;
        if (store.settings.fakeSidebarAutoAdjustCount) {
            const extra = Math.floor(store.totalPages * 1.5);
            count = Math.min(50, count + extra);
        }
        
        rawItems = shuffled.slice(0, count);
    }

    return rawItems.map(item => ({
        isTitle: item.startsWith('[TITLE] '),
        text: item.replace('[TITLE] ', '')
    }));
});
</script>

<style scoped lang="less">
.fake-sidebar {
  width: 220px;
  border-left: 1px solid var(--border-color);
  background-color: var(--bg-primary);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  user-select: none;

  position: sticky;
  top: 0;
  align-self: flex-start;
  max-height: calc(100vh - 160px); // keep it within viewport when scrolling
  
  &.gemini, &.chatgpt {
    background-color: transparent; // Blend in for cleaner look
    border-left-color: transparent; // Remove harsh border
  }
}

.fake-sidebar-inner {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fake-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 13px;
  
  &.has-title {
    margin-top: 12px;
    margin-bottom: 4px;
    
    &:first-of-type {
      margin-top: 0;
    }
  }

  &.is-gemini, &.is-chatgpt {
    padding: 6px 8px;
    border-radius: var(--radius-sm);
    transition: background-color 0.2s;
    margin-left: -8px; // Offset padding
    margin-right: -8px;
    cursor: default;

    &:not(.has-title):hover {
      background-color: var(--bg-surface-hover);
      color: var(--text-primary);

      .fake-dot.gemini, .fake-dot.chatgpt {
        background-color: var(--text-secondary);
      }
    }
  }
}

.fake-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.gemini, &.chatgpt {
    color: var(--text-primary);
    opacity: 0.8;
    letter-spacing: normal;
    text-transform: none;
    font-size: 13px;
  }
}

.fake-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--border-color);
  flex-shrink: 0;
  transition: background-color 0.2s;

  &.gemini, &.chatgpt {
    background-color: var(--text-muted);
    opacity: 0.6;
  }
}

.fake-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// Custom Scrollbar for sidebar itself
.fake-sidebar::-webkit-scrollbar {
  width: 4px;
}
.fake-sidebar::-webkit-scrollbar-track {
  background: transparent;
}
.fake-sidebar::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.2);
  border-radius: 4px;
}
.fake-sidebar:hover::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.4);
}
</style>
