<template>
  <div 
    class="message-container" 
    :style="isDummyChat && index < totalItems - 1 ? 'margin-bottom: 32px;' : (store.settings.readingMode === 'scroll' && !isDummyChat && index < totalItems - 1 ? 'margin-bottom: 40px; border-bottom: 1px dashed var(--border-color); padding-bottom: 40px;' : '')"
  >
    <div class="user-message">
      <div class="user-img-row" v-if="userImages.length > 0">
        <img v-for="(src, i) in userImages" :src="src" :key="i" />
      </div>
      <div class="user-msg-bubble" v-if="userTextHtml" v-html="userTextHtml"></div>
    </div>
    
    <div class="ai-response" v-show="!isDummyChat || aiResponseRaw.trim() || (isActiveStreaming && isLast)">
      <div class="ai-avatar" :class="{ 'breathing': isActiveStreaming && isAiWaitingFirstToken && isLast }">
        <FindDeepSparkle v-if="currentStyle.favicon === 'fd-sparkle'" size="100%" />
        <img v-else-if="currentStyle.favicon" :src="currentStyle.favicon" alt="AI" style="width: 100%; height: 100%; object-fit: contain; border-radius: 50%;">
        <div class="ai-sparkle" v-else></div>
      </div>
      <div class="ai-text" :style="{ 
        fontSize: store.settings.fontSize + 'px', 
        lineHeight: store.settings.lineHeight,
        color: store.settings.fontColor || 'inherit'
      }">
        <!-- During streaming: render reasoning as native Vue element -->
        <template v-if="isActiveStreaming && isLast && streamingReasoning">
          <details class="ai-reasoning" :open="reasoningOpen" @toggle="onReasoningToggle">
            <summary>显示思路</summary>
            <div class="reasoning-body" v-text="streamingReasoning"></div>
          </details>
        </template>
        <!-- Main response content (v-html) -->
        <div class="html-wrapper" v-if="isActiveStreaming && isLast" v-html="formattedStreamingResponse"></div>
        <div class="html-wrapper" v-else-if="isTypewriterActive" v-html="typewriterHtml"></div>
        <div class="html-wrapper" v-else-if="isBossStreamActive" v-html="bossStreamHtml"></div>
        <div class="html-wrapper" v-else v-html="formattedContent"></div>
        <div v-if="showThinking" class="thinking-loading" :style="content ? 'margin-top: 4px;' : ''">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>

    <div class="response-actions" v-show="!isDummyChat || aiResponseRaw.trim() || (isActiveStreaming && isLast)">
      <button class="action-btn" title="好反馈" @click="store.showToast('感谢您的反馈')">
        <icon-material-symbols-thumb-up />
      </button>
      <button class="action-btn" title="坏反馈" @click="store.showToast('感谢您的反馈')">
        <icon-material-symbols-thumb-down />
      </button>
      <button class="action-btn" @click="$emit('copy', index)" title="复制">
        <icon-material-symbols-content-copy />
      </button>
      <button class="action-btn" title="更多" @click="store.showToast(store.comingSoonText)">
        <icon-material-symbols-more-vert />
      </button>
    </div>
    
    <div class="page-nav" v-if="!isDummyChat && isLast">
      <button class="page-nav-btn" @click="store.showToc = true" title="目录">
        <icon-material-symbols-menu-book /> 目录
      </button>
      <button class="page-nav-btn" @click="store.prevPage" :disabled="store.currentPage <= 0">
        <icon-material-symbols-chevron-left /> 上一页
      </button>
      <div class="page-info" @click="$emit('jump')" title="点击跳转页码" style="cursor:pointer;text-decoration:underline dashed;text-underline-offset:4px;min-width:80px;text-align:center">
        {{ store.currentPage + 1 }} / {{ store.totalPages }}
      </div>
      <button class="page-nav-btn" @click="store.nextPage" :disabled="store.currentPage >= store.totalPages - 1">
         下一页 <icon-material-symbols-chevron-right />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAppStore } from '@/store/appStore';
import { STYLE_CONFIG } from '@/config/constants';
import FindDeepSparkle from '@/components/FindDeepSparkle.vue';
import { 
  formatContent, 
  getUserTextHtml, 
  getAiResponseRaw, 
  getUserImages 
} from '@/utils/formatters';

const props = defineProps<{
  content: string;
  index: number;
  totalItems: number;
  isLast: boolean;
  isDummyChat: boolean;
  chatTitle: string;
  isActiveStreaming: boolean;
  isAiWaitingFirstToken: boolean;
  isAiWaitingMainResponse: boolean;
  streamingReasoning: string;
  streamingMainResponse: string;
  useTypewriterEffect: boolean;
  typewriterHtml: string;
  bossStreamActive: boolean;
  bossStreamHtml: string;
  bossStreamPageIndex: number;
}>();

