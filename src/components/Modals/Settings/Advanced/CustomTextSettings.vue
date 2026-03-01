<template>
  <div class="advanced-sub-group">
    <div class="sub-group-title">
       <icon-material-symbols-edit-note />
       <span>个性化文案</span>
    </div>
    <div class="setting-item no-border">
      <div class="setting-label">
        <div class="label-with-desc">
          <span>“敬请期待”提示语</span>
          <span class="desc-text">自定义点击未开发功能时的弹窗内容</span>
        </div>
      </div>
      <div class="setting-control">
        <input 
          type="text" 
          v-model="store.comingSoonText" 
          class="custom-text-input" 
          placeholder="例如：功能开发中，攒够 100 个赞就上线"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/store/appStore';
const store = useAppStore();
</script>

<style scoped>
.custom-text-input {
  width: 100%;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  font-size: 13px;
  transition: all 0.2s ease;
}

.custom-text-input:focus {
  outline: none;
  border-color: var(--text-secondary);
  background: var(--bg-surface);
}
</style>
