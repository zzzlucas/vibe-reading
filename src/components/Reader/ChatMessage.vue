<template>
  <div 
    class="message-container" 
    :style="isDummyChat && index < totalItems - 1 ? 'margin-bottom: 32px;' : (store.settings.readingMode === 'scroll' && !isDummyChat && index < totalItems - 1 ? 'margin-bottom: 40px; border-bottom: 1px dashed var(--border-color); padding-bottom: 40px;' : '')"
  >
    <div class="user-message" v-if="shouldShowUserMessage">
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

    <!-- Response actions (feedback, copy) - Always visible/hoverable -->
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
    
    <!-- Page navigation - Protected by safety reveal loop -->
    <div 
      v-if="!isDummyChat && isLast"
      class="footer-safety-wrapper" 
      :class="{ 'revealed': isFooterRevealed }"
    >
      <div class="page-nav">
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

    <!-- Classic Blog Post Footer -->
    <div v-if="store.style === 'classic_blog1'" class="blog1-post-footer">
      <div class="blog1-disclaimer">
        免责声明：本内容由 AI 助手生成或来自第三方创作者，仅供参考，不代表本站任何正式立场。
      </div>
      
      <div class="blog1-digg-row">
        <div class="blog1-digg-buttons">
          <button class="digg-btn item-top" @click="store.showToast('推荐成功')">好文要顶</button>
          <button class="digg-btn item-follow" @click="store.showToast('关注成功')">关注我</button>
          <button class="digg-btn item-fav" @click="store.showToast('已加入收藏')">收藏该文</button>
          <button class="digg-btn item-share" @click="store.showToast('微信二维码已生成')">微信分享</button>
        </div>
      </div>

      <div class="blog1-author-info">
        <div class="author-avatar">
          <FindDeepSparkle v-if="currentStyle.favicon === 'fd-sparkle'" size="100%" />
          <img v-else :src="currentStyle.favicon || 'https://via.placeholder.com/64'" alt="Avatar" />
        </div>
        <div class="author-meta">
          <div class="author-name">{{ store.userName || 'DeepSky' }}</div>
          <div class="author-stats">粉丝 - 9 关注 - 1</div>
          <button class="author-follow-btn" @click="store.showToast('已关注')">+加关注</button>
        </div>
        <div class="author-digg">
          <div class="author-digg-item">
            <div class="digg-num">1</div>
            <button class="digg-action" @click="store.showToast('推荐成功')">👍 推荐</button>
          </div>
          <div class="author-digg-item">
            <div class="digg-num">0</div>
            <button class="digg-action" @click="store.showToast('踩中..')">👎 反对</button>
          </div>
          <div class="author-digg-vip">
            <a @click.prevent>升级成为会员</a>
          </div>
        </div>
      </div>

      <div class="blog1-prev-post">
        <a @click.prevent>« 上一篇：让 Agent 越来越“懂你”：长期记忆的原理与工程实现</a>
      </div>

      <div class="blog1-post-meta">
        posted @ {{ new Date().toISOString().slice(0, 16).replace('T', ' ') }} {{ store.userName || 'DeepSky' }} 阅读(47) 评论(0) 收藏 举报
      </div>

      <div class="blog1-footer-links">
        <a @click.prevent="refreshPage">刷新页面</a>
        <a @click.prevent="scrollToTop">返回顶部</a>
      </div>

      <div class="blog1-comment-teaser">
        <icon-material-symbols-chat-bubble-outline style="font-size: 14px; margin-right: 4px; vertical-align: middle; color: #1a6496;" />
        登录后才能查看或发表评论，立即 <a @click.prevent>登录</a> 或者 逛逛 <a @click.prevent="store.activeId = null">首页</a>
      </div>
    </div>

    <!-- Classic Doc1 (Yuque-style) Footer -->
    <div v-if="store.style === 'classic_doc1' && isLast" class="doc1-post-footer">
      <!-- Like Section -->
      <div class="doc1-like-section">
        <div class="like-btn" @click="store.showToast('感谢鼓励！')">
          <icon-material-symbols-thumb-up-outline />
        </div>
        <div class="like-text">若有收获，就点个赞吧</div>
      </div>

      <!-- Post Meta -->
      <div class="doc1-meta-row">
        <div class="meta-item author">
            <icon-material-symbols-person-outline class="meta-icon" />
            <span class="meta-val">用户2026</span>
        </div>
        <div class="meta-item time">
            <icon-material-symbols-schedule-outline class="meta-icon" />
            <span class="meta-val">2022-07-21 10:02</span>
        </div>
        <div class="meta-item views">
            <icon-material-symbols-menu-book-outline class="meta-icon" />
            <span class="meta-val">32</span>
        </div>
        <div class="meta-item comments">
            <icon-material-symbols-chat-bubble-outline class="meta-icon" />
            <span class="meta-val">0</span>
        </div>
      </div>

      <!-- Comment Section -->
      <div class="doc1-comment-box">
        <div class="comment-user-avatar">
          <FindDeepSparkle size="100%" />
        </div>
        <div class="comment-input-area">
          <div class="comment-editor-placeholder">
            <div class="editor-toolbar">
              <button class="tool-btn"><icon-material-symbols-add-circle-outline /></button>
              <span class="divider"></span>
              <button class="tool-btn">正文 <icon-material-symbols-keyboard-arrow-down /></button>
              <button class="tool-btn">B</button>
              <button class="tool-btn"><icon-material-symbols-format-list-bulleted /></button>
              <button class="tool-btn"><icon-material-symbols-format-list-numbered /></button>
              <button class="tool-btn"><icon-material-symbols-link /></button>
              <button class="tool-btn"><icon-material-symbols-sentiment-satisfied-outline /></button>
              <div class="editor-tip">Ctrl + ⇧ + 8 无序列表</div>
            </div>
          </div>
          <button class="btn-reply" @click="store.showToast('感谢您的评论！')">回复</button>
        </div>
      </div>

      <!-- Footer Branding -->
      <div class="doc1-site-footer">
        <div class="footer-logo">
          <span class="logo-icon">🍃</span> 文档
        </div>
        <div class="footer-links">
          <a @click.prevent>关于文档</a>
          <span class="dot">|</span>
          <a @click.prevent>使用帮助</a>
          <span class="dot">|</span>
          <a @click.prevent>数据安全</a>
          <span class="dot">|</span>
          <a @click.prevent>服务协议</a>
          <span class="dot">|</span>
          <a @click.prevent>English</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
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
const isFooterRevealed = ref(false);

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