const emit = defineEmits(['copy', 'jump']);

const store = useAppStore();
const reasoningOpen = ref(false);

const currentStyle = computed(() => STYLE_CONFIG[store.style]);

const userImages = computed(() => getUserImages(props.content, props.isDummyChat));
const userTextHtml = computed(() => getUserTextHtml(props.content, store, props.isDummyChat, props.chatTitle));
const aiResponseRaw = computed(() => getAiResponseRaw(props.content, props.isDummyChat));

const formattedContent = computed(() => formatContent(props.content, store, props.isDummyChat, props.chatTitle));

const formattedStreamingResponse = computed(() => {
  const text = props.streamingMainResponse;
  if (!text.trim()) return '';
  return formatContent(`[USER]: dummy\n\n${text}`, store, true, 'dummy');
});

const isTypewriterActive = computed(() => props.useTypewriterEffect && props.typewriterHtml && props.isLast);
const isBossStreamActive = computed(() => props.bossStreamActive && props.index === props.bossStreamPageIndex);

const showThinking = computed(() => {
  if (props.isActiveStreaming && props.isLast && props.isAiWaitingMainResponse) return true;
  if (isTypewriterActive.value && props.typewriterHtml.length < formattedContent.value.length) return true;
  if (isBossStreamActive.value && props.bossStreamHtml.length < formattedContent.value.length) return true;
  return false;
});

function onReasoningToggle(e: Event) {
  reasoningOpen.value = (e.target as HTMLDetailsElement).open;
}
</script>

<style scoped lang="less">
/* Copied styles from ReaderScreen.vue relevant to message container and its children */
.message-container {
  max-width: 820px;
  width: 100%;
  margin: 0 auto;
}

.user-message {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  margin-bottom: 24px;
}

.user-img-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 4px;
  
  img {
    max-width: 200px;
    max-height: 200px;
    border-radius: var(--radius-md);
    object-fit: contain;
    border: 1px solid var(--border-color);
  }
}

.user-msg-bubble {
  padding: 12px 16px;
  background-color: var(--bg-surface);
  border-radius: var(--radius-lg);
  font-size: 15px;
  line-height: 1.5;
  color: var(--text-primary);
  max-width: 85%;
  word-break: break-word;
  white-space: pre-wrap;
}

