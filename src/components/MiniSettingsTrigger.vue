<template>
  <div 
    v-if="shouldShow" 
    class="mini-settings-trigger"
    :class="{ 'is-expanded': isHovered }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @click="store.showSettings = true"
  >
    <div class="mini-icon">
      <icon-material-symbols-settings />
    </div>
    <span class="mini-text">设置和新功能</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStore } from '@/store/appStore';

const store = useAppStore();
const isHovered = ref(false);

const shouldShow = computed(() => {
  // Only show when style is NOT gemini or chatgpt
  // And also not in classic_blog1 as that's handled by its own layout
  const style = store.style;
  return style !== 'gemini' && style !== 'chatgpt';
});
</script>

<style scoped lang="less">
.mini-settings-trigger {
  position: fixed;
  bottom: 12px;
  left: 12px;
  height: 32px;
  width: 32px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  display: flex;
  align-items: center;
  overflow: hidden;
  cursor: pointer;
  z-index: 1000;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-sm);
  padding: 0;

  &:hover {
    background-color: var(--bg-surface-hover);
    border-color: var(--accent);
    color: var(--accent);
    box-shadow: var(--shadow-md);
  }

  &.is-expanded {
    width: 140px;
    padding-right: 12px;
  }

  .mini-icon {
    width: 30px;
    min-width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    svg {
      font-size: 18px;
    }
  }

  .mini-text {
    font-size: 12px;
    white-space: nowrap;
    margin-left: 4px;
    opacity: 0;
    transition: opacity 0.2s;
    font-weight: 500;
  }

  &.is-expanded .mini-text {
    opacity: 1;
  }
}

/* Specific Style Overrides for better camouflage */
[data-style="vscode"] .mini-settings-trigger {
  border-radius: 4px;
  background-color: var(--bg-sidebar);
  border: none;
  box-shadow: none;
  &:hover { color: #fff; }
}

[data-style="terminal"] .mini-settings-trigger {
  border-radius: 0;
  background-color: #000;
  border: 1px solid #16c60c;
  color: #16c60c;
  box-shadow: none;
}

[data-style="classic_blog1"] .mini-settings-trigger {
  border-radius: 8px;
  background-color: transparent;
  border: 1px solid rgba(128, 128, 128, 0.3);
  color: #1a6496;
  box-shadow: none;
  &:hover { background-color: rgba(255,255,255,0.1); border-color: #1a6496; }
}
</style>

