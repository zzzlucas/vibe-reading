<template>
  <main class="main-content" :class="{'gemini-welcome-layout': store.style === 'gemini' && store.activeNovelIndex === null && !store.showWasteland}">
    <!-- Top Bar -->
    <header class="top-bar">
      <div class="top-bar-left">
        <button class="icon-btn sidebar-toggle-btn" 
                v-if="!store.sidebarOpen"
                @click="store.sidebarOpen = true"
                title="显示侧边栏">
          <icon-material-symbols-menu />
        </button>
        <span class="logo-text top-logo" @dblclick="store.toggleBossMode()">{{ store.appTitle }}</span>
      </div>
      <div class="top-bar-right">
        <button v-if="!store.isPro" class="top-btn" @click="store.showActivateModal = true">
          升级 Pro
        </button>
        <button class="icon-btn" @click="toggleTheme" title="切换主题">
          <icon-material-symbols-light-mode v-if="store.theme === 'dark'" />
          <icon-material-symbols-dark-mode v-else />
        </button>
        <div class="avatar-dropdown-wrapper" ref="avatarDropdownRef">
          <div class="avatar" title="账号" @click="showAvatarDropdown = !showAvatarDropdown" :style="(!store.userAvatar && store.userAvatarColor) ? { background: store.userAvatarColor } : {}">
            <img v-if="store.userAvatar" :src="store.userAvatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />
            <span v-else>{{ store.userName.charAt(0).toUpperCase() }}</span>
          </div>
          
          <div class="avatar-dropdown" v-if="showAvatarDropdown">
            <div class="dropdown-header">
              <div class="dropdown-avatar" :style="(!store.userAvatar && store.userAvatarColor) ? { background: store.userAvatarColor } : {}">
                <img v-if="store.userAvatar" :src="store.userAvatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />
                <span v-else>{{ store.userName.charAt(0).toUpperCase() }}</span>
              </div>
              <div class="dropdown-user-info">
                <div class="dropdown-name">{{ store.userName }}</div>
                <div class="dropdown-plan">{{ store.isPro ? store.appTitle + ' Pro' : 'Free Plan' }}</div>
              </div>
            </div>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" @click="openProfileModal">
              <icon-material-symbols-manage-accounts /> 更换个人信息
            </button>
            <button class="dropdown-item" @click="openSettings">
              <icon-material-symbols-settings /> 设置
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Chat Content Area -->
    <div class="chat-area" 
         ref="chatArea"
         @dragover.prevent="isDragging = true"
         @dragleave.prevent="isDragging = false"
         @drop.prevent="handleDrop">
      <!-- Wasteland View -->
      <div class="wasteland-view" v-if="store.showWasteland">
        <div class="wasteland-content">
          <div class="wasteland-icon-wrap">
            <icon-material-symbols-landscape />
          </div>
          <h2 class="wasteland-title">你来到了一片没有知识的荒原</h2>
          <p class="wasteland-desc">这里的星球还在自转，只是所有的连接都暂时断开了。<br>你可以尝试加载一份本地文档，或者在设置中探索更多功能。</p>
          <button class="wasteland-btn" @click="store.showWasteland = false; store.activeId = null">回到主页</button>
        </div>
      </div>

      <!-- Welcome Screen -->
      <div class="welcome-screen" 
           v-else-if="store.activeNovelIndex === null"
           @dragover.prevent="isDragging = true"
           @dragleave.prevent="isDragging = false"
           @drop.prevent="handleDrop">
        <!-- Gemini specific welcome -->
        <template v-if="store.style === 'gemini'">
          <div class="gemini-greeting">
            <h1 class="greeting-h1">
              <div class="greeting-name">
                <span class="gemini-welcome-sparkle">
                  <img src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg" alt="Gemini" style="width: 32px; height: 32px; pointer-events: none;" />
                </span>
                <span class="greeting-text">{{ store.userName }}，你好</span>
              </div>
              <div class="greeting-subtitle">需要我为你做些什么？</div>
            </h1>
          </div>
        </template>
        <!-- Generic welcome -->
        <template v-else>
          <div class="welcome-gradient-text">{{ currentStyle.welcomeTitle }}</div>
          <div class="welcome-subtitle">{{ currentStyle.welcomeSubtitle }}</div>
          
          <div class="welcome-cards-container">
            <div class="welcome-cards">
              <div class="welcome-card" @click="triggerFileInput">
                <icon-material-symbols-menu-book class="card-icon" style="color:#4285f4;background:rgba(66,133,244,0.1)" />
                <span class="card-text">加载作品文件</span>
              </div>
              <div class="welcome-card" @click="store.showSettings = true">
                <icon-material-symbols-settings class="card-icon" style="color:#ea4335;background:rgba(234,67,53,0.1)" />
                <span class="card-text">打开设置查看更多选项</span>
              </div>
              <div class="welcome-card" @click="openRecent">
                <icon-material-symbols-history class="card-icon" style="color:#fbbc05;background:rgba(251,188,5,0.1)" />
                <span class="card-text">继续阅读最近打开的对话</span>
              </div>
              <div class="welcome-card" @click="store.showHelp = true">
                <icon-material-symbols-help class="card-icon" style="color:#34a853;background:rgba(52,168,83,0.1)" />
                <span class="card-text">查看快捷操作及使用指南</span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Reading Content -->
      <div class="reading-content-layout" v-else>
      <div class="reading-content">
        <div 
          class="message-container" 
          v-for="(pageContent, index) in pagesToRender" 
          :key="isDummyChat ? `dummy-${index}` : `page-${store.currentPage}`"
          :style="isDummyChat && index < pagesToRender.length - 1 ? 'margin-bottom: 32px;' : ''"
        >
          <div class="user-message">
            <div class="user-img-row" v-if="getUserImages(pageContent).length > 0">
              <img v-for="(src, i) in getUserImages(pageContent)" :src="src" :key="i" />
            </div>
            <div class="user-msg-bubble" v-if="getUserTextHtml(pageContent, index)" v-html="getUserTextHtml(pageContent, index)"></div>
          </div>
          
          <div class="ai-response" v-show="!isDummyChat || getAiResponseRaw(pageContent).trim() || (isActiveStreaming && index === pagesToRender.length - 1)">
            <div class="ai-avatar" :class="{ 'breathing': isActiveStreaming && isAiWaitingFirstToken && index === pagesToRender.length - 1 }">
              <img v-if="currentStyle.favicon" :src="currentStyle.favicon" alt="AI" style="width: 100%; height: 100%; object-fit: contain; border-radius: 50%;">
              <div class="ai-sparkle" v-else></div>
            </div>
            <div class="ai-text" :style="{ 
              fontSize: store.settings.fontSize + 'px', 
              lineHeight: store.settings.lineHeight,
              color: store.settings.fontColor || 'inherit'
            }">
              <!-- During streaming: render reasoning as native Vue element -->
              <template v-if="isActiveStreaming && index === pagesToRender.length - 1 && streamingReasoning">
                <details class="ai-reasoning" :open="reasoningOpen" @toggle="(e: Event) => reasoningOpen = (e.target as HTMLDetailsElement).open">
                  <summary>显示思路</summary>
                  <div class="reasoning-body" v-text="streamingReasoning"></div>
                </details>
              </template>
              <!-- Main response content (v-html) -->
              <div class="html-wrapper" v-if="isActiveStreaming && index === pagesToRender.length - 1" v-html="formatStreamingMainResponse()"></div>
              <div class="html-wrapper" v-else-if="useTypewriterEffect" v-html="typewriterHtml"></div>
              <div class="html-wrapper" v-else-if="bossStreamActive && index === bossStreamPageIndex" v-html="bossStreamHtml"></div>
              <div class="html-wrapper" v-else v-html="formatContent(pageContent)"></div>
              <div v-if="(isActiveStreaming && index === pagesToRender.length - 1 && isAiWaitingMainResponse) || (useTypewriterEffect && typewriterHtml.length < formatContent(pageContent).length) || (bossStreamActive && index === bossStreamPageIndex && bossStreamHtml.length < formatContent(pageContent).length)" class="thinking-loading" :style="pageContent ? 'margin-top: 4px;' : ''">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>

          <div class="response-actions" v-show="!isDummyChat || getAiResponseRaw(pageContent).trim() || (isActiveStreaming && index === pagesToRender.length - 1)">
            <button class="action-btn" title="好反馈" @click="store.showToast('感谢您的反馈')">
              <icon-material-symbols-thumb-up />
            </button>
            <button class="action-btn" title="坏反馈" @click="store.showToast('感谢您的反馈')">
              <icon-material-symbols-thumb-down />
            </button>
            <button class="action-btn" title="修改回复" @click="store.showToast('暂不支持修改回复')" v-show="false">
              <icon-material-symbols-tune />
            </button>
            <button class="action-btn" @click="copyToClipboard(index)" title="复制">
              <icon-material-symbols-content-copy />
            </button>
            <button class="action-btn" title="更多" @click="store.showToast(store.comingSoonText)">
              <icon-material-symbols-more-vert />
            </button>
          </div>
          
          <div class="page-nav" v-if="!isDummyChat && index === pagesToRender.length - 1">
            <button class="page-nav-btn" @click="store.showToc = true" title="目录">
              <icon-material-symbols-menu-book /> 目录
            </button>
            <button class="page-nav-btn" @click="store.prevPage" :disabled="store.currentPage <= 0">
              <icon-material-symbols-chevron-left /> 上一页
            </button>
            <div class="page-info" @click="jumpPage" title="点击跳转页码" style="cursor:pointer;text-decoration:underline dashed;text-underline-offset:4px;min-width:80px;text-align:center">
              {{ store.currentPage + 1 }} / {{ store.totalPages }}
            </div>
            <button class="page-nav-btn" @click="store.nextPage" :disabled="store.currentPage >= store.totalPages - 1">
               下一页 <icon-material-symbols-chevron-right />
            </button>
          </div>
        </div>
      </div> <!-- end .reading-content -->
      
      <!-- BOSS 侧边栏 (Right) - 根据 fakeSidebarShowForTypes 配置显示 -->
        <aside v-if="shouldShowFakeSidebar" class="fake-sidebar">
          <div class="fake-sidebar-inner">
             <div v-for="(item, i) in fakeSidebarTasks" :key="i" class="fake-item" :class="{ 'has-title': item.isTitle }">
                <template v-if="item.isTitle">
                   <div class="fake-title">{{ item.text }}</div>
                </template>
                <template v-else>
                   <div class="fake-dot"></div>
                   <div class="fake-text">{{ item.text }}</div>
                </template>
             </div>
          </div>
        </aside>
      </div><!-- end .reading-content-layout -->
    </div><!-- end .chat-area -->

    <!-- Bottom Input Bar -->
    <div class="input-area" 
         v-if="!store.showWasteland"
         :class="{ 'is-dragging': isDragging }"
         @dragover.prevent="isDragging = true"
         @dragleave.prevent="isDragging = false"
         @drop.prevent="handleDrop">
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
                 v-model="inputValue" 
                 @keydown.enter="handleInputSubmit" 
                 :placeholder="currentStyle.placeholder" />
          <div class="gemini-toolbar">
            <div class="toolbar-left">
              <button class="icon-btn input-icon" @click="triggerFileInput" title="上传文件">
                <icon-material-symbols-add />
              </button>
              <button class="icon-btn tool-btn" title="工具" @click="store.showToast(store.comingSoonText)">
                <icon-material-symbols-instant-mix />
                <span class="tool-text">工具</span>
              </button>
            </div>
            <div class="toolbar-right">
              <div class="model-selector">
                <span>{{ currentStyle.modelLabel || 'Pro' }}</span>
                <icon-material-symbols-expand-more style="font-size:16px" />
              </div>
              <button class="icon-btn send-btn" :class="{ 'has-text': (inputValue.trim() || attachedImages.length > 0 || isListening) && !isAiGenerating, 'is-listening': isListening }" @click="handleSendClick" :title="isActiveStreaming ? '停止响应' : (isListening ? '停止聆听' : ((inputValue.trim() || attachedImages.length > 0) ? '发送' : '语音输入'))" :disabled="isAiGenerating && !isActiveStreaming">
                <icon-material-symbols-stop-circle v-if="isActiveStreaming" style="color: var(--accent-pink); width: 24px; height: 24px;" />
                <icon-material-symbols-graphic-eq v-else-if="isListening" class="voice-active-icon" style="width: 24px; height: 24px;" />
                <icon-material-symbols-send v-else-if="inputValue.trim() || attachedImages.length > 0" />
                <icon-material-symbols-mic v-else />
              </button>
            </div>
          </div>
        </div>

        <!-- ChatGPT Style Input DOM -->
        <div class="input-wrapper chatgpt-wrapper" v-else-if="store.style === 'chatgpt'">
          <button class="icon-btn input-icon attachment-btn" @click="triggerFileInput" title="上传附件">
            <icon-material-symbols-add />
          </button>
          <input type="text" 
                 class="chat-input" 
                 v-model="inputValue" 
                 @keydown.enter="handleInputSubmit" 
                 :placeholder="currentStyle.placeholder" />
          <div class="chatgpt-right-actions">
            <button class="icon-btn input-icon" title="搜索网页">
              <icon-material-symbols-language />
            </button>
            <button class="icon-btn input-icon" title="推理指导">
              <icon-material-symbols-lightbulb />
            </button>
            <div class="model-selector">
              <span>{{ currentStyle.modelLabel || 'Pro' }}</span>
              <icon-material-symbols-expand-more style="font-size:16px" />
            </div>
            <button class="icon-btn send-btn chatgpt-send" :class="{ 'has-text': (inputValue.trim() || attachedImages.length > 0 || isListening) && !isAiGenerating, 'is-listening': isListening }" @click="handleSendClick" :title="isActiveStreaming ? '停止响应' : (isListening ? '停止聆听' : ((inputValue.trim() || attachedImages.length > 0) ? '发送' : '语音输入'))" :disabled="isAiGenerating && !isActiveStreaming">
              <icon-material-symbols-stop-circle v-if="isActiveStreaming" style="font-size: 16px; color: var(--bg-primary)" />
              <icon-material-symbols-graphic-eq v-else-if="isListening" class="voice-active-icon" style="font-size: 16px; color: var(--bg-primary)" />
              <icon-material-symbols-arrow-upward v-else-if="inputValue.trim() || attachedImages.length > 0" style="font-size: 16px; color: var(--bg-primary)" />
              <icon-material-symbols-mic v-else />
            </button>
          </div>
        </div>

        <!-- Default Style Input DOM -->
        <div class="input-wrapper default-wrapper" v-else>
          <input type="text" 
                 class="chat-input" 
                 v-model="inputValue" 
                 @keydown.enter="handleInputSubmit" 
                 :placeholder="currentStyle.placeholder" />
          <div class="input-actions-inline">
            <button class="icon-btn input-icon" @click="triggerFileInput" title="上传文件">
              <icon-material-symbols-add-circle />
            </button>
            <button class="icon-btn input-icon" title="深入研究">
              <icon-material-symbols-explore />
            </button>
          </div>
          <div class="input-right-actions">
            <div class="model-selector">
              <span>{{ currentStyle.modelLabel || 'Pro' }}</span>
              <icon-material-symbols-expand-more style="font-size:16px" />
            </div>
            <button class="icon-btn send-btn" :class="{ 'is-listening': isListening }" @click="handleSendClick" :title="isActiveStreaming ? '停止响应' : (isListening ? '停止聆听' : ((inputValue.trim() || attachedImages.length > 0) ? '发送' : '语音输入'))" :disabled="isAiGenerating && !isActiveStreaming">
              <icon-material-symbols-stop-circle v-if="isActiveStreaming" style="color: var(--accent-pink)" />
              <icon-material-symbols-graphic-eq v-else-if="isListening" class="voice-active-icon" />
              <icon-material-symbols-send v-else-if="inputValue.trim() || attachedImages.length > 0" />
              <icon-material-symbols-mic v-else />
            </button>
          </div>
        </div>
      </div>
      
      <!-- Gemini Suggestion Chips (only on welcome screen) -->
      <div class="gemini-suggestion-chips" v-if="store.style === 'gemini' && store.activeNovelIndex === null">
        <div class="gemini-chips-row">
          <button class="gemini-chip" @click="triggerFileInput">
            <icon-material-symbols-image style="color: #fbbc05;" /> 制作图片
          </button>
          <button class="gemini-chip" @click="store.showToast(store.comingSoonText)">
            <icon-material-symbols-music-note style="color: #ea4335;" /> 创作音乐
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
    
    <input type="file" ref="fileInput" accept="*" style="display:none" multiple @change="handleFileSelect">
    
    <!-- Dev Only: Quick Reading Settings Button -->
    <button v-if="isDev" class="dev-quick-settings-btn" @click="openDevReadingSettings" title="[DEV] 快速调试阅读配置">
      <icon-material-symbols-settings />
    </button>

    <!-- Image Preview Modal -->
    <div v-if="previewImageUrl" class="image-preview-overlay" @click="previewImageUrl = null">
      <div class="preview-close-btn">
        <icon-material-symbols-close />
      </div>
      <img :src="previewImageUrl" class="preview-full-img" @click.stop />
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useAppStore } from '@/store/appStore';
import { STYLE_CONFIG } from '@/config/constants';
import { ContentDB } from '@/utils/db'; // Make sure you import this if we add novel processing here

