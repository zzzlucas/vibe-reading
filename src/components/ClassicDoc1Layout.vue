<template>
  <div class="doc1-page">
    <!-- Left Sidebar -->
    <aside class="doc1-sidebar" :class="{ 'is-collapsed': sidebarCollapsed }">
      <!-- Sidebar Header -->
      <div class="doc1-sidebar-header">
        <div class="doc1-repo-dropdown">
          <div class="repo-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <span class="repo-name" 
                contenteditable="true" 
                @blur="saveRepoName" 
                @keydown.enter.prevent="($event.target as HTMLElement).blur()"
                title="点击编辑知识库名称">{{ repoName }}</span>
        </div>
        <div class="repo-sub">
          <span class="repo-sub-name" 
                contenteditable="true" 
                @blur="saveRepoSubName" 
                @keydown.enter.prevent="($event.target as HTMLElement).blur()"
                title="点击编辑仓库路径">{{ repoSubName }}</span>
          <span class="arrow">▾</span>
          <span class="more-options">...</span>
        </div>
      </div>

      <!-- Search Box -->
      <div class="doc1-search-box">
        <span class="search-icon">🔍</span>
        <input type="text" placeholder="搜索" />
        <span class="shortcut">Ctrl + J</span>
        <button class="add-btn">+</button>
      </div>

      <!-- Nav Items -->
      <div class="doc1-nav-group primary-nav">
        <a class="doc1-nav-item" @click.prevent="goHome" :class="{ active: store.activeId === null }">
          <span class="icon">🏠</span>
          <span class="text">首页</span>
        </a>
      </div>

      <div class="doc1-nav-group directory-group">
        <div class="doc1-group-title">
          <span class="icon">📑</span>
          <span class="text">目录</span>
          <div class="actions">
            <span class="action-icon">⚙</span>
            <span class="action-icon">▤</span>
          </div>
        </div>
        
        <div class="doc1-doc-list">
          <a v-for="(novel, idx) in filteredNovels"
             :key="novel.id"
             class="doc1-doc-item"
             :class="{ active: store.activeId === novel.id }"
             @click.prevent="store.openNovel(store.novels.indexOf(novel))">
             <span class="doc-icon">📄</span>
             <span class="doc-title">{{ getDisplayName(novel) }}</span>
          </a>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="doc1-main" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <!-- Top Actions Bar -->
      <header class="doc1-topbar">
        <div class="breadcrumb" :style="{ visibility: store.settings.showNovelTitle ? 'visible' : 'hidden', pointerEvents: store.settings.showNovelTitle ? 'auto' : 'none' }">
          <span class="breadcrumb-item" v-if="chatTitle">{{ chatTitle }}</span>
          <span class="breadcrumb-item" v-else>首页</span>
          <span class="lock-icon" v-if="chatTitle" title="私密">🔒</span>
        </div>
        <div class="actions">
          <div class="ai-badge">AI</div>
          <button class="icon-btn" title="收藏"><icon-material-symbols-star-outline /></button>
          <button class="icon-btn" title="协作"><icon-material-symbols-person-add-outline /></button>
          <button class="icon-btn" title="演示"><icon-material-symbols-present-to-all-outline /></button>
          <button class="btn-share">分享</button>
          <button class="btn-edit-yuque">编辑</button>
          <button class="icon-btn more-btn">⋯</button>
        </div>
      </header>

      <!-- Content Layout -->
      <div class="doc1-content-layout">
        <!-- Reader Wrapper -->
        <div class="doc1-reader-wrapper">
          <ReaderScreen />
        </div>

        <!-- Right Outline -->
        <aside class="doc1-outline" v-if="store.activeNovelIndex !== null">
          <div class="outline-header">
            <span>大纲</span>
            <span class="icon">🔗</span>
          </div>
          <div class="outline-list">
            <a class="outline-item active">{{ chatTitle }}</a>
            <!-- Dynamic outline items from dummy pools -->
            <a v-for="(item, idx) in outlineItems" 
               :key="idx" 
               class="outline-item child"
               @click.prevent="store.showToast('跳转到：' + item)">
               {{ item }}
            </a>
          </div>
        </aside>
      </div>

      <!-- Floating Buttons -->
      <div class="doc1-floating-actions" v-if="store.activeNovelIndex !== null">
        <button class="float-btn" @dblclick="store.toggleBossMode()" title="双击触发老板键">❖</button>
        <button class="float-btn" title="AI 对话">💬</button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStore } from '@/store/appStore';
