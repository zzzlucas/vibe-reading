<template>
  <div class="modal-overlay" v-if="store.confirmVisible" style="z-index: 99999;" @click.self="handleCancel">
    <div class="modal-container confirm-modal-container">
      <div class="modal-header">
        <h2>{{ store.confirmTitle }}</h2>
        <button class="icon-btn modal-close" @click="handleCancel">
        <icon-material-symbols-close />
      </button>
      </div>
      <div class="modal-body confirm-modal-body">
        <p class="confirm-message">{{ store.confirmMessage }}</p>
        
        <div v-if="store.confirmIsPrompt" class="prompt-input-container">
          <input type="text" ref="promptInput" class="prompt-input" v-model="promptValue" @keydown.enter="handleOk" @keydown.esc="handleCancel" :placeholder="store.confirmPlaceholder" />
        </div>
        
        <div class="confirm-actions">
          <button class="setting-btn" @click="handleCancel">取消</button>
          <button class="setting-btn primary-fill" @click="handleOk">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/store/appStore';
import { ref, watch, nextTick } from 'vue';

const store = useAppStore();
const promptValue = ref('');
const promptInput = ref<HTMLInputElement | null>(null);

watch(() => store.confirmVisible, (val) => {
  if (val) {
    promptValue.value = store.confirmDefaultValue || '';
    if (store.confirmIsPrompt) {
      nextTick(() => {
        promptInput.value?.focus();
      });
    }
  }
});

function handleCancel() {
  store.resolveConfirmDialog(false, null);
}

function handleOk() {
  if (store.confirmIsPrompt) {
    store.resolveConfirmDialog(true, promptValue.value);
  } else {
    store.resolveConfirmDialog(true, null);
  }
}
</script>

<style scoped lang="less">
.confirm-modal-container {
  max-width: 400px;
  width: 90%;
}

.confirm-modal-body {
  padding: 8px 20px 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.confirm-message {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 50vh;
  overflow-y: auto;
  font-family: inherit;
  
  // Custom scrollbar
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
}

.prompt-input-container {
  width: 100%;
}

.prompt-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  font-family: inherit;
  
  &:focus {
    border-color: var(--accent);
  }
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.setting-btn {
  padding: 8px 20px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  background: transparent;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition-speed);

  &:hover {
    background-color: var(--bg-surface-hover);
  }
}

.primary-fill {
  background: var(--accent);
  color: white;
  border-color: var(--accent);

  &:hover {
    background: var(--accent);
    opacity: 0.9;
  }
}
</style>
