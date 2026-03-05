<template>
  <main class="main-content" :class="{
    'center-input-layout': (store.style === 'gemini' || store.style === 'chatgpt') && store.activeNovelIndex === null && !store.showWasteland,
    'chatgpt-home-shift': store.style === 'chatgpt' && store.activeNovelIndex === null && !store.showWasteland
  }">
    <!-- Top Bar -->
    <ReaderHeader />

    <!-- Chat Content Area -->
    <div class="chat-area" 
         ref="chatArea"
         @scroll="handleScroll"
         @dragover.prevent="isDragging = true"
         @dragleave.prevent="isDragging = false"
         @drop.prevent="onDrop">
      
      <!-- Wasteland View -->
      <WastelandView v-if="store.showWasteland" />

      <!-- Welcome Screen -->
      <WelcomeScreen 
           v-else-if="store.activeNovelIndex === null"
           @trigger-file="triggerFileInput"
           @dragover.prevent="isDragging = true"
           @dragleave.prevent="isDragging = false"
           @drop.prevent="onDrop" />

      <!-- Reading Content -->
      <div class="reading-content-layout" v-else>
        <div class="reading-content">
          <ChatMessage 
            v-for="(pageContent, index) in pagesToRender" 
            :key="isDummyChat ? `dummy-${index}` : `page-${store.settings.readingMode === 'scroll' ? renderedScrollPages[index] : store.currentPage}`"
            :content="pageContent"
            :index="index"
            :totalItems="pagesToRender.length"
            :isLast="index === pagesToRender.length - 1"
            :isDummyChat="isDummyChat"
            :chatTitle="chatTitle"
            :isActiveStreaming="isActiveStreaming"
            :isAiWaitingFirstToken="isAiWaitingFirstToken"
            :isAiWaitingMainResponse="isAiWaitingMainResponse"
            :streamingReasoning="streamingReasoning"
            :streamingMainResponse="streamingMainResponse"
            :useTypewriterEffect="useTypewriterEffect"
            :typewriterHtml="typewriterHtml"
            :bossStreamActive="bossStreamActive"
            :bossStreamHtml="bossStreamHtml"
            :bossStreamPageIndex="bossStreamPageIndex"
            @copy="copyToClipboard"
            @jump="jumpPage"
            @regenerate="handleRegenerate"
            @export="handleExport"
            @edit="handleEdit"
          />
        </div>

        <!-- BOSS 侧边栏 (Right) -->
        <BossSidebar v-if="shouldShowFakeSidebar" />
      </div>
    </div>

    <!-- Bottom Input Bar -->
    <ReaderInput 
      v-if="!store.showWasteland"
      v-model="inputValue"
      :isDragging="isDragging"
      :attachedImages="attachedImages"
      :isListening="isListening"
      :isAiGenerating="isAiGenerating"
      :isActiveStreaming="isActiveStreaming"
      @submit="handleInputSubmit"
      @send-click="handleSendClick"
      @trigger-file="triggerFileInput"
      @dragover="isDragging = true"
      @dragleave="isDragging = false"
      @drop="onDrop"
    />
    
    <input type="file" ref="fileInput" accept="*" style="display:none" multiple @change="handleFileSelect">
    
    <!-- Dev Only: Mock New User Button -->
    <button v-if="isDev" class="dev-mock-new-user-btn" @click="mockNewUserEffect" title="[DEV] 模拟新用户 +1">
      <icon-material-symbols-group-add />
    </button>

    <!-- Dev Only: Quick Reading Settings Button -->
    <button v-if="isDev" class="dev-quick-settings-btn" @click="openDevReadingSettings" title="[DEV] 快速调试排版配置">
      <icon-material-symbols-settings />
    </button>

    <!-- Dev Only: Clear All Data -->
    <button v-if="isDev" class="dev-clear-data-btn" @click="devClearData" title="[DEV] 一键强制洗白所有数据(含设备指纹)">
      <icon-material-symbols-delete-sweep />
    </button>
    
    <!-- Dev Only: Clear Read Count -->
    <button v-if="isDev" class="dev-clear-read-btn" @click="store.devClearReadCount" title="[DEV] 一键清除阅读字数">
      <icon-material-symbols-restore-page />
    </button>

    <!-- Image Preview Modal -->
    <ImagePreviewModal v-model="previewImageUrl" />
  </main>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useAppStore } from '@/store/appStore';
