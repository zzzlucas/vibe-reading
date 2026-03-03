import { defineStore } from 'pinia';
import { ref, watch, computed } from 'vue';
import type { Novel, Chapter, Settings, Theme, StyleName, Encoding } from '../types';
import { ContentDB, IdentityDB } from '../utils/db';
import { STYLE_CONFIG } from '../config/constants';

const STORAGE_PREFIX = 'deep_reader_';
// 内存级集合：仅记录本次会话中刚导入的作品 ID，用于精确触发首次打开时的打字机动画
const _justAddedIds = new Set<string>();

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
  const toastHasIcon = ref(false);
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
  const triggerSystemFileSignal = ref(0);
  const isInitializing = ref(true);
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
  
  const userName = ref('Finder');
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
    typewriterMode: true,
    typewriterSpeed: 25,
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
    showUserBubble: true,
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
    secondaryRenderIndent: 2,
    secondaryRenderContentBlocks: [],
    secondaryRenderContentBlocksRandom: false,
    hasSeenVibeReadingTip: false,
    hasSeenClassicBlogVibeTip: false,
    coffeeVibeMode: false,
    vibeQuickConfigCollapsed: false,
    version: 3
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

  async function ensureDeviceId() {
    let lsId = localStorage.getItem('deep_reader_device_id');
    try {
      await IdentityDB.open();
      let idbId = await IdentityDB.get('device_id');
      
      let finalId = idbId || lsId;
      if (!finalId) {
        finalId = generateUid() + generateUid();
      }
      
      if (finalId !== idbId) {
        await IdentityDB.set('device_id', finalId);
      }
      if (finalId !== lsId) {
        localStorage.setItem('deep_reader_device_id', finalId);
      }
      
      return finalId;
    } catch(err) {
      if (!lsId) {
        lsId = generateUid() + generateUid();
        localStorage.setItem('deep_reader_device_id', lsId);
      }
      return lsId;
    }
  }

  async function saveInvitedBy(code: string) {
    if (!code) return;
    localStorage.setItem('deep_reader_invited_by', code);
    try {
      await IdentityDB.open();
      await IdentityDB.set('invited_by', code);
    } catch(err) {}
  }

  async function getInvitedBy() {
    let lsCode = localStorage.getItem('deep_reader_invited_by');
    try {
      await IdentityDB.open();
      let idbCode = await IdentityDB.get('invited_by');
      return idbCode || lsCode || null;
    } catch(err) {
      return lsCode || null;
    }
  }

  // Actions
  async function initStore() {
    try {
      await ContentDB.open();
      
      // Load config
      const savedTheme = _loadFromStorage('theme');
      if (savedTheme) theme.value = savedTheme as Theme;
      
      const savedStyle = _loadFromStorage('style');
      const validStyles = ['gemini', 'chatgpt', 'classic_blog1', 'classic_blog2', 'classic_blog3', 'classic_doc1', 'classic_doc2', 'classic_doc3', 'mdn', 'wiki', 'stackoverflow', 'juejin'];
      if (savedStyle && validStyles.includes(savedStyle)) {
        style.value = savedStyle as StyleName;
      } else if (savedStyle) {
        style.value = 'gemini'; // Default fallback for old or invalid styles
      }
      
      const savedEncoding = _loadFromStorage('encoding');
      if (savedEncoding) encoding.value = savedEncoding as Encoding;
      
      const savedSettings = _loadFromStorage('settings');
      if (savedSettings) {
        settings.value = { ...settings.value, ...savedSettings };
        
        // Settings Migration for version 2/3 (new defaults)
        if (!savedSettings.version || savedSettings.version < 3) {
           if (!savedSettings.version || savedSettings.version < 2) {
             settings.value.typewriterSpeed = 25;
             settings.value.secondaryRenderIndent = 2;
           }
           settings.value.typewriterMode = true;
           settings.value.version = 3;
           _saveToStorage('settings', settings.value);
        }
      }

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
          
          if (!novel.id || !novel.type) {
             toRemove.push(i);
             continue;
          }

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

      // Default book onboarding: Load if list is empty or we are upgrading from broken version
      const hasOldInit = _loadFromStorage('has_init_default');
      const hasNewInit = _loadFromStorage('has_init_default_v2');
      
      // Auto-fix for users who got scrambled text in the previous attempt
      if (hasOldInit && !hasNewInit && novels.value.length > 0) {
        const brokenIdx = novels.value.findIndex(n => n.name === '《海底两万里》（示例作品）.txt' && n.type === 'works');
        if (brokenIdx !== -1) {
          // Find and delete the broken one to allow fresh import
          const brokenId = novels.value[brokenIdx].id;
          await ContentDB.delete(brokenId);
          novels.value.splice(brokenIdx, 1);
          _saveNovelsMeta();
        }
      }

      if (novels.value.length === 0 && !hasNewInit) {
        await _loadDefaultBook();
        _saveToStorage('has_init_default_v2', true);
        
        // Auto-open the default book after a short delay to ensure UI stability
        if (novels.value.length > 0) {
          setTimeout(() => {
             openNovel(0);
             // 初始化彻底完成，开放打字机和 Toast 触发
             setTimeout(() => { isInitializing.value = false; }, 200);
          }, 100);
        } else {
          isInitializing.value = false;
        }
      } else {
        // 如果不是初次安装，也要在加载完已存数据后标记完成
        isInitializing.value = false;
      }
    } catch (err) {
      console.error('Store Init failed:', err);
      isInitializing.value = false;
    }
  }

  async function _loadDefaultBook() {
    try {
      // Use full URL or relative path based on environment, for dev/prod flexibility
      const response = await fetch('./《海底两万里》（示例作品）.txt');
      if (!response.ok) return;
      
      const buffer = await response.arrayBuffer();
      let content = '';
      
      try {
        // Try UTF-8 first
        const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
        content = utf8Decoder.decode(buffer);
      } catch (err) {
        // Fallback to GBK if UTF-8 fails
        const gbkDecoder = new TextDecoder('gbk', { fatal: false });
        content = gbkDecoder.decode(buffer);
      }
      
      const newId = generateUid();
      const fileName = '《海底两万里》（示例作品）.txt';
      
      novels.value.push({
        id: newId,
        type: 'works',
        name: fileName,
        size: content.length,
        lastRead: Date.now(),
        currentPage: 0,
        displayName: '海底两万里（示例）',
        isPinned: false
      });
      
      // 标记为"刚导入"，openNovel 时精确触发一次打字机动画
      _justAddedIds.add(newId);
      await ContentDB.save(newId, content, 'works', fileName);
      _saveNovelsMeta();
    } catch (err) {
      console.warn('Failed to load default book:', err);
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
  watch(style, (val, oldVal) => {
    _saveToStorage('style', val);
    
    // Only show toast if it's a real switch (not initial load/refresh)
    if (!isInitializing.value && oldVal && val !== oldVal) {
      const config = STYLE_CONFIG[val];
      const uiName = config?.uiName || '新风格';
      
      showActionToast(`✨ 已为您开启 ${uiName} 风格，是否快速配置排版获取更好阅读氛围`, '快速配置', () => {
        showSettings.value = true;
        autoExpandReading.value = true;
      });
    }
  });
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
    const savedPage = novel.currentPage || 0;
    currentPage.value = savedPage >= totalPages.value ? 0 : savedPage;
    
    // 仅当该作品是本次会话刚导入的（_justAddedIds 中有记录）才触发打字机，避免刷新/切换时误触发
    if (settings.value.typewriterMode && _justAddedIds.has(novel.id)) {
      _justAddedIds.delete(novel.id);
      triggerTypewriter.value = true;
    }
    
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
    toastHasIcon.value = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Extended_Pictographic})/u.test(msg.trim());
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
    toastHasIcon.value = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Extended_Pictographic})/u.test(msg.trim());
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
    } else {
      // 检查是否为示例作品且已到达末尾
      const activeIdx = activeNovelIndex.value;
      if (activeIdx !== null && novels.value[activeIdx].name === '《海底两万里》（示例作品）.txt') {
        showActionToast('示例缓冲区已结束，请上传本地 .txt 文件继续渲染', '立即上传', () => {
          triggerSystemFileSignal.value++;
        });
      }
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

  function _splitContent(content: string, charsPerPageRaw: number) {
    const charsPerPage = Math.max(charsPerPageRaw || 2000, 100); // Safety floor to prevent infinite loops

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
    let chapterCount = 0;
    const chapterRegex = /^\s*(第[0-9零一二三四五六七八九十百千万]+[章回节集卷部篇])(?:\s+.*)?$/;

    for (const para of paragraphs) {
      const isChapter = chapterRegex.test(para) || (para.length < 50 && para.startsWith('第') && (para.includes('章') || para.includes('节')));
      
      if (isChapter && cur.length > 0 && chapterCount > 0) {
        pgs.push(cur.trim());
        cur = '';
      }

      if (isChapter) {
        chapters.value.push({ title: para.trim().substring(0, 50), page: pgs.length });
        chapterCount++;
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
          // Ensure splitPos is at least 1 to avoid infinite loop
          if (se > charsPerPage * 0.5) {
             splitPos = Math.max(se + 1, 1);
          }
          pgs.push(remaining.substring(0, splitPos).trim());
          remaining = remaining.substring(splitPos);
          if (splitPos === 0) break; // Emergency break
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
          const content = `[USER]: Q1 季度项目进展报告的要点，包括完成的里程碑和下一步计划\n\n好的，我来帮你整理 Q1 季度项目进展报告的要点：\n\n**一、已完成的里程碑**\n\n1. 核心模块重构完成，性能提升 40%\n2. 用户管理系统 v2.0 上线，支持多租户架构\n3. 完成第三方支付系统对接（支付宝、微信支付）\n4. 自动化测试覆盖率从 45% 提升至 82%\n\n**二、关键数据指标**\n\n• 日活用户: 12.5 万 → 18.3 万 (↑46.4%)\n• 系统可用性: 99.95%\n• 平均响应时间: 从 320ms 降至 180ms\n\n**三、下一步计划**\n\n1. 启动微服务拆分第二阶段\n2. 引入 AI 智能推荐模型\n`;
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

  function applyBasicVibe() {
    settings.value.showNovelTitle = true;
    settings.value.showChapterName = false;
    settings.value.secondaryRenderIndent = 0;
    settings.value.secondaryRenderObfuscationMode = 'none';
    settings.value.secondaryRenderContentBlocks = [];
    settings.value.hasSeenClassicBlogVibeTip = true;
    showToast(`✨ ${settings.value.coffeeVibeMode ? '中杯' : '基础'}氛围配置成功！`, 'info');
  }

  function applyAdvancedVibe() {
    settings.value.showNovelTitle = true;
    settings.value.showChapterName = false;
    settings.value.secondaryRenderIndent = 0;
    settings.value.secondaryRenderObfuscationMode = 'log_simple';
    settings.value.secondaryRenderContentBlocks = ['git_status']; // 轻度点缀
    settings.value.hasSeenClassicBlogVibeTip = true;
    showToast(`🔮 ${settings.value.coffeeVibeMode ? '大杯' : '进阶'}氛围配置成功！有点班味了~`, 'info');
  }

  function applyDeepVibe() {
    settings.value.showNovelTitle = false;
    settings.value.showChapterName = false;
    settings.value.secondaryRenderIndent = 0;
    settings.value.secondaryRenderObfuscationMode = 'log'; // 复杂装饰模式
    settings.value.secondaryRenderContentBlocks = ['git_status', 'auth_stub', 'sys_log', 'import_section', 'data_structure'];
    settings.value.secondaryRenderEnablePunctuation = true;
    settings.value.secondaryRenderRemovePunctuation = ['all'];
    settings.value.hasSeenClassicBlogVibeTip = true;
    showToast(`🚀 ${settings.value.coffeeVibeMode ? '超大杯' : '深度'}氛围配置已启动！班味有点浓~`, 'info');
  }

  // 供外部 composable 标记刚导入的作品，使其能在首次打开时触发打字机动画
  function markJustAdded(id: string) {
    _justAddedIds.add(id);
  }

  return {
    novels, activeId, activeNovelId, activeNovelIndex, currentPage, totalPages, pages, chapters, generatingContexts,
    sidebarOpen, showWasteland, isPro, hasNaggedPro, showHelp, showSettings, showProfileModal, showActivateModal, showToc, bossMode,
    theme, style, encoding, settings, aiSettings, appTitle, userName, userAvatar, userAvatarColor, autoExpandAdvanced, autoExpandReading, autoPreview, comingSoonText, isNewAchievement, skipNextTypewriter, triggerTypewriter, fakeSidebarRefreshSeed, triggerSystemFileSignal,
    openNovel, deleteNovel, renameNovel, togglePinNovel, prevPage, nextPage, searchInNovel, toggleBossMode,
    initStore, showToast, showActionToast, handleToastAction, confirmDialog, promptDialog, resolveConfirmDialog,
    generateUid, ensureDeviceId, saveInvitedBy, getInvitedBy, markJustAdded, applyBasicVibe, applyAdvancedVibe, applyDeepVibe,
    confirmVisible, confirmMessage, confirmTitle, confirmIsPrompt, confirmDefaultValue, confirmPlaceholder,
    toastVisible, toastMessage, toastType, toastHasIcon, toastActionText, previewTimer,
    _saveNovelsMeta, _syncNovelPage
  };
});
