<template>
  <header class="top-bar">
    <div class="top-bar-left">
      <button class="icon-btn sidebar-toggle-btn" 
              v-if="!store.sidebarOpen"
              @click="store.sidebarOpen = true"
              title="显示侧边栏">
        <icon-material-symbols-menu />
      </button>
      <span class="logo-text top-logo" @dblclick="store.toggleBossMode()">{{ store.appTitle }}</span>
      <span class="top-bar-novel-title" v-if="store.settings.showNovelTitle && store.activeId">
        {{ chatTitle }}
      </span>
    </div>
    <div class="top-bar-right">
      <button v-if="!store.isPro" class="top-btn" @click="openProSettings">
        升级 Pro
      </button>
      <button class="icon-btn" @click="toggleTheme" title="切换主题">
        <icon-material-symbols-light-mode v-if="store.theme === 'dark'" />
        <icon-material-symbols-dark-mode v-else />
      </button>
      <div class="avatar-dropdown-wrapper" ref="avatarDropdownRef" v-click-outside="() => showAvatarDropdown = false">
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
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStore } from '@/store/appStore';
import { STYLE_CONFIG } from '@/config/constants';

const store = useAppStore();
const showAvatarDropdown = ref(false);

const currentStyle = computed(() => STYLE_CONFIG[store.style]);

const chatTitle = computed(() => {
  if (store.activeNovelIndex === null) {
    return store.style === 'gemini' ? store.appTitle : currentStyle.value.title;
  }
  const novel = store.novels[store.activeNovelIndex];
  return novel ? (novel.displayName || novel.name.replace(/\.txt$/i, '')) : '';
});

function toggleTheme() {
  store.theme = store.theme === 'dark' ? 'light' : 'dark';
}

function openProfileModal() {
  showAvatarDropdown.value = false;
  store.showProfileModal = true;
}

function openSettings() {
  showAvatarDropdown.value = false;
  store.showSettings = true;
}

function openProSettings() {
  showAvatarDropdown.value = false;
  store.scrollToUpgrade();
}

// Directive for clicking outside
const vClickOutside = {
  mounted(el: any, binding: any) {
    el._clickOutside = (event: Event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value();
      }
    };
    document.addEventListener('click', el._clickOutside);
  },
  unmounted(el: any) {
    document.removeEventListener('click', el._clickOutside);
  }
};
</script>

<style scoped lang="less">
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
  min-width: 0;
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

.top-bar-novel-title {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
  margin-left: 4px;
  padding-left: 12px;
  position: relative;
}

.top-bar-novel-title::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 12px;
  width: 1px;
  background-color: var(--border-color);
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

  svg {
    font-size: 20px;
    color: var(--text-secondary);
  }
}
</style>