import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';

marked.use({
  gfm: true,
  breaks: true,
  renderer: {
    code({ text, lang }: any) {
      let highlighted: string;
      let detectedLang = lang || '';
      if (lang && hljs.getLanguage(lang)) {
        highlighted = hljs.highlight(text, { language: lang }).value;
      } else {
        const result = hljs.highlightAuto(text);
        highlighted = result.value;
        if (!detectedLang) detectedLang = result.language || 'code';
      }
      // 将 \n 编码为 HTML 实体，防止 marked breaks:true 把每行末尾再插一个 <br>
      // <pre> 内 &#10; 与真实换行符等价，不影响显示
      highlighted = highlighted.replace(/\n/g, '&#10;');
      const displayLang = detectedLang.toUpperCase() || 'CODE';
      return `<div class="code-block"><div class="code-header"><span class="code-lang-label">${escapeHtml(displayLang)}</span></div><pre><code class="hljs language-${escapeHtml(detectedLang)}">${highlighted}</code></pre></div>`;
    }
  }
});

const store = useAppStore();
const isDev = (import.meta as any).env?.DEV;
const isDragging = ref(false);
const previewImageUrl = ref<string | null>(null);

function openDevReadingSettings() {
  store.autoExpandReading = true;
  store.showSettings = true;
}

const currentStyle = computed(() => STYLE_CONFIG[store.style]);

const chatTitle = computed(() => {
  if (store.activeNovelIndex === null) {
    return store.style === 'gemini' ? store.appTitle : currentStyle.value.title;
  }
  const novel = store.novels[store.activeNovelIndex];
  return novel ? (novel.displayName || novel.name.replace(/\.txt$/i, '')) : '';
});

const isDummyChat = computed(() => {
  if (store.activeNovelIndex === null) return false;
  const novel = store.novels[store.activeNovelIndex];
  return !!novel && (novel.type === 'fake' || novel.type === 'ai');
});

// 真实 AI 会话（ai 类型）：不展示侧边栏也不走 bossStream
const isRealAiChat = computed(() => {
  if (store.activeNovelIndex === null) return false;
  const novel = store.novels[store.activeNovelIndex];
  return !!novel && novel.type === 'ai';
});

// 首屏模式下（boss 模式 + 非末轮），只渲染第一页，保持"AI 正在回复第一轮"的视觉完整性
const pagesToRender = computed(() => {
  if (store.activeNovelIndex === null) return [];
  if (isDummyChat.value) {
    // BOSS 模式首屏模式：只显示第一轮，隐藏后续轮次（数据不删除，仅临时隐藏）
    if (store.bossMode && store.settings.bossKeyStreamTurn !== 'last') {
      return [store.pages[0] || ''];
    }
    return store.pages;
  }
  return [store.pages[store.currentPage] || ''];
});

// 侧边栏可见性：根据 fakeSidebarShowForTypes 多选适用对话类型
const shouldShowFakeSidebar = computed(() => {
  if (!store.settings.showFakeSidebar) return false;
  const types: string[] = store.settings.fakeSidebarShowForTypes || ['works', 'fake'];
  if (store.activeNovelIndex === null) return false;
  const novel = store.novels[store.activeNovelIndex];
  if (!novel) return false;
  return types.includes(novel.type);
});

// Avatar Dropdown
const showAvatarDropdown = ref(false);
const avatarDropdownRef = ref<HTMLElement | null>(null);

function openProfileModal() {
  showAvatarDropdown.value = false;
  store.showProfileModal = true;
}

function openSettings() {
  showAvatarDropdown.value = false;
  store.showSettings = true;
}

function closeDropdown(e: MouseEvent) {
  if (avatarDropdownRef.value && !avatarDropdownRef.value.contains(e.target as Node)) {
    showAvatarDropdown.value = false;
  }
}

function getAiResponseRaw(text: string) {
  if (!text) return '';
  if (!isDummyChat.value) return text;
  const match = text.match(/^\[USER\]:\s*([\s\S]*?)\n\n([\s\S]*)$/);
  return match ? match[2] : '';
}

function getUserImages(text: string) {
  if (isDummyChat.value && text) {
    const match = text.match(/^\[USER\]:\s*([\s\S]*?)(?:\n\n|$)/);
    const userText = match ? match[1] : '';
    const imgTagRegex = /!\[.*?\]\((data:image\/[^)]+)\)/g;
    const images: string[] = [];
    let m;
    while ((m = imgTagRegex.exec(userText)) !== null) {
      images.push(m[1]);
    }
    return images;
  }
  return [];
}