import { STYLE_CONFIG } from '@/config/constants';

// Internal Components
import ReaderHeader from './Reader/ReaderHeader.vue';
import WastelandView from './Reader/WastelandView.vue';
import WelcomeScreen from './Reader/WelcomeScreen.vue';
import ChatMessage from './Reader/ChatMessage.vue';
import ReaderInput from './Reader/ReaderInput.vue';
import BossSidebar from './Reader/BossSidebar.vue';
import ImagePreviewModal from './Reader/ImagePreviewModal.vue';

// Composables & Utils
import { useAiChat } from '@/composables/useAiChat';
import { useSpeech } from '@/composables/useSpeech';
import { useFileProcessor } from '@/composables/useFileProcessor';
import { useTypewriter } from '@/composables/useTypewriter';
import { useBossStream } from '@/composables/useBossStream';
import { apiFetch } from '@/utils/request';

const store = useAppStore();
const isDev = (import.meta as any).env?.DEV;
const chatArea = ref<HTMLElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const inputValue = ref('');
const attachedImages = ref<string[]>([]);
const previewImageUrl = ref<string | null>(null);

// Computed logic
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
const shouldShowFakeSidebar = computed(() => {
  if (!store.settings.showFakeSidebar) return false;
  const types: string[] = store.settings.fakeSidebarShowForTypes || ['works', 'fake'];
  if (store.activeNovelIndex === null) return false;
  const novel = store.novels[store.activeNovelIndex];
  if (!novel) return false;
  return types.includes(novel.type);
});

// use Composables
const { 
  isAiGenerating, isActiveStreaming, isAiWaitingFirstToken, isAiWaitingMainResponse,
  streamingReasoning, streamingMainResponse, userScrolledUp,
  handleAiChat, stopAiGeneration 
} = useAiChat(attachedImages, chatArea);

const { isListening, toggleVoiceRecording } = useSpeech(inputValue);
const { isDragging, processFiles } = useFileProcessor(attachedImages);
const { typewriterHtml, useTypewriterEffect, startTypewriter, stopTypewriter } = useTypewriter(isDummyChat, chatTitle);
const { bossStreamActive, bossStreamHtml, bossStreamPageIndex, startBossStream, stopBossStream } = useBossStream(chatArea, isDummyChat, chatTitle);

// Local methods
function triggerFileInput() {
  if (fileInput.value) fileInput.value.click();
}

async function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  const files = Array.from(target.files || []);
  await processFiles(files);
  target.value = '';
}

async function onDrop(e: DragEvent) {
  isDragging.value = false;
  const files = Array.from(e.dataTransfer?.files || []);
  if (files.length > 0) {
    await processFiles(files);
  }
}

function openDevReadingSettings() {
  store.autoExpandReading = true;
  store.showSettings = true;
}

async function mockNewUserEffect() {
  try {
    const deviceId = await store.ensureDeviceId();
    const infoRes = await apiFetch(`/api/invite/info?deviceId=${deviceId}`);
    const infoData = await infoRes.json();
    
    if (!infoData.inviteCode) {
      store.showToast('无法获取您的邀请码');
      return;
    }

    const mockDeviceId = 'mock_' + Math.random().toString(36).substring(2, 10);

    const useRes = await apiFetch('/api/invite/use', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode: infoData.inviteCode, deviceId: mockDeviceId })
    });
    
    const useData = await useRes.json();
    if (useData.error) {
       store.showToast('❌ 模拟失败: ' + useData.error);
       return;
    }

    await apiFetch('/api/invite/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: mockDeviceId })
    });

    store.showToast('✅ 成功模拟 1 名新用户完成邀请任务！(重新打开排版侧栏查看最新进度)');
  } catch (err: any) {
    store.showToast('❌ 模拟失败: ' + err.message);
  }
}

const renderedScrollPages = ref<number[]>([]);

