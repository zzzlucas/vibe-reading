import { ref, computed, onUnmounted } from 'vue';
import { useAppStore } from '@/store/appStore';
import { formatContent } from '@/utils/formatters';

export function useTypewriter(isDummyChat: any, chatTitle: any) {
  const store = useAppStore();
  const typewriterHtml = ref('');
  let typewriterTimer: any = null;

  const useTypewriterEffect = computed(() => {
    if (store.style !== 'gemini' && store.style !== 'chatgpt') return false;
    if (isDummyChat.value) return false;
    if (store.settings.readingMode === 'scroll') return false;
    return store.settings.typewriterMode;
  });

  function stopTypewriter() {
    if (typewriterTimer) {
      clearInterval(typewriterTimer);
      typewriterTimer = null;
    }
  }

  function startTypewriter() {
    stopTypewriter();
    const rawContent = store.pages[store.currentPage] || '';
    if (!rawContent) {
      typewriterHtml.value = '';
      return;
    }

    const fullHtml = formatContent(rawContent, store, isDummyChat.value, chatTitle.value);
    
    const shouldType = useTypewriterEffect.value && store.triggerTypewriter && !store.skipNextTypewriter;

    if (!shouldType) {
      typewriterHtml.value = fullHtml;
      store.triggerTypewriter = false;
      store.skipNextTypewriter = false;
      return;
    }

    store.triggerTypewriter = false;
    typewriterHtml.value = '';
    let index = 0;
    const charsPerTick = Math.max(1, Math.floor(60 / Math.max(1, store.settings.typewriterSpeed))); 
    
    typewriterTimer = setInterval(() => {
      for (let i = 0; i < charsPerTick; i++) {
        if (index >= fullHtml.length) {
          stopTypewriter();
          break;
        }
        
        const char = fullHtml[index];
        if (char === '<') {
          const tagEnd = fullHtml.indexOf('>', index);
          if (tagEnd !== -1) {
            index = tagEnd + 1;
          } else {
            index++;
          }
        } else {
          index++;
        }
      }
      
      typewriterHtml.value = fullHtml.substring(0, index);
      
      if (index >= fullHtml.length) {
        stopTypewriter();
      }
    }, store.settings.typewriterSpeed);
  }

  onUnmounted(() => {
    stopTypewriter();
  });

  return {
    typewriterHtml,
    useTypewriterEffect,
    startTypewriter,
    stopTypewriter
  };
}