function getUserTextHtml(text: string, _index: number) {
  if (!isDummyChat.value) {
    const pageNum = store.currentPage + 1;
    const total = store.totalPages;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // 逻辑：根据模式决定内容
    let content = '';
    const mode = store.settings.userBubbleMode || 'default';
    
    if (mode === 'default') {
      content = `${chatTitle.value}${store.currentPage === 0 ? '' : ` - 第 ${pageNum} 页`}`;
    } else if (mode === 'random') {
      const randoms = [
          '帮我分析一下这一页的重点',
          '这段话有什么深层含义吗？',
          '总结一下这一章的主要内容',
          '继续往下读',
          '这里的转折点在哪里？',
          '我读到这里了，记录一下'
      ];
      // 我们用 pageNum 作为随机种子，保证同一页看到的随机内容一致，不会跳动
      content = randoms[pageNum % randoms.length];
    } else {
      // 模板模式
      let template = store.settings.userBubbleTemplate || '{{title}} - 第 {{page}} 页';
      content = template.replace(/{{title}}/g, chatTitle.value)
                        .replace(/{{page}}/g, pageNum.toString())
                        .replace(/{{total}}/g, total.toString())
                        .replace(/{{time}}/g, timeStr);
    }
    
    return escapeHtml(content);
  }
  if (!text) return escapeHtml(chatTitle.value);
  const match = text.match(/^\[USER\]:\s*([\s\S]*?)(?:\n\n|$)/);
  const userText = match ? match[1] : chatTitle.value;

  const imgTagRegex = /!\[.*?\]\((data:image\/[^)]+)\)/g;
  const textWithoutImages = userText.replace(imgTagRegex, '').trim();

  if (!textWithoutImages) return '';
  return DOMPurify.sanitize(marked.parse(textWithoutImages) as string);
}

function formatContent(text: string) {
  let tmp = getAiResponseRaw(text);
  if (!tmp.trim()) return '';

  let lines = tmp.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // 隐藏章节名：移除第一行（通常是标题），该功能仅对作品类型生效
  if (!store.settings.showChapterName && lines.length > 0 && !isDummyChat.value) {
    lines.shift();
  }
  
  tmp = applySecondaryObfuscation(lines);

  const rawHtml = marked.parse(tmp) as string;
  return DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['open'] });
}