const shouldShowUserMessage = computed(() => {
  if (props.isDummyChat) return true;
  const isAiStyle = ['gemini', 'chatgpt'].includes(store.style);
  if (isAiStyle) return true; 
  if (store.style.startsWith('classic_blog')) return store.settings.showNovelTitle; 
  return false; 
});

const showThinking = computed(() => {
  if (props.isActiveStreaming && props.isLast && props.isAiWaitingMainResponse) return true;
  if (isTypewriterActive.value && props.typewriterHtml.length < formattedContent.value.length) return true;
  if (isBossStreamActive.value && props.bossStreamHtml.length < formattedContent.value.length) return true;
  return false;
});

function onReasoningToggle(e: Event) {
  reasoningOpen.value = (e.target as HTMLDetailsElement).open;
}

// Safety Scroll Logic
let scrollContainer: HTMLElement | null = null;

function handleWheel(e: WheelEvent) {
  if (props.isDummyChat || isFooterRevealed.value) return;
  if (!scrollContainer) return;

  const atBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 5;
  if (atBottom && e.deltaY > 0) {
    // Reveal footer on extra scroll effort at bottom
    isFooterRevealed.value = true;
  }
}

function handleTouchMove(e: TouchEvent) {
  if (props.isDummyChat || isFooterRevealed.value) return;
  if (!scrollContainer) return;

  const atBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 5;
  // Note: Touch direction detection could be more precise but scroll end + move is usually enough
  if (atBottom) {
    isFooterRevealed.value = true;
  }
}

onMounted(() => {
    // Find the shared scroll container
    scrollContainer = document.querySelector('.chat-area');
    if (scrollContainer) {
        scrollContainer.addEventListener('wheel', handleWheel, { passive: true });
        scrollContainer.addEventListener('touchmove', handleTouchMove, { passive: true });
    }
});

onUnmounted(() => {
    if (scrollContainer) {
        scrollContainer.removeEventListener('wheel', handleWheel);
        scrollContainer.removeEventListener('touchmove', handleTouchMove);
    }
});

// Reset safety when content changes (new page)
watch(() => props.content, () => {
  isFooterRevealed.value = false;
});

