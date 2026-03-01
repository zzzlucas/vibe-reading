<template>
  <aside class="sidebar" :class="{ collapsed: !store.sidebarOpen }">
    <!-- ChatGPT Sidebar Header -->
    <div class="sidebar-header" v-if="store.style === 'chatgpt'" style="justify-content: space-between; padding-right: 12px;">
      <button class="icon-btn sidebar-toggle-btn" @click="store.sidebarOpen = !store.sidebarOpen" title="关闭侧边栏">
        <icon-material-symbols-menu-open />
      </button>
      <button class="icon-btn" @click="createNewChat" title="新聊天">
        <icon-material-symbols-edit-square />
      </button>
    </div>

    <!-- Default/Gemini Sidebar Header -->
    <div class="sidebar-header" v-else>
      <button class="icon-btn sidebar-menu-btn" @click="store.sidebarOpen = !store.sidebarOpen" title="主菜单">
        <icon-material-symbols-menu />
      </button>
      <!-- Logo moved to main header per user request -->
    </div>

    <div class="sidebar-actions" v-if="store.style !== 'chatgpt'">
      <button class="new-chat-btn" @click="createNewChat">
        <icon-material-symbols-add />
        <span class="btn-text">发起新对话</span>
      </button>
      
      <div v-if="isSearching" class="search-container nav-item">
        <icon-material-symbols-search class="search-icon" />
        <input 
          type="text" 
          class="search-input" 
          placeholder="搜索对话..." 
          v-model="searchQuery"
          @blur="closeSearchIfEmpty"
          @keydown.enter="blurSearchInput"
          @keydown.esc="clearAndCloseSearch"
          ref="searchInputRef"
        />
      </div>
      <button v-else class="nav-item search-btn" @click="openSearch">
        <icon-material-symbols-search />
        <span class="nav-text">搜索内容</span>
      </button>
    </div>

    <!-- ChatGPT Nav -->
    <div class="sidebar-nav" v-if="store.style === 'chatgpt'" style="margin-top: 8px;">
      <button class="nav-item" @click="createNewChat">
        <span class="chatgpt-logo-icon"></span>
        <span class="nav-text">新聊天</span>
      </button>
      <button class="nav-item" @click="store.showWasteland = true; store.activeId = null">
        <icon-material-symbols-search />
        <span class="nav-text">搜索聊天</span>
      </button>
      <button class="nav-item" @click="store.showWasteland = true; store.activeId = null">
        <icon-material-symbols-image />
        <span class="nav-text">图片</span>
      </button>
      <button class="nav-item" @click="store.showWasteland = true; store.activeId = null">
        <icon-material-symbols-grid-view />
        <span class="nav-text">应用</span>
      </button>
    </div>

    <!-- Default Nav -->
    <div class="sidebar-nav" v-else>
      <button class="nav-item" @click="store.showWasteland = true; store.activeId = null">
        <icon-material-symbols-explore />
        <span class="nav-text">探索内容</span>
      </button>
    </div>

    <div class="sidebar-section" v-if="store.style !== 'chatgpt'">
      <div class="section-header">
        <span class="section-title">Gem</span>
        <icon-material-symbols-chevron-right class="section-toggle" />
      </div>
      <div class="section-items gem-list">
        <button class="nav-item sub-item" @click="store.showWasteland = true; store.activeId = null">
          <icon-material-symbols-auto-stories />
          <span class="nav-text">Storybook</span>
        </button>
      </div>
    </div>

    <div class="sidebar-section chat-section" :style="{ marginTop: store.style === 'chatgpt' ? '8px' : '0' }">
      <div class="section-header" v-if="store.style !== 'chatgpt'">
         <span class="section-title">对话</span>
      </div>
      <div class="section-items custom-scrollbar">
        <div v-if="searchQuery && groupedNovels.every(g => g.items.length === 0)" class="empty-search-state">
           没有找到包含 "{{ searchQuery }}" 的对话
        </div>
        <template v-for="group in groupedNovels" :key="group.id">
          <div v-if="group.items.length > 0" class="group-container">
            <div v-if="group.label" class="group-label">{{ group.label }}</div>
            <div v-for="item in group.items" :key="item.novel.name" 
                 class="nav-item conv-item chapter-item" 
                 :class="{ active: store.activeNovelIndex === item.originalIndex, 'pinned-item': item.novel.isPinned }"
                 @click.stop="handleNavigate(item.originalIndex)"
                 @contextmenu.prevent="showContextMenu($event, item.originalIndex)">
              <!-- Conditional Icon for ChatGPT vs Defaults -->
              <div v-if="store.style === 'chatgpt'" style="width: 20px;"></div>
              <!-- Removed conv-icon for Gemini style per user request -->
              
              <input v-if="renamingIndex === item.originalIndex" 
                     type="text" 
                     class="conv-rename-input"
                     v-model="renameValue"
                     @blur="finishRename(item.originalIndex)"
                     @keydown.enter="($event.target as HTMLInputElement)?.blur()"
                     @keydown.esc="cancelRename"
                     ref="renameInputRefs" />
              
              <span v-else class="nav-text" :class="{ 'has-pin': item.novel.isPinned }">{{ getDisplayName(item.novel) }}</span>
              
              <icon-material-symbols-keep class="static-pin" v-if="item.novel.isPinned && renamingIndex !== item.originalIndex" />

              <div class="conv-actions" v-show="renamingIndex !== item.originalIndex">
                <button class="conv-action-btn" :class="{ 'pin-indicator': item.novel.isPinned }" @click.stop="store.togglePinNovel(item.originalIndex)" :title="item.novel.isPinned ? '取消置顶' : '置顶'">
                  <icon-material-symbols-keep-off v-if="item.novel.isPinned" />
                  <icon-material-symbols-keep v-else />
                </button>
                <button class="conv-action-btn conv-edit-btn" @click.stop="startRename(item.originalIndex)" title="编辑标题">
                  <icon-material-symbols-edit />
                </button>
                <button class="conv-action-btn conv-more-btn" @click.stop="showContextMenu($event, item.originalIndex)" title="更多">
                  <icon-material-symbols-more-vert />
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- ChatGPT Bottom Area -->
    <div class="sidebar-bottom chatgpt-bottom" v-if="store.style === 'chatgpt'">
      <div class="nav-item" @click="store.showSettings = true" style="margin-bottom: 8px;">
        <icon-material-symbols-stars style="color: #ecc48f" />
        <div style="display:flex; flex-direction:column; gap:2px">
          <span class="nav-text" style="font-weight: 500">升级</span>
          <span class="nav-text" style="font-size: 12px; color: var(--text-muted)">获取 GPT-4 等</span>
        </div>
      </div>
      <div class="nav-item user-profile-btn" @click="store.showProfileModal = true">
        <div class="avatar-small" style="overflow: hidden;" :style="(!store.userAvatar && store.userAvatarColor) ? { background: store.userAvatarColor } : {}">
          <img v-if="store.userAvatar" :src="store.userAvatar" style="width: 100%; height: 100%; object-fit: cover;" />
          <span v-else>{{ store.userName.charAt(0).toUpperCase() }}</span>
        </div>
        <span class="nav-text">{{ store.userName }}</span>
      </div>
    </div>

    <!-- Default Bottom Area -->
    <div class="sidebar-bottom" v-else>
      <div class="nav-item" @click="store.showHelp = true">
        <icon-material-symbols-help />
        <span class="nav-text">帮助与支持</span>
      </div>
      <div class="nav-item" @click="store.showSettings = true">
        <icon-material-symbols-settings />
        <span class="nav-text">设置和新功能</span>
      </div>
      <div class="location-info">
        <div class="dot"></div>
        <div>
          中国<br>
          <span style="font-size: 10px;">根据您的 IP 地址 • 收起所有帐号已开启</span>
        </div>
      </div>
    </div>

    <!-- Context Menu -->
    <Teleport to="body">
      <div v-if="contextMenuTarget !== null" 
           class="context-menu show" 
           :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px', display: 'flex' }">
        <button class="context-menu-item" @click="handleContextAction('pin')">
          <icon-material-symbols-keep v-if="contextMenuTarget !== null && !store.novels[contextMenuTarget]?.isPinned" />
          <icon-material-symbols-keep-off v-else />
          <span>{{ contextMenuTarget !== null && store.novels[contextMenuTarget]?.isPinned ? '取消置顶' : '置顶' }}</span>
        </button>
        <button class="context-menu-item" @click="handleContextAction('rename')">
          <icon-material-symbols-edit />
          <span>重命名</span>
        </button>
        <button class="context-menu-item" @click="handleContextAction('delete')">
          <icon-material-symbols-delete />
          <span>删除</span>
        </button>
      </div>
    </Teleport>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { useAppStore } from '@/store/appStore';