function applySecondaryObfuscation(lines: string[]) {
  if (lines.length === 0) return lines.join('\n\n');
  const mode = store.settings.secondaryRenderObfuscationMode || 'none';

  // 1. apply string replacement first if requested
  if (store.settings.secondaryRenderEnableReplace && store.settings.secondaryRenderReplaceDict) {
    const rules = store.settings.secondaryRenderReplaceDict.split('\n').map(l => l.trim()).filter(l => l);
    for (const rule of rules) {
      const parts = rule.split(/->|=|:/);
      if (parts.length >= 2) {
        const k = parts[0].trim();
        const v = parts.slice(1).join('->').trim(); // in case value has -> inside
        if (k && v !== undefined) {
          try {
            const re = new RegExp(k, 'g');
            for (let i = 0; i < lines.length; i++) {
              lines[i] = lines[i].replace(re, v);
            }
          } catch(e) { /* ignore invalid regex */ }
        }
      }
    }
  }

  // 2. apply remove punctuation if requested
  if (store.settings.secondaryRenderEnablePunctuation && store.settings.secondaryRenderRemovePunctuation && store.settings.secondaryRenderRemovePunctuation.length > 0) {
    const punc = store.settings.secondaryRenderRemovePunctuation;
    const removeAll = punc.includes('all');
    const removeComma = removeAll || punc.includes('comma');
    const removePeriod = removeAll || punc.includes('period');
    const removeQuote = removeAll || punc.includes('quote');
    const removeExclamation = removeAll || punc.includes('exclamation');
    const removeQuestion = removeAll || punc.includes('question');
    const removeEllipsis = removeAll || punc.includes('ellipsis');

    for (let i = 0; i < lines.length; i++) {
        if (removeAll) {
            lines[i] = lines[i].replace(/[.,;:!?…"'“”‘’()\[\]{}—_《》「」『』，。、：；！？（）【】 ]+/g, ' ');
        } else {
            if (removeComma)    lines[i] = lines[i].replace(/[,，、]/g, ' ');
            if (removePeriod)   lines[i] = lines[i].replace(/[.。]/g, ' ');
            if (removeQuote)    lines[i] = lines[i].replace(/["'“”‘’「」『』]/g, '');
            if (removeExclamation) lines[i] = lines[i].replace(/[!！]/g, ' ');
            if (removeQuestion) lines[i] = lines[i].replace(/[?？]/g, ' ');
            if (removeEllipsis) lines[i] = lines[i].replace(/…/g, '');
        }
    }
  }

  // merge paragraphs if requested
  let mergedLines = lines;
  if (store.settings.secondaryRenderMergeParagraphs && store.settings.secondaryRenderMergeCount > 1) {
    mergedLines = [];
    const count = store.settings.secondaryRenderMergeCount;
    for (let i = 0; i < lines.length; i += count) {
      mergedLines.push(lines.slice(i, i + count).join(''));
    }
  }

  // specific mode formatting
  if (mode === 'log') {
    const dateStr = new Date().toISOString().split('T')[0];
    let html = '```log\n';
    const logLevels = ['INFO', 'DEBUG', 'WARN', 'TRACE'];
    mergedLines.forEach((line, idx) => {
       const level = logLevels[idx % logLevels.length];
       const ts = new Date(Date.now() + idx * 1000).toTimeString().split(' ')[0];
       html += `[${dateStr} ${ts}] [${level}] [Worker-${idx}] ${line}\n`;
    });
    html += '```\n';
    return html;
  }
  
  if (mode === 'json') {
    const dataObj = {
      taskId: `task-${Date.now().toString().slice(-4)}`,
      status: "SUCCESS",
      extracted_entities: mergedLines.map((content, idx) => ({
        id: idx + 1,
        content: content
      }))
    };
    return '```json\n' + JSON.stringify(dataObj, null, 2) + '\n```\n';
  }

  if (mode === 'markdown_report') {
    let result = '';
    mergedLines.forEach((line, idx) => {
      if (idx % 3 === 0) {
        result += `\n### Phase ${Math.floor(idx/3) + 1}: Execution Flow\n`;
      }
      result += `- ${line}\n`;
    });
    return result;
  }

  if (mode === 'translation') {
    let result = '';
    const fakeEngHints = [
      "The system is extracting the semantic context...",
      "Process initialized with parameter sequence...",
      "Analyzing the natural language structure...",
      "Computing the transition matrix...",
      "Event triggered at worker thread..."
    ];
    mergedLines.forEach((line, idx) => {
      const eng = fakeEngHints[idx % fakeEngHints.length];
      result += `> 💬 *${eng}*\n\n${line}\n\n`;
    });
    return result;
  }

  // default mode or replace mode falls back to normal paragraph indent
  const indentCount = store.settings.secondaryRenderIndent !== undefined ? store.settings.secondaryRenderIndent : 2;
  const indentStr = indentCount > 0 ? Array(indentCount).fill('　').join('') : '';
  
  return mergedLines.map(line => {
    const trimmed = line.trim();
    // 如果是 Markdown 语法的行（标题、引用、列表、代码块），则不添加首行缩进，避免破坏渲染
    if (/^([#>\-*]|\d+\.|```)/.test(trimmed)) {
      return line;
    }
    return `${indentStr}${line}`;
  }).join('\n\n');
}

function formatStreamingMainResponse() {
  let text = streamingMainResponse.value;
  if (!text.trim()) return '';

  let lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (!store.settings.showChapterName && lines.length > 0) {
      lines.shift();
  }
  text = applySecondaryObfuscation(lines);

  const rawHtml = marked.parse(text) as string;
  return DOMPurify.sanitize(rawHtml);
}

function escapeHtml(text: string) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function toggleTheme() {
  store.theme = store.theme === 'dark' ? 'light' : 'dark';
}

async function jumpPage() {
  const input = await store.promptDialog(
    `跳转到第几页？(1 - ${store.totalPages})\n(当前第 ${store.currentPage + 1} 页)`,
    '',
    '输入数字...',
    '页码跳转'
  );
  if (input === null) return;
  const p = parseInt(input);
  if (!isNaN(p) && p >= 1 && p <= store.totalPages) {
    store.triggerTypewriter = true;
    store.currentPage = p - 1;
  } else {
    store.showToast('无效页码，请输入 1 到 ' + store.totalPages + ' 之间的数字');
  }
}

// Typewriter logic for novels
const typewriterHtml = ref('');
let typewriterTimer: any = null;

function startTypewriter() {
  stopTypewriter();
  const rawContent = store.pages[store.currentPage] || '';
  if (!rawContent) return;

  const fullHtml = formatContent(rawContent);
  
  const shouldType = useTypewriterEffect.value && store.triggerTypewriter && !store.skipNextTypewriter;

  if (!shouldType) {
    typewriterHtml.value = fullHtml;
    store.triggerTypewriter = false;
    store.skipNextTypewriter = false;
    return;
  }

  store.triggerTypewriter = false;
  typewriterHtml.value = '';
  let index = 0;
  const charsPerTick = Math.max(1, Math.floor(60 / Math.max(1, store.settings.typewriterSpeed))); 
  
  typewriterTimer = setInterval(() => {
    // Reveal a chunky slice to keep up if speed is very high, but usually just a few chars
    // Since we are dealing with formatted HTML, we reveal it increments of raw HTML length?
    // Actually, to avoid breaking HTML tags, we should reveal characters of the parsed HTML.
    // BUT cutting raw HTML is dangerous (<di...v>). 
    // A better trick: reveal characters from the parsed HTML string, BUT skip tags.
    
    // Simplest version: Reveal from the raw content and then re-parse? expensive.
    // Let's reveal by index in fullHtml, but if we land inside a tag, jump to end of tag.
    
    for (let i = 0; i < charsPerTick; i++) {
      if (index >= fullHtml.length) {
        stopTypewriter();
        break;
      }
      
      const char = fullHtml[index];
      if (char === '<') {
        const tagEnd = fullHtml.indexOf('>', index);
        if (tagEnd !== -1) {
          index = tagEnd + 1;
        } else {
          index++;
        }
      } else {
        index++;
      }
    }
    
    typewriterHtml.value = fullHtml.substring(0, index);
    
    if (index >= fullHtml.length) {
      stopTypewriter();
    }
  }, store.settings.typewriterSpeed);
}

function stopTypewriter() {
  if (typewriterTimer) {
    clearInterval(typewriterTimer);
    typewriterTimer = null;
  }
}

// Typewriter effect: ONLY for novels (never dummy chats)
const useTypewriterEffect = computed(() => {
  if (isDummyChat.value) return false;
  return store.settings.typewriterMode;
});

// Boss stream: separate system for dummy chat in boss mode
// bossStreamPageIndex: which page (conversation turn) to stream
const bossStreamActive = ref(false);
const bossStreamHtml = ref('');
const bossStreamPageIndex = ref(0);
let bossStreamTimer: any = null;

function stopBossStream() {
  if (bossStreamTimer) {
    clearInterval(bossStreamTimer);
    bossStreamTimer = null;
  }
}

function startBossStream() {
  stopBossStream();
  bossStreamActive.value = false;
  bossStreamHtml.value = '';

  const turn = store.settings.bossKeyStreamTurn || 'first';
  // 'first' → page 0 (stream in viewport); 'last' → last page (scroll to bottom)
  const pageIdx = turn === 'last' ? store.pages.length - 1 : 0;
  bossStreamPageIndex.value = pageIdx;

  const targetPage = store.pages[pageIdx] || '';
  if (!targetPage) return;

  const fullHtml = formatContent(targetPage);
  if (!fullHtml || fullHtml.length < 20) return;

  const rawChars = store.settings.bossKeyStreamStartChars || 300;
  let startIndex = Math.min(rawChars * 4, Math.floor(fullHtml.length * 0.85));

  // Adjust forward if we're mid-tag
  if (fullHtml.lastIndexOf('<', startIndex) > fullHtml.lastIndexOf('>', startIndex)) {
    const tagEnd = fullHtml.indexOf('>', startIndex);
    startIndex = tagEnd !== -1 ? tagEnd + 1 : startIndex;
  }

  bossStreamHtml.value = fullHtml.substring(0, startIndex);
  bossStreamActive.value = true;

  // If 'last' mode, scroll chat area to bottom after a short delay for DOM render
  if (turn === 'last') {
    nextTick(() => {
      if (chatArea.value) {
        chatArea.value.scrollTop = chatArea.value.scrollHeight;
      }
    });
  }

  let index = startIndex;
  const charsPerTick = 3;

  bossStreamTimer = setInterval(() => {
    for (let i = 0; i < charsPerTick; i++) {
      if (index >= fullHtml.length) {
        stopBossStream();
        bossStreamHtml.value = fullHtml;
        return;
      }
      const char = fullHtml[index];
      if (char === '<') {
        const tagEnd = fullHtml.indexOf('>', index);
        index = tagEnd !== -1 ? tagEnd + 1 : index + 1;
      } else {
        index++;
      }
    }
    bossStreamHtml.value = fullHtml.substring(0, index);
    if (index >= fullHtml.length) {
      stopBossStream();
    }
  }, 30);
}

// Watcher 1: 翻页/useTypewriterEffect 变化 → 打字机（仅限普通小说）
let bossModeTimeout: any = null;
watch(
  [() => store.currentPage, () => useTypewriterEffect.value],
  () => {
    if (!isDummyChat.value) {
      startTypewriter();
    }
    if (!store.bossMode || !isDummyChat.value) {
      stopBossStream();
      bossStreamActive.value = false;
      bossStreamHtml.value = '';
    }
  },
  { immediate: true }
);

// Watcher 1b: 切换会话 → 无条件清空旧会话的 bossStream 残留
// bossStream 的启动权只在 Watcher 2（进入 boss mode 的那一刻），
// 用户手动在 boss mode 下点击其他对话，只清空残留、展示真实内容，不重启流式
watch(() => store.activeNovelIndex, () => {
  stopBossStream();
  bossStreamActive.value = false;
  bossStreamHtml.value = '';

  // 普通小说才需要打字机
  if (!isDummyChat.value) {
    startTypewriter();
  }
});

// Watcher 2: bossMode 状态转换（false→true 才触发流式，true→false 清理）
watch(() => store.bossMode, (isBoss, wasBoss) => {
  if (isBoss && !wasBoss && store.settings.bossKeyStreamOutput) {
    // 从 false→true：进入 BOSS 键目标对话，触发流式
    if (bossModeTimeout) clearTimeout(bossModeTimeout);
    bossModeTimeout = setTimeout(() => {
      if (store.bossMode && isDummyChat.value) {
        startBossStream();
      }
    }, 80);
  } else if (!isBoss) {
    // 退出 Boss 模式：清理所有流式状态
    if (bossModeTimeout) clearTimeout(bossModeTimeout);
    stopBossStream();
    bossStreamActive.value = false;
    bossStreamHtml.value = '';
  }
});

onUnmounted(() => {
  stopTypewriter();
  stopBossStream();
  if (bossModeTimeout) clearTimeout(bossModeTimeout);
});

const inputValue = ref('');
const attachedImages = ref<string[]>([]);
const reasoningOpen = ref(false);
const userScrolledUp = ref(false);

const fakeSidebarPoolIT = [
    "[TITLE] 最近任务", "更新 API 文档", "修复代码 Lint 错误", "与产品确认需求细节", "准备下周一的周报", 
    "[TITLE] 技术预研", "研究 Vue3 并行渲染逻辑", "Pinia 持久化方案对比", "Vite 编译速度优化", 
    "[TITLE] 项目管理", "检查 JIRA 进行中的任务", "回复邮件列表相关提问", "Code Review: PR #128", 
    "更新 README 部署指南", "重构核心逻辑层", "优化数据库索引", "清理无效依赖项", "编写单元测试用例",
    "同步测试环境数据", "处理客户反馈的 500 错误", "升级后端 Node 版本", "审查第三方包安全性",
    "[TITLE] 待办清单", "提交加班申请单", "报销出差交通费", "整理本地会议记录", "预定下周的会议室",
    "配置 CI/CD 自动部署", "压测大文件读取性能", "修复深色模式样式溢出", "同步 UI 组件库最新规范",
    "与运维确认带宽限额", "更新 API 错误代码表", "撰写系统迁移手册", "调整 Nginx 配置负载均衡",
    "[TITLE] 学习进度", "深入理解 JS 原型链", "Go 语言协程模型初步", "React 19 特兴跟踪",
    "准备内部分享议题", "优化前端首屏加载时间", "重构消息通知聚合服务", "增加日志脱敏处理逻辑",
    "[TITLE] 个人笔记", "记一次生产环境内存泄露", "多端适配关键点记录", "优化正则匹配效率感悟",
    "整理浏览器缓存策略", "检查 SSL 证书过期时间", "导出 Q3 度量报表", "同步内部 Wiki 变更",
    "排查 Redis 缓存命中率", "验证 K8s 服务发现配置", "调研大模型推理加速方案", "优化前端长列表渲染",
    "[TITLE] 其他杂项", "清理桌面多余截图", "格式化移动硬盘数据", "更新 GitHub 个人简介", "确认激活码生成逻辑",
    "处理前端防抖失效 Bug", "配置 Webpack 多态打包", "支持多语言 i18n 翻译", "整合第三方 Auth 服务",
    "移除旧版废弃代码片段", "优化图片资源的 WebP 转换", "验证移动端触控反馈", "调整弹窗组件层级 ID",
    "实现前端多会话持久化", "追踪内存快照中的泄露点", "编写业务异常处理机制", "同步 Git 远程仓库钩子",
    "修复 IE11 的最后一点兼容", "支持本地 TXT 编码自动识别", "封装跨域代理中间件", "重写路由鉴权拦截器",
    "更新依赖包的版本镜像地", "迁移 Sentry 到自建服务器", "调整 Logstash 过滤解析器", "编写 API 压力测试脚本",
    "检查 Docker Compose 网络", "优化 SQL 慢查询注入防御", "实现前端路由守卫逻辑", "封装统一的消息推送接口",
    "整理团队内部技术分享", "分析竞品功能实现原理", "支持前端文件分段上传", "优化多维表导出性能",
    "处理页面 FCP 性能瓶颈", "验证 GraphQL 的查询深度", "同步测试覆盖率到面板", "生成最新的 API Swagger",
    "配置 Prometheus 的告警阈值", "检查 CDN 的缓存穿透问题", "手动部署最新的演示环境"
];

const fakeSidebarPoolGeneral = [
    "[TITLE] 本周重点", "跟进重点客户续约进度", "确认 Q3 营销活动方案", "准备部门周会汇报材料", "汇总各地区销售数据",
    "[TITLE] 审批流程", "处理待生效的费用报销", "审批新员工转正申请", "核对本月供应商付款单", "查看请假审批记录",
    "[TITLE] 项目协同", "跨部门协作沟通群待回复", "安排新供应商线上对接会", "更新产品发布物料进度", "确认运营推广时间节点",
    "收集用户体验调研问卷", "整理客户投诉跟进工单", "跟进法务合同盖章流程", "跟进设计资源输出排期",
    "[TITLE] 知识库建设", "整理上季度复盘文档", "更新入职培训手册", "分享行业竞品分析报告", "归档历史项目资料",
    "编辑部门内部通讯录", "维护常见问题解答库 (FAQ)", "收集团队优秀案例分享", "起草内部操作规范草案",
    "[TITLE] 行政杂项", "预定下周五团队团建场地", "申办公用品采购清单", "协调外部访客接待流", "跟发会议纪要给参会人",
    "确认下月办公场地租赁事宜", "录入新入职员工信息", "排期下半年的消防安全演习", "核对月度考勤异常情况",
    "[TITLE] 个人成长", "阅读《从优秀到卓越》第三章", "学习最新行业合规政策", "预约英语口语陪练课程",
    "整理个人年度 OKR 进度", "准备内部演讲竞聘材料", "查看行业线上研讨会回放", "报名参加管理技能培训班",
    "[TITLE] 财务相关", "核对各项目组预算执行率", "催要待报销的增值税发票", "编制下阶段资金流水预测", "审核季度差旅费用汇总表",
    "对接银行账户信息变更", "整理审计所需文件底稿", "确认税务申报进度", "汇总个人所得税汇算清缴",
    "[TITLE] 其他杂事", "回复未读邮件 12 封", "清理系统桌面临时文件夹", "更新电脑密码及安全问题", "联系 IT 部门维修打印机",
    "预约体检时间", "领取节日福利礼包", "办理门禁卡权限延期", "更换办公室饮水机滤芯"
];

const fakeSidebarPoolDesign = [
    "[TITLE] 设计周报", "完成 3.0 版本 UI 规范初稿", "整理图标库 SVG 规范", "确认移动端适配切图", "回复前端关于间距的疑问",
    "[TITLE] 灵感采集", "收集竞品最新微动效方案", "整理 Dribbble 优秀深色模式案例", "分析 Apple 官网字体层级",
    "[TITLE] 协作文档", "在 Figma 中回复开发标注提议", "更新 PRD 中的交互原型图", "参加下午 2 点的需求评审会",
    "导出 Q4 季度视觉资产", "重构设计系统的颜色变量", "校对 Android 端点击热区", "清理本地 Figma 回收站",
    "[TITLE] 待办清单", "提交 Adobe CC 续费申请", "整理手绘草图到知识库", "预定远程设计同步会", "导出给外包商的任务说明书",
    "校对官网无障碍阅读方案", "整理字体商用授权清单", "起草新产品的品牌视觉方案", "调整弹窗组件的阴影参数",
    "[TITLE] 交互演进", "测试原型在真机上的流程度", "梳理新用户注册流失节点", "优化加载状态的骨骼屏设计",
    "更新全局空状态插画库", "修复 iOS 端导航栏背景模糊", "调整全局圆角由 8px 到 12px", "同步图标组件到研发分支",
    "[TITLE] 竞品分析", "分析飞书 7.0 布局策略", "拆解 Discord 侧边栏交互 logic", "总结 Notion 块编辑器的 UX 核心",
    "整理常见的报错反馈设计模式", "调研沉浸式阅读的翻页动效", "对比国内外金融 App 首页布局", "追踪最新的 Lottie 动画实现方案",
    "[TITLE] 个人成长", "阅读《设计心理学 2》", "学习 Blender 基础建模技巧", "预约周六的线下设计沙龙",
    "整理个人作品集更新记录", "回顾本月设计走查出的重灾区", "查看行业最新的无障碍准则", "报名参加 UI 动效高级特训班"
];

const fakeSidebarTasks = computed(() => {
    let rawItems: string[] = [];
    if (store.settings.fakeSidebarMode === 'custom' && store.settings.fakeSidebarContent) {
        rawItems = store.settings.fakeSidebarContent.split('\n').map(l => l.trim()).filter(l => l);
    } else {
        // 随机从池子里选 15-20 个，并保证包含一些 [TITLE]
        // 种子排除 currentPage，确保同会话内翻页不刷新侧边栏；仅在切换会话或手动刷新时变动
        const novelInfo = (store.activeNovelIndex !== null ? store.novels[store.activeNovelIndex] : null) || { id: 'default' };
        const seedValue = novelInfo.id + (store.fakeSidebarRefreshSeed * 1000);
        const rand = (i: number) => {
            // 使用简易的种子随机逻辑
            let h = 0;
            const str = seedValue + i;
            for (let j = 0; j < str.length; j++) {
              h = ((h << 5) - h) + str.charCodeAt(j);
              h |= 0;
            }
            const x = Math.sin(h) * 10000;
            return x - Math.floor(x);
        };
        
        // 简单洗牌逻辑
        let poolToUse = fakeSidebarPoolIT;
        if (store.settings.fakeSidebarMode === 'random_general') poolToUse = fakeSidebarPoolGeneral;
        else if (store.settings.fakeSidebarMode === 'random_design') poolToUse = fakeSidebarPoolDesign;
        
        const shuffled = [...poolToUse].sort((a, b) => rand(poolToUse.indexOf(a)) - 0.5);
        
        let count = store.settings.fakeSidebarItemCount || 15;
        // 如果开启了自动调整，根据对话轮数（totalPages）动态增加条数
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
const isAiGenerating = computed(() => {
  if (store.activeNovelIndex === null || !store.novels[store.activeNovelIndex]) return false;
  return store.generatingContexts.has(store.novels[store.activeNovelIndex].id);
});

const isAnyAiGenerating = computed(() => store.generatingContexts.size > 0);

const isAiWaitingFirstToken = computed(() => {
  if (store.activeNovelIndex === null || !store.novels[store.activeNovelIndex]) return false;
  return store.generatingContexts.get(store.novels[store.activeNovelIndex].id)?.isWaitingFirstToken || false;
});

const isAiWaitingMainResponse = computed(() => {
  if (store.activeNovelIndex === null || !store.novels[store.activeNovelIndex]) return false;
  return store.generatingContexts.get(store.novels[store.activeNovelIndex].id)?.isWaitingMainResponse || false;
});

const streamingReasoning = computed(() => {
  if (store.activeNovelIndex === null || !store.novels[store.activeNovelIndex]) return '';
  return store.generatingContexts.get(store.novels[store.activeNovelIndex].id)?.streamingReasoning || '';
});

const streamingMainResponse = computed(() => {
  if (store.activeNovelIndex === null || !store.novels[store.activeNovelIndex]) return '';
  return store.generatingContexts.get(store.novels[store.activeNovelIndex].id)?.streamingMainResponse || '';
});

// True only when AI is generating AND user is viewing the generating chat
const isActiveStreaming = computed(() => 
  isAiGenerating.value
);

function stopAiGeneration() {
  if (store.activeNovelIndex === null || !store.novels[store.activeNovelIndex]) return;
  const chatId = store.novels[store.activeNovelIndex].id;
  const ctx = store.generatingContexts.get(chatId);
  if (ctx && ctx.abortController) {
    ctx.abortController.abort();
    store.generatingContexts.delete(chatId);
  }
}

const isImageModel = (model: string) => {
  const m = model.toLowerCase();
  return m.includes('image') || m.includes('diffusion') || m.includes('flux') || m.includes('sd-') || m.includes('stable-diffusion') || m.includes('dall-e') || m.includes('kolors') || m.includes('cogview') || m.includes('playground');
};

async function handleAiChat(input: string) {
  if (isAiGenerating.value) return;

  const currentAbortController = new AbortController();
  const signal = currentAbortController.signal;
  
  let novelIndex = store.activeNovelIndex;
  
  const imagesToSend = [...attachedImages.value];
  attachedImages.value = [];
  
  let imagesMarkdown = '';
  if (imagesToSend.length > 0) {
    imagesMarkdown = '\n' + imagesToSend.map(img => `![图片](${img})`).join('  ');
  }
  const finalInputText = input + imagesMarkdown;
  
  if (novelIndex === null || !isDummyChat.value) { 
    const chatId = store.generateUid();
    const chatName = `ai_${Date.now()}.txt`;
    const initialContent = `[USER]: ${finalInputText}\n\n`;
    await ContentDB.save(chatId, initialContent, 'ai', chatName);
    
    store.novels.unshift({
      id: chatId,
      type: 'ai',
      name: chatName,
      size: initialContent.length,
      lastRead: Date.now(),
      currentPage: 0,
      displayName: input.substring(0, 20) || '多模态对话'
    });
    store._saveNovelsMeta();
    novelIndex = 0;
    // 直接设置活跃 ID
    store.activeId = chatId;
    store.pages = [initialContent];
    store.totalPages = 1;
    store.currentPage = 0;
  } else {
    const newRound = `[USER]: ${finalInputText}\n\n`;
    
    // If the last page has no AI response (e.g. previous request failed), replace it instead of creating a duplicate
    const lastPage = store.pages[store.pages.length - 1] || '';
    const lastPageAiMatch = lastPage.match(/^\[USER\]:\s*[\s\S]*?\n\n([\s\S]*)$/);
    const lastPageHasAiResponse = lastPageAiMatch && lastPageAiMatch[1].trim().length > 0;
    
    if (!lastPageHasAiResponse && store.pages.length > 0) {
      store.pages[store.pages.length - 1] = newRound;
    } else {
      store.pages.push(newRound);
    }
    
    store.totalPages = store.pages.length;
    store.currentPage = store.pages.length - 1;
    store._syncNovelPage();
    nextTick(() => { if (chatArea.value) chatArea.value.scrollTop = chatArea.value.scrollHeight; });
  }

  reasoningOpen.value = false;
  userScrolledUp.value = false;
  
  const ctxChatId = store.novels[novelIndex].id;
  // Snapshot the current pages into an independent buffer
  store.generatingContexts.set(ctxChatId, {
    abortController: currentAbortController,
    isWaitingFirstToken: true,
    isWaitingMainResponse: true,
    pages: [...store.pages],
    pageIndex: store.pages.length - 1,
    streamingReasoning: '',
    streamingMainResponse: ''
  });
  
  let currentResponse = '';
  let currentReasoning = '';

  // Build messages from the snapshot, not from store.pages (which can change if user switches chat)
  const ctx = store.generatingContexts.get(ctxChatId)!;
  const snapshotPages = [...ctx.pages];

  const messages = [];
  for (let i = 0; i < snapshotPages.length; i++) {
    const page = snapshotPages[i];
    const match = page.match(/^\[USER\]:\s*([\s\S]*?)\n\n([\s\S]*)$/);
    const fallbackMatch = page.match(/^\[USER\]:\s*([\s\S]*)$/);
    
    let uMsg = match ? match[1] : (fallbackMatch ? fallbackMatch[1] : '');
    let aMsg = match ? match[2] : '';

    // Prevent API 400 errors by skipping historical rounds that have no AI response
    if (i < snapshotPages.length - 1 && (!aMsg || aMsg.trim() === '')) {
      continue;
    }

    if (uMsg) {
      if (i === snapshotPages.length - 1) {
        // Last round (current request): extract embedded base64 (e.g. from retry) + attached images
        const imgTagRegex = /!\[.*?\]\((data:image\/[^)]+)\)/g;
        const embeddedImages: string[] = [];
        let m;
        while ((m = imgTagRegex.exec(uMsg)) !== null) {
          embeddedImages.push(m[1]);
        }
        
        const cleanUserMsg = uMsg.replace(imgTagRegex, '').trim();
        const allImages = [...embeddedImages];
        for (const img of imagesToSend) {
          if (!allImages.includes(img)) allImages.push(img);
        }

        if (allImages.length > 0) {
          const contentArr: any[] = [{ type: 'text', text: cleanUserMsg || '分析图片' }];
          for (const imgBase64 of allImages) {
            contentArr.push({ type: 'image_url', image_url: { url: imgBase64 } });
          }
          messages.push({ role: 'user', content: contentArr });
        } else {
          messages.push({ role: 'user', content: cleanUserMsg });
        }
      } else {
        // Historical rounds: Strip base64 to save tokens and avoid payload massive limits
        const cleanUserMsg = uMsg.replace(/!\[.*?\]\(data:image\/.*?;base64,[^\)]+\)/g, '[参考历史图片]').trim();
        messages.push({ role: 'user', content: cleanUserMsg });
      }
    }
    
    if (aMsg && aMsg.trim()) {
      messages.push({ role: 'assistant', content: aMsg.trim() });
    }
  }

  const { apiKey, baseUrl, model, customModel } = store.aiSettings;
  const actualModel = customModel || model || 'gpt-3.5-turbo';
  const isImg = isImageModel(actualModel);
  const url = `${baseUrl.replace(/\/$/, '')}/${isImg ? 'images/generations' : 'chat/completions'}`;

  try {
    if (isImg) {
      // Image Generation (Non-streaming)
      // Build payload
      const payload: any = {
        model: actualModel,
        prompt: input, 
        batch_size: 1,
        num_inference_steps: 20
      };

      // Qwen-Image-Edit models do NOT support image_size
      const isQwenEdit = actualModel.toLowerCase().includes('image-edit');
      if (!isQwenEdit) {
        payload.image_size = '1024x1024';
      }

      // guidance_scale is supported by most, but some might be picky
      payload.guidance_scale = 7.5;

      // Support Img2Img if an image is provided
      if (imagesToSend.length > 0) {
        // Most SiliconFlow models take the base64 string (often prefers without the data: prefix)
        const pureBase64 = imagesToSend[0].replace(/^data:image\/\w+;base64,/, '');
        payload.image = pureBase64;
        // Strength is not a standard parameter for SiliconFlow's generations endpoint, let's remove it to avoid 60000 error
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload),
        signal: signal
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText);
      }

      const data = await response.json();
      const contextObj = store.generatingContexts.get(ctxChatId);
      if (!contextObj) return;

      contextObj.isWaitingFirstToken = false;
      contextObj.isWaitingMainResponse = false;

      let imageMarkdown = '';
      if (data.images && data.images.length > 0) {
        // SiliconFlow returns 'images' array with 'url'
        imageMarkdown = data.images.map((img: any) => `![Generated Image](${img.url})`).join('\n\n');
      } else if (data.data && data.data.length > 0) {
        // Standard OpenAI format
        imageMarkdown = data.data.map((img: any) => `![Generated Image](${img.url || (img.b64_json ? `data:image/png;base64,${img.b64_json}` : '')})`).join('\n\n');
      }

      const finalDisplay = imageMarkdown || '未获取到生成的图片，请检查模型返回格式。';
      const newContent = `[USER]: ${finalInputText}\n\n${finalDisplay}`;
      
      contextObj.streamingMainResponse = finalDisplay;
      contextObj.pages[contextObj.pageIndex] = newContent;

      const isActiveChat = store.activeNovelIndex !== null && store.novels[store.activeNovelIndex]?.id === ctxChatId;
      if (isActiveChat) {
        store.pages[contextObj.pageIndex] = newContent;
        nextTick(() => { if (chatArea.value) chatArea.value.scrollTop = chatArea.value.scrollHeight; });
      }

      const finalFullContent = contextObj.pages.join('\n\n[PAGE_BREAK]\n\n');
      await ContentDB.save(ctxChatId, finalFullContent, 'ai');
      return;
    }

    // Chat / Vision Generation (Streaming)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: actualModel,
        messages: messages,
        stream: true
      }),
      signal: signal
    });

    if (!response.ok) {
        let errText = await response.text();
        try {
          const jsonErr = JSON.parse(errText);
          const msg = jsonErr.message || jsonErr.error?.message || '';
          if (msg) {
            if (msg.toLowerCase().includes('not a vlm') || msg.toLowerCase().includes('vision')) {
              errText = '当前模型不支持多模态识图，请仅发送文本，或在设置中配置带有 Vision 视觉能力的大模型。\n\n(原始报错: ' + msg + ')';
            } else {
              errText = msg;
            }
          }
        } catch (e) {
          // Keep raw text if not JSON
        }
        throw new Error(errText);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder('utf-8');
    if (!reader) throw new Error('No reader attached');

    let buffer = '';
    let lastAutoSaveTime = Date.now();
    
    // Throttled auto-save every 3 seconds to protect against page refresh
    const autoSaveIfNeeded = async () => {
      const now = Date.now();
      if (now - lastAutoSaveTime > 3000) {
        lastAutoSaveTime = now;
        const contextObj = store.generatingContexts.get(ctxChatId);
        if (contextObj) {
          const content = contextObj.pages.join('\n\n[PAGE_BREAK]\n\n');
          await ContentDB.save(ctxChatId, content, 'ai');
        }
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.trim() === 'data: [DONE]') continue;
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            if (data.choices && data.choices[0] && data.choices[0].delta) {
              const delta = data.choices[0].delta.content || '';
              const reasoningToken = data.choices[0].delta.reasoning_content || '';

              const contextObj = store.generatingContexts.get(ctxChatId);
              if (!contextObj) break;

              if ((delta || reasoningToken) && contextObj.isWaitingFirstToken) {
                contextObj.isWaitingFirstToken = false;
              }
              if (delta && contextObj.isWaitingMainResponse) {
                contextObj.isWaitingMainResponse = false;
              }
              
              if (reasoningToken) currentReasoning += reasoningToken;
              if (delta) currentResponse += delta;
              
              // Update live refs for Vue template rendering
              contextObj.streamingReasoning = currentReasoning;
              contextObj.streamingMainResponse = currentResponse;
              
              // Build the full content for storage
              let storedDisplay = '';
              if (currentReasoning) {
                storedDisplay += `
<details class="ai-reasoning">
  <summary>
    显示思路
  </summary>
  <div class="reasoning-body">
    ${currentReasoning}
  </div>
</details>
\n\n`;
              }
              storedDisplay += currentResponse;
              
              const newContent = `[USER]: ${finalInputText}\n\n${storedDisplay}`;
              // Write to the independent buffer
              contextObj.pages[contextObj.pageIndex] = newContent;
              
              // Only sync to store.pages if user is still viewing this chat
              const isActiveChat = store.activeNovelIndex !== null && store.novels[store.activeNovelIndex]?.id === ctxChatId;
              if (isActiveChat) {
                store.pages[contextObj.pageIndex] = newContent;
                nextTick(() => {
                  if (!userScrolledUp.value && chatArea.value) {
                    chatArea.value.scrollTop = chatArea.value.scrollHeight;
                  }
                });
              }
              
              // Periodically save to IndexedDB so refresh doesn't lose progress
              autoSaveIfNeeded();
            }
          } catch (e) {}
        }
      }
    }

    // Save from the buffer (which always has the correct data)
    const contextObj = store.generatingContexts.get(ctxChatId);
    if (contextObj) {
      const finalContent = contextObj.pages.join('\n\n[PAGE_BREAK]\n\n');
      await ContentDB.save(ctxChatId, finalContent, 'ai');
      
      // Update file size in novels list
      const novelInList = store.novels.find(n => n.id === ctxChatId);
      if (novelInList) novelInList.size = finalContent.length;
      store._saveNovelsMeta();
      
      // If user is viewing this chat, sync the final state
      const isActiveChat = store.activeNovelIndex !== null && store.novels[store.activeNovelIndex]?.name === ctxChatId;
      if (isActiveChat) {
        store.pages = [...contextObj.pages];
      }
    }

  } catch (err: any) {
    if (err.name === 'AbortError') return;
    store.showActionToast(`AI 请求异常`, '报错详情', () => {
      store.confirmDialog(err.message || String(err), '报错详情');
    });
  } finally {
    store.generatingContexts.delete(ctxChatId);
  }
}