function refreshPage() {
  window.location.reload();
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
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

.footer-safety-wrapper {
  opacity: 0;
  transform: translateY(20px);
  pointer-events: none;
  transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  margin-top: 40px;
  
  &.revealed {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }
}

.response-actions {
  display: flex;
  gap: 4px;
  margin-left: 44px;
  margin-bottom: 24px;
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
  margin: 0 0 20px 0;
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

/* Classic Blog 1 Footer Styles */
.blog1-post-footer {
  margin-top: 40px;
  padding: 10px 0;
  border-top: 1px dashed #ddd;
}

.blog1-disclaimer {
  font-size: 12px;
  color: #888;
  margin-bottom: 20px;
  line-height: 1.6;
}

.blog1-digg-row {
  margin-bottom: 25px;
}

.blog1-digg-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.digg-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  
  &.item-top { background: linear-gradient(180deg, #42b983 0%, #2f8e65 100%); }
  &.item-follow { background: linear-gradient(180deg, #d35400 0%, #b34700 100%); }
  &.item-fav { background: linear-gradient(180deg, #f39c12 0%, #e67e22 100%); }
  &.item-share { background: linear-gradient(180deg, #27ae60 0%, #219150 100%); }
  
  &:hover { opacity: 0.9; transform: translateY(-1px); }
  &:active { transform: translateY(0); }
}

.blog1-author-info {
  display: flex;
  background: #fdfdfd;
  border: 1px dashed #eee;
  padding: 15px;
  margin-bottom: 20px;
  gap: 15px;
  align-items: center;
}

.author-avatar {
  width: 50px;
  height: 50px;
  flex-shrink: 0;
  border: 1px solid #ddd;
  padding: 2px;
  background: #fff;
  img { width: 100%; height: 100%; object-fit: cover; }
}

.author-meta {
  flex: 1;
}

.author-name {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.author-stats {
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.author-follow-btn {
  padding: 2px 8px;
  font-size: 11px;
  background: #5B9BD5;
  color: #fff;
  border: none;
  border-radius: 2px;
  cursor: pointer;
}

.author-digg {
  display: flex;
  gap: 12px;
  align-items: center;
}

.author-digg-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.digg-num {
  width: 42px;
  height: 28px;
  background: #fdf6ec;
  border: 1px solid #faecc5;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  color: #e6a23c;
}

.digg-action {
  background: transparent;
  border: none;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  &:hover { color: #5B9BD5; text-decoration: underline; }
}

.author-digg-vip {
  font-size: 12px;
  a {
    color: #1a6496;
    text-decoration: underline;
    cursor: pointer;
  }
}

.blog1-prev-post {
  font-size: 13px;
  margin-bottom: 30px;
  a {
    color: #1a6496;
    text-decoration: none;
    &:hover { text-decoration: underline; color: #c00; }
  }
}

.blog1-post-meta {
  font-size: 12px;
  color: #999;
  text-align: right;
  margin-bottom: 15px;
}

.blog1-footer-links {
  text-align: right;
  font-size: 12px;
  margin-bottom: 25px;
  a {
    color: #1a6496;
    margin-left: 10px;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
}

.blog1-comment-teaser {
  background: #fff;
  border: 1px dashed #ddd;
  padding: 20px;
  font-size: 13px;
  color: #333;
  a {
    color: #1a6496;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
}

/* Classic Doc 1 (Yuque-style) Footer Styles */
.doc1-post-footer {
  margin-top: 80px;
  padding-bottom: 60px;
  border-top: 1px solid #f0f0f0;
  color: #262626;
}

.doc1-like-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 40px;
  margin-bottom: 40px;
  
  .like-btn {
    width: 48px;
    height: 48px;
    border: 1px solid #ff9d22;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ff9d22;
    cursor: pointer;
    margin-bottom: 12px;
    background: #fff;
    transition: all 0.2s;
    
    svg { font-size: 24px; }
    &:hover { background: #fffaf0; transform: scale(1.05); }
  }
  
  .like-text {
    font-size: 14px;
    color: #8c8c8c;
  }
}

.doc1-meta-row {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
  color: #8c8c8c;
  font-size: 14px;
  
  .meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    .meta-icon { font-size: 16px; opacity: 0.8; }
  }
}

.doc1-comment-box {
  display: flex;
  gap: 12px;
  margin-bottom: 60px;
  
  .comment-user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    overflow: hidden;
    background: #f0f0f0;
    flex-shrink: 0;
  }
  
  .comment-input-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.comment-editor-placeholder {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  min-height: 120px;
  background: #fff;
  padding: 8px;
  
  .editor-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f0f0f0;
    position: relative;
    height: 32px;
    
    .tool-btn {
      background: none;
      border: none;
      color: #595959;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 6px;
      border-radius: 4px;
      &:hover { background: #f5f5f5; }
      svg { font-size: 16px; }
    }
    
    .divider {
      width: 1px;
      height: 14px;
      background: #e8e8e8;
      margin: 0 4px;
    }
    
    .editor-tip {
      margin-left: auto;
      font-size: 12px;
      color: #bfbfbf;
    }
  }
}

.btn-reply {
  align-self: flex-start;
  background: #00b96b;
  color: #fff;
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover { opacity: 0.9; }
}

.doc1-site-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  padding-top: 40px;
  border-top: 1px solid #f0f0f0;
  font-size: 13px;
  
  .footer-logo {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #434343;
    font-weight: 500;
    .logo-icon { font-size: 18px; }
  }
  
  .footer-links {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #8c8c8c;
    a { cursor: pointer; &:hover { color: #595959; } }
    .dot { color: #d9d9d9; }
  }
}

/* Dark Mode Overrides for Classic Doc1 Footer */
[data-theme='dark'] {
  .doc1-post-footer {
    border-top-color: #303030;
    color: #d9d9d9;
  }
  .doc1-like-section {
    .like-btn {
      background: #1f1f1f;
      border-color: #ff9d22;
      &:hover { background: #2b2111; }
    }
    .like-text { color: #bfbfbf; }
  }
  .doc1-meta-row { color: #a6a6a6; }
  .comment-editor-placeholder {
    background: #1f1f1f;
    border-color: #303030;
    .editor-toolbar {
      border-bottom-color: #303030;
      .tool-btn { color: #bfbfbf; &:hover { background: #303030; } }
      .divider { background: #303030; }
    }
  }
  .doc1-site-footer {
    border-top-color: #303030;
    .footer-logo { color: #d9d9d9; }
    .footer-links { color: #a6a6a6; a:hover { color: #d9d9d9; } .dot { color: #434343; } }
  }
}
</style>