watch(() => store.currentPage, (newPage) => {
  if (store.settings.readingMode === 'scroll') {
    if (renderedScrollPages.value[renderedScrollPages.value.length - 1] !== newPage && 
        renderedScrollPages.value[0] !== newPage) {
      renderedScrollPages.value = [newPage];
    }
  } else {
    renderedScrollPages.value = [newPage];
  }
}, { immediate: true });

watch(() => store.activeNovelIndex, () => {
    if (store.currentPage !== undefined) {
      renderedScrollPages.value = [store.currentPage];
    }
    stopBossStream();
    if (!isDummyChat.value) startTypewriter();
}, { immediate: true });

function handleScroll(e: Event) {
  const target = e.target as HTMLElement;
  if (store.settings.readingMode === 'scroll' && !isDummyChat.value && store.activeNovelIndex !== null) {
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 400) {
      const lastRendered = renderedScrollPages.value[renderedScrollPages.value.length - 1];
      if (lastRendered !== undefined && lastRendered < store.totalPages - 1) {
        const next = lastRendered + 1;
        if (!renderedScrollPages.value.includes(next)) {
          renderedScrollPages.value.push(next);
          store.currentPage = next;
          store._syncNovelPage();
        }
      }
    }
  }
}

const pagesToRender = computed(() => {
  // Dependency tracking for reactive re-render on settings change
  const _deps = [
    store.settings.showNovelTitle,
    store.settings.showChapterName,
    store.settings.secondaryRenderMergeParagraphs,
    store.settings.secondaryRenderMergeCount,
    store.settings.secondaryRenderIndent,
    store.settings.secondaryRenderObfuscationMode,
    store.settings.secondaryRenderEnablePunctuation,
    store.settings.secondaryRenderRemovePunctuation,
    store.settings.secondaryRenderEnableReplace,
    store.settings.secondaryRenderReplaceDict
  ];

  if (store.activeNovelIndex === null) return [];
  if (isDummyChat.value) {
    if (store.bossMode && store.settings.bossKeyStreamTurn !== 'last') {
      return [store.pages[0] || ''];
    }
    return store.pages;
  }
  if (store.settings.readingMode === 'scroll') {
    return [renderedScrollPages.value.map(idx => store.pages[idx] || '').join('\n\n')];
  }
  return [store.pages[store.currentPage] || ''];
});

// Watch for store signal to trigger file selection
watch(() => store.triggerSystemFileSignal, () => {
    triggerFileInput();
});

// Methods exported to template
async function jumpPage() {
  if (store.settings.readingMode === 'scroll') return;
  const inputStr = await store.promptDialog(`请输入页码 (1 - ${store.totalPages})`, String(store.currentPage + 1), '页码数字...', '页码跳转');
  if (inputStr) {
    let pg = parseInt(inputStr.trim());
    if (!isNaN(pg)) {
      pg = pg - 1;
      if (pg < 0) pg = 0;
      if (pg >= store.totalPages) pg = store.totalPages - 1;
      store.currentPage = pg;
    }
  }
}

function handleExport(index: number, format: 'md' | 'txt', content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const name = store.novels[store.activeNovelIndex!]?.displayName || 'export';
  a.download = `${name}_round_${index + 1}.${format}`;
  a.click();
}

async function handleEdit(index: number, newFullContent: string) {
  store.pages[index] = newFullContent;
  store._syncNovelPage();
  if (store.activeNovelIndex !== null) {
    const chatId = store.novels[store.activeNovelIndex].id;
    const type = store.novels[store.activeNovelIndex].type;
    const finalContent = store.pages.join('\n\n[PAGE_BREAK]\n\n');
    const { ContentDB } = await import('@/utils/db');
    await ContentDB.save(chatId, finalContent, type);
    const novelInList = store.novels.find(n => n.id === chatId);
    if (novelInList) novelInList.size = finalContent.length;
    store._saveNovelsMeta();
  }
}

