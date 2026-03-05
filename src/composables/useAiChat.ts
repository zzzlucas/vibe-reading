import { ref, computed, nextTick, type Ref } from 'vue';
import { useAppStore } from '@/store/appStore';
import { ContentDB } from '@/utils/db';

export function useAiChat(attachedImages: Ref<string[]>, chatArea: Ref<HTMLElement | null>) {
  const store = useAppStore();
  const reasoningOpen = ref(false);
  const userScrolledUp = ref(false);

  const isAiGenerating = computed(() => {
    if (store.activeNovelIndex === null || !store.novels[store.activeNovelIndex]) return false;
    return store.generatingContexts.has(store.novels[store.activeNovelIndex].id);
  });

  const isActiveStreaming = computed(() => isAiGenerating.value);

  const isAiWaitingFirstToken = computed(() => {
    if (store.activeNovelIndex === null || !store.novels[store.activeNovelIndex]) return false;
    return store.generatingContexts.get(store.novels[store.activeNovelIndex].id)?.isWaitingFirstToken || false;
  });

  const isAiWaitingMainResponse = computed(() => {
    if (store.activeNovelIndex === null || !store.novels[store.activeNovelIndex]) return false;
    return store.generatingContexts.get(store.novels[store.activeNovelIndex].id)?.isWaitingMainResponse || false;
  });

  const streamingReasoning = computed(() => {
    if (store.activeNovelIndex === null || !store.novels[store.activeNovelIndex]) return '';
    return store.generatingContexts.get(store.novels[store.activeNovelIndex].id)?.streamingReasoning || '';
  });

  const streamingMainResponse = computed(() => {
    if (store.activeNovelIndex === null || !store.novels[store.activeNovelIndex]) return '';
    return store.generatingContexts.get(store.novels[store.activeNovelIndex].id)?.streamingMainResponse || '';
  });

  const isImageModel = (model: string) => {
    const m = model.toLowerCase();
    return m.includes('image') || m.includes('diffusion') || m.includes('flux') || m.includes('sd-') || m.includes('stable-diffusion') || m.includes('dall-e') || m.includes('kolors') || m.includes('cogview') || m.includes('playground');
  };

  function stopAiGeneration() {
    if (store.activeNovelIndex === null || !store.novels[store.activeNovelIndex]) return;
    const chatId = store.novels[store.activeNovelIndex].id;
    const ctx = store.generatingContexts.get(chatId);
    if (ctx && ctx.abortController) {
      ctx.abortController.abort();
      store.generatingContexts.delete(chatId);
    }
  }

  async function handleAiChat(input: string) {
    if (isAiGenerating.value) return;

    const currentAbortController = new AbortController();
    const signal = currentAbortController.signal;
    
    let novelIndex = store.activeNovelIndex;
    
    const imagesToSend = [...attachedImages.value];
    attachedImages.value = [];
    
    let imagesMarkdown = '';
    if (imagesToSend.length > 0) {
      imagesMarkdown = '\n' + imagesToSend.map(img => `![图片](${img})`).join('  ');
    }
    const finalInputText = input + imagesMarkdown;
    
    const isDummyChat = computed(() => {
      if (store.activeNovelIndex === null) return false;
      const novel = store.novels[store.activeNovelIndex];
      return !!novel && (novel.type === 'fake' || novel.type === 'ai');
    });

    if (novelIndex === null || !isDummyChat.value) { 
      const chatId = store.generateUid();
      const chatName = `ai_${Date.now()}.txt`;
      const initialContent = `[USER]: ${finalInputText}\n\n`;
      await ContentDB.save(chatId, initialContent, 'ai', chatName);
      
      store.novels.unshift({
        id: chatId,
        type: 'ai',
        name: chatName,
        size: initialContent.length,
        lastRead: Date.now(),
        currentPage: 0,
        displayName: input.substring(0, 20) || '多模态对话'
      });
      store._saveNovelsMeta();
      novelIndex = 0;
      store.activeId = chatId;
      store.pages = [initialContent];
      store.totalPages = 1;
      store.currentPage = 0;
    } else {
      const newRound = `[USER]: ${finalInputText}\n\n`;
      const lastPage = store.pages[store.pages.length - 1] || '';
      const lastPageAiMatch = lastPage.match(/^\[USER\]:\s*[\s\S]*?\n\n([\s\S]*)$/);
      const lastPageHasAiResponse = lastPageAiMatch && lastPageAiMatch[1].trim().length > 0;
      
      if (!lastPageHasAiResponse && store.pages.length > 0) {
        store.pages[store.pages.length - 1] = newRound;
      } else {
        store.pages.push(newRound);
      }
      
      store.totalPages = store.pages.length;
      store.currentPage = store.pages.length - 1;
      store._syncNovelPage();
      nextTick(() => { if (chatArea.value) chatArea.value.scrollTop = chatArea.value.scrollHeight; });
    }

    reasoningOpen.value = false;
    userScrolledUp.value = false;
    
    const ctxChatId = store.novels[novelIndex].id;
    store.generatingContexts.set(ctxChatId, {
      abortController: currentAbortController,
      isWaitingFirstToken: true,
      isWaitingMainResponse: true,
      pages: [...store.pages],
      pageIndex: store.pages.length - 1,
      streamingReasoning: '',
      streamingMainResponse: ''
    });
    
    let currentResponse = '';
    let currentReasoning = '';

    const ctx = store.generatingContexts.get(ctxChatId)!;
    const snapshotPages = [...ctx.pages];

    const messages = [];
    for (let i = 0; i < snapshotPages.length; i++) {
      const page = snapshotPages[i];
      const match = page.match(/^\[USER\]:\s*([\s\S]*?)\n\n([\s\S]*)$/);
      const fallbackMatch = page.match(/^\[USER\]:\s*([\s\S]*)$/);
      
      let uMsg = match ? match[1] : (fallbackMatch ? fallbackMatch[1] : '');
      let aMsg = match ? match[2] : '';

      if (i < snapshotPages.length - 1 && (!aMsg || aMsg.trim() === '')) {
        continue;
      }

      if (uMsg) {
        if (i === snapshotPages.length - 1) {
          const imgTagRegex = /!\[.*?\]\((data:image\/[^)]+)\)/g;
          const embeddedImages: string[] = [];
          let m;
          while ((m = imgTagRegex.exec(uMsg)) !== null) {
            embeddedImages.push(m[1]);
          }
          
          const cleanUserMsg = uMsg.replace(imgTagRegex, '').trim();
          const allImages = [...embeddedImages];
          for (const img of imagesToSend) {
            if (!allImages.includes(img)) allImages.push(img);
          }

          if (allImages.length > 0) {
            const contentArr: any[] = [{ type: 'text', text: cleanUserMsg || '分析图片' }];
            for (const imgBase64 of allImages) {
              contentArr.push({ type: 'image_url', image_url: { url: imgBase64 } });
            }
            messages.push({ role: 'user', content: contentArr });
          } else {
            messages.push({ role: 'user', content: cleanUserMsg });
          }
        } else {
          const cleanUserMsg = uMsg.replace(/!\[.*?\]\(data:image\/.*?;base64,[^\)]+\)/g, '[参考历史图片]').trim();
          messages.push({ role: 'user', content: cleanUserMsg });
        }
      }
      
      if (aMsg && aMsg.trim()) {
        messages.push({ role: 'assistant', content: aMsg.trim() });
      }
    }

    const { apiKey, baseUrl, model } = store.currentAiConfig;
    const actualModel = model || 'gpt-3.5-turbo';
    const isImg = isImageModel(actualModel);
    const url = `${baseUrl.replace(/\/$/, '')}/${isImg ? 'images/generations' : 'chat/completions'}`;

    try {
      if (isImg) {
        const payload: any = {
          model: actualModel,
          prompt: input, 
          batch_size: 1,
          num_inference_steps: 20
        };

        const isQwenEdit = actualModel.toLowerCase().includes('image-edit');
        if (!isQwenEdit) {
          payload.image_size = '1024x1024';
        }

        payload.guidance_scale = 7.5;

        if (imagesToSend.length > 0) {
          const pureBase64 = imagesToSend[0].replace(/^data:image\/\w+;base64,/, '');
          payload.image = pureBase64;
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(payload),
          signal: signal
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText);
        }

        const data = await response.json();
        const contextObj = store.generatingContexts.get(ctxChatId);
        if (!contextObj) return;

        contextObj.isWaitingFirstToken = false;
        contextObj.isWaitingMainResponse = false;

        let imageMarkdown = '';
        if (data.images && data.images.length > 0) {
          imageMarkdown = data.images.map((img: any) => `![Generated Image](${img.url})`).join('\n\n');
        } else if (data.data && data.data.length > 0) {
          imageMarkdown = data.data.map((img: any) => `![Generated Image](${img.url || (img.b64_json ? `data:image/png;base64,${img.b64_json}` : '')})`).join('\n\n');
        }

        const finalDisplay = imageMarkdown || '未获取到生成的图片，请检查模型返回格式。';
        const newContent = `[USER]: ${finalInputText}\n\n${finalDisplay}`;
        
        contextObj.streamingMainResponse = finalDisplay;
        contextObj.pages[contextObj.pageIndex] = newContent;

        const isActiveChat = store.activeNovelIndex !== null && store.novels[store.activeNovelIndex]?.id === ctxChatId;
        if (isActiveChat) {
          store.pages[contextObj.pageIndex] = newContent;
          nextTick(() => { if (chatArea.value) chatArea.value.scrollTop = chatArea.value.scrollHeight; });
        }

        const finalFullContent = contextObj.pages.join('\n\n[PAGE_BREAK]\n\n');
        await ContentDB.save(ctxChatId, finalFullContent, 'ai');
        return;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: actualModel,
          messages: messages,
          stream: true
        }),
        signal: signal
      });

      if (!response.ok) {
          let errText = await response.text();
          try {
            const jsonErr = JSON.parse(errText);
            const msg = jsonErr.message || jsonErr.error?.message || '';
            if (msg) {
              if (msg.toLowerCase().includes('not a vlm') || msg.toLowerCase().includes('vision')) {
                errText = '当前模型不支持多模态识图，请仅发送文本，或在设置中配置带有 Vision 视觉能力的大模型。\n\n(原始报错: ' + msg + ')';
              } else {
                errText = msg;
              }
            }
          } catch (e) {}
          throw new Error(errText);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      if (!reader) throw new Error('No reader attached');

      let buffer = '';
      let lastAutoSaveTime = Date.now();
      
      const autoSaveIfNeeded = async () => {
        const now = Date.now();
        if (now - lastAutoSaveTime > 3000) {
          lastAutoSaveTime = now;
          const contextObj = store.generatingContexts.get(ctxChatId);
          if (contextObj) {
            const content = contextObj.pages.join('\n\n[PAGE_BREAK]\n\n');
            await ContentDB.save(ctxChatId, content, 'ai');
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.trim() === 'data: [DONE]') continue;
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.choices && data.choices[0] && data.choices[0].delta) {
                const delta = data.choices[0].delta.content || '';
                const reasoningToken = data.choices[0].delta.reasoning_content || '';

                const contextObj = store.generatingContexts.get(ctxChatId);
                if (!contextObj) break;

                if ((delta || reasoningToken) && contextObj.isWaitingFirstToken) {
                  contextObj.isWaitingFirstToken = false;
                }
                if (delta && contextObj.isWaitingMainResponse) {
                  contextObj.isWaitingMainResponse = false;
                }
                
                if (reasoningToken) {
                  let cleanedReasoning = reasoningToken
                    .replace(/<\|?begin_of_box\|?>/gi, '')
                    .replace(/<\|?end_of_box\|?>/gi, '')
                    .replace(/<think>/gi, '')
                    .replace(/<\/think>/gi, '');
                  currentReasoning += cleanedReasoning;
                }
                if (delta) {
                  let cleanedDelta = delta
                    .replace(/<\|?begin_of_box\|?>/gi, '')
                    .replace(/<\|?end_of_box\|?>/gi, '')
                    .replace(/<think>/gi, '')
                    .replace(/<\/think>/gi, '');
                  currentResponse += cleanedDelta;

                  // Some API endpoints merge reasoning into main delta wrapped in <think></think>
                  // We handle the edge case where they stream it all in delta
                  const thinkMatch = currentResponse.match(/<think>([\s\S]*?)<\/think>/i);
                  if (thinkMatch) {
                    currentReasoning += thinkMatch[1];
                    currentResponse = currentResponse.replace(thinkMatch[0], '');
                  } else if (currentResponse.includes('<think>')) {
                    // It's still streaming inside think tag via main response
                    const parts = currentResponse.split('<think>');
                    const possibleEnd = parts[1].split('</think>');
                    if (possibleEnd.length > 1) {
                        currentReasoning += possibleEnd[0];
                        currentResponse = parts[0] + possibleEnd[1];
                    }
                  }
                }
                
                contextObj.streamingReasoning = currentReasoning;
                contextObj.streamingMainResponse = currentResponse;
                
                let storedDisplay = '';
                if (currentReasoning) {
                  storedDisplay += `\n<details class="ai-reasoning">\n  <summary>\n    显示思路\n  </summary>\n  <div class="reasoning-body">\n    ${currentReasoning}\n  </div>\n</details>\n\n`;
                }
                storedDisplay += currentResponse;
                
                const newContent = `[USER]: ${finalInputText}\n\n${storedDisplay}`;
                contextObj.pages[contextObj.pageIndex] = newContent;
                
                const isActiveChat = store.activeNovelIndex !== null && store.novels[store.activeNovelIndex]?.id === ctxChatId;
                if (isActiveChat) {
                  store.pages[contextObj.pageIndex] = newContent;
                  nextTick(() => {
                    if (!userScrolledUp.value && chatArea.value) {
                      chatArea.value.scrollTop = chatArea.value.scrollHeight;
                    }
                  });
                }
                autoSaveIfNeeded();
              }
            } catch (e) {}
          }
        }
      }

      const contextObj = store.generatingContexts.get(ctxChatId);
      if (contextObj) {
        const finalContent = contextObj.pages.join('\n\n[PAGE_BREAK]\n\n');
        await ContentDB.save(ctxChatId, finalContent, 'ai');
        const novelInList = store.novels.find(n => n.id === ctxChatId);
        if (novelInList) novelInList.size = finalContent.length;
        store._saveNovelsMeta();
        const isActiveChat = store.activeNovelIndex !== null && store.novels[store.activeNovelIndex]?.name === ctxChatId;
        if (isActiveChat) {
          store.pages = [...contextObj.pages];
        }
      }

    } catch (err: any) {
      if (err.name === 'AbortError') return;
      store.showActionToast(`AI 请求异常`, '报错详情', () => {
        store.confirmDialog(err.message || String(err), '报错详情');
      });
    } finally {
      store.generatingContexts.delete(ctxChatId);
    }
  }

  return {
    isAiGenerating,
    isActiveStreaming,
    isAiWaitingFirstToken,
    isAiWaitingMainResponse,
    streamingReasoning,
    streamingMainResponse,
    reasoningOpen,
    userScrolledUp,
    stopAiGeneration,
    handleAiChat
  };
}
