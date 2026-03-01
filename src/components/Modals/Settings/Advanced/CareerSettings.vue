<template>
  <div class="advanced-sub-group" id="achievement-section">
    <div class="sub-group-title">
       <icon-material-symbols-workspace-premium />
       <span>职场进阶 {{ store.settings.bossModeUnlocked ? '(已开启 BOSS 关怀)' : '' }}</span>
    </div>
    <!-- Preset Toggle -->
    <div class="setting-item no-border">
      <div class="setting-label">
        <span>快速项目更名</span>
      </div>
      <div class="setting-control selector-group">
        <button class="preset-btn" :class="{ active: store.appTitle === 'FindDeep' }" @click="store.appTitle = 'FindDeep'">FindDeep</button>
        <button class="preset-btn" :class="{ active: store.appTitle === 'DeepReader' }" @click="store.appTitle = 'DeepReader'">DeepReader</button>
        <button class="preset-btn" :class="{ active: store.appTitle === 'DeepWork' }" @click="store.appTitle = 'DeepWork'">DeepWork</button>
      </div>
    </div>
    <!-- Custom Name -->
    <div class="setting-item no-border">
      <div class="setting-label">
        <span>自定义名称</span>
      </div>
      <div class="setting-control">
        <input type="text" v-model="store.appTitle" class="name-input-small">
      </div>
    </div>
    <!-- Humor text -->
    <div class="humor-footer">
      <span :class="{ 'achievement-highlight': store.isNewAchievement }">
        Redefining {{ store.appTitle }}
      </span>
      <span class="status-wlb">Project Status: Maintaining Work-Life Balance...</span>
      <span class="power-saving">Power Saving Mode</span>
      <span class="self-recharge">Self-Recharging</span>
      <span class="res-optimized">Resource Allocation: Optimized</span>
      <span class="lazy-virtue" @click="store.showToast('正解！懒惰是让世界自动化的动力 ☕', 'achievement')">Laziness is the first virtue of a programmer</span>
      <span class="faker-legacy" @click="store.showToast('大魔王降临！不灭之握 🎮', 'achievement')">Hide on bush</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/store/appStore';
const store = useAppStore();
</script>
