<template>
  <div class="wasteland-view">
    <div class="wasteland-content">
      <div class="wasteland-icon-wrap">
        <icon-material-symbols-landscape />
      </div>
      <h2 class="wasteland-title">你来到了一片没有知识的荒原</h2>
      <p class="wasteland-desc">这里的星球还在自转，只是所有的连接都暂时断开了。<br>你可以尝试加载一份本地文档，或者在设置中探索更多功能。</p>
      <button class="wasteland-btn" @click="store.showWasteland = false; store.activeId = null">回到主页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/store/appStore';

const store = useAppStore();
</script>

<style scoped lang="less">
.wasteland-view {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.5s ease;
  min-height: 400px;
}

.wasteland-content {
  text-align: center;
  max-width: 400px;
}

.wasteland-icon-wrap {
  font-size: 64px;
  color: var(--text-muted);
  margin-bottom: 24px;
  opacity: 0.5;
}

.wasteland-title {
  font-size: 24px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.wasteland-desc {
  font-size: 15px;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 32px;
}

.wasteland-btn {
  padding: 10px 24px;
  background-color: var(--accent-blue);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
}
</style>
