<template>
  <div class="input-area" 
       :class="{ 'is-dragging': isDragging }"
       @dragover.prevent="$emit('dragover')"
       @dragleave.prevent="$emit('dragleave')"
       @drop.prevent="$emit('drop', $event)">
    <!-- Drag Overlay -->
    <div class="drag-drop-overlay" :class="{ 'visible': isDragging }">
      <div class="overlay-inner">
        <div class="drag-icon-pulse">
          <icon-material-symbols-upload-file />
        </div>
        <span class="drag-label">松开即可快速加载文件</span>
        <span class="drag-sub-label">支持 .txt 阅读作品及各类图片附件</span>
      </div>
    </div>

    <div class="input-container">
      <!-- Attached Images Preview -->
      <div class="attached-images" v-if="attachedImages.length > 0">
        <div class="attached-image-wrap" v-for="(img, idx) in attachedImages" :key="idx">
          <img :src="img" />
          <button class="remove-img-btn" @click="attachedImages.splice(idx, 1)" title="移除">&times;</button>
        </div>
      </div>

      <!-- Gemini Style Input DOM -->
      <div class="input-wrapper gemini-wrapper" v-if="store.style === 'gemini'">
        <input type="text" 
               class="chat-input" 
               :value="modelValue"
               @input="onInput"
               @keydown.enter="$emit('submit')" 
               :placeholder="currentStyle.placeholder" />
        <div class="gemini-toolbar">
          <div class="toolbar-left">
            <button class="icon-btn input-icon" @click="$emit('trigger-file')" title="上传文件">
              <icon-material-symbols-add />
            </button>
            <button class="icon-btn tool-btn" title="工具" @click="store.showToast(store.comingSoonText)">
              <icon-material-symbols-instant-mix />
              <span class="tool-text">工具</span>
            </button>
          </div>
          <div class="toolbar-right">
            <div class="model-selector-wrapper" v-click-outside="() => showModelSelector = false">
              <div class="model-selector" @click="showModelSelector = !showModelSelector">
                <span>{{ store.currentAiConfig?.name || currentStyle.modelLabel || 'Pro' }}</span>
                <icon-material-symbols-expand-more style="font-size:16px" />
              </div>
              <div class="model-dropdown-menu" v-if="showModelSelector">
                <div class="model-dropdown-item" 
                     v-for="conf in store.aiSettings.configs" 
                     :key="conf.id"
                     :class="{ active: store.aiSettings.activeConfigId === conf.id }"
                     @click.stop="switchConfig(conf.id)">
                  <icon-material-symbols-check v-if="store.aiSettings.activeConfigId === conf.id" class="check-icon" />
                  <span class="check-placeholder" v-else></span>
                  <span>{{ conf.name || '未命名' }}</span>
                </div>
              </div>
            </div>
            <button class="icon-btn send-btn" :class="{ 'has-text': (modelValue.trim() || attachedImages.length > 0 || isListening) && !isAiGenerating, 'is-listening': isListening }" @click="$emit('send-click')" :title="isActiveStreaming ? '停止响应' : (isListening ? '停止聆听' : ((modelValue.trim() || attachedImages.length > 0) ? '发送' : '语音输入'))" :disabled="isAiGenerating && !isActiveStreaming">
              <icon-material-symbols-stop-circle v-if="isActiveStreaming" style="color: var(--accent-pink); width: 24px; height: 24px;" />
              <icon-material-symbols-graphic-eq v-else-if="isListening" class="voice-active-icon" style="width: 24px; height: 24px;" />
              <icon-material-symbols-send v-else-if="modelValue.trim() || attachedImages.length > 0" />
              <icon-material-symbols-mic v-else />
            </button>
          </div>
        </div>
      </div>

      <!-- ChatGPT Style Input DOM -->
      <div class="input-wrapper chatgpt-wrapper" v-else-if="store.style === 'chatgpt'">
        <button class="icon-btn input-icon attachment-btn" @click="$emit('trigger-file')" title="上传附件">
          <icon-material-symbols-add />
        </button>
        <input type="text" 
               class="chat-input" 
               :value="modelValue"
               @input="onInput"
               @keydown.enter="$emit('submit')" 
               :placeholder="currentStyle.placeholder" />
        <div class="chatgpt-right-actions">
          <button class="icon-btn input-icon" title="搜索网页">
            <icon-material-symbols-language />
          </button>
          <button class="icon-btn input-icon" title="推理指导">
            <icon-material-symbols-lightbulb />
          </button>
          <div class="model-selector-wrapper" v-click-outside="() => showModelSelector = false">
            <div class="model-selector" @click="showModelSelector = !showModelSelector">
              <span>{{ store.currentAiConfig?.name || currentStyle.modelLabel || 'Pro' }}</span>
              <icon-material-symbols-expand-more style="font-size:16px" />
            </div>
            <div class="model-dropdown-menu" v-if="showModelSelector">
              <div class="model-dropdown-item" 
                   v-for="conf in store.aiSettings.configs" 
                   :key="conf.id"
                   :class="{ active: store.aiSettings.activeConfigId === conf.id }"
                   @click.stop="switchConfig(conf.id)">
                <icon-material-symbols-check v-if="store.aiSettings.activeConfigId === conf.id" class="check-icon" />
                <span class="check-placeholder" v-else></span>
                <span>{{ conf.name || '未命名' }}</span>
              </div>
            </div>
          </div>
          <button class="icon-btn send-btn chatgpt-send" :class="{ 'has-text': (modelValue.trim() || attachedImages.length > 0 || isListening) && !isAiGenerating, 'is-listening': isListening }" @click="$emit('send-click')" :title="isActiveStreaming ? '停止响应' : (isListening ? '停止聆听' : ((modelValue.trim() || attachedImages.length > 0) ? '发送' : '语音输入'))" :disabled="isAiGenerating && !isActiveStreaming">
            <icon-material-symbols-stop-circle v-if="isActiveStreaming" style="font-size: 16px; color: var(--bg-primary)" />
            <icon-material-symbols-graphic-eq v-else-if="isListening" class="voice-active-icon" style="font-size: 16px; color: var(--bg-primary)" />
            <icon-material-symbols-arrow-upward v-else-if="modelValue.trim() || attachedImages.length > 0" style="font-size: 16px; color: var(--bg-primary)" />
            <icon-material-symbols-mic v-else />
          </button>
        </div>
      </div>

      <!-- Default Style Input DOM -->
      <div class="input-wrapper default-wrapper" v-else>
        <input type="text" 
               class="chat-input" 
               :value="modelValue"
               @input="onInput"
               @keydown.enter="$emit('submit')" 
               :placeholder="currentStyle.placeholder" />
        <div class="input-actions-inline">
          <button class="icon-btn input-icon" @click="$emit('trigger-file')" title="上传文件">
            <icon-material-symbols-add-circle />
          </button>
          <button class="icon-btn input-icon" title="深入研究">
            <icon-material-symbols-explore />
          </button>
        </div>
        <div class="input-right-actions">
          <div class="model-selector-wrapper" v-click-outside="() => showModelSelector = false">
            <div class="model-selector" @click="showModelSelector = !showModelSelector">
              <span>{{ store.currentAiConfig?.name || currentStyle.modelLabel || 'Pro' }}</span>
              <icon-material-symbols-expand-more style="font-size:16px" />
            </div>
            <div class="model-dropdown-menu" v-if="showModelSelector">
              <div class="model-dropdown-item" 
                   v-for="conf in store.aiSettings.configs" 
                   :key="conf.id"
                   :class="{ active: store.aiSettings.activeConfigId === conf.id }"
                   @click.stop="switchConfig(conf.id)">
                <icon-material-symbols-check v-if="store.aiSettings.activeConfigId === conf.id" class="check-icon" />
                <span class="check-placeholder" v-else></span>
                <span>{{ conf.name || '未命名' }}</span>
              </div>
            </div>
          </div>
          <button class="icon-btn send-btn" :class="{ 'is-listening': isListening }" @click="$emit('send-click')" :title="isActiveStreaming ? '停止响应' : (isListening ? '停止聆听' : ((modelValue.trim() || attachedImages.length > 0) ? '发送' : '语音输入'))" :disabled="isAiGenerating && !isActiveStreaming">
            <icon-material-symbols-stop-circle v-if="isActiveStreaming" style="color: var(--accent-pink)" />
            <icon-material-symbols-graphic-eq v-else-if="isListening" class="voice-active-icon" />
            <icon-material-symbols-send v-else-if="modelValue.trim() || attachedImages.length > 0" />
            <icon-material-symbols-mic v-else />
          </button>
        </div>
      </div>
    </div>
    
    <!-- Gemini Suggestion Chips (only on welcome screen) -->
    <div class="gemini-suggestion-chips" v-if="store.style === 'gemini' && store.activeNovelIndex === null">
      <div class="gemini-chips-row">
        <button class="gemini-chip" @click="$emit('trigger-file')">
          <icon-material-symbols-image style="color: #fbbc05;" />识别图片
        </button>
        <button class="gemini-chip" @click="store.showToast(store.comingSoonText)">
          创作音乐
        </button>
        <button class="gemini-chip" @click="store.showToast(store.comingSoonText)">
          给我的一天注入活力
        </button>
        <button class="gemini-chip" @click="store.showToast(store.comingSoonText)">
          创作视频
        </button>
      </div>
      <div class="gemini-chips-row">
        <button class="gemini-chip" @click="store.showToast(store.comingSoonText)">
          随便写点什么
        </button>
        <button class="gemini-chip" @click="store.showToast(store.comingSoonText)">
          帮我学习
        </button>
      </div>
    </div>

    <div class="input-disclaimer" v-html="currentStyle.disclaimer" v-show="store.activeNovelIndex !== null"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAppStore } from '@/store/appStore';
