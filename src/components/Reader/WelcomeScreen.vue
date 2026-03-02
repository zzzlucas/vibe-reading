<template>
  <div class="welcome-screen">
    <!-- Gemini specific welcome -->
    <template v-if="store.style === 'gemini'">
      <div class="gemini-greeting">
        <h1 class="greeting-h1">
          <div class="greeting-name">
            <span class="gemini-welcome-sparkle">
              <FindDeepSparkle size="32px" />
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
          <div class="welcome-card" @click="$emit('trigger-file')">
            <icon-material-symbols-menu-book class="card-icon" />
            <span class="card-text">加载阅读作品文件</span>
          </div>
          <div class="welcome-card" @click="store.showSettings = true">
            <icon-material-symbols-settings class="card-icon" />
            <span class="card-text">打开设置查看更多选项</span>
          </div>
          <div class="welcome-card" @click="openRecent">
            <icon-material-symbols-history class="card-icon" />
            <span class="card-text">继续阅读最近打开的对话</span>
          </div>
          <div class="welcome-card" @click="store.showHelp = true">
            <icon-material-symbols-help class="card-icon" />
            <span class="card-text">查看快捷操作及使用指南</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '@/store/appStore';
import { STYLE_CONFIG } from '@/config/constants';
import FindDeepSparkle from '@/components/FindDeepSparkle.vue';

const store = useAppStore();
const currentStyle = computed(() => STYLE_CONFIG[store.style]);

defineEmits(['trigger-file']);

function openRecent() {
  if (store.novels.length > 0) {
    store.openNovel(0);
  } else {
    store.showToast('暂无阅读记录');
  }
}
</script>

<style scoped lang="less">
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
    color: var(--text-secondary);
  }

  .card-text {
    font-size: 14px;
    color: var(--text-primary);
    line-height: 1.4;
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

.greeting-text {
  color: var(--text-primary);
}

.greeting-subtitle {
  color: var(--text-secondary);
  font-size: 32px;
  font-weight: 500;
  margin-top: 4px;
}
@media (max-width: 900px) {
  .welcome-cards { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 600px) {
  .welcome-cards { grid-template-columns: 1fr; }
}
</style>
