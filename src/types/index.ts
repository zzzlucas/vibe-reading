export interface Novel {
  id: string; // Unique short ID for URL and tracking
  name: string;
  type: 'works' | 'fake' | 'ai'; // 'works' for imported documents, 'fake' for sample chats, 'ai' for real chat
  size: number;
  lastRead: number;
  currentPage: number;
  displayName?: string;
  isPinned?: boolean;
}

export interface Chapter {
  title: string;
  page: number;
}

export interface Settings {
  fontSize: number;
  lineHeight: number;
  charsPerPage: number;
  readingMode: 'page' | 'scroll';
  bossKeys: string[];
  bossModeUnlocked: boolean;
  tripleClickBossKey: boolean;
  prevPageKeys?: string[];
  nextPageKeys?: string[];
  scrollUpKeys?: string[];
  scrollDownKeys?: string[];
  typewriterMode: boolean;
  typewriterSpeed: number;
  bossKeyStreamOutput: boolean;
  bossKeyTarget: 'template' | 'random' | 'specific';
  bossKeySpecificTargetId: string;
  bossKeyStreamStartChars: number;
  bossKeyStreamTurn: 'first' | 'last';
  userBubbleTemplate: string;
  userBubbleMode: 'default' | 'random' | 'template';
  fontColor: string;
  showChapterName: boolean;
  showNovelTitle: boolean;
  secondaryRenderMergeParagraphs: boolean;
  secondaryRenderMergeCount: number;
  showFakeSidebar: boolean;
  fakeSidebarMode: 'custom' | 'random_it' | 'random_general' | 'random_design';
  fakeSidebarContent: string;
  fakeSidebarItemCount: number;
  fakeSidebarAutoAdjustCount: boolean;
  fakeSidebarShowForTypes: string[];
  secondaryRenderObfuscationMode: 'none' | 'log' | 'json' | 'markdown_report' | 'translation';
  secondaryRenderEnableReplace: boolean;
  secondaryRenderReplaceDict: string;
  secondaryRenderEnablePunctuation: boolean;
  secondaryRenderRemovePunctuation: string[];
  secondaryRenderIndent: number;
  basicSettingsCollapsed?: boolean;
  advancedSettingsCollapsed?: boolean;
  hasSeenVibeReadingTip?: boolean;
}

export interface StyleConfig {
  logo: string;
  title: string;
  placeholder: string;
  disclaimer: string;
  modelLabel: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  favicon: string;
}

export type Theme = 'dark' | 'light';
export type Encoding = 'auto' | 'utf-8' | 'gbk' | 'utf-16le' | 'utf-16be' | 'big5';
export type StyleName = 'gemini' | 'chatgpt' | 'vscode' | 'terminal' | 'idea' | 'webstorm' | 'juejin' | 'mdn' | 'stackoverflow';
