<template>
  <div class="modal-overlay" v-if="store.showHelp" @click.self="store.showHelp = false">
    <div class="modal-container">
      <div class="modal-header">
        <h2>使用帮助</h2>
        <button class="icon-btn modal-close" @click="store.showHelp = false">
        <icon-material-symbols-close />
      </button>
      </div>
      <div class="modal-body help-content markdown-body" v-html="renderedHelp">
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '@/store/appStore';
import { STYLE_CONFIG } from '@/config/constants';
import { marked } from 'marked';
import helpDocRaw from '../../../read_help.md?raw';

const store = useAppStore();
const currentStyle = computed(() => STYLE_CONFIG[store.style]);

const processedDoc = computed(() => {
  return helpDocRaw.replace('{{ currentStyle.logo }}', currentStyle.value.logo);
});

const renderedHelp = computed(() => {
  return marked.parse(processedDoc.value) as string;
});

</script>

<style scoped>
.help-content :deep(h3) {
  font-size: 1.1rem;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}
.help-content :deep(ul) {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin-bottom: 0.5rem;
}
.help-content :deep(li) {
  margin-bottom: 0.25rem;
}
.help-content :deep(p) {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}
.help-content :deep(blockquote) {
  color: var(--text-muted);
  border-left: 4px solid var(--border-color);
  padding-left: 1rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
.help-content :deep(code) {
  background: var(--bg-hover);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.9em;
}
.help-content :deep(strong) {
  font-weight: 600;
}
</style>
