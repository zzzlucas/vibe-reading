import { defineStore } from 'pinia';
import { ref, watch, computed } from 'vue';
import type { Novel, Chapter, Settings, Theme, StyleName, Encoding } from '../types';
import { ContentDB } from '../utils/db';

const STORAGE_PREFIX = 'deep_reader_';

export const useAppStore = defineStore('app', () => {
  // State
  const novels = ref<Novel[]>([]);
  const activeId = ref<string | null>(null);

  const activeNovelId = computed(() => activeId.value);

  const activeNovelIndex = computed(() => {
    if (activeId.value === null) return null;
    const index = novels.value.findIndex(n => n.id === activeId.value);
    return index >= 0 ? index : null;
  });
  
  // Storage for multi-chat parallel generation context
  const generatingContexts = ref(new Map<string, {
    abortController: AbortController;
    isWaitingFirstToken: boolean;
    isWaitingMainResponse: boolean;
    pages: string[];
    pageIndex: number;
    streamingReasoning: string;
    streamingMainResponse: string;
  }>());

  const currentPage = ref(0);
  const totalPages = ref(0);
  const pages = ref<string[]>([]);
  const chapters = ref<Chapter[]>([]);
  
  const sidebarOpen = ref(true);
  const showWasteland = ref(false);
  const isPro = ref(false);
  const hasNaggedPro = ref(false);
  
  const showHelp = ref(false);
  const showSettings = ref(false);
  const showProfileModal = ref(false);
  const bossMode = ref(false);
  const previousNovelIdBeforeBoss = ref<string | null>(null);
  const showActivateModal = ref(false);
  const showToc = ref(false);
  const toastMessage = ref('');
  const toastVisible = ref(false);
  const toastType = ref<'info' | 'preview' | 'achievement' | 'action'>('info');
  const toastActionText = ref('');
  let toastActionCallback: (() => void) | null = null;
  const previewTimer = ref(0);
  const hasWarnedPro = ref(false);
  const autoExpandAdvanced = ref(false);
  const autoExpandReading = ref(false);
  const autoPreview = ref(false);
  const comingSoonText = ref('更多功能敬请期待');
  const isNewAchievement = ref(false);
  const skipNextTypewriter = ref(false);
  const triggerTypewriter = ref(false);
  const fakeSidebarRefreshSeed = ref(0);
  // Custom Modal States
  const confirmVisible = ref(false);
  const confirmMessage = ref('');
  const confirmTitle = ref('提示');
  const confirmIsPrompt = ref(false);
  const confirmDefaultValue = ref('');
  const confirmPlaceholder = ref('');
  let resolveConfirm: ((result: { confirmed: boolean, value: string | null }) => void) | null = null;
  
  const theme = ref<Theme>('dark');
  const style = ref<StyleName>('gemini');
  const encoding = ref<Encoding>('auto');
  const appTitle = ref('FindDeep');
  
  const userName = ref('Zheng');
  const userAvatar = ref<string | null>(null);
  const userAvatarColor = ref<string | null>(null);
  
  const aiSettings = ref({
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-3.5-turbo',
    customModel: ''
  });
  
  const settings = ref<Settings>({
    fontSize: 16,
    lineHeight: 1.8,
    charsPerPage: 2000,
    readingMode: 'page',
    bossKeys: ['`', 'Escape'],
    bossModeUnlocked: false,
    tripleClickBossKey: true,
    prevPageKeys: ['ArrowLeft'],
    nextPageKeys: ['ArrowRight'],
    scrollUpKeys: ['ArrowUp'],
    scrollDownKeys: ['ArrowDown'],
    typewriterMode: false,
    typewriterSpeed: 50,
    bossKeyStreamOutput: true,
    bossKeyTarget: 'template',
    bossKeySpecificTargetId: '',
    bossKeyStreamStartChars: 50,
    bossKeyStreamTurn: 'first',
    userBubbleTemplate: '{{title}} - 第 {{page}} 页',
    userBubbleMode: 'default',
    fontColor: '',
    showChapterName: true,
    showNovelTitle: true,
    secondaryRenderMergeParagraphs: false,
    secondaryRenderMergeCount: 3,
    showFakeSidebar: false,
    fakeSidebarMode: 'random_it',
    fakeSidebarContent: '',
    fakeSidebarItemCount: 15,
    fakeSidebarAutoAdjustCount: false,
    fakeSidebarShowForTypes: ['works', 'fake'],
    secondaryRenderObfuscationMode: 'none',
    secondaryRenderEnableReplace: false,
    secondaryRenderReplaceDict: '',
    secondaryRenderEnablePunctuation: false,
    secondaryRenderRemovePunctuation: [],
    secondaryRenderIndent: 0
  });

  // Helpers
  const _loadFromStorage = (key: string) => {
    try {
      const data = localStorage.getItem(STORAGE_PREFIX + key);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  };
  const _saveToStorage = (key: string, data: any) => {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  };

  const generateUid = () => {
    // Generate a clean 12-char UID
    return Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8);
  };

  // Actions
  async function initStore() {
    await ContentDB.open();
    
    // Load config
    const savedTheme = _loadFromStorage('theme');
    if (savedTheme) theme.value = savedTheme as Theme;
    
    const savedStyle = _loadFromStorage('style');
    const validStyles = ['gemini', 'chatgpt', 'vscode', 'terminal', 'idea', 'webstorm', 'juejin', 'mdn', 'stackoverflow'];
    if (savedStyle && validStyles.includes(savedStyle)) {
      style.value = savedStyle as StyleName;
    } else if (savedStyle) {
      style.value = 'gemini'; // Default fallback for old or invalid styles
    }
    
    const savedEncoding = _loadFromStorage('encoding');
    if (savedEncoding) encoding.value = savedEncoding as Encoding;
    
    const savedSettings = _loadFromStorage('settings');
    if (savedSettings) settings.value = { ...settings.value, ...savedSettings };

    const savedAppTitle = _loadFromStorage('appTitle');
    if (savedAppTitle) appTitle.value = savedAppTitle;

    const savedAutoPreview = _loadFromStorage('autoPreview');
    if (savedAutoPreview !== null) autoPreview.value = !!savedAutoPreview;

    const savedComingSoon = _loadFromStorage('comingSoonText');
    if (savedComingSoon) comingSoonText.value = savedComingSoon;

    const savedUserName = _loadFromStorage('userName');
    if (savedUserName) userName.value = savedUserName;

    const savedUserAvatar = _loadFromStorage('userAvatar');
    if (savedUserAvatar) userAvatar.value = savedUserAvatar;

    const savedUserAvatarColor = _loadFromStorage('userAvatarColor');
    if (savedUserAvatarColor) userAvatarColor.value = savedUserAvatarColor;

    const savedAiSettings = _loadFromStorage('aiSettings');
    if (savedAiSettings) {
      aiSettings.value = { ...aiSettings.value, ...savedAiSettings };
    }

    // Load novels
    const savedNovels = _loadFromStorage('novels_meta');
    if (savedNovels && Array.isArray(savedNovels)) {
      novels.value = savedNovels;
      
      let modified = false;
      const toRemove: number[] = [];
      
      for (let i = 0; i < novels.value.length; i++) {
        const novel = novels.value[i];
        
        // Ensure meta has ID and Type (basic structure integrity)
        if (!novel.id || !novel.type) {
           toRemove.push(i);
           continue;
        }

        // Only keep if content exists in IndexedDB (keyed by ID)
        const exists = await ContentDB.has(novel.id);
        if (!exists) {
          toRemove.push(i);
        }
      }

      if (toRemove.length > 0) {
        for (let i = toRemove.length - 1; i >= 0; i--) {
          novels.value.splice(toRemove[i], 1);
        }
        modified = true;
      }
      
      if (modified) {
        _saveNovelsMeta();
      }
    }
  }

  function _saveNovelsMeta() {
    const meta = novels.value.map(n => ({
      id: n.id,
      type: n.type,
      name: n.name, size: n.size, lastRead: n.lastRead,
      currentPage: n.currentPage, displayName: n.displayName || '',
      isPinned: !!n.isPinned
    }));
    _saveToStorage('novels_meta', meta);
  }

  // Watchers to auto-save
  watch(theme, (val) => _saveToStorage('theme', val));
  watch(style, (val) => _saveToStorage('style', val));
  watch(encoding, (val) => _saveToStorage('encoding', val));
  watch(settings, (val) => _saveToStorage('settings', val), { deep: true });
  watch(aiSettings, (val) => _saveToStorage('aiSettings', val), { deep: true });
  watch(appTitle, (val) => _saveToStorage('appTitle', val));
  watch(userName, (val) => _saveToStorage('userName', val));
  watch(userAvatar, (val) => _saveToStorage('userAvatar', val));
  watch(userAvatarColor, (val) => _saveToStorage('userAvatarColor', val));
  watch(autoPreview, (val) => _saveToStorage('autoPreview', val));
  watch(comingSoonText, (val) => _saveToStorage('comingSoonText', val));
  watch(activeId, (val) => _saveToStorage('last_active_id', val));

  async function openNovel(index: number) {
    const novel = novels.value[index];
    if (!novel) return;
    
    // 关键优化：在切换前清空旧书页数据，防止 Vue 尝试把几千页的旧小说渲染为普通聊天节点导致严重卡顿
    pages.value = [];
    totalPages.value = 0;
    
    activeId.value = novel.id;
    
    // 如果该对话正在生成中，直接从内存中恢复数据，避免从数据库中读取旧数据导致闪烁和抖动
    const ctx = generatingContexts.value.get(novel.id);
    if (ctx) {
      pages.value = [...ctx.pages];
      totalPages.value = pages.value.length;
      currentPage.value = pages.value.length - 1;
      return;
    }

    const content = await ContentDB.load(novel.id);
    if (!content) {
      novels.value.splice(index, 1);
      _saveNovelsMeta();
      return;
    }
    
    // simple split logic
    pages.value = _splitContent(content, settings.value.charsPerPage);
    totalPages.value = pages.value.length;
    currentPage.value = novel.currentPage || 0;
    if (currentPage.value >= totalPages.value) currentPage.value = 0;
    
    novel.lastRead = Date.now();
    showWasteland.value = false;
    _saveNovelsMeta();
  }

  async function deleteNovel(index: number) {
    const novel = novels.value[index];
    if (!novel) return;
    await ContentDB.delete(novel.id);
    novels.value.splice(index, 1);
    _saveNovelsMeta();
    if (activeId.value === novel.id) {
        activeId.value = null;
    }
  }

  function checkProLimit() {
    if (isPro.value) return;
    
    const charsReadSoFar = (currentPage.value + 1) * settings.value.charsPerPage;
    const threshold = 300000;
    const warningThreshold = threshold * 0.9;

    if (charsReadSoFar >= threshold) {
      if (!hasNaggedPro.value) {
        hasNaggedPro.value = true;
        showActivateModal.value = true;
      }
    } else if (charsReadSoFar >= warningThreshold) {
      if (!hasWarnedPro.value) {
        hasWarnedPro.value = true;
        showToast('您已阅读接近 10 万字，继续阅读需升级 Pro 版本');
      }
    }
  }

  function showToast(msg: string, type: 'info' | 'preview' | 'achievement' | 'action' = 'info') {
    toastMessage.value = msg;
    toastType.value = type;
    toastVisible.value = true;
    if (type === 'info' || type === 'achievement') {
      setTimeout(() => {
        toastVisible.value = false;
      }, type === 'achievement' ? 8000 : 4000);
    }
  }

  function showActionToast(msg: string, actionText: string, callback: () => void) {
    toastMessage.value = msg;
    toastType.value = 'action';
    toastActionText.value = actionText;
    toastActionCallback = callback;
    toastVisible.value = true;
    setTimeout(() => {
      toastVisible.value = false;
    }, 6000);
  }

  function handleToastAction() {
    if (toastActionCallback) toastActionCallback();
  }

  function confirmDialog(msg: string, title = '提示') {
    return new Promise<boolean>((resolve) => {
      confirmMessage.value = msg;
      confirmTitle.value = title;
      confirmIsPrompt.value = false;
      confirmVisible.value = true;
      resolveConfirm = (res) => resolve(res.confirmed);
    });
  }

  function promptDialog(msg: string, defaultValue = '', placeholder = '', title = '输入') {
    return new Promise<string | null>((resolve) => {
      confirmMessage.value = msg;
      confirmTitle.value = title;
      confirmIsPrompt.value = true;
      confirmDefaultValue.value = defaultValue;
      confirmPlaceholder.value = placeholder;
      confirmVisible.value = true;
      resolveConfirm = (res) => resolve(res.confirmed ? (res.value || '') : null);
    });
  }

  function resolveConfirmDialog(confirmed: boolean, value: string | null = null) {
    confirmVisible.value = false;
    if (resolveConfirm) {
      resolveConfirm({ confirmed, value });
      resolveConfirm = null;
    }
  }

  function prevPage() {
    if (currentPage.value > 0) {
        triggerTypewriter.value = true;
        currentPage.value--;
        _syncNovelPage();
    }
  }
  function nextPage() {
    if (currentPage.value < totalPages.value - 1) {
        triggerTypewriter.value = true;
        currentPage.value++;
        _syncNovelPage();
    }
  }
  function _syncNovelPage() {
    if (activeNovelIndex.value !== null) {
      novels.value[activeNovelIndex.value].currentPage = currentPage.value;
      _saveNovelsMeta();
      checkProLimit();
    }
  }
  
  function searchInNovel(keyword: string) {
    for (let i = currentPage.value; i < totalPages.value; i++) {
      if (pages.value[i].includes(keyword)) {
        if (i === currentPage.value) {
          for (let j = currentPage.value + 1; j < totalPages.value; j++) {
            if (pages.value[j].includes(keyword)) {
              currentPage.value = j;
              _syncNovelPage();
              return;
            }
          }
          return;
        }
        currentPage.value = i;
        _syncNovelPage();
        return;
      }
    }
  }

  function _splitContent(content: string, charsPerPage: number) {
    // Explicit page breaks for dummy chats or special formatting
    if (content.includes('[PAGE_BREAK]')) {
      return content.split('[PAGE_BREAK]')
        .map(p => p.trim())
        .filter(p => p.length > 0);
    }

    // Single-round AI chat (no PAGE_BREAK yet) — don't split by chars
    if (content.trimStart().startsWith('[USER]:')) {
      return [content.trim()];
    }

    const pgs: string[] = [];
    chapters.value = [];
    const paragraphs = content.split(/\n+/).filter(p => p.trim());
    let cur = '';
    const chapterRegex = /^\s*(第[0-9零一二三四五六七八九十百千万]+[章回节集卷部篇])(?:\s+.*)?$/;

    for (const para of paragraphs) {
      const isChapter = chapterRegex.test(para) || (para.length < 50 && para.startsWith('第') && (para.includes('章') || para.includes('节')));
      
      if (isChapter && cur.length > 0) {
        pgs.push(cur.trim());
        cur = '';
      }

      if (isChapter) {
        chapters.value.push({ title: para.trim().substring(0, 50), page: pgs.length });
      }

      if (cur.length + para.length > charsPerPage && cur.length > 0) {
        pgs.push(cur.trim());
        cur = '';
      }

      if (para.length > charsPerPage) {
        if (cur.length > 0) { pgs.push(cur.trim()); cur = ''; }
        let remaining = para;
        while (remaining.length > charsPerPage) {
          let splitPos = charsPerPage;
          const se = remaining.lastIndexOf('。', charsPerPage);
          if (se > charsPerPage * 0.5) splitPos = se + 1;
          pgs.push(remaining.substring(0, splitPos).trim());
          remaining = remaining.substring(splitPos);
        }
        if (remaining.trim()) cur = remaining + '\n\n';
      } else {
        cur += para + '\n\n';
      }
    }
    if (cur.trim()) pgs.push(cur.trim());
    return pgs.length > 0 ? pgs : ['（空内容）'];
  }

  function renameNovel(index: number, newName: string) {
    if (!novels.value[index]) return;
    novels.value[index].displayName = newName.trim();
    _saveNovelsMeta();
  }

  function togglePinNovel(index: number) {
    if (!novels.value[index]) return;
    novels.value[index].isPinned = !novels.value[index].isPinned;
    _saveNovelsMeta();
  }

  async function toggleBossMode() {
    if (bossMode.value) {
      bossMode.value = false;
      skipNextTypewriter.value = true;
      if (previousNovelIdBeforeBoss.value !== null) {
        const idx = novels.value.findIndex(n => n.id === previousNovelIdBeforeBoss.value);
        if (idx >= 0) {
          await openNovel(idx);
        }
      } else {
         activeId.value = null;
      }
    } else {
      previousNovelIdBeforeBoss.value = activeId.value;
      
      const targetMode = settings.value.bossKeyTarget || 'template';
      let bossNovelIndex = -1;

      if (targetMode === 'random') {
        const aiChats = novels.value.filter(n => n.type === 'fake' || n.type === 'ai');
        if (aiChats.length > 0) {
           bossNovelIndex = novels.value.findIndex(n => n.id === aiChats[Math.floor(Math.random() * aiChats.length)].id);
        }
      } else if (targetMode === 'specific' && settings.value.bossKeySpecificTargetId) {
        bossNovelIndex = novels.value.findIndex(n => n.id === settings.value.bossKeySpecificTargetId);
      }

      if (bossNovelIndex === -1 && targetMode !== 'template' && targetMode !== 'random') {
          bossNovelIndex = -1;
      }

      if (bossNovelIndex === -1) {
        let templateIndex = novels.value.findIndex(n => n.name === 'dummy_boss_chat.txt');
        if (templateIndex === -1) {
          const content = `[USER]: 帮我整理一下 Q1 季度项目进展报告的要点，包括完成的里程碑和下一步计划\n\n好的，我来帮你整理 Q1 季度项目进展报告的要点：\n\n**一、已完成的里程碑**\n\n1. 核心模块重构完成，性能提升 40%\n2. 用户管理系统 v2.0 上线，支持多租户架构\n3. 完成第三方支付系统对接（支付宝、微信支付）\n4. 自动化测试覆盖率从 45% 提升至 82%\n\n**二、关键数据指标**\n\n• 日活用户: 12.5 万 → 18.3 万 (↑46.4%)\n• 系统可用性: 99.95%\n• 平均响应时间: 从 320ms 降至 180ms\n\n**三、下一步计划**\n\n1. 启动微服务拆分第二阶段\n2. 引入 AI 智能推荐模型\n`;
          const bossId = generateUid();
          await ContentDB.save(bossId, content, 'fake', 'dummy_boss_chat.txt');
          novels.value.unshift({
            id: bossId,
            type: 'fake',
            name: 'dummy_boss_chat.txt',
            size: content.length,
            lastRead: Date.now(),
            currentPage: 0,
            displayName: 'Q1 季度项目进展报告',
            isPinned: true
          });
          _saveNovelsMeta();
          templateIndex = 0;
        }
        bossNovelIndex = templateIndex;
      }

      // 先加载内容，再设置 bossMode，确保 watcher 触发时 pages 已就绪
      await openNovel(bossNovelIndex);
      bossMode.value = true;
    }
  }

  return {
    novels, activeId, activeNovelId, activeNovelIndex, currentPage, totalPages, pages, chapters, generatingContexts,
    sidebarOpen, showWasteland, isPro, hasNaggedPro, showHelp, showSettings, showProfileModal, showActivateModal, showToc, bossMode,
    theme, style, encoding, settings, aiSettings, appTitle, userName, userAvatar, userAvatarColor, autoExpandAdvanced, autoExpandReading, autoPreview, comingSoonText, isNewAchievement, skipNextTypewriter, triggerTypewriter, fakeSidebarRefreshSeed,
    openNovel, deleteNovel, renameNovel, togglePinNovel, prevPage, nextPage, searchInNovel, toggleBossMode,
    initStore, showToast, showActionToast, handleToastAction, confirmDialog, promptDialog, resolveConfirmDialog,
    generateUid,
    confirmVisible, confirmMessage, confirmTitle, confirmIsPrompt, confirmDefaultValue, confirmPlaceholder,
    toastVisible, toastMessage, toastType, toastActionText, previewTimer,
    _saveNovelsMeta, _syncNovelPage
  };
});