import { STYLE_CONFIG } from '@/config/constants';
import { DUMMY_TITLES_IT, DUMMY_TITLES_GENERAL, DUMMY_TITLES_DESIGN } from '@/config/dummyPools';
import ReaderScreen from './ReaderScreen.vue';
import type { Novel } from '@/types';

const store = useAppStore();
const sidebarCollapsed = ref(false);
const aiStyles = ['gemini', 'chatgpt'];

const filteredNovels = computed(() => {
  if (aiStyles.includes(store.style)) return store.novels;
  // Non-AI styles only see works and fake conversations
  return store.novels.filter(n => n.type === 'works' || n.type === 'fake');
});

const chatTitle = computed(() => {
  if (store.activeNovelIndex === null) return '';
  const novel = store.novels[store.activeNovelIndex];
  return novel ? (novel.displayName || novel.name.replace(/\.txt$/i, '')) : '';
});

const outlineItems = computed(() => {
  // Pull data from the same pools as "Fill Dialog List (Left)"
  let pool: string[] = [];
  const mode = store.settings.fakeSidebarMode;
  
  if (mode === 'random_design') {
    pool = DUMMY_TITLES_DESIGN;
  } else if (mode === 'random_general') {
    pool = DUMMY_TITLES_GENERAL;
  } else {
    // Default to IT (randomly pick a language category)
    const langs = Object.keys(DUMMY_TITLES_IT);
    const randomLang = langs[Math.floor(Math.random() * langs.length)];
    pool = DUMMY_TITLES_IT[randomLang];
  }
  
  // Return a few items to simulate an outline
  return pool.slice(0, 5);
});

const repoName = ref(localStorage.getItem('doc1_repo_name') || '张三的文档');
const repoSubName = ref(localStorage.getItem('doc1_repo_sub_name') || '张三的文档-空间1号');

function saveRepoName(e: Event) {
  const val = (e.target as HTMLElement).innerText.trim();
  repoName.value = val;
  localStorage.setItem('doc1_repo_name', val);
}

function saveRepoSubName(e: Event) {
  const val = (e.target as HTMLElement).innerText.trim();
  repoSubName.value = val;
  localStorage.setItem('doc1_repo_sub_name', val);
}

function goHome() {
  store.activeId = null;
  store.showWasteland = false;
}

function getDisplayName(novel: Novel) {
  return novel.displayName || novel.name.replace(/\.txt$/i, '');
}
</script>

<style scoped lang="less">
.doc1-page {
  --doc1-heading-color: #262626;
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: white; /* 类似语雀/Notion浅色 */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: #262626;

  /* Custom Thinner Scrollbar */
  * {
    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.05);
      border-radius: 10px;
      transition: all 0.2s;
    }
    &.doc1-main, &.doc1-sidebar, &.doc1-outline {
       &::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
       }
    }
    &:hover::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
    }
  }
}

/* ===== Left Sidebar ===== */
.doc1-sidebar {
  width: 260px;
  min-width: 260px;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  background: #fafafa;
  transition: width 0.3s, min-width 0.3s;
  
  &.is-collapsed {
    width: 0;
    min-width: 0;
    overflow: hidden;
    border-right: none;
  }
}

