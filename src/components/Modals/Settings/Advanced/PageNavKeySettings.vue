<template>
  <div class="page-key-settings">
    <div class="setting-item">
      <div class="setting-label">
        <icon-material-symbols-chevron-left />
        <div class="label-with-desc">
          <span>上一页快捷键</span>
          <span class="desc-text">除了方向键外的自定义按键</span>
        </div>
      </div>
      <div class="setting-control hotkey-manager">
        <div class="key-tags">
          <div v-for="(key, idx) in store.settings.prevPageKeys" :key="idx" class="key-tag" @click="removeKey('prev', idx)">
            {{ formatKey(key) }}
            <icon-material-symbols-close style="font-size:12px" />
          </div>
          <div v-if="(store.settings.prevPageKeys?.length || 0) < 2" 
               class="key-tag key-add" 
               :class="{ 'is-listening': listeningType === 'prev' }" 
               @click="startListen('prev')">
            {{ listeningType === 'prev' ? '按下按键...' : '+ 设置' }}
          </div>
        </div>
      </div>
    </div>

    <div class="setting-item">
      <div class="setting-label">
        <icon-material-symbols-chevron-right />
        <div class="label-with-desc">
          <span>下一页快捷键</span>
          <span class="desc-text">除了方向键/空格外的自定义按键</span>
        </div>
      </div>
      <div class="setting-control hotkey-manager">
        <div class="key-tags">
          <div v-for="(key, idx) in store.settings.nextPageKeys" :key="idx" class="key-tag" @click="removeKey('next', idx)">
            {{ formatKey(key) }}
            <icon-material-symbols-close style="font-size:12px" />
          </div>
          <div v-if="(store.settings.nextPageKeys?.length || 0) < 2" 
               class="key-tag key-add" 
               :class="{ 'is-listening': listeningType === 'next' }" 
               @click="startListen('next')">
            {{ listeningType === 'next' ? '按下按键...' : '+ 设置' }}
          </div>
        </div>
      </div>
    </div>
    <div class="setting-item">
      <div class="setting-label">
        <icon-material-symbols-keyboard-arrow-up />
        <div class="label-with-desc">
          <span>向上滚动</span>
          <span class="desc-text">自定义平滑向上的快捷键</span>
        </div>
      </div>
      <div class="setting-control hotkey-manager">
        <div class="key-tags">
          <div v-for="(key, idx) in store.settings.scrollUpKeys" :key="idx" class="key-tag" @click="removeKey('scrollUp', idx)">
            {{ formatKey(key) }}
            <icon-material-symbols-close style="font-size:12px" />
          </div>
          <div v-if="(store.settings.scrollUpKeys?.length || 0) < 2" 
               class="key-tag key-add" 
               :class="{ 'is-listening': listeningType === 'scrollUp' }" 
               @click="startListen('scrollUp')">
            {{ listeningType === 'scrollUp' ? '按下按键...' : '+ 设置' }}
          </div>
        </div>
      </div>
    </div>

    <div class="setting-item">
      <div class="setting-label">
        <icon-material-symbols-keyboard-arrow-down />
        <div class="label-with-desc">
          <span>向下滚动</span>
          <span class="desc-text">自定义平滑向下的快捷键</span>
        </div>
      </div>
      <div class="setting-control hotkey-manager">
        <div class="key-tags">
          <div v-for="(key, idx) in store.settings.scrollDownKeys" :key="idx" class="key-tag" @click="removeKey('scrollDown', idx)">
            {{ formatKey(key) }}
            <icon-material-symbols-close style="font-size:12px" />
          </div>
          <div v-if="(store.settings.scrollDownKeys?.length || 0) < 2" 
               class="key-tag key-add" 
               :class="{ 'is-listening': listeningType === 'scrollDown' }" 
               @click="startListen('scrollDown')">
            {{ listeningType === 'scrollDown' ? '按下按键...' : '+ 设置' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { useAppStore } from '@/store/appStore';

const store = useAppStore();
const listeningType = ref<'prev' | 'next' | 'scrollUp' | 'scrollDown' | null>(null);

function formatKey(key: string) {
  if (key === ' ') return 'Space';
  if (key === 'ArrowLeft') return '←';
  if (key === 'ArrowRight') return '→';
  if (key === 'ArrowUp') return '↑';
  if (key === 'ArrowDown') return '↓';
  return key;
}

function startListen(type: 'prev' | 'next' | 'scrollUp' | 'scrollDown') {
  listeningType.value = type;
  window.addEventListener('keydown', captureKey, { capture: true });
}

function captureKey(e: KeyboardEvent) {
  e.preventDefault();
  e.stopPropagation();
  
  if (!listeningType.value) return;

  const key = e.key;
  const map: Record<string, keyof typeof store.settings> = {
    prev: 'prevPageKeys',
    next: 'nextPageKeys',
    scrollUp: 'scrollUpKeys',
    scrollDown: 'scrollDownKeys'
  };
  const targetList = map[listeningType.value];
  
  if (!store.settings[targetList]) {
    (store.settings as any)[targetList] = [];
  }

  if (!(store.settings[targetList] as string[]).includes(key)) {
    (store.settings[targetList] as string[]).push(key);
  }

  stopListening();
}

function stopListening() {
  window.removeEventListener('keydown', captureKey, { capture: true });
  listeningType.value = null;
}

function removeKey(type: 'prev' | 'next' | 'scrollUp' | 'scrollDown', idx: number) {
  const map: Record<string, keyof typeof store.settings> = {
    prev: 'prevPageKeys',
    next: 'nextPageKeys',
    scrollUp: 'scrollUpKeys',
    scrollDown: 'scrollDownKeys'
  };
  const targetList = map[type];
  (store.settings[targetList] as string[])?.splice(idx, 1);
}

onUnmounted(() => {
  stopListening();
});
</script>

<style scoped lang="less">
.hotkey-manager {
  display: flex;
  justify-content: flex-end;
}

.key-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}

.key-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;

  &:hover {
    border-color: var(--text-muted);
    background: var(--bg-surface-hover);
  }

  &.key-add {
    border-style: dashed;
    color: var(--text-muted);
    
    &.is-listening {
      border-color: var(--text-primary);
      color: var(--text-primary);
      background: rgba(128, 128, 128, 0.1);
      border-style: solid;
    }
  }
}
</style>