import { STYLE_CONFIG } from '@/config/constants';

const props = defineProps<{
  modelValue: string;
  isDragging: boolean;
  attachedImages: string[];
  isListening: boolean;
  isAiGenerating: boolean;
  isActiveStreaming: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'submit', 'send-click', 'trigger-file', 'dragover', 'dragleave', 'drop']);

const store = useAppStore();
const currentStyle = computed(() => STYLE_CONFIG[store.style]);
const showModelSelector = ref(false);

function switchConfig(id: string) {
  store.aiSettings.activeConfigId = id;
  showModelSelector.value = false;
}

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

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value);
}
</script>

<style scoped lang="less">
/* Copied styles from ReaderScreen.vue relevant to input area */
.input-area {
  padding: 8px 24px 16px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  position: relative;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &.is-dragging {
    transform: scale(1.02);
  }
}

.input-container {
  width: 100%;
  max-width: 768px;
  background-color: var(--bg-surface);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  transition: border-color var(--transition-speed), box-shadow var(--transition-speed), background-color 0.3s;
  overflow: visible;
  position: relative;
  z-index: 10;
  
  &:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
  }
}

.input-wrapper {
  display: flex;
  align-items: center;
  padding: 8px 8px 8px 16px;
  gap: 4px;

  &.gemini-wrapper {
    flex-direction: column;
    align-items: stretch;
    padding: 8px 8px 8px 16px;

    .chat-input {
      min-height: 48px;
    }

    .gemini-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 4px;
    }

    .toolbar-left, .toolbar-right {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .tool-btn {
      width: auto;
      padding: 0 16px;
      border-radius: var(--radius-xl);
      gap: 4px;
      background: var(--bg-surface-hover);
    }

    .send-btn {
      background: transparent;
      &.has-text {
        background: transparent;
        color: var(--accent);
      }
    }
  }

  &.chatgpt-wrapper {
    flex-direction: row;
    padding: 8px;
    border-radius: 20px;

    .chat-input {
      padding: 8px 12px;
    }

    .attachment-btn {
      width: 32px;
      height: 32px;
      margin-left: 4px;
    }

    .chatgpt-right-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .chatgpt-send {
      width: 32px;
      height: 32px;
      margin-left: 4px;
      background: var(--bg-surface-hover);
      border-radius: 50%;

      &.has-text {
        background: var(--text-primary);
        color: var(--bg-primary);
      }

      &:hover {
        background: var(--text-muted);
      }
    }
  }

  &.default-wrapper {
    padding: 8px 8px 8px 16px;
    .input-right-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 8px 8px;
      gap: 8px;
    }
    .chat-input {
      padding: 8px 16px;
    }
  }
}

