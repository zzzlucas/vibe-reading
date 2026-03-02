import { ref, type Ref } from 'vue';
import { useAppStore } from '@/store/appStore';
import { ContentDB } from '@/utils/db';

export function useFileProcessor(attachedImages: Ref<string[]>) {
  const store = useAppStore();
  const isDragging = ref(false);

  async function processFiles(files: File[]) {
    if (files.length === 0) return;

    let validNovelFound = false;
    let firstNovelIndex = -1;

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result && typeof ev.target.result === 'string') {
            attachedImages.value.push(ev.target.result);
          }
        };
        reader.readAsDataURL(file);
        validNovelFound = true;
        continue;
      }

      if (!file.name.toLowerCase().endsWith('.txt')) {
        store.showActionToast(`文件 ${file.name} 已读取，当前大模型正在测试并接入多媒体文件内测功能，暂不开放上传`, '知道了', () => {});
        continue;
      }

      validNovelFound = true;
      try {
        const content = await readFileWithEncoding(file, store.encoding);
        const newId = store.generateUid();
        const cleanDisplayName = file.name
          .replace(/\.txt$/i, '')
          .replace(/[《》]/g, '');

        store.novels.push({
          id: newId,
          type: 'works',
          name: file.name,
          size: file.size,
          lastRead: Date.now(),
          currentPage: 0,
          displayName: cleanDisplayName
        });
        
        await ContentDB.save(newId, content, 'works', file.name);
        store.markJustAdded(newId);
        store._saveNovelsMeta();
        
        const newIndex = store.novels.length - 1;
        if (firstNovelIndex === -1) {
          firstNovelIndex = newIndex;
        }
      } catch (err) {
        console.error('加载失败:', err);
        store.showToast('加载失败: ' + file.name);
      }
    }

    if (firstNovelIndex >= 0) {
      await store.openNovel(firstNovelIndex);
    }
  }

  function readFileWithEncoding(file: File, forcedEncoding: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;

        if (forcedEncoding && forcedEncoding !== 'auto') {
          try {
            const text = new TextDecoder(forcedEncoding).decode(buffer);
            resolve(text);
          } catch (err) {
            reject(err);
          }
          return;
        }

        const bytes = new Uint8Array(buffer);
        if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
          resolve(new TextDecoder('utf-8').decode(buffer));
          return;
        }
        if (bytes[0] === 0xFF && bytes[1] === 0xFE) {
          resolve(new TextDecoder('utf-16le').decode(buffer));
          return;
        }
        if (bytes[0] === 0xFE && bytes[1] === 0xFF) {
          resolve(new TextDecoder('utf-16be').decode(buffer));
          return;
        }

        const utf8Text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
        const replacementCount = (utf8Text.match(/\uFFFD/g) || []).length;
        if (replacementCount === 0) {
          resolve(utf8Text);
          return;
        }

        try {
          const gbkText = new TextDecoder('gbk', { fatal: false }).decode(buffer);
          resolve(gbkText);
        } catch (err) {
          resolve(utf8Text);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  return {
    isDragging,
    processFiles
  };
}