function handleSendClick() {
  if (isActiveStreaming.value) {
    stopAiGeneration();
    return;
  }
  if (isListening.value) {
    toggleVoiceRecording();
    return;
  }
  if (!inputValue.value.trim() && attachedImages.value.length === 0) {
    toggleVoiceRecording();
    return;
  }
  handleInputSubmit();
}

function handleInputSubmit() {
  if (isListening.value) {
    toggleVoiceRecording();
  }
  
  const input = inputValue.value.trim();
  if (!input && attachedImages.value.length === 0) return;
  if (isAiGenerating.value) return;

  const pageNum = parseInt(input);
  if (!isNaN(pageNum) && store.activeNovelIndex !== null && !isDummyChat.value) {
    const target = pageNum - 1;
    if (target >= 0 && target < store.totalPages) {
      store.currentPage = target;
    } else {
      store.showToast(`页码超出范围 (1-${store.totalPages})`);
    }
    inputValue.value = '';
    return;
  }
  
  if (input === 'help' || input === '帮助') {
    store.showHelp = true;
    inputValue.value = '';
    return;
  } else if (input === 'home' || input === '首页') {
    store.activeId = null;
    inputValue.value = '';
    return;
  }

  // Handle AI Chat
  if (!store.aiSettings.apiKey) {
    store.showActionToast('尚未配置 API Key，无法使用 AI 问答能力', '立即设置', () => {
      store.showSettings = true;
      store.autoExpandAdvanced = true;
    });
    return;
  }

  inputValue.value = '';
  handleAiChat(input);
}