.doc1-sidebar-header {
  padding: 16px 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.doc1-repo-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #595959;
  font-size: 13px;
  cursor: pointer;
  .repo-icon svg { width: 14px; height: 14px; }
  .repo-name {
    border: 1px transparent dashed;
    outline: none;
    padding: 0 2px;
    border-radius: 2px;
    cursor: text;
    &:hover { border-color: rgba(0,0,0,0.1); }
    &:focus { border-color: #1677ff; background: white; }
  }
}
.repo-sub {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  color: #262626;
  .repo-sub-name {
    border: 1px transparent dashed;
    outline: none;
    padding: 0 2px;
    border-radius: 2px;
    cursor: text;
    &:hover { border-color: rgba(0,0,0,0.1); }
    &:focus { border-color: #1677ff; background: white; }
  }
  .arrow { margin-left: 4px; font-size: 12px; color: #8c8c8c; }
  .more-options { margin-left: auto; color: #8c8c8c; font-weight: normal; }
}

.doc1-search-box {
  margin: 8px 16px;
  border-radius: 4px;
  background: #f0f0f0;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  font-size: 13px;
  gap: 6px;
  input {
    border: none;
    background: transparent;
    outline: none;
    width: 60px;
    flex: 1;
    color: #262626;
    &::placeholder { color: #8c8c8c; }
  }
  .search-icon { font-size: 12px; color: #8c8c8c; }
  .shortcut { font-size: 12px; color: #8c8c8c; background: #e6e6e6; padding: 1px 4px; border-radius: 4px; }
  .add-btn { background: none; border: none; font-size: 16px; color: #8c8c8c; cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center; }
}

.doc1-nav-group {
  display: flex;
  flex-direction: column;
}
.primary-nav {
  padding: 0 8px;
  margin-bottom: 12px;
}
.doc1-nav-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #595959;
  gap: 8px;
  text-decoration: none;
  &:hover { background: #f0f0f0; }
  &.active { 
    background: rgba(0, 0, 0, 0.04); 
    color: #262626; 
    font-weight: 500; 
    .doc-icon { color: #00b96b; opacity: 1; }
  }
}

.directory-group {
  flex: 1;
  overflow-y: auto;
  .doc1-group-title {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    font-size: 12px;
    color: #8c8c8c;
    gap: 6px;
    .actions { margin-left: auto; display: flex; gap: 8px; }
    .action-icon { cursor: pointer; &:hover { color: #595959; } }
  }
}
.doc1-doc-list {
  display: flex;
  flex-direction: column;
  padding: 0 8px 12px;
  gap: 2px;
}
.doc1-doc-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #595959;
  gap: 8px;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  &:hover { background: #f0f0f0; }
  &.active { 
    background: rgba(0, 0, 0, 0.04); 
    color: #262626; 
    font-weight: 500; 
    .doc-icon { color: #00b96b; opacity: 1; }
  }
  .doc-icon { font-size: 14px; opacity: 0.7; }
  .doc-title { overflow: hidden; text-overflow: ellipsis; }
}

/* ===== Main Content ===== */
.doc1-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: white;
  position: relative;
  z-index: 10;
}

/* Topbar */
.doc1-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 24px;
  flex-shrink: 0;
}
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #8c8c8c;
  .breadcrumb-item { color: #595959; font-weight: 500; }
  .lock-icon { font-size: 12px; }
}
.actions {
  display: flex;
  align-items: center;
  gap: 8px; /* Slightly tighter gap */
  
  .ai-badge {
    background: #00b96b;
    color: white;
    font-size: 11px;
    font-weight: bold;
    padding: 2px 6px;
    border-radius: 4px;
    margin-right: 4px;
    user-select: none;
  }
  
  .icon-btn {
    background: none;
    border: none;
    font-size: 20px; /* Larger icons */
    color: #595959;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    transition: all 0.2s;
    &:hover:not(.no-hover-bg) { background: #f0f0f0; }
    
    svg { font-size: 20px; }
  }
  
  .action-divider {
    width: 1px;
    height: 16px;
    background: #f0f0f0;
    margin: 0 4px;
  }
  
  .btn-group-outline {
    display: flex;
    align-items: center;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    padding: 2px;
    .icon-btn {
      width: 28px;
      height: 28px;
      svg { font-size: 16px; }
      &:hover { color: #1677ff; }
    }
  }

  .btn-share {
    background: white;
    border: 1px solid #d9d9d9;
    padding: 5px 16px;
    border-radius: 6px;
    font-size: 14px;
    color: #262626;
    cursor: pointer;
    margin-left: 4px;
    transition: all 0.2s;
    &:hover { border-color: #00b96b; color: #00b96b; }
  }
  
  .btn-edit-yuque {
    background: #00b96b;
    border: 1px solid #00b96b;
    padding: 5px 20px;
    border-radius: 6px;
    font-size: 14px;
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    &:hover { background: #00a85d; border-color: #00a85d; }
  }
}

/* Content Layout (Reader + Outline) */
.doc1-content-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.doc1-reader-wrapper {
  flex: 1;
  min-width: 0;
  position: relative;
  /* Override ReaderScreen internally */
  :deep(.main-content) {
    background: transparent !important;
    height: 100% !important;
  }
  :deep(.top-bar) { display: none !important; }
  :deep(.input-area) { display: none !important; }
  :deep(.dev-quick-settings-btn) { display: none !important; }
  :deep(.chat-area) {
    padding: 24px 60px 80px;
    max-width: 800px;
    margin: 0 auto;
  }
  
  /* Restyle Bubbles to simulate Document view */
  :deep(.user-message) {
    align-items: flex-start;
    margin-bottom: 24px;
  }
  :deep(.user-msg-bubble) {
    background: transparent !important;
    padding: 0 !important;
    max-width: 100% !important;
    color: #262626 !important;
    font-size: 32px !important;
    font-weight: bold !important;
    border-radius: 0 !important;
    white-space: normal !important;
    line-height: 1.4 !important;
    margin-bottom: 16px;
    
    // Limit to 2 lines with ellipsis
    display: -webkit-box !important;
    -webkit-line-clamp: 2 !important;
    line-clamp: 2 !important;
    -webkit-box-orient: vertical !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }
  :deep(.user-img-row), :deep(.ai-avatar), :deep(.response-actions) { display: none !important; }
  
  /* Content styling */
  :deep(.ai-response) { gap: 0 !important; }
  :deep(.ai-text) {
    font-size: 16px !important;
    line-height: 1.8 !important;
    color: #262626 !important;
  }
  
  /* Typographic styles mimicking doc */
  :deep(.ai-text h1), :deep(.ai-text h2), :deep(.ai-text h3) {
    margin-top: 1.2em;
    margin-bottom: 0.6em;
    font-weight: 600;
    color: var(--doc1-heading-color) !important;
  }
  :deep(strong) {
    color: var(--doc1-heading-color) !important;
    font-weight: 600;
  }
  :deep(.ai-text p) { margin-bottom: 1em; text-indent: 0; }
  :deep(.footer-safety-wrapper) { opacity: 1 !important; transform: none !important; pointer-events: auto !important; margin-top: 40px; }
  :deep(.page-nav) {
    border-top: 1px solid #f0f0f0;
    padding-top: 16px;
    margin-left: 0;
  }
  :deep(.page-nav-btn) { background: transparent; border-color: #d9d9d9; color: #595959; border-radius: 4px; }
  :deep(.page-info) { color: #8c8c8c; }
  
  /* Code blocks */
  :deep(.code-block) { background: #f5f5f5 !important; border: 1px solid #e8e8e8 !important; border-radius: 6px !important; }
  :deep(.code-header) { background: #fafafa !important; border-bottom: 1px solid #e8e8e8 !important; border-top-left-radius: 6px; border-top-right-radius: 6px; }
  :deep(.code-lang-label), :deep(.hljs) { color: #595959 !important; }
  
  /* Hide fake sidebar from ReaderScreen */
  :deep(.fake-sidebar) { display: none !important; }
}

/* Right Outline */
.doc1-outline {
  width: 200px;
  min-width: 200px;
  padding: 0 24px;
  border-left: 1px solid transparent; /* No visible border initially, blend with background */
  overflow-y: auto;
  transform: translateX(-50px); /* Shift left by 50px */
}
.outline-header {
  font-size: 12px;
  color: #8c8c8c;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  margin-bottom: 12px;
}
.outline-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.outline-item {
  font-size: 14px;
  color: #595959;
  cursor: pointer;
  text-decoration: none;
  padding-left: 0; /* Aligned to left */
  line-height: 1.5;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  &.active {
    color: #1677ff;
    font-weight: 500;
  }
  &:hover:not(.active) { color: #262626; }
  &.child { font-size: 13px; color: #8c8c8c; }
}

/* Floating Actions */
.doc1-floating-actions {
  position: absolute;
  bottom: 40px;
  right: 40px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.float-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: white;
  border: 1px solid #f0f0f0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  color: #595959;
  transition: all 0.2s;
  &:hover { box-shadow: 0 6px 16px rgba(0,0,0,0.12); transform: translateY(-2px); }
}

/* Dark Mode Overrides */
[data-theme='dark'] {
  .doc1-page { 
    background: var(--bg-primary); 
    color: var(--text-primary);
    position: relative;
    --doc1-heading-color: #ffffff;
  }
  .doc1-sidebar { 
    background: var(--bg-sidebar); 
    border-color: var(--border-color); 
    z-index: 10;
  }
  .search-bar {
    background: var(--bg-input) !important;
    border-color: var(--border-color) !important;
  }
  .search-input {
    background: transparent !important;
    color: var(--text-primary) !important;
    &::placeholder { color: var(--text-muted) !important; }
  }
  .search-icon, .search-shortcut { color: var(--text-muted) !important; }
  
  .doc1-main {
    background: var(--bg-primary);
    position: relative;
    z-index: 10;
  }
  .doc1-topbar {
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-color);
  }
  .doc1-content-layout {
    background: var(--bg-primary);
  }
  .doc1-outline {
    background: var(--bg-primary);
    border-left-color: var(--border-color);
  }

  .repo-sub, .breadcrumb-item { color: var(--text-secondary); }
  .repo-name:focus, .repo-sub-name:focus { background: var(--bg-surface-hover) !important; color: #fff; }
  .repo-name:hover, .repo-sub-name:hover { border-color: var(--border-color-light) !important; }
  .doc1-nav-item, .doc1-doc-item { 
    color: var(--text-secondary); 
    &:hover { background: var(--bg-surface-hover); } 
    &.active { 
       background: rgba(255, 255, 255, 0.06) !important; 
       color: #fff !important; 
       font-weight: 500;
       .doc-icon { opacity: 1 !important; color: #00b96b; }
    } 
  }
  .icon-btn, .btn-share { color: var(--text-secondary); }
  .ai-badge { background: #00b96b; color: white; }
  .btn-group-outline { border-color: var(--border-color); }
  .btn-share { background: transparent; border-color: var(--border-color); color: var(--text-secondary); }
  .action-divider { background: var(--border-color); }
  
  .doc1-reader-wrapper {
    :deep(.user-msg-bubble) { color: var(--text-primary) !important; }
    :deep(.ai-text) { color: var(--text-secondary) !important; }
    :deep(.code-block) { background: rgba(0, 0, 0, 0.3) !important; border-color: var(--border-color) !important; }
    :deep(.code-header) { background: rgba(0, 0, 0, 0.5) !important; border-color: var(--border-color) !important; }
    :deep(.page-nav) { border-top-color: var(--border-color); }
    
    /* Welcome screen dark mode adjustments */
    :deep(.welcome-gradient-text) {
      background: linear-gradient(135deg, #00b96b, #4e4376);
      -webkit-background-clip: text;
      background-clip: text;
    }
    :deep(.welcome-card) {
      background: var(--bg-surface) !important;
      border-color: var(--border-color) !important;
      &:hover { background: var(--bg-surface-hover) !important; }
    }
  }
  
  .outline-item { 
    color: var(--text-secondary); 
    &:hover:not(.active) { color: var(--text-primary); } 
  }
  .float-btn { 
    background: var(--bg-surface); 
    border-color: var(--border-color); 
    color: var(--text-secondary); 
    box-shadow: 0 4px 12px rgba(0,0,0,0.3); 
  }

  /* Dark mode scrollbar */
  * {
    &::-webkit-scrollbar-thumb {
      background: var(--scrollbar-thumb);
    }
    &:hover::-webkit-scrollbar-thumb {
      background: var(--scrollbar-hover);
    }
  }
}
</style>