async function handleRegenerate(index: number) {
  if (!isDummyChat.value) return;
  const content = store.pages[index] || '';
  const match = content.match(/^\[USER\]:\s*([\s\S]*?)\n\n([\s\S]*)$/);
  const fallbackMatch = content.match(/^\[USER\]:\s*([\s\S]*)$/);
  let uMsg = match ? match[1] : (fallbackMatch ? fallbackMatch[1] : '');
  
  if (!uMsg) return;

  if (index < store.pages.length - 1) {
    const ok = await store.confirmDialog('重新生成将会丢弃此回合之后的对话记录，是否继续？', '重新生成');
    if (!ok) return;
  }
  
  store.pages = store.pages.slice(0, index);
  store.totalPages = store.pages.length;
  store.currentPage = Math.max(0, store.pages.length - 1);
  store._syncNovelPage();
  
  stopAiGeneration();
  inputValue.value = '';
  // Strip images for regeneration payload (it's safe fallback)
  const cleanUserMsg = uMsg.replace(/!\[.*?\]\(data:image\/.*?;base64,[^\)]+\)/g, '').trim();
  handleAiChat(cleanUserMsg);
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

// Watchers
watch([() => store.currentPage, () => useTypewriterEffect.value], () => {
  if (!isDummyChat.value) startTypewriter();
  if (!store.bossMode || !isDummyChat.value) {
    stopBossStream();
  }
}, { immediate: true });

// 专门监听 triggerTypewriter 的变化：处理 currentPage 没有变化时（如首次打开第0页）仍需触发打字机的情形
watch(() => store.triggerTypewriter, (val) => {
  if (val && !isDummyChat.value) {
    nextTick(() => {
      startTypewriter();
    });
  }
});

let bossModeTimeout: any = null;
watch(() => store.bossMode, (isBoss, wasBoss) => {
  if (isBoss && !wasBoss && store.settings.bossKeyStreamOutput) {
    if (bossModeTimeout) clearTimeout(bossModeTimeout);
    bossModeTimeout = setTimeout(() => {
      if (store.bossMode && isDummyChat.value) startBossStream();
    }, 80);
  } else if (!isBoss) {
    if (bossModeTimeout) clearTimeout(bossModeTimeout);
    stopBossStream();
  }
});

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
  if (isListening.value) toggleVoiceRecording();
  
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

  if (!store.currentAiConfig?.apiKey) {
    store.showActionToast('尚未配置 API Key，无法使用 AI 问答能力', '立即设置', () => {
      store.showSettings = true;
      store.autoExpandAdvanced = true;
    });
    return;
  }

  inputValue.value = '';
  handleAiChat(input);
}


