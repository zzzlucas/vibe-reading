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
        
        <div v-if="store.confirmIsSelect" class="prompt-input-container">
          <div class="custom-select-wrapper" v-click-outside="() => showSelectDropdown = false">
            <div class="custom-select-trigger prompt-input" :class="{'is-open': showSelectDropdown}" @click="showSelectDropdown = !showSelectDropdown">
              <span>{{ store.confirmSelectOptions.find(opt => opt.value === promptValue)?.label || '请选择' }}</span>
              <icon-material-symbols-expand-more style="font-size: 18px; color: var(--text-secondary);" />
            </div>
            <div class="custom-select-dropdown" v-if="showSelectDropdown">
              <div class="custom-select-option" 
                   v-for="opt in store.confirmSelectOptions" 
                   :key="opt.value" 
                   :class="{'active': opt.value === promptValue}"
                   @click="selectOption(opt.value)">
                {{ opt.label }}
              </div>
            </div>
          </div>
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
const showSelectDropdown = ref(false);

const vClickOutside = {
  mounted(el: any, binding: any) {
    el._clickOutside = (event: Event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value();
      }
    };
    document.addEventListener('mousedown', el._clickOutside);
  },
  unmounted(el: any) {
    document.removeEventListener('mousedown', el._clickOutside);
  }
};

watch(() => store.confirmVisible, (val) => {
  if (val) {
    promptValue.value = store.confirmDefaultValue || '';
    showSelectDropdown.value = false;
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
  if (store.confirmIsPrompt || store.confirmIsSelect) {
    store.resolveConfirmDialog(true, promptValue.value);
  } else {
    store.resolveConfirmDialog(true, null);
  }
}

function selectOption(val: string) {
  promptValue.value = val;
  showSelectDropdown.value = false;
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

.custom-select-wrapper {
  position: relative;
  width: 100%;
}

.custom-select-trigger {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  
  &.is-open {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
  }
}

.custom-select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 100%;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  overflow: hidden;
  animation: dropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.custom-select-option {
  padding: 10px 14px;
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: var(--bg-surface-hover);
  }
  
  &.active {
    color: var(--accent);
    background-color: rgba(var(--accent-rgb, 138, 180, 248), 0.1);
    font-weight: 500;
  }
}

@keyframes dropdownFadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