// Speech Recognition logic
const isListening = ref(false);
let recognition: any = null;
let savedTranscript = '';

function toggleVoiceRecording() {
  if (isListening.value) {
    if (recognition) recognition.stop();
    isListening.value = false;
    return;
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    store.showToast('您的浏览器不支持原生的语音识别 API，推荐使用 Chrome 浏览器');
    return;
  }

  if (!recognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => {
      isListening.value = true;
      savedTranscript = inputValue.value ? inputValue.value + ' ' : '';
      store.showToast('🎙️ 正在聆听...', 'info');
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let newlyFinal = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          newlyFinal += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      savedTranscript += newlyFinal;
      inputValue.value = savedTranscript + interimTranscript;
    };
    
    recognition.onerror = (e: any) => {
      store.showToast('语音识别异常: ' + e.error);
      isListening.value = false;
    };
    
    recognition.onend = () => {
      isListening.value = false;
    };
  }
  
  recognition.start();
}

// File loading logic
const fileInput = ref<HTMLInputElement | null>(null);

function triggerFileInput() {
  if (fileInput.value) fileInput.value.click();
}

async function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  const files = Array.from(target.files || []);
  await processFiles(files);
  target.value = '';
}

async function handleDrop(e: DragEvent) {
  isDragging.value = false;
  const files = Array.from(e.dataTransfer?.files || []);
  if (files.length > 0) {
    await processFiles(files);
  }
}

async function processFiles(files: File[]) {
  if (files.length === 0) return;

  let validNovelFound = false;
  let firstNovelIndex = -1;

  for (const file of files) {
    // 1. Process Images (as attachments)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result && typeof ev.target.result === 'string') {
          attachedImages.value.push(ev.target.result);
        }
      };
      reader.readAsDataURL(file);
      validNovelFound = true;
      continue;
    }

    // 2. Process TXT (as new novel/chat)
    if (!file.name.toLowerCase().endsWith('.txt')) {
      store.showActionToast(`文件 ${file.name} 已读取，当前大模型正在测试并接入多媒体文件内测功能，暂不开放上传`, '知道了', () => {});
      continue;
    }

    validNovelFound = true;
    try {
      const content = await readFileWithEncoding(file, store.encoding);
      const newId = store.generateUid();
      
      // 去掉书名号并移除 .txt 后缀作为显示名
      const cleanDisplayName = file.name
        .replace(/\.txt$/i, '')
        .replace(/[《》]/g, '');

      store.novels.push({
        id: newId,
        type: 'works',
        name: file.name,
        size: file.size,
        lastRead: Date.now(),
        currentPage: 0,
        displayName: cleanDisplayName
      });
      
      await ContentDB.save(newId, content, 'works', file.name);
      store._saveNovelsMeta();
      
      const newIndex = store.novels.length - 1;
      if (firstNovelIndex === -1) {
        firstNovelIndex = newIndex;
      }
    } catch (err) {
      console.error('加载失败:', err);
      store.showToast('加载失败: ' + file.name);
    }
  }

  if (firstNovelIndex >= 0) {
    await store.openNovel(firstNovelIndex);
  }
}

function openRecent() {
  if (store.novels.length > 0) {
    store.openNovel(0);
  } else {
    store.showToast('暂无阅读记录');
  }
}