async function handleKeydown(e: KeyboardEvent) {
  const isInput = (e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA';
  if (isInput) return;

  if (store.settings.bossKeys.includes(e.key)) {
    e.preventDefault();
    const wasBossMode = store.bossMode;
    await store.toggleBossMode();
    
    if (wasBossMode && !store.bossMode && !store.settings.bossModeUnlocked && store.activeNovelIndex !== null) {
      const activeNovel = store.novels[store.activeNovelIndex];
      if (activeNovel && activeNovel.type === 'works') {
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
  
  if (store.showSettings || store.showProfileModal || store.showActivateModal || store.showHelp || store.confirmVisible) {
    if (e.key === 'Escape') {
      store.showHelp = false;
      store.showSettings = false;
      store.showToc = false;
    }
    return;
  }

  const key = e.key;
  const isScrollUp = store.settings.scrollUpKeys?.includes(key);
  const isScrollDown = store.settings.scrollDownKeys?.includes(key);
  const isPrev = store.settings.prevPageKeys?.includes(key);
  const isNext = store.settings.nextPageKeys?.includes(key) || (key === ' ' && !isInput);

  if ((isScrollUp || isScrollDown) && store.activeNovelIndex !== null && chatArea.value) {
    e.preventDefault();
    const scrollAmount = 140;
    chatArea.value.scrollBy({ top: isScrollUp ? -scrollAmount : scrollAmount, behavior: 'smooth' });
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

  if (key === 'Escape') {
    store.showHelp = false;
    store.showSettings = false;
    store.showToc = false;
  }
}

async function handleGlobalClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (target.tagName === 'IMG' && (target.closest('.html-wrapper') || target.closest('.user-img-row'))) {
    previewImageUrl.value = (target as HTMLImageElement).src;
    return;
  }

  if (store.settings.tripleClickBossKey && e.detail === 3) {
    // 弹窗打开时，不触发老板键连击
    if (store.showSettings || store.showProfileModal || store.showActivateModal || store.showHelp) {
      return;
    }

    const wasBossMode = store.bossMode;
    await store.toggleBossMode();
    
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
  }
}

function handleChatScroll() {
  if (!isAiGenerating.value || !chatArea.value) return;
  const el = chatArea.value;
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  userScrolledUp.value = !atBottom;
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('click', handleGlobalClick);
  nextTick(() => {
    if (chatArea.value) {
      chatArea.value.addEventListener('scroll', handleChatScroll);
    }
  });
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.removeEventListener('click', handleGlobalClick);
  if (chatArea.value) {
    chatArea.value.removeEventListener('scroll', handleChatScroll);
  }
  if (bossModeTimeout) clearTimeout(bossModeTimeout);
});

watch(() => store.currentPage, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    if (store.activeNovelIndex !== null) {
      store.novels[store.activeNovelIndex].currentPage = newVal;
      store._saveNovelsMeta();
    }
    if (chatArea.value && store.settings.readingMode !== 'scroll') {
      chatArea.value.scrollTop = 0;
    }
  }
});

watch(() => store.autoPreview, (newVal) => {
  if (newVal) {
    store._saveNovelsMeta();
  }
});

async function devClearData() {
  const ok = await store.confirmDialog('⚠️ [DEV测试专属操作]\n是否要彻底清除本地域名下产生的所有缓存？\n将清除包括设备指纹(IdentityDB)、卡密记录及全部小说，相当于系统重装。', '[DEV] 彻底清理');
  if (ok) {
    localStorage.clear();
    try {
      const { ContentDB, IdentityDB } = await import('@/utils/db');
      await ContentDB.clear();
      await IdentityDB.open();
      await IdentityDB.clear(); 
    } catch(err) {}
    window.location.reload();
  }
}


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

.chat-area {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  scroll-behavior: smooth;
}

.reading-content-layout {
  display: flex;
  flex: 1;
  min-height: 0;
}

.reading-content {
  flex: 1;
  min-width: 0;
}

.dev-mock-new-user-btn {
  position: fixed;
  bottom: 176px;
  right: 20px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  box-shadow: var(--shadow-sm);
  
  &:hover {
    color: var(--text-primary);
    background: var(--bg-surface-hover);
  }
}

.dev-quick-settings-btn {
  position: fixed;
  bottom: 128px;
  right: 20px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  box-shadow: var(--shadow-sm);
  
  &:hover {
    color: var(--text-primary);
    background: var(--bg-surface-hover);
  }
}

.dev-clear-data-btn {
  position: fixed;
  bottom: 32px;
  right: 20px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  box-shadow: var(--shadow-sm);
  
  &:hover {
    color: var(--accent-pink);
    border-color: var(--accent-pink);
    background: rgba(242, 139, 130, 0.1);
  }
}

.dev-clear-read-btn {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  box-shadow: var(--shadow-sm);
  
  &:hover {
    color: var(--accent);
    border-color: var(--accent);
    background: var(--bg-surface-hover);
  }
}

.main-content.center-input-layout {
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

  :deep(.welcome-screen) {
    padding: 0 0 32px 0;
    width: 100%;
    max-width: 820px;
    flex: none;
    align-items: flex-start;
  }

  :deep(.chatgpt-greeting-container) {
    align-items: center;
    width: 100%;
    margin-bottom: 24px;
    padding: 0;
  }

  :deep(.input-area) {
    flex: none;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
    margin-bottom: auto;
    padding-top: 0;
  }

  :deep(.input-container) {
    width: 100%;
    max-width: 820px;
  }

  :deep(.gemini-suggestion-chips) {
    max-width: 820px;
  }
}

.main-content.chatgpt-home-shift {
  .chat-area,
  :deep(.input-area) {
    transform: translateY(-10vh);
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

  svg {
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
  :deep(.sidebar-toggle-btn) { display: flex; }
  :deep(.welcome-gradient-text), :deep(.welcome-subtitle) { font-size: 28px; }
  :deep(.top-logo) { font-size: 16px; }
}

@media (max-width: 600px) {
  .chat-area { padding: 0 12px; }
  :deep(.input-area) { padding: 8px 12px 12px 12px; }
}
</style>
