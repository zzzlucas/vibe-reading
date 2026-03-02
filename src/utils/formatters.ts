import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';

function escapeHtml(text: string) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

marked.use({
  gfm: true,
  breaks: true,
  renderer: {
    code({ text, lang }: any) {
      let highlighted: string;
      let detectedLang = lang || '';
      if (lang && hljs.getLanguage(lang)) {
        highlighted = hljs.highlight(text, { language: lang }).value;
      } else {
        const result = hljs.highlightAuto(text);
        highlighted = result.value;
        if (!detectedLang) detectedLang = result.language || 'code';
      }
      highlighted = highlighted.replace(/\n/g, '&#10;');
      const displayLang = detectedLang.toUpperCase() || 'CODE';
      return `<div class="code-block"><div class="code-header"><span class="code-lang-label">${escapeHtml(displayLang)}</span></div><pre><code class="hljs language-${escapeHtml(detectedLang)}">${highlighted}</code></pre></div>`;
    }
  }
});

export function applySecondaryObfuscation(lines: string[], store: any) {
  if (lines.length === 0) return lines.join('\n\n');
  
  const activeNovel = store.activeNovelIndex !== null ? store.novels[store.activeNovelIndex] : null;
  if (!activeNovel || activeNovel.type !== 'works') {
    return lines.join('\n\n');
  }

  const mode = store.settings.secondaryRenderObfuscationMode || 'none';

  if (store.settings.secondaryRenderEnableReplace && store.settings.secondaryRenderReplaceDict) {
    const rules = store.settings.secondaryRenderReplaceDict.split('\n').map((l: string) => l.trim()).filter((l: string) => l);
    for (const rule of rules) {
      const parts = rule.split(/->|=|:/);
      if (parts.length >= 2) {
        const k = parts[0].trim();
        const v = parts.slice(1).join('->').trim();
        if (k && v !== undefined) {
          try {
            const re = new RegExp(k, 'g');
            for (let i = 0; i < lines.length; i++) {
              lines[i] = lines[i].replace(re, v);
            }
          } catch(e) { }
        }
      }
    }
  }

  if (store.settings.secondaryRenderEnablePunctuation && store.settings.secondaryRenderRemovePunctuation && store.settings.secondaryRenderRemovePunctuation.length > 0) {
    const punc = store.settings.secondaryRenderRemovePunctuation;
    const removeAll = punc.includes('all');
    const removeComma = removeAll || punc.includes('comma');
    const removePeriod = removeAll || punc.includes('period');
    const removeQuote = removeAll || punc.includes('quote');
    const removeExclamation = removeAll || punc.includes('exclamation');
    const removeQuestion = removeAll || punc.includes('question');
    const removeEllipsis = removeAll || punc.includes('ellipsis');

    for (let i = 0; i < lines.length; i++) {
        if (removeAll) {
            lines[i] = lines[i].replace(/[.,;:!?…"'“”‘’()\[\]{}—_《》「」『』，。、：；！？（）【】 ]+/g, ' ');
        } else {
            if (removeComma)    lines[i] = lines[i].replace(/[,，、]/g, ' ');
            if (removePeriod)   lines[i] = lines[i].replace(/[.。]/g, ' ');
            if (removeQuote)    lines[i] = lines[i].replace(/["'“”‘’「」『』]/g, '');
            if (removeExclamation) lines[i] = lines[i].replace(/[!！]/g, ' ');
            if (removeQuestion) lines[i] = lines[i].replace(/[?？]/g, ' ');
            if (removeEllipsis) lines[i] = lines[i].replace(/…/g, '');
        }
    }
  }

  let mergedLines = lines;
  if (store.settings.secondaryRenderMergeParagraphs && store.settings.secondaryRenderMergeCount > 1) {
    mergedLines = [];
    const count = store.settings.secondaryRenderMergeCount;
    for (let i = 0; i < lines.length; i += count) {
      mergedLines.push(lines.slice(i, i + count).join(''));
    }
  }

  if (mode === 'log') {
    const dateStr = new Date().toISOString().split('T')[0];
    let html = '```log\n';
    const logLevels = ['INFO', 'DEBUG', 'WARN', 'TRACE'];
    mergedLines.forEach((line, idx) => {
       const level = logLevels[idx % logLevels.length];
       const ts = new Date(Date.now() + idx * 1000).toTimeString().split(' ')[0];
       html += `[${dateStr} ${ts}] [${level}] [Worker-${idx}] ${line}\n`;
    });
    html += '```\n';
    return html;
  }
  
  if (mode === 'json') {
    const dataObj = {
      taskId: `task-${Date.now().toString().slice(-4)}`,
      status: "SUCCESS",
      extracted_entities: mergedLines.map((content, idx) => ({
        id: idx + 1,
        content: content
      }))
    };
    return '```json\n' + JSON.stringify(dataObj, null, 2) + '\n```\n';
  }

  if (mode === 'markdown_report') {
    let result = '';
    mergedLines.forEach((line, idx) => {
      if (idx % 3 === 0) {
        result += `\n### Phase ${Math.floor(idx/3) + 1}: Execution Flow\n`;
      }
      result += `- ${line}\n`;
    });
    return result;
  }

  if (mode === 'translation') {
    let result = '';
    const fakeEngHints = [
      "The system is extracting the semantic context...",
      "Process initialized with parameter sequence...",
      "Analyzing the natural language structure...",
      "Computing the transition matrix...",
      "Event triggered at worker thread..."
    ];
    mergedLines.forEach((line, idx) => {
      const eng = fakeEngHints[idx % fakeEngHints.length];
      result += `> 💬 *${eng}*\n\n${line}\n\n`;
    });
    return result;
  }

  const indentCount = store.settings.secondaryRenderIndent !== undefined ? store.settings.secondaryRenderIndent : 2;
  const indentStr = indentCount > 0 ? Array(indentCount).fill('　').join('') : '';
  
  return mergedLines.map(line => {
    const trimmed = line.trim();
    if (/^([#>\-*]|\d+\.|```)/.test(trimmed)) {
      return line;
    }
    return `${indentStr}${line}`;
  }).join('\n\n');
}

export function formatContent(text: string, store: any, isDummyChat: boolean, chatTitle: string) {
  if (!text) return '';
  
  let tmp = text;
  if (isDummyChat) {
    const match = text.match(/^\[USER\]:\s*([\s\S]*?)\n\n([\s\S]*)$/);
    tmp = match ? match[2] : '';
  }
  
  if (!tmp.trim()) return '';

  let lines = tmp.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  if (!store.settings.showChapterName && lines.length > 0 && !isDummyChat && store.settings.readingMode !== 'scroll') {
    lines.shift();
  }
  
  tmp = applySecondaryObfuscation(lines, store);

  const rawHtml = marked.parse(tmp) as string;
  let finalHtml = DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['open'] });
  
  if (store.settings.readingMode === 'scroll' && !isDummyChat) {
    const fadeStyle = 'style="opacity: 0.4; font-size: 0.85em; font-weight: normal; color: inherit; margin: 1.5em 0; user-select: none;" class="chapter-fade"';
    finalHtml = finalHtml.replace(/<p>\s*(第[零一二三四五六七八九十百千万0-9]+[章回卷集节部][\s\S]*?)<\/p>/g, `<p ${fadeStyle}>$1</p>`);
    finalHtml = finalHtml.replace(/<h[1-6]>\s*(第[零一二三四五六七八九十百千万0-9]+[章回卷集节部][\s\S]*?)<\/h[1-6]>/g, `<div ${fadeStyle}>$1</div>`);
  }
  
  return finalHtml;
}

export function getUserTextHtml(text: string, store: any, isDummyChat: boolean, chatTitle: string) {
  if (!isDummyChat) {
    const pageNum = store.currentPage + 1;
    const total = store.totalPages;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    let content = '';
    const mode = store.settings.userBubbleMode || 'default';
    
    if (mode === 'default') {
      content = `${chatTitle}${store.currentPage === 0 ? '' : ` - 第 ${pageNum} 页`}`;
    } else if (mode === 'random') {
      const randoms = [
          '帮我分析一下这一页的重点',
          '这段话有什么深层含义吗？',
          '总结一下这一章的主要内容',
          '继续往下读',
          '这里的转折点在哪里？',
          '我读到这里了，记录一下'
      ];
      content = randoms[pageNum % randoms.length];
    } else {
      let template = store.settings.userBubbleTemplate || '{{title}} - 第 {{page}} 页';
      content = template.replace(/{{title}}/g, chatTitle)
                        .replace(/{{page}}/g, pageNum.toString())
                        .replace(/{{total}}/g, total.toString())
                        .replace(/{{time}}/g, timeStr);
    }
    
    return escapeHtml(content);
  }
  if (!text) return escapeHtml(chatTitle);
  const match = text.match(/^\[USER\]:\s*([\s\S]*?)(?:\n\n|$)/);
  const userText = match ? match[1] : chatTitle;

  const imgTagRegex = /!\[.*?\]\((data:image\/[^)]+)\)/g;
  const textWithoutImages = userText.replace(imgTagRegex, '').trim();

  if (!textWithoutImages) return '';
  return DOMPurify.sanitize(marked.parse(textWithoutImages) as string);
}

export function getAiResponseRaw(text: string, isDummyChat: boolean) {
  if (!text) return '';
  if (!isDummyChat) return text;
  const match = text.match(/^\[USER\]:\s*([\s\S]*?)\n\n([\s\S]*)$/);
  return match ? match[2] : '';
}

export function getUserImages(text: string, isDummyChat: boolean) {
  if (isDummyChat && text) {
    const match = text.match(/^\[USER\]:\s*([\s\S]*?)(?:\n\n|$)/);
    const userText = match ? match[1] : '';
    const imgTagRegex = /!\[.*?\]\((data:image\/[^)]+)\)/g;
    const images: string[] = [];
    let m;
    while ((m = imgTagRegex.exec(userText)) !== null) {
      images.push(m[1]);
    }
    return images;
  }
  return [];
}