import { STYLE_CONFIG } from '@/config/constants';
import type { Novel } from '@/types';

const store = useAppStore();
const currentStyle = computed(() => STYLE_CONFIG[store.style]);

// Search Feature
const isSearching = ref(false);
const searchQuery = ref('');
const searchInputRef = ref<HTMLInputElement | null>(null);

function openSearch() {
  isSearching.value = true;
  nextTick(() => {
    if (searchInputRef.value) {
      searchInputRef.value.focus();
    }
  });
}

function closeSearchIfEmpty() {
  if (!searchQuery.value.trim()) {
    isSearching.value = false;
  }
}

function blurSearchInput() {
  if (searchInputRef.value) {
    searchInputRef.value.blur();
  }
}

function clearAndCloseSearch() {
  searchQuery.value = '';
  isSearching.value = false;
  blurSearchInput();
}

// Grouping Novels - only separate pinned items
const groupedNovels = computed(() => {
  const groups = [
    { id: 'pinned', label: '', items: [] as any[] },
    { id: 'unpinned', label: '', items: [] as any[] }
  ];

  store.novels.forEach((novel, index) => {
    const item = { novel, originalIndex: index };
    const query = searchQuery.value.trim().toLowerCase();
    
    // Filter by search query if exists
    if (query) {
      const displayName = novel.displayName || novel.name.replace(/\.txt$/i, '');
      if (!displayName.toLowerCase().includes(query)) {
        return;
      }
    }
    
    if (novel.isPinned) {
      groups[0].items.push(item);
    } else {
      groups[1].items.push(item);
    }
  });

  return groups;
});

