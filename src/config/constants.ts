import type { StyleConfig, StyleName } from '../types';

export const STYLE_CONFIG: Record<StyleName, StyleConfig> = {
  gemini: {
    logo: 'FindDeep',
    title: 'FindDeep',
    placeholder: '问问 FindDeep',
    disclaimer: 'FindDeep 是一款内部协作工具，信息仅供参考。',
    modelLabel: 'Pro',
    welcomeTitle: '你好呀',
    welcomeSubtitle: '有什么我可以帮忙的吗？',
    favicon: 'https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030456e93de685481c559f160ea06b.png'
  },
  vscode: {
    logo: 'VS Code',
    title: 'Visual Studio Code',
    placeholder: 'Ask Copilot or type / for commands',
    disclaimer: 'AI-generated code may be incorrect. Please verify.',
    modelLabel: 'Copilot',
    welcomeTitle: 'Welcome to VS Code',
    welcomeSubtitle: 'Unlock the power of AI-assisted coding',
    favicon: 'https://code.visualstudio.com/favicon.ico'
  },
  terminal: {
    logo: 'Terminal',
    title: 'root@linux:~',
    placeholder: 'root@linux:~# ',
    disclaimer: 'Warning: You are currently operating as root.',
    modelLabel: 'bash',
    welcomeTitle: 'System Online',
    welcomeSubtitle: 'Linux version 5.15.0-101-generic',
    favicon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Terminal_icon_%28macOS%29.svg/120px-Terminal_icon_%28macOS%29.svg.png'
  },
  idea: {
    logo: 'IntelliJ IDEA',
    title: 'IntelliJ IDEA',
    placeholder: 'Ask AI Assistant...',
    disclaimer: 'AI Assistant can make mistakes. Please check the suggestions.',
    modelLabel: 'AI Assistant',
    welcomeTitle: 'Hello User',
    welcomeSubtitle: 'How can I help you write better code today?',
    favicon: 'https://resources.jetbrains.com/storage/products/intellij-idea/img/meta/intellij-idea_logo_300x300.png'
  },
  webstorm: {
    logo: 'WebStorm',
    title: 'WebStorm',
    placeholder: 'Ask AI Assistant...',
    disclaimer: 'AI Assistant can make mistakes. Please check the suggestions.',
    modelLabel: 'AI Assistant',
    welcomeTitle: 'Hello Web Developer',
    welcomeSubtitle: 'Let\'s write some JavaScript today',
    favicon: 'https://resources.jetbrains.com/storage/products/webstorm/img/meta/webstorm_logo_300x300.png'
  },
  juejin: {
    logo: '稀土掘金',
    title: '稀土掘金',
    placeholder: '搜索前端、后端、架构...',
    disclaimer: '掘金文章和评论均由用户提供，请注意甄别信息的准确性',
    modelLabel: 'Juejin-AI',
    welcomeTitle: '掘金一下',
    welcomeSubtitle: '发现全网优质技术内容',
    favicon: 'https://lf3-cdn-tos.bytescm.com/obj/static/xitu_juejin_web/e08da34488b114bd4c665ba2fa520a31.svg'
  },
  mdn: {
    logo: 'MDN',
    title: 'MDN Web Docs',
    placeholder: 'Search MDN...',
    disclaimer: 'By developers, for developers.',
    modelLabel: 'MDN-AI',
    welcomeTitle: 'Resources for developers',
    welcomeSubtitle: 'Documenting web technologies',
    favicon: 'https://developer.mozilla.org/favicon-48x48.cbbd161b.png'
  },
  stackoverflow: {
    logo: 'Stack Overflow',
    title: 'Stack Overflow',
    placeholder: 'Search for questions...',
    disclaimer: 'Answers are provided by the community.',
    modelLabel: 'OverflowAI',
    welcomeTitle: 'Every developer has a tab open to Stack Overflow',
    welcomeSubtitle: 'Where developers learn, share, and build careers.',
    favicon: 'https://cdn.sstatic.net/Sites/stackoverflow/Img/apple-touch-icon.png'
  },
  chatgpt: {
    logo: 'ChatGPT',
    title: 'ChatGPT',
    placeholder: 'Message ChatGPT...',
    disclaimer: 'ChatGPT can make mistakes. Consider verifying important information.',
    modelLabel: 'GPT-4',
    welcomeTitle: 'How can I help you today?',
    welcomeSubtitle: "I'm ChatGPT, here to chat with you.",
    favicon: 'https://cdn.oaistatic.com/_next/static/media/favicon-32x32.630a2b99.png'
  }
};
