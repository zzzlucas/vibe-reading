<template>
  <div class="modal-overlay" v-if="store.showHelp" @click.self="store.showHelp = false">
    <div class="modal-container">
      <div class="modal-header">
        <h2>使用帮助</h2>
        <button class="icon-btn modal-close" @click="store.showHelp = false">
        <icon-material-symbols-close />
      </button>
      </div>
      <div class="modal-body help-content">
        <p><strong>📖 加载作品</strong><br>
        1. 在侧边栏或欢迎页点击“加载作品文件”<br>
        2. 选择您本地的 <code>.txt</code> 格式的文本文件即可开始阅读。<br>
        <span class="text-muted">提示：所有文件数据仅保存在您的浏览器本地，不会上传服务器。</span></p>
        
        <p class="mt-4"><strong>🎮 快捷键操作</strong></p>
        <ul>
          <li><code>空格键</code> / <code>→</code> / <code>↓</code>：下一页</li>
          <li><code>←</code> / <code>↑</code>：上一页</li>
          <li><code>Esc</code>：关闭任意活动窗口</li>
        </ul>

        <p class="mt-4"><strong>💼 BOSS 键 (Boss Mode)</strong><br>
        当有人经过时，您可以瞬间将阅读器切换到工作界面。触发方式：<br>
        - 键盘任意键入 <strong>反引号 <code>`</code></strong>（Esc键下方）<br>
        - 或 <strong>双击</strong> 左上角 <code>{{ currentStyle.logo }}</code> 标志<br>
        <span class="text-muted">再次触发即可恢复阅读。</span></p>

        <p class="mt-4"><strong>✨ 阅读设置</strong><br>
        您可以在“设置”中随心更改主题色（提供深/浅色可选）、调整文字大小及行间距，还可修改应用风格语言。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '@/store/appStore';
import { STYLE_CONFIG } from '@/config/constants';

const store = useAppStore();
const currentStyle = computed(() => STYLE_CONFIG[store.style]);

</script>