function readFileWithEncoding(file: File, forcedEncoding: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;

      if (forcedEncoding && forcedEncoding !== 'auto') {
        try {
          const text = new TextDecoder(forcedEncoding).decode(buffer);
          resolve(text);
        } catch (err) {
          reject(err);
        }
        return;
      }

      const bytes = new Uint8Array(buffer);
      if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
        resolve(new TextDecoder('utf-8').decode(buffer));
        return;
      }
      if (bytes[0] === 0xFF && bytes[1] === 0xFE) {
        resolve(new TextDecoder('utf-16le').decode(buffer));
        return;
      }
      if (bytes[0] === 0xFE && bytes[1] === 0xFF) {
        resolve(new TextDecoder('utf-16be').decode(buffer));
        return;
      }

      const utf8Text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
      const replacementCount = (utf8Text.match(/\uFFFD/g) || []).length;
      if (replacementCount === 0) {
        resolve(utf8Text);
        return;
      }

      try {
        const gbkText = new TextDecoder('gbk', { fatal: false }).decode(buffer);
        resolve(gbkText);
      } catch (err) {
        resolve(utf8Text);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function copyToClipboard(index?: number) {
  let text = '';
  if (typeof index === 'number' && isDummyChat.value) {
    text = store.pages[index] || '';
  } else {
    text = store.pages[store.currentPage] || '';
  }
  navigator.clipboard.writeText(text).then(() => {
     store.showToast('已添加到剪贴板');
  }).catch(() => store.showToast('复制失败'));
}

// Global shortkeys
async function handleKeydown(e: KeyboardEvent) {
  const isInput = (e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA';
  if (isInput) return;

  // Boss key check
  if (store.settings.bossKeys.includes(e.key)) {
    e.preventDefault();
    const wasBossMode = store.bossMode;
    await store.toggleBossMode();
    
    // Achievement Logic: show toast when switching BACK from first-time boss mode
    if (wasBossMode && !store.bossMode && !store.settings.bossModeUnlocked && store.activeNovelIndex !== null) {
      const activeNovel = store.novels[store.activeNovelIndex];
      const isReadingWork = activeNovel && activeNovel.type === 'works';
      
      if (isReadingWork) {
        store.settings.bossModeUnlocked = true;
        store.showActionToast('达成成就：BOSS 关怀！相关的进阶选项已解锁。', '立即查看', () => {
          store.showSettings = true;
          store.autoExpandAdvanced = true;
          store.isNewAchievement = true;
          nextTick(() => {
            setTimeout(() => {
              const el = document.getElementById('achievement-section');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => { store.isNewAchievement = false; }, 2000);
            }, 500);
          });
        });
      }
    }
    return;
  }
  
  if (store.bossMode) return;
  
  const key = e.key;
  const isScrollUp = store.settings.scrollUpKeys?.includes(key);
  const isScrollDown = store.settings.scrollDownKeys?.includes(key);
  const isPrev = store.settings.prevPageKeys?.includes(key);
  const isNext = store.settings.nextPageKeys?.includes(key) || (key === ' ' && !isInput);

  if ((isScrollUp || isScrollDown) && store.activeNovelIndex !== null && chatArea.value) {
    e.preventDefault();
    const scrollAmount = 140;
    chatArea.value.scrollBy({
      top: isScrollUp ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
    return;
  }

  if (isPrev && store.activeNovelIndex !== null) {
    e.preventDefault();
    store.prevPage();
    return;
  }
  
  if (isNext && store.activeNovelIndex !== null) {
    e.preventDefault();
    store.nextPage();
    return;
  }

  switch (key) {
    case 'Escape':
      // The boss key check happens above, so if Escape is a boss key, it toggles bossMode.
      // If it's NOT a boss key, it closes other things.
      store.showHelp = false;
      store.showSettings = false;
      store.showToc = false;
      break;
  }
}

async function handleGlobalClick(e: MouseEvent) {
  // Handle image preview
  const target = e.target as HTMLElement;
  if (target.tagName === 'IMG' && (target.closest('.html-wrapper') || target.closest('.user-img-row'))) {
    previewImageUrl.value = (target as HTMLImageElement).src;
    return;
  }

  if (store.settings.tripleClickBossKey && e.detail === 3) {
    const wasBossMode = store.bossMode;
    await store.toggleBossMode();
    
    // Achievement Logic: show toast when switching BACK from first-time boss mode
    if (wasBossMode && !store.bossMode && !store.settings.bossModeUnlocked && store.activeNovelIndex !== null) {
      const activeNovel = store.novels[store.activeNovelIndex];
      const isReadingWork = activeNovel && !activeNovel.name.startsWith('dummy_') && !activeNovel.name.startsWith('ai_');

      if (isReadingWork) {
        store.settings.bossModeUnlocked = true;
        store.showActionToast('达成成就：BOSS 关怀！相关的进阶选项已解锁。', '立即查看', () => {
          store.showSettings = true;
          store.autoExpandAdvanced = true;
          store.isNewAchievement = true;
          nextTick(() => {
            setTimeout(() => {
              const el = document.getElementById('achievement-section');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => { store.isNewAchievement = false; }, 2000);
            }, 500);
          });
        });
      }
    }
  }
}

function handleChatScroll() {
  if (!isAiGenerating.value || !chatArea.value) return;
  const el = chatArea.value;
  // If user is within 80px of the bottom, consider them "at bottom" and re-enable auto-scroll
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  userScrolledUp.value = !atBottom;
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('click', handleGlobalClick);
  document.addEventListener('click', closeDropdown);
  nextTick(() => {
    if (chatArea.value) {
      chatArea.value.addEventListener('scroll', handleChatScroll);
    }
  });
});
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.removeEventListener('click', handleGlobalClick);
  document.removeEventListener('click', closeDropdown);
  if (chatArea.value) {
    chatArea.value.removeEventListener('scroll', handleChatScroll);
  }
});

const chatArea = ref<HTMLElement | null>(null);



// Watch current page to sync state
watch(() => store.currentPage, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    if (store.activeNovelIndex !== null) {
      store.novels[store.activeNovelIndex].currentPage = newVal;
      store._saveNovelsMeta();
    }
    
    // Reset scroll to top when page changes
    if (chatArea.value) {
      chatArea.value.scrollTop = 0;
    }
  }
});

// When user navigates back to the generating chat, re-sync from buffer
watch(() => store.activeNovelIndex, (newIdx) => {
  if (newIdx !== null && store.novels[newIdx]) {
    const chatId = store.novels[newIdx].id;
    if (store.generatingContexts.has(chatId)) {
      const ctx = store.generatingContexts.get(chatId);
      if (ctx && ctx.pages.length > 0) {
        store.pages = [...ctx.pages];
        store.totalPages = store.pages.length;
        store.currentPage = store.pages.length - 1;
      }
    }
  }
});

</script>

<style scoped lang="less">
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background-color: var(--bg-primary);
  transition: background-color 0.3s;
}

/* Top bar */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--topbar-height);
  min-height: var(--topbar-height);
  padding: 0 16px;
  position: relative;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0; // Required for text-overflow to work on children
}

.sidebar-toggle-btn {
  display: flex;
}

.top-logo {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
  letter-spacing: -0.3px;
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  margin: 0 4px 0 8px;
}



.top-bar-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.top-btn {
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition-speed);

  &:hover {
    background: var(--bg-surface-hover);
  }
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--sparkle-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  color: white;
  cursor: pointer;
  margin-left: 4px;
}

.avatar-dropdown-wrapper {
  position: relative;
}

.avatar-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 260px;
  background-color: var(--bg-modal);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  z-index: 2000;
  animation: dropdownFadeIn 0.2s ease;
}

@keyframes dropdownFadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
}

.dropdown-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--sparkle-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  font-weight: 500;
  flex-shrink: 0;
}

.dropdown-user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.dropdown-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-plan {
  font-size: 13px;
  color: var(--text-muted);
}

.dropdown-divider {
  height: 1px;
  background-color: var(--border-color);
  margin: 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  width: 100%;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition: background-color var(--transition-speed);
  text-align: left;

  &:hover {
    background-color: var(--bg-surface-hover);
  }
  
  &:last-of-type {
    border-radius: 0 0 var(--radius-md) var(--radius-md);
  }

  .material-symbols-outlined {
    font-size: 20px;
    color: var(--text-secondary);
  }
}


/* Chat */
.chat-area {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  scroll-behavior: smooth;
}

/* Welcome */
.welcome-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 40px 20px;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.welcome-gradient-text {
  font-size: 44px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--gradient-start), var(--gradient-mid), var(--gradient-end));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}

.welcome-subtitle {
  font-size: 44px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 48px;
}

.welcome-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  max-width: 720px;
  width: 100%;
}

.welcome-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
  padding: 16px;
  border-radius: var(--radius-md);
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: background-color var(--transition-speed), transform var(--transition-speed);
  min-height: 120px;

  &:hover {
    background-color: var(--bg-surface-hover);
    transform: translateY(-2px);
  }

  .card-icon {
    font-size: 24px;
    padding: 8px;
    border-radius: 12px;
  }

  .card-text {
    font-size: 14px;
    color: var(--text-primary);
    line-height: 1.4;
  }
}

/* Gemini specific Welcome Layout */
.main-content.gemini-welcome-layout {
  .chat-area {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    flex: none;
    margin-top: auto;
    overflow: visible;
    padding-bottom: 0;
  }
  
  .welcome-screen {
    padding: 0 0 32px 0;
    width: 100%;
    max-width: 820px;
    flex: none;
    align-items: flex-start;
  }
  
  .input-area {
    flex: none;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
    margin-bottom: auto;
    padding-top: 0;
  }

  .input-container {
    width: 100%;
    max-width: 820px;
  }
  
  .gemini-suggestion-chips {
    max-width: 820px;
  }
}

.gemini-greeting {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding-left: 16px;
  margin-bottom: 12px;
}

.greeting-h1 {
  font-size: 32px;
  font-weight: 500;
  line-height: 1.3;
  margin: 0;
  letter-spacing: -0.2px;
}

.greeting-name {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.gemini-welcome-sparkle img {
  vertical-align: middle;
  margin-top: -4px;
}

.greeting-text {
  color: var(--text-primary);
}

.greeting-subtitle {
  color: var(--text-secondary);
  font-size: 32px;
  font-weight: 500;
  margin-top: 4px;
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
  white-space: nowrap;

  &:hover {
    background-color: var(--bg-surface-hover);
  }
  
  .material-symbols-outlined {
    font-size: 20px;
  }
}

/* Reading */
.reading-content-layout {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  gap: 32px;
}

.reading-content {
  flex: 1;
  max-width: 768px;
  width: 100%;
  padding: 20px 0 40px 0;
  animation: fadeIn 0.4s ease;
  transition: opacity 0.15s ease;

  &.page-fade-out {
    opacity: 0.3;
    pointer-events: none;
  }

  &.page-fade-in {
    animation: pageFadeIn 0.25s ease;
  }
}

@keyframes pageFadeIn {
  from { opacity: 0.3; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.fake-sidebar {
  width: 260px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  max-height: calc(100vh - 240px);
  padding: 20px 0;
  user-select: none;
  opacity: 0.85;
  display: flex;
  flex-direction: column;
}

.fake-sidebar-inner {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow-y: auto;
  pointer-events: auto;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--border-color);
    border-radius: 4px;
  }
}

.fake-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;

  &.has-title {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--border-color);
    &:first-child { 
       margin-top: 0; 
       padding-top: 0;
       border-top: none; 
    }
  }
}

