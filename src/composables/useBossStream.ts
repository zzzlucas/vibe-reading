import { ref, nextTick, type Ref, onUnmounted } from 'vue';
import { useAppStore } from '@/store/appStore';
import { formatContent } from '@/utils/formatters';

export function useBossStream(chatArea: Ref<HTMLElement | null>, isDummyChat: Ref<boolean>, chatTitle: Ref<string>) {
  const store = useAppStore();
  const bossStreamActive = ref(false);
  const bossStreamHtml = ref('');
  const bossStreamPageIndex = ref(0);
  let bossStreamTimer: any = null;

  function stopBossStream() {
    if (bossStreamTimer) {
      clearInterval(bossStreamTimer);
      bossStreamTimer = null;
    }
  }

  function startBossStream() {
    stopBossStream();
    bossStreamActive.value = false;
    bossStreamHtml.value = '';

    // Only AI styles get the streaming effect
    if (store.style !== 'gemini' && store.style !== 'chatgpt') return;

    const turn = store.settings.bossKeyStreamTurn || 'first';
    const pageIdx = turn === 'last' ? store.pages.length - 1 : 0;
    bossStreamPageIndex.value = pageIdx;

    const targetPage = store.pages[pageIdx] || '';
    if (!targetPage) return;

    const fullHtml = formatContent(targetPage, store, isDummyChat.value, chatTitle.value);
    if (!fullHtml || fullHtml.length < 20) return;

    const rawChars = store.settings.bossKeyStreamStartChars || 300;
    let startIndex = Math.min(rawChars * 4, Math.floor(fullHtml.length * 0.85));

    if (fullHtml.lastIndexOf('<', startIndex) > fullHtml.lastIndexOf('>', startIndex)) {
      const tagEnd = fullHtml.indexOf('>', startIndex);
      startIndex = tagEnd !== -1 ? tagEnd + 1 : startIndex;
    }

    bossStreamHtml.value = fullHtml.substring(0, startIndex);
    bossStreamActive.value = true;

    if (turn === 'last') {
      nextTick(() => {
        if (chatArea.value) {
          chatArea.value.scrollTop = chatArea.value.scrollHeight;
        }
      });
    }

    let index = startIndex;
    const charsPerTick = 3;

    bossStreamTimer = setInterval(() => {
      for (let i = 0; i < charsPerTick; i++) {
        if (index >= fullHtml.length) {
          stopBossStream();
          bossStreamHtml.value = fullHtml;
          return;
        }
        const char = fullHtml[index];
        if (char === '<') {
          const tagEnd = fullHtml.indexOf('>', index);
          index = tagEnd !== -1 ? tagEnd + 1 : index + 1;
        } else {
          index++;
        }
      }
      bossStreamHtml.value = fullHtml.substring(0, index);
      if (index >= fullHtml.length) {
        stopBossStream();
      }
    }, 30);
  }

  onUnmounted(() => {
    stopBossStream();
  });

  return {
    bossStreamActive,
    bossStreamHtml,
    bossStreamPageIndex,
    startBossStream,
    stopBossStream
  };
}