.ai-response {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.ai-avatar {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
  
  &.breathing {
    animation: breathing 1.5s ease-in-out infinite;
  }
}

@keyframes breathing {
  0% { opacity: 0.6; transform: scale(0.95); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0.6; transform: scale(0.95); }
}

.ai-sparkle {
  width: 28px;
  height: 28px;
  background: var(--sparkle-bg);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  &::after {
    content: '✨';
    color: white;
    font-size: 16px;
  }
}

.ai-text {
  flex: 1;
  min-width: 0;
  overflow-x: hidden;
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-primary);
  word-wrap: break-word;
  font-family: inherit;

  :deep(p) { margin-bottom: 12px; }
  :deep(p:last-child) { margin-bottom: 0; }

  :deep(h1), :deep(h2), :deep(h3), :deep(h4) {
    color: var(--text-primary);
    margin-top: 24px;
    margin-bottom: 12px;
    font-weight: 600;
  }

  :deep(h1) { font-size: 24px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; }
  :deep(h2) { font-size: 20px; }
  :deep(h3) { font-size: 18px; }
  :deep(h4) { font-size: 16px; }

  :deep(ul), :deep(ol) {
    margin: 8px 0 16px 24px;
    padding: 0;
  }

  :deep(li) { margin-bottom: 6px; }

  :deep(img) {
    max-width: 100%;
    max-height: 400px;
    object-fit: contain;
    border-radius: 12px;
    margin: 12px 0;
    cursor: zoom-in;
    border: 1px solid var(--border-color);
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: scale(1.01);
      border-color: var(--accent);
    }
  }

  :deep(blockquote) {
    margin: 16px 0;
    padding: 12px 16px;
    border-left: 4px solid var(--text-secondary);
    background: var(--bg-surface-hover);
    color: var(--text-secondary);
    border-radius: 0 8px 8px 0;
    p:last-child { margin-bottom: 0; }
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
  }

  :deep(th), :deep(td) {
    padding: 8px 12px;
    border: 1px solid var(--border-color);
  }

  :deep(th) {
    background: var(--bg-surface-hover);
    font-weight: 600;
  }

  :deep(strong) {
    font-weight: 600;
    color: var(--text-primary);
  }

  :deep(code:not(pre code)) {
    background: var(--bg-surface-hover);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 14px;
    color: var(--text-primary);
  }

  /* AI Code Block Styles */
  :deep(.code-block) {
    margin: 16px 0;
    border-radius: 8px;
    background: #0d1117;
    border: 1px solid rgba(255,255,255,0.08);
    overflow: hidden;
    font-family: 'Fira Code', 'JetBrains Mono', 'Consolas', monospace;
  }
  :deep(.code-header) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255,255,255,0.04);
    padding: 7px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  :deep(.code-lang-label) {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    font-family: 'Fira Code', 'Consolas', monospace;
  }
  :deep(pre) {
    margin: 0;
    padding: 16px 20px;
    max-width: 100%;
    overflow-x: auto;
    overflow-y: visible;
    line-height: 1.6 !important;
    background: transparent;
    white-space: pre;
    &::-webkit-scrollbar { height: 5px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.15);
      border-radius: 4px;
    }
    &::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
  }
  :deep(pre code) {
    font-size: 13px;
    line-height: 1.6 !important;
    font-family: 'Fira Code', 'JetBrains Mono', 'Consolas', monospace;
    background: transparent;
    white-space: pre;
    display: block;
  }
  :deep(pre br) { display: none; }
  
  /* highlight.js token overrides */
  :deep(.hljs) { background: transparent; color: #c9d1d9; }
  :deep(.hljs-keyword)    { color: #ff7b72; }
  :deep(.hljs-string)     { color: #a5d6ff; }
  :deep(.hljs-comment)    { color: #8b949e; font-style: italic; }
  :deep(.hljs-number)     { color: #79c0ff; }
  :deep(.hljs-built_in)   { color: #ffa657; }
  :deep(.hljs-function), :deep(.hljs-title) { color: #d2a8ff; }
  :deep(.hljs-type)       { color: #ffa657; }
  :deep(.hljs-variable), :deep(.hljs-attr) { color: #c9d1d9; }
  :deep(.hljs-params)     { color: #e6edf3; }
  :deep(.hljs-literal)    { color: #79c0ff; }
  :deep(.hljs-operator)   { color: #ff7b72; }
  :deep(.hljs-punctuation){ color: #8b949e; }
  :deep(.hljs-property)   { color: #79c0ff; }
  :deep(.hljs-meta)       { color: #e3b341; }
  :deep(.hljs-tag)        { color: #7ee787; }
  :deep(.hljs-name)       { color: #7ee787; }
  :deep(.hljs-selector-tag) { color: #7ee787; }
  :deep(.hljs-symbol)     { color: #a5d6ff; }
  :deep(.hljs-link)       { color: #a5d6ff; text-decoration: underline; }
  :deep(.hljs-addition)   { color: #aff5b4; background: rgba(46,160,67,0.15); }
  :deep(.hljs-deletion)   { color: #ffa198; background: rgba(248,81,73,0.15); }
}

.html-wrapper {
  overflow-x: auto;
  line-height: inherit;
  font-size: inherit;
  color: inherit;
}

/* AI deep thinking logic matching Gemini */
:deep(.ai-reasoning) {
  margin: 2px 0 16px 0;
  background: transparent;
}

:deep(.ai-reasoning summary) {
  cursor: pointer;
  color: var(--text-primary);
  font-size: 14px;
  user-select: none;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 0px;
  list-style: none;
}
:deep(.ai-reasoning summary::-webkit-details-marker) { display: none; }
:deep(.ai-reasoning summary:hover) { opacity: 0.8; }

:deep(.ai-reasoning summary::after) {
  content: '';
  display: inline-block;
  width: 10px;
  height: 6px;
  background-color: currentColor;
  clip-path: polygon(0 0, 100% 0, 50% 100%);
  margin-left: 4px;
  transition: transform 0.2s;
}
:deep(.ai-reasoning[open] summary::after) { transform: rotate(180deg); }

:deep(.ai-reasoning .reasoning-body) {
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.6;
  padding-left: 18px;
  margin-left: 9px;
  margin-top: 16px;
  border-left: 1px solid var(--border-color);
  font-style: italic;
  white-space: pre-wrap;
}

.thinking-loading {
  display: flex;
  gap: 4px;
  padding: 4px 0;
  
  span {
    width: 6px;
    height: 6px;
    background: var(--text-muted);
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out both;
    
    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
  }
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
  40% { transform: scale(1); opacity: 0.6; }
}

.response-actions {
  display: flex;
  gap: 4px;
  margin-left: 44px;
  margin-bottom: 24px;
  opacity: 0;
  transition: opacity 0.2s;
}

.message-container:hover .response-actions {
  opacity: 1;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--bg-surface-hover);
    color: var(--text-primary);
  }

  svg {
    font-size: 18px;
  }
}

.page-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin: 40px 0 20px 0;
  margin-left: 44px;
  padding: 16px;
}

.page-nav-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  background: var(--bg-surface);
  color: var(--text-primary);
  border-radius: var(--radius-md);
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: var(--bg-surface-hover);
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
}

.page-info {
  font-size: 14px;
  color: var(--text-secondary);
}
</style>