.fake-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}

.fake-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--accent);
  opacity: 0.6;
  flex-shrink: 0;
}

.fake-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.user-message {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  padding: 0 0 16px 0;
}

.user-img-row {
  display: flex;
  flex-direction: row;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.user-img-row img {
  width: 160px;
  height: 160px;
  border-radius: 12px;
  object-fit: cover;
  display: block;
}

/* Tooltip styling for copy button */
.copy-tooltip {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--bg-surface-active);
  color: var(--text-primary);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
  white-space: nowrap;
}

.copy-btn-wrapper {
  position: relative;
}

.copy-btn-wrapper:hover .copy-tooltip {
  opacity: 1;
}

/* AI loading and breathing animations */
.breathing {
  animation: breathing 1.5s infinite ease-in-out;
}
@keyframes breathing {
  0% { transform: scale(1); opacity: 1; filter: brightness(1); }
  50% { transform: scale(1.15); opacity: 0.8; filter: brightness(1.2); }
  100% { transform: scale(1); opacity: 1; filter: brightness(1); }
}

.thinking-loading {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding-left: 4px;
}
.thinking-loading span {
  width: 6px;
  height: 6px;
  background-color: var(--text-muted);
  border-radius: 50%;
  animation: waiting-bounce 1.4s infinite ease-in-out both;
}
.thinking-loading span:nth-child(1) { animation-delay: -0.32s; }
.thinking-loading span:nth-child(2) { animation-delay: -0.16s; }
@keyframes waiting-bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.user-msg-bubble {
  background-color: var(--bg-surface);
  color: var(--text-primary);
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  font-size: 15px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.user-msg-bubble {
  background-color: var(--bg-surface);
  color: var(--text-primary);
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  font-size: 15px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

::v-deep(.user-msg-bubble p:last-child) {
  margin-bottom: 0;
}

::v-deep(.user-msg-bubble p:first-child) {
  margin-top: 0;
}

/* AI deep thinking logic matching Gemini */
::v-deep(.ai-reasoning) {
  margin: 2px 0 16px 0;
  background: transparent;
}

::v-deep(.ai-reasoning summary) {
  cursor: pointer;
  color: var(--text-primary);
  font-size: 14px;
  user-select: none;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 0px;
  list-style: none; /* Hide default triangle */
}
::v-deep(.ai-reasoning summary::-webkit-details-marker) {
  display: none;
}
::v-deep(.ai-reasoning summary:hover) {
  opacity: 0.8;
}

::v-deep(.ai-reasoning summary::after) {
  content: '';
  display: inline-block;
  width: 10px;
  height: 6px;
  background-color: currentColor;
  clip-path: polygon(0 0, 100% 0, 50% 100%);
  margin-left: 4px;
  transition: transform 0.2s;
}
::v-deep(.ai-reasoning[open] summary::after) {
  transform: rotate(180deg);
}

::v-deep(.ai-reasoning .reasoning-body) {
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

.ai-response {
  display: flex;
  gap: 16px;
  padding: 0;
}

.ai-avatar {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  margin-top: 2px;
}

.ai-text {
  flex: 1;
  /* min-width:0 是 flex 子项防止内容撑破容器的关键 */
  min-width: 0;
  /* 封堵超宽内容向父级的宽度泄漏，code-block 的 overflow-x:auto 才能生效 */
  overflow-x: hidden;
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-primary);
  word-wrap: break-word;

  :deep(p) {
    margin-bottom: 12px;
  }
  
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
  
  :deep(li) {
    margin-bottom: 6px;
  }

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
    
    p:last-child {
      margin-bottom: 0;
    }
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
}

.response-actions {
  display: flex;
  gap: 4px;
  padding-left: 44px;
  margin-top: 4px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--transition-speed), color var(--transition-speed);

  &:hover {
    background-color: var(--bg-surface-hover);
    color: var(--text-secondary);
  }

  .material-symbols-outlined {
    font-size: 18px;
  }
}

/* AI sparkle icon */
.ai-sparkle {
  width: 28px;
  height: 28px;
  background: var(--sparkle-bg);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  &::after {
    content: '✦';
    color: white;
    font-size: 16px;
  }
}

/* Page nav */
.page-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 20px 0 10px 0;
  margin-left: 44px;
}

.page-nav-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all var(--transition-speed);

  &:hover {
    background-color: var(--bg-surface-hover);
    color: var(--text-primary);
    border-color: var(--border-color-light);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .material-symbols-outlined {
    font-size: 18px;
  }
}

.page-info {
  font-size: 13px;
  color: var(--text-muted);
}

/* Input */
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
}

@keyframes dragPulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(var(--accent-rgb, 138, 180, 248), 0.4); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(var(--accent-rgb, 138, 180, 248), 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(var(--accent-rgb, 138, 180, 248), 0); }
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
}
.attached-image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  border: none;
  font-size: 14px;
  cursor: pointer;
  line-height: 1;
}
.remove-img-btn:hover {
  background: rgba(0,0,0,0.8);
}

.input-container {
  width: 100%;
  max-width: 768px;
  background-color: var(--bg-surface);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  transition: border-color var(--transition-speed), box-shadow var(--transition-speed), background-color 0.3s;
  overflow: hidden;

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
    }

    .send-btn {
      background: transparent;
      &.has-text {
        background: transparent;
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
      
      &.has-text {
        background: var(--text-primary);
      }
      
      &:hover {
        background: var(--text-muted);
      }
    }
  }

  &.default-wrapper {
    flex-direction: row;
  }
}

.chat-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 16px;
  font-family: inherit;
  outline: none;
  padding: 8px 0;
  min-width: 0;

  &::placeholder {
    color: var(--text-muted);
  }
}

.input-actions-inline {
  display: flex;
  align-items: center;
  gap: 2px;
}

.input-icon {
  width: 36px;
  height: 36px;

  .material-symbols-outlined {
    font-size: 20px;
  }
}

.input-right-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 4px;
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

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--bg-surface-hover);

  &:hover {
    background-color: var(--bg-surface-active);
  }
}

.input-disclaimer {
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
  padding-top: 8px;

  :deep(a) {
    color: var(--text-link);
    text-decoration: none;
  }
}

/* Scroll mode */
.scroll-load-more {
  display: flex;
  justify-content: center;
  padding: 24px 0 12px 0;
  margin-left: 44px;
}

.scroll-load-more-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 28px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition: all var(--transition-speed);

  &:hover {
    border-color: var(--accent);
    color: var(--accent);
    background-color: rgba(138, 180, 248, 0.06);
  }

  .material-symbols-outlined {
    font-size: 18px;
  }
}

.scroll-divider {
  text-align: center;
  padding: 16px 0;
  margin-left: 44px;
  color: var(--text-muted);
  font-size: 12px;
  border-top: 1px dashed var(--border-color);
  margin-top: 24px;
}



@media (max-width: 1024px) {
  .top-btn-extra { display: none; }
}

@media (max-width: 900px) {
  .sidebar-toggle-btn { display: flex; }
  .welcome-cards { grid-template-columns: repeat(2, 1fr); }
  .welcome-gradient-text, .welcome-subtitle { font-size: 28px; }
  .top-logo { font-size: 16px; }
}

@media (max-width: 720px) {
  .top-btn {
    font-size: 11px;
    padding: 4px 8px;
  }
}


@media (max-width: 600px) {
  .welcome-cards { grid-template-columns: 1fr; }
  .chat-area { padding: 0 12px; }
  .input-area { padding: 8px 12px 12px 12px; }
}

.wasteland-view {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  animation: fadeIn 0.6s ease-out;
}

.wasteland-content {
  max-width: 500px;
}

.wasteland-icon-wrap {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-surface);
  border-radius: 50%;
  color: var(--text-muted);
  
  span {
    font-size: 40px;
  }
}

.wasteland-title {
  font-size: 24px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.wasteland-desc {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.8;
  margin-bottom: 32px;
}

.wasteland-btn {
  background: var(--text-primary);
  color: var(--bg-primary);
  border: none;
  padding: 10px 24px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* AI Code Block Styles */
.ai-text {
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
    /* 限制 pre 不超过父容器宽度，横向超长内容在 pre 内滚动 */
    max-width: 100%;
    overflow-x: auto;
    overflow-y: visible;
    /* 显式锁定行高，防止继承外层 lineHeight 设置 */
    line-height: 1.6 !important;
    background: transparent;
    /* 保持代码不折行 */
    white-space: pre;
    /* 自定义滚动条风格 */
    &::-webkit-scrollbar {
      height: 5px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.15);
      border-radius: 4px;
    }
    &::-webkit-scrollbar-thumb:hover {
      background: rgba(255,255,255,0.3);
    }
  }
  :deep(pre code) {
    font-size: 13px;
    line-height: 1.6 !important;
    font-family: 'Fira Code', 'JetBrains Mono', 'Consolas', monospace;
    background: transparent;
    white-space: pre;
    /* block 而非 inline-block，让 pre 完整控制宽度与滚动 */
    display: block;
  }
  /* 消除 breaks:true 意外插入的 br 带来的额外空行（双重保险） */
  :deep(pre br) {
    display: none;
  }
  /* highlight.js 语法着色 token 覆盖 */
  :deep(.hljs) {
    background: transparent;
    color: #c9d1d9;
  }
  :deep(.hljs-keyword)    { color: #ff7b72; }
  :deep(.hljs-string)     { color: #a5d6ff; }
  :deep(.hljs-comment)    { color: #8b949e; font-style: italic; }
  :deep(.hljs-number)     { color: #79c0ff; }
  :deep(.hljs-built_in)   { color: #ffa657; }
  :deep(.hljs-function),
  :deep(.hljs-title)      { color: #d2a8ff; }
  :deep(.hljs-type)       { color: #ffa657; }
  :deep(.hljs-variable),
  :deep(.hljs-attr)       { color: #c9d1d9; }
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

  :deep(strong) {
    font-weight: 600;
    color: var(--text-primary);
  }
}

.dev-quick-settings-btn {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 80px;
  background: var(--bg-surface);
  border: 1px dashed var(--text-muted);
  border-right: none;
  border-radius: 8px 0 0 8px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  cursor: pointer;
  opacity: 0.3;
  transition: opacity 0.2s, background 0.2s, color 0.2s;
}

.dev-quick-settings-btn:hover {
  opacity: 1;
  background: var(--bg-surface-hover);
  color: var(--text-primary);
}

/* Image Preview Modal */
.image-preview-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  cursor: zoom-out;
  animation: modalFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.preview-full-img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
  cursor: default;
}

.preview-close-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
  }
}

@keyframes modalFadeIn {
  from { opacity: 0; transform: scale(1.02); }
  to { opacity: 1; transform: scale(1); }
}
</style>