// Renaming
const renamingIndex = ref<number | null>(null);
const renameValue = ref('');
const renameInputRefs = ref<HTMLElement[]>([]);

const getDisplayName = (novel: Novel) => novel.displayName || novel.name.replace(/\.txt$/i, '');

function startRename(index: number) {
  const novel = store.novels[index];
  if (!novel) return;
  renameValue.value = getDisplayName(novel);
  renamingIndex.value = index;
  nextTick(() => {
    // Focus the first newly rendered input (Vue might put it in an array)
    const inputs = document.querySelectorAll('.conv-rename-input');
    if (inputs.length) (inputs[0] as HTMLInputElement).focus();
  });
}

function finishRename(index: number) {
  if (renamingIndex.value !== index) return;
  const newName = renameValue.value.trim();
  const novel = store.novels[index];
  if (newName && newName !== novel.name.replace(/\.txt$/i, '')) {
    store.renameNovel(index, newName);
  } else if (!newName) {
    store.renameNovel(index, ''); // reset
  }
  renamingIndex.value = null;
}

function cancelRename() {
  renamingIndex.value = null;
}

// Global click to close context menu
function closeContextGlobal(e: MouseEvent) {
  if (contextMenuTarget.value !== null) {
    const target = e.target as HTMLElement;
    if (!target.closest('.context-menu') && !target.closest('.conv-more-btn')) {
      hideContextMenu();
    }
  }
}
onMounted(() => document.addEventListener('click', closeContextGlobal));
onUnmounted(() => document.removeEventListener('click', closeContextGlobal));

