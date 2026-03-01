<template>
  <div class="settings-section">
    <div class="section-body">
      <CareerSettings />
      <FeedbackSettings />
      <CustomTextSettings />
      <AiSettings />
      <NovelManagementSettings />
      <StorageSettings />
      <div class="advanced-sub-group compliance-disclaimer">
        <div class="sub-group-title">
          <icon-material-symbols-info-outline />
          <span>合规性与免责声明</span>
        </div>
        <div class="disclaimer-content">
          此项目仅为本地文本解析与排版工具。本工具不提供、不线上存储、不分发任何文本内容。用户使用本工具导入、阅读的任何内容，其版权及合法性均由用户自行负责。请用户严格遵守相关法律法规，勿用于阅读违规或侵权内容。本工具仅供个人效率管理使用，因使用本工具导致的任何职场纠纷或法律责任，与开发者无关。
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/store/appStore';
import CareerSettings from './Advanced/CareerSettings.vue';
import FeedbackSettings from './Advanced/FeedbackSettings.vue';
import CustomTextSettings from './Advanced/CustomTextSettings.vue';
import NovelManagementSettings from './Advanced/NovelManagementSettings.vue';
import AiSettings from './Advanced/AiSettings.vue';
import StorageSettings from './Advanced/StorageSettings.vue';

const store = useAppStore();
</script>
