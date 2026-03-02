<template>
  <div class="blog1-page">
    <!-- Top Navigation Bar -->
    <nav class="blog1-navbar">
      <div class="blog1-navbar-inner">
        <div class="blog1-navbar-left">
          <a class="blog1-logo" @click.prevent><span>🏠</span> 博客园</a>
          <a class="blog1-nav-link" @click.prevent>会员</a>
          <a class="blog1-nav-link" @click.prevent>周边</a>
          <a class="blog1-nav-link" @click.prevent>新闻</a>
          <a class="blog1-nav-link" @click.prevent>博问</a>
          <a class="blog1-nav-link" @click.prevent>闪存</a>
          <a class="blog1-nav-link" @click.prevent>公包</a>
          <a class="blog1-nav-link" @click.prevent>赞助商</a>
          <a class="blog1-nav-link blog1-highlight" @click.prevent>Chat2DB</a>
        </div>
        <div class="blog1-navbar-right">
          <div class="blog1-nav-search">
            <input type="text" placeholder="代码改变世界" />
            <button class="blog1-nav-search-btn">🔍</button>
          </div>
          <a class="blog1-nav-link" @click.prevent>注册</a>
          <a class="blog1-nav-link" @click.prevent @click="store.showSettings = true">登录</a>
        </div>
      </div>
    </nav>

    <!-- Blog Header -->
    <div class="blog1-header">
      <h1 class="blog1-blog-name" @dblclick="store.toggleBossMode()">{{ blogName }}</h1>
      <p class="blog1-blog-subtitle">{{ blogSubtitle }}</p>
    </div>

    <!-- Sub Navigation -->
    <div class="blog1-subnav">
      <div class="blog1-subnav-inner">
        <div class="blog1-subnav-links">
          <a @click.prevent="goHome" :class="{ active: !store.activeId }">博客园</a>
          <a @click.prevent="goHome">首页</a>
          <a @click.prevent>新随笔</a>
          <a @click.prevent @click="store.showSettings = true">联系</a>
          <a @click.prevent>订阅</a>
          <a @click.prevent @click="store.showSettings = true">管理</a>
        </div>
        <div class="blog1-subnav-stats">
          随笔 - {{ store.novels.length || 14 }}&nbsp;&nbsp;文章 - 0&nbsp;&nbsp;评论 - 14&nbsp;&nbsp;阅读 - 13645
        </div>
      </div>
    </div>

    <!-- Main Body -->
    <div class="blog1-body">
      <!-- Left Sidebar -->
      <aside class="blog1-sidebar">
        <!-- 公告 -->
        <div class="blog1-widget">
          <h3 class="blog1-widget-title">公告</h3>
          <div class="blog1-widget-content">
            <div class="blog1-profile-row">昵称: <span>{{ store.userName }}</span></div>
            <div class="blog1-profile-row">园龄: <span>4年5个月</span></div>
            <div class="blog1-profile-row">粉丝: <span>9</span></div>
            <div class="blog1-profile-row">关注: <span>1</span></div>
            <button class="blog1-follow-btn" @click="store.showToast('已关注')">+加关注</button>
          </div>
        </div>

        <!-- 日历 -->
        <div class="blog1-widget blog1-cal-widget">
          <div class="blog1-cal-head">
            <button @click="calPrev">&lt;</button>
            <span>{{ calYear }}年{{ calMonth }}月</span>
            <button @click="calNext">&gt;</button>
          </div>
          <table class="blog1-cal-table">
            <thead><tr><th v-for="d in '日一二三四五六'" :key="d">{{ d }}</th></tr></thead>
            <tbody>
              <tr v-for="(week, wi) in calWeeks" :key="wi">
                <td v-for="(day, di) in week" :key="di" :class="{ today: day.t, empty: !day.n }">{{ day.n || '' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 搜索 -->
        <div class="blog1-widget">
          <h3 class="blog1-widget-title">搜索</h3>
          <div class="blog1-widget-content blog1-search-row">
            <input type="text" class="blog1-sidebar-input" />
            <button class="blog1-sidebar-btn">找找看</button>
          </div>
        </div>

        <!-- 常用链接 -->
        <div class="blog1-widget">
          <h3 class="blog1-widget-title">常用链接</h3>
          <div class="blog1-widget-content blog1-links">
            <a @click.prevent="goHome">我的随笔</a>
            <a @click.prevent>我的评论</a>
            <a @click.prevent>我的参与</a>
            <a @click.prevent>最新评论</a>
            <a @click.prevent>我的标签</a>
          </div>
        </div>

        <!-- 随笔分类 (Novel Navigation) -->
        <div class="blog1-widget" v-if="store.novels.length > 0">
          <h3 class="blog1-widget-title">随笔分类</h3>
          <div class="blog1-widget-content blog1-links">
            <a v-for="(novel, idx) in store.novels.slice(0, 10)"
               :key="novel.id"
               :class="{ 'blog1-active': store.activeNovelIndex === idx }"
               @click.prevent="store.openNovel(idx)">
              {{ getDisplayName(novel) }}({{ fakeCount(idx) }})
            </a>
          </div>
        </div>

        <!-- 随笔档案 -->
        <div class="blog1-widget">
          <h3 class="blog1-widget-title">随笔档案</h3>
          <div class="blog1-widget-content blog1-links">
            <a @click.prevent>2026年3月(1)</a>
            <a @click.prevent>2026年2月(5)</a>
            <a @click.prevent>2026年1月(8)</a>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="blog1-main">
        <ReaderScreen />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStore } from '@/store/appStore';
import { STYLE_CONFIG } from '@/config/constants';
import ReaderScreen from './ReaderScreen.vue';
import type { Novel } from '@/types';

const store = useAppStore();
const currentStyle = computed(() => STYLE_CONFIG[store.style]);

const blogName = computed(() => currentStyle.value?.logo || 'deep-sky');
const blogSubtitle = computed(() => '一名程序猿的探索和沉淀  微信公众号: ' + (store.userName || 'DeepSky'));

function goHome() { store.activeId = null; store.showWasteland = false; }
function getDisplayName(novel: Novel) { return novel.displayName || novel.name.replace(/\.txt$/i, ''); }
function fakeCount(idx: number) { return (idx * 7 + 3) % 10 + 1; }

// Calendar
const calYear = ref(new Date().getFullYear());
const calMonth = ref(new Date().getMonth() + 1);
function calPrev() { if (calMonth.value === 1) { calMonth.value = 12; calYear.value--; } else calMonth.value--; }
function calNext() { if (calMonth.value === 12) { calMonth.value = 1; calYear.value++; } else calMonth.value++; }
const calWeeks = computed(() => {
  const y = calYear.value, m = calMonth.value;
  const firstDay = new Date(y, m - 1, 1).getDay();
  const daysInMonth = new Date(y, m, 0).getDate();
  const today = new Date();
  const isCur = today.getFullYear() === y && today.getMonth() + 1 === m;
  const cells: { n: number; t: boolean }[] = [];
  for (let i = 0; i < firstDay; i++) cells.push({ n: 0, t: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ n: d, t: isCur && today.getDate() === d });
  while (cells.length % 7 !== 0) cells.push({ n: 0, t: false });
  const weeks: { n: number; t: boolean }[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
});

const searchText = ref('');
</script>

<style scoped lang="less">
/* ===== Blog1 Page Shell ===== */
.blog1-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: var(--blog1-page-bg, #e0e0e0);
  font-family: Verdana, Arial, Helvetica, sans-serif;
  font-size: 13px;
  color: #333;
}

/* ===== Navbar ===== */
.blog1-navbar {
  background: var(--blog1-nav-bg, #5B9BD5);
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}
.blog1-navbar-inner {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
}
.blog1-navbar-left, .blog1-navbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
}
.blog1-logo {
  color: #fff;
  font-weight: bold;
  font-size: 14px;
  text-decoration: none;
  margin-right: 8px;
  cursor: pointer;
  white-space: nowrap;
}
.blog1-nav-link {
  color: rgba(255,255,255,0.9);
  text-decoration: none;
  font-size: 12px;
  padding: 4px 6px;
  cursor: pointer;
  white-space: nowrap;
  &:hover { color: #fff; text-decoration: underline; }
}
.blog1-highlight { color: #FFD700; }
.blog1-nav-search {
  display: flex;
  align-items: center;
  input {
    width: 120px;
    height: 22px;
    border: 1px solid rgba(255,255,255,0.4);
    border-radius: 2px;
    padding: 0 6px;
    font-size: 11px;
    background: rgba(255,255,255,0.15);
    color: #fff;
    outline: none;
    &::placeholder { color: rgba(255,255,255,0.6); }
  }
}
.blog1-nav-search-btn {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
  padding: 2px 4px;
}

/* ===== Blog Header ===== */
.blog1-header {
  background: var(--blog1-header-bg, linear-gradient(180deg, #7ECEF4 0%, #B8E4F9 100%));
  padding: 14px 20px 10px;
  flex-shrink: 0;
  text-align: left;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
}
.blog1-blog-name {
  font-size: 22px;
  font-weight: bold;
  color: var(--blog1-header-text, #333);
  margin: 0;
  cursor: pointer;
}
.blog1-blog-subtitle {
  font-size: 12px;
  color: var(--blog1-header-sub, #555);
  margin: 4px 0 0;
}

/* ===== Sub Navigation ===== */
.blog1-subnav {
  background: var(--blog1-subnav-bg, #D4EBF8);
  flex-shrink: 0;
  border-bottom: 1px solid var(--blog1-border, #ccc);
}
.blog1-subnav-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  height: 32px;
}
.blog1-subnav-links {
  display: flex;
  gap: 2px;
  a {
    color: var(--blog1-link, #1a6496);
    text-decoration: none;
    font-size: 13px;
    padding: 4px 10px;
    border-radius: 3px 3px 0 0;
    cursor: pointer;
    &:hover, &.active {
      background: var(--blog1-subnav-active, #A6D4ED);
      color: #333;
    }
  }
}
.blog1-subnav-stats {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

/* ===== Main Body ===== */
.blog1-body {
  flex: 1;
  min-height: 0;
  display: flex;
  max-width: 1100px;
  width: 100%;
  margin: 8px auto 0;
  gap: 8px;
}

/* ===== Left Sidebar ===== */
.blog1-sidebar {
  width: 200px;
  min-width: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 12px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }
}

.blog1-widget {
  background: var(--blog1-card-bg, #fff);
  border: 1px solid var(--blog1-border, #ddd);
}
.blog1-widget-title {
  font-size: 12px;
  font-weight: bold;
  color: var(--blog1-widget-title-color, #4a7ea8);
  padding: 5px 10px;
  margin: 0;
  border-bottom: 1px solid var(--blog1-border, #ddd);
  background: var(--blog1-widget-title-bg, #f0f8ff);
}
.blog1-widget-content {
  padding: 8px 10px;
  font-size: 12px;
}

/* Profile */
.blog1-profile-row {
  margin-bottom: 3px;
  color: #555;
  span { color: #333; }
}
.blog1-follow-btn {
  margin-top: 6px;
  padding: 2px 10px;
  font-size: 11px;
  background: var(--blog1-nav-bg, #5B9BD5);
  color: #fff;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  &:hover { opacity: 0.85; }
}

/* Calendar */
.blog1-cal-widget {
  padding: 0;
}
.blog1-cal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background: var(--blog1-widget-title-bg, #f0f8ff);
  border-bottom: 1px solid var(--blog1-border, #ddd);
  font-size: 12px;
  button {
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 14px;
    color: var(--blog1-link, #1a6496);
    padding: 0 4px;
    &:hover { color: #0d4f7e; }
  }
}
.blog1-cal-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  text-align: center;
  th {
    padding: 2px;
    font-weight: normal;
    color: #888;
    font-size: 11px;
  }
  td {
    padding: 2px;
    cursor: default;
    &.today {
      background: var(--blog1-nav-bg, #5B9BD5);
      color: #fff;
      font-weight: bold;
      border-radius: 2px;
    }
    &.empty { visibility: hidden; }
  }
}

/* Search */
.blog1-search-row {
  display: flex;
  gap: 4px;
}
.blog1-sidebar-input {
  flex: 1;
  height: 22px;
  border: 1px solid #ccc;
  padding: 0 4px;
  font-size: 11px;
  outline: none;
  background: #fff;
  color: #333;
}
.blog1-sidebar-btn {
  padding: 0 8px;
  height: 22px;
  font-size: 11px;
  background: #f5f5f5;
  border: 1px solid #ccc;
  cursor: pointer;
  white-space: nowrap;
  &:hover { background: #e8e8e8; }
}

/* Links */
.blog1-links {
  display: flex;
  flex-direction: column;
  gap: 3px;
  a {
    color: var(--blog1-link, #1a6496);
    text-decoration: none;
    font-size: 12px;
    cursor: pointer;
    padding: 1px 0;
    &:hover { text-decoration: underline; color: #0d4f7e; }
    &.blog1-active { font-weight: bold; color: #c00; }
  }
}

/* ===== Main Content Area ===== */
.blog1-main {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  background: var(--blog1-card-bg, #fff);
  border: 1px solid var(--blog1-border, #ddd);

  /* Override ReaderScreen internals */
  :deep(.main-content) {
    height: 100% !important;
    background: transparent !important;
  }
  :deep(.top-bar) {
    display: none !important;
  }
  :deep(.input-area) {
    display: none !important;
  }
  :deep(.dev-quick-settings-btn) {
    display: none !important;
  }
  :deep(.chat-area) {
    padding: 12px 20px;
  }
  :deep(.message-container) {
    max-width: 100%;
  }
  :deep(.reading-content-layout) {
    flex-direction: column;
  }
  /* Restyle user bubble as article title */
  :deep(.user-message) {
    align-items: flex-start;
    margin-bottom: 8px;
  }
  :deep(.user-msg-bubble) {
    background: transparent !important;
    padding: 0 !important;
    max-width: 100% !important;
    color: var(--blog1-title-link, #275E8E) !important;
    font-size: 20px !important;
    font-weight: bold !important;
    border-radius: 0 !important;
    white-space: normal !important;
  }
  :deep(.user-img-row) {
    display: none !important;
  }
  /* Hide AI avatar */
  :deep(.ai-avatar) {
    display: none !important;
  }
  :deep(.ai-response) {
    gap: 0 !important;
    margin-bottom: 8px;
  }
  :deep(.ai-text) {
    font-size: 14px !important;
    line-height: 1.7 !important;
    color: var(--blog1-text, #333) !important;
  }
  :deep(.ai-text p) {
    margin-bottom: 10px;
    text-indent: 0;
  }
  /* Hide response actions */
  :deep(.response-actions) {
    display: none !important;
  }
  /* Restyle page nav */
  :deep(.footer-safety-wrapper) {
    margin-top: 16px;
    opacity: 1 !important;
    transform: none !important;
    pointer-events: auto !important;
  }
  :deep(.page-nav) {
    margin-left: 0;
    border-top: 1px dashed var(--blog1-border, #ddd);
    padding-top: 12px;
  }
  :deep(.page-nav-btn) {
    background: var(--blog1-widget-title-bg, #f0f8ff);
    border-color: var(--blog1-border, #ddd);
    color: var(--blog1-link, #1a6496);
    border-radius: 3px;
    font-size: 13px;
    &:hover:not(:disabled) {
      background: var(--blog1-subnav-bg, #D4EBF8);
    }
  }
  :deep(.page-info) {
    color: #666;
  }
  /* Welcome screen override */
  :deep(.welcome-screen) {
    padding: 40px 20px;
  }
  /* Code block override for blog style */
  :deep(.code-block) {
    background: #f5f5f5 !important;
    border: 1px solid #ddd !important;
  }
  :deep(.code-header) {
    background: #eaeaea !important;
    border-bottom-color: #ddd !important;
  }
  :deep(.code-lang-label) {
    color: #666 !important;
  }
  :deep(pre) {
    background: transparent !important;
  }
  :deep(pre code) {
    color: #333 !important;
  }
  :deep(.hljs) {
    background: transparent !important;
    color: #333 !important;
  }
  :deep(.hljs-keyword) { color: #0000ff !important; }
  :deep(.hljs-string) { color: #a31515 !important; }
  :deep(.hljs-comment) { color: #008000 !important; }
  :deep(.hljs-number) { color: #098658 !important; }
  :deep(.hljs-built_in) { color: #795E26 !important; }
  :deep(.hljs-function), :deep(.hljs-title) { color: #795E26 !important; }
  :deep(.hljs-type) { color: #267f99 !important; }

  /* Hide BossSidebar inside blog layout */
  :deep(.fake-sidebar) {
    display: none !important;
  }
}

/* Responsive */
@media (max-width: 800px) {
  .blog1-sidebar { width: 160px; min-width: 160px; }
  .blog1-navbar-right { display: none; }
}
@media (max-width: 600px) {
  .blog1-sidebar { display: none; }
  .blog1-body { margin: 4px; }
}
</style>