// Context Menu
const contextMenuTarget = ref<number | null>(null);
const contextMenuX = ref(0);
const contextMenuY = ref(0);

function showContextMenu(e: MouseEvent, index: number) {
  contextMenuTarget.value = index;
  contextMenuX.value = Math.min(e.clientX || e.pageX, window.innerWidth - 180);
  contextMenuY.value = Math.min(e.clientY || e.pageY, window.innerHeight - 100);
}

function hideContextMenu() {
  contextMenuTarget.value = null;
}

async function handleContextAction(action: 'rename' | 'delete' | 'pin') {
  const index = contextMenuTarget.value;
  hideContextMenu();
  if (index === null) return;
  
  if (action === 'rename') {
    startRename(index);
  } else if (action === 'delete') {
    const confirmed = await store.confirmDialog(`确定要删除「${getDisplayName(store.novels[index])}」吗？`, '删除对话');
    if (confirmed) {
      store.deleteNovel(index);
    }
  } else if (action === 'pin') {
    store.togglePinNovel(index);
  }
}

function handleNavigate(index: number) {
  if (renamingIndex.value !== null) return; // Prevent navigation while renaming
  store.openNovel(index);
}

function createNewChat() {
  store.activeId = null;
  store.showWasteland = false;
}
</script>

<style scoped lang="less">
.sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  height: 100vh;
  background-color: var(--bg-sidebar);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-speed), min-width var(--transition-speed), opacity var(--transition-speed), background-color 0.3s;
  overflow: hidden;
  position: relative;
  z-index: 100;

  &.collapsed {
    width: 0;
    min-width: 0;
    opacity: 0;
    pointer-events: none;
  }
}

.sidebar-header {
  display: flex;
  align-items: center;
  padding: 8px 14px; // 14px left + 10px inner icon offset = 24px icon left edge
  gap: 4px;
  height: 52px;
  min-height: 52px;
}

.sidebar-actions {
  padding: 8px 12px 0 12px;
}

.new-chat-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px; // 完美对齐基线
  border: none;
  border-radius: var(--radius-xl);
  background-color: transparent;
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition: background-color var(--transition-speed);

  &:hover {
    background-color: var(--bg-surface-hover);
  }

  .material-symbols-outlined {
    font-size: 20px;
    color: var(--text-secondary);
  }
}

.sidebar-nav {
  padding: 4px 12px;
}

.search-container {
  padding: 8px 12px; // 完美对齐基线
  border-radius: var(--radius-xl);
  background-color: var(--bg-surface-active);
  margin-top: 4px;
  border: 1px solid var(--border-color);
  
  // Base properties inherited from nav-item
  cursor: text;

  .search-icon {
    font-size: 20px;
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--text-primary);
    font-size: 14px;
    font-family: inherit;
    outline: none;
    &::placeholder {
      color: var(--text-muted);
    }
  }
}

.search-btn {
  margin-top: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px 12px; // 完美对齐基线
  border: none;
  border-radius: var(--radius-xl);
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition: background-color var(--transition-speed);
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;

  &:hover {
    background-color: var(--bg-surface-hover);
  }

  &.active {
    background-color: var(--bg-surface-active);
  }

  .material-symbols-outlined {
    font-size: 20px;
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  .nav-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;

    &.has-pin {
      padding-right: 24px;
    }
  }
}

.conv-item {
  position: relative;

  &:hover .conv-actions {
    opacity: 1;
    pointer-events: auto;
  }
  
  &:hover .static-pin {
    opacity: 0;
  }
}

.static-pin {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: var(--text-muted);
  transition: opacity var(--transition-speed);
  pointer-events: none;
}