.chat-input {
  width: 100%;
  border: none;
  background: transparent;
  padding: 8px 12px;
  font-size: 16px;
  color: var(--text-primary);
  outline: none;
  font-family: inherit;
  
  &::placeholder {
    color: var(--text-muted);
  }
}

.model-selector-wrapper {
  position: relative;
}

.model-selector {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 10px;
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: background-color var(--transition-speed);
  white-space: nowrap;
  
  &:hover {
    background-color: var(--bg-surface-hover);
  }
}

.model-dropdown-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  background: var(--bg-modal);
  border: 1px solid rgba(128, 128, 128, 0.15); /* More subtle and independent border */
  border-radius: 14px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.02) inset;
  display: flex;
  flex-direction: column;
  min-width: 150px;
  z-index: 2000;
  padding: 6px;
  animation: dropdownFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.model-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  border-radius: 8px;
  border: 1px solid transparent; /* Prepare for highlight border */

  &:hover {
    background-color: rgba(128, 128, 128, 0.08);
    color: var(--text-primary);
    border-color: rgba(128, 128, 128, 0.1); /* Subtle highlighting border */
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  }

  &.active {
    color: var(--accent);
    background-color: transparent;
    font-weight: 600;

    &:hover {
      background-color: rgba(var(--accent-rgb, 100, 181, 246), 0.06);
      border-color: rgba(var(--accent-rgb, 100, 181, 246), 0.12);
    }
  }

  .check-icon {
    font-size: 16px;
    flex-shrink: 0;
  }

  .check-placeholder {
    width: 16px;
    display: inline-block;
    flex-shrink: 0;
  }
}

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
  
  &.has-text {
    color: var(--accent);
  }
  
  &:hover {
    background-color: var(--bg-surface-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.input-disclaimer {
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
  padding-top: 8px;
  margin-top: 0;

  :deep(a) {
    color: var(--text-link);
    text-decoration: none;
  }
}

.attached-images {
  display: flex;
  gap: 12px;
  padding: 16px 16px 0 16px;
  flex-wrap: wrap;
  width: 100%;
}

.attached-image-wrap {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  background-color: var(--bg-primary);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.remove-img-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(0,0,0,0.6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  border: none;
  line-height: 1;
  
  &:hover {
    background: rgba(0,0,0,0.8);
  }
}

.drag-drop-overlay {
  position: absolute;
  inset: 0 24px 16px 24px;
  background: rgba(var(--accent-rgb, 138, 180, 248), 0.08);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 2px dashed var(--accent);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s ease;
  transform: translateY(10px);

  &.visible {
    opacity: 1;
    transform: translateY(0);
  }
}

.overlay-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.drag-icon-pulse {
  width: 64px;
  height: 64px;
  background: var(--accent);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  box-shadow: 0 0 20px rgba(var(--accent-rgb, 138, 180, 248), 0.4);
  animation: dragPulse 1.5s infinite;
}

@keyframes dragPulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(var(--accent-rgb, 138, 180, 248), 0.4); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(var(--accent-rgb, 138, 180, 248), 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(var(--accent-rgb, 138, 180, 248), 0); }
}

.drag-label {
  font-size: 18px;
  font-weight: 600;
  color: var(--accent);
}

.drag-sub-label {
  font-size: 13px;
  color: var(--text-secondary);
  opacity: 0.8;
}

.gemini-suggestion-chips {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 32px;
  width: 100%;
}

.gemini-chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.gemini-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border-radius: 24px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all var(--transition-speed);

  &:hover {
    background-color: var(--bg-surface-hover);
    border-color: var(--accent-blue);
  }
}
</style>