.conv-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-speed);
  
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--bg-surface-hover);
  padding-left: 8px;
}

.conv-actions::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 0;
  width: 20px;
  height: 100%;
  background: linear-gradient(to right, transparent, var(--bg-surface-hover));
  pointer-events: none;
}

.conv-item.active .conv-actions {
  background: var(--bg-surface-active);
}

.conv-item.active .conv-actions::before {
  background: linear-gradient(to right, transparent, var(--bg-surface-active));
}

.conv-action-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-speed);

  &:hover {
    background-color: var(--bg-surface-active);
    color: var(--text-secondary);
  }

  .material-symbols-outlined {
    font-size: 16px;
  }
}

.conv-rename-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  padding: 0;
  min-width: 0;
  border-bottom: 2px solid var(--accent);
}

.sidebar-section {
  padding: 4px 12px;
}

.chat-section {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding-right: 2px; // Space for the scrollbar outer track

  .section-header {
    padding-left: 12px; 
    padding-right: 12px;
  }

  .section-items {
    flex: 1;
    overflow-y: auto;
    padding-right: 8px; // Inner padding to push scrollbar away from items
    padding-bottom: 24px;
    
    // Smooth scroll for internal navigation
    scroll-behavior: smooth;
  }
}

.empty-search-state {
  padding: 16px;
  color: var(--text-muted);
  font-size: 13px;
  text-align: center;
  margin-top: 20px;
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(128, 128, 128, 0.2) transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(128, 128, 128, 0.1);
    border-radius: 10px;
    transition: background 0.3s;
  }
  &:hover::-webkit-scrollbar-thumb {
    background: rgba(128, 128, 128, 0.4);
  }
}

.group-container {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.group-label {
  padding: 16px 12px 8px 12px; // 基线对齐 12px
  font-size: 11px;
  font-weight: 500;
  color: var(--text-primary); // Use primary color for group labels like "今天"
  background: var(--bg-sidebar); 
  position: sticky;
  top: 0;
  z-index: 10;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px 4px 12px; // 统一为 12px
  cursor: pointer;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.section-toggle {
  font-size: 18px;
  color: var(--text-muted);
  transition: transform var(--transition-speed);
}

.section-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sub-item {
  font-size: 13px;
  /* Removes unnecessary shift */
}

.sidebar-bottom {
  margin-top: auto;
  padding: 8px 12px 16px 12px;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}

.location-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px 0 16px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--text-muted);
    margin-top: 4px;
  }
}

.context-menu {
  position: fixed;
  background-color: var(--bg-modal);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lg);
  z-index: 5000;
  display: flex;
  flex-direction: column;
  min-width: 160px;
  padding: 4px 0;
  animation: ctxIn 0.15s ease;
}

@keyframes ctxIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: background-color var(--transition-speed);
  text-align: left;

  &:hover {
    background-color: var(--bg-surface-hover);
  }

  .material-symbols-outlined {
    font-size: 18px;
    color: var(--text-secondary);
  }
}

.chapter-item.active {
  background-color: var(--bg-surface-active); // It uses the updated #21242d
  border-radius: var(--radius-xl); // Keep pill shape from nav-item

  .nav-text {
    // Gemini active items keep the same text color and weight, just background changes
    color: var(--text-primary);
  }
}

.conv-icon {
  font-size: 20px;
  color: var(--text-secondary);
  opacity: 0.7;
}

// 移除不必要的间距缩小，调整缩进以基线对齐
.chapter-item {
  padding: 10px 12px; 
  min-height: 40px;
}

.pin-indicator {
  color: var(--accent) !important;
  opacity: 1 !important;
  
  .material-symbols-outlined {
    font-size: 14px;
  }
}


.chatgpt-logo-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-small {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--sparkle-bg);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

@media (max-width: 900px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 200;
    box-shadow: var(--shadow-lg);

    &.collapsed {
      width: 0;
      box-shadow: none;
    }
  }
}
</style>
