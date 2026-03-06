/**
 * Signal Collector SDK v2
 * 
 * 分级上报 + 本地加密缓存 + 批量上报机制
 * 
 * ── 事件编码映射表 ──
 * 
 * 【付费意愿分析 · 📦 批量上报】
 *   1001  用户点击"卡密升级"入口
 *   1002  用户在卡密弹窗中停留超过 10s
 *   1003  用户尝试激活但卡密为空
 *   1004  用户点击皮肤风格按钮（含未上线的）
 *   1005  用户发起 AI 对话
 *
 * 【安全监测 · ⚡ 即时上报 + 📧 邮件通知】
 *   2001  检测到开发者工具打开
 *   2004  检测到查看源码快捷键 (Ctrl+U)
 *   2005  检测到 debugger 陷阱触发
 *   2006  检测到自动化工具 (Puppeteer / Selenium)
 *   2007  检测到 Ctrl+S 离线保存
 *
 * 【基础行为】
 *   3001  页面访问 (session start) · 📦 批量
 *   3002  页面离开 (session end) · ⚡ 即时
 *
 * 【排版设置 · 📦 批量上报】
 *   4001  一键排版预设点击
 *   4002  单独排版选项变更
 */

import { useAppStore } from '@/store/appStore'

// ── 配置 ──
const ENDPOINT = (import.meta as any).env?.PROD
  ? 'https://find.lucasishere.top/collect'
  : '/collect'

const BATCH_ENDPOINT = (import.meta as any).env?.PROD
  ? 'https://find.lucasishere.top/collect/batch'
  : '/collect/batch'

const FLUSH_INTERVAL_MS = 30 * 60 * 1000 // 30 分钟
const STORAGE_KEY = 'fd_sq' // find_deep_signal_queue (混淆命名)

// ── 即时上报的事件编码范围 ──
const IMMEDIATE_EVENTS = new Set([2001, 2004, 2005, 2006, 2007, 3002])

// ══════════════════════════════════════════════════════════════════════════════
// 签名算法（与后端 collector.ts 中的 _verifyHash 对称）
// ══════════════════════════════════════════════════════════════════════════════

function _hash(payload: string | number, deviceId: string): string {
  const salt = 'fNd_s1gN@l#47'
  const raw = `${salt}:${payload}:@:${deviceId}`
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i)
    h1 = Math.imul(h1 ^ char, 2654435761)
    h2 = Math.imul(h2 ^ char, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  const p1 = (h1 >>> 0).toString(16).padStart(8, '0')
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0')
  const p3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0')
  const p4 = ((~h1 ^ h2) >>> 0).toString(16).padStart(8, '0')
  const p5 = ((h1 ^ ~h2) >>> 0).toString(16).padStart(8, '0')
  const p6 = ((h1 + h2) >>> 0).toString(16).padStart(8, '0')
  const p7 = ((h1 - h2) >>> 0).toString(16).padStart(8, '0')
  const p8 = ((h2 - h1) >>> 0).toString(16).padStart(8, '0')
  return p1 + p2 + p3 + p4 + p5 + p6 + p7 + p8
}

// ══════════════════════════════════════════════════════════════════════════════
// 设备 ID
// ══════════════════════════════════════════════════════════════════════════════

function _getDeviceId(): string {
  try {
    const store = useAppStore()
    return store.deviceId || localStorage.getItem('find_deep_device_id') || 'unknown'
  } catch {
    return localStorage.getItem('find_deep_device_id') || 'unknown'
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 节流控制
// ══════════════════════════════════════════════════════════════════════════════

const _throttleMap = new Map<number, number>()
const THROTTLE_MS = 3000

function _isThrottled(eventCode: number): boolean {
  const now = Date.now()
  const last = _throttleMap.get(eventCode) || 0
  if (now - last < THROTTLE_MS) return true
  _throttleMap.set(eventCode, now)
  return false
}

// ══════════════════════════════════════════════════════════════════════════════
// 本地加密缓存队列
// ══════════════════════════════════════════════════════════════════════════════

interface QueuedEvent {
  t: number        // 事件类型
  s: string        // 来源路径
  p?: Record<string, any> // 载荷
  ts: number       // 时间戳
}

let _memQueue: QueuedEvent[] = []

// XOR 混淆 + Base64（轻量级加密，防止 localStorage 明文可读）
function _xorEncode(str: string): string {
  const key = 'fD_q7k!'
  let result = ''
  for (let i = 0; i < str.length; i++) {
    result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return btoa(result)
}

function _xorDecode(encoded: string): string {
  const key = 'fD_q7k!'
  const decoded = atob(encoded)
  let result = ''
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return result
}

function _saveQueueToStorage(): void {
  try {
    if (_memQueue.length === 0) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    const json = JSON.stringify(_memQueue)
    localStorage.setItem(STORAGE_KEY, _xorEncode(json))
  } catch { /* quota exceeded or other errors, silently ignore */ }
}

function _loadQueueFromStorage(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return
    const json = _xorDecode(stored)
    const parsed = JSON.parse(json)
    if (Array.isArray(parsed)) {
      _memQueue = parsed
    }
  } catch {
    // 数据损坏，清除
    localStorage.removeItem(STORAGE_KEY)
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 发送函数
// ══════════════════════════════════════════════════════════════════════════════

function _sendImmediate(t: number, p?: Record<string, any>, s?: string): void {
  const deviceId = _getDeviceId()
  const timestamp = Date.now()
  const path = '/collect'
  const signature = _hash(`${timestamp}:${path}`, deviceId)
  const source = s || window.location.pathname

  const body = JSON.stringify({
    t,
    s: source,
    ...(p ? { p } : {})
  })

  try {
    fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': deviceId,
        'X-Timestamp': timestamp.toString(),
        'X-Signature': signature,
      },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch { /* silent */ }
}

function _flushBatch(): void {
  if (_memQueue.length === 0) return

  const deviceId = _getDeviceId()
  const timestamp = Date.now()
  const path = '/collect/batch'
  const signature = _hash(`${timestamp}:${path}`, deviceId)

  // 提取队列副本并立即清空
  const batch = [..._memQueue]
  _memQueue = []
  _saveQueueToStorage()

  const body = JSON.stringify({
    events: batch.map(e => ({
      t: e.t,
      s: e.s,
      ...(e.p ? { p: e.p } : {}),
      ts: e.ts,
    }))
  })

  try {
    fetch(BATCH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': deviceId,
        'X-Timestamp': timestamp.toString(),
        'X-Signature': signature,
      },
      body,
      keepalive: true,
    }).catch(() => {
      // 发送失败，将事件放回队列
      _memQueue = [...batch, ..._memQueue]
      _saveQueueToStorage()
    })
  } catch {
    _memQueue = [...batch, ..._memQueue]
    _saveQueueToStorage()
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 公开 API
// ══════════════════════════════════════════════════════════════════════════════

/**
 * 发送埋点信号
 * @param t  事件类型编码
 * @param p  附加载荷 (optional)
 * @param s  来源路径 (optional, 默认取当前 pathname)
 */
export function emit(t: number, p?: Record<string, any>, s?: string): void {
  if (_isThrottled(t)) return

  if (IMMEDIATE_EVENTS.has(t)) {
    // ⚡ 即时上报
    _sendImmediate(t, p, s)
  } else {
    // 📦 存入批量队列
    _memQueue.push({
      t,
      s: s || window.location.pathname,
      ...(p ? { p } : {}),
      ts: Date.now(),
    })
    _saveQueueToStorage()
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 安全监测模块
// ══════════════════════════════════════════════════════════════════════════════

let _securityInitialized = false

/**
 * 初始化安全监测 + 批量上报定时器
 * 应在应用入口（如 App.vue 的 onMounted）中调用一次
 */
export function initSecurityMonitor(): void {
  if (_securityInitialized) return
  _securityInitialized = true

  // 恢复上次未上报的队列
  _loadQueueFromStorage()

  // 如果有上次残留的数据，立即 flush
  if (_memQueue.length > 0) {
    setTimeout(_flushBatch, 5000) // 延迟 5s，等页面初始化完成
  }

  // ── 定时批量上报（每 30 分钟） ──
  setInterval(_flushBatch, FLUSH_INTERVAL_MS)

  // ── 1. DevTools 检测（窗口尺寸差异法）──
  let _devToolsOpen = false
  const _checkDevTools = () => {
    const threshold = 160
    const widthDiff = window.outerWidth - window.innerWidth > threshold
    const heightDiff = window.outerHeight - window.innerHeight > threshold
    const isOpen = widthDiff || heightDiff

    if (isOpen && !_devToolsOpen) {
      _devToolsOpen = true
      emit(2001, { m: 'size' })
    } else if (!isOpen && _devToolsOpen) {
      _devToolsOpen = false
    }
  }
  setInterval(_checkDevTools, 5000)
  _checkDevTools()

  // ── 2. debugger 陷阱计时检测 ──
  const _debuggerTrap = () => {
    const start = performance.now()
    // eslint-disable-next-line no-debugger
    debugger
    const duration = performance.now() - start
    if (duration > 100) {
      emit(2005, { dt: Math.round(duration) })
    }
  }
  // 每 15 秒执行一次 debugger 陷阱
  setInterval(_debuggerTrap, 15000)

  // ── 3. 自动化工具检测 ──
  if ((navigator as any).webdriver === true) {
    emit(2006)
  }

  // ── 4. 键盘快捷键检测 ──
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    // Ctrl+U (View Source)
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      emit(2004, { k: 'ctrl+u' })
    }
    // Ctrl+Shift+I / F12 (DevTools)
    if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I')) {
      emit(2001, { m: 'key' })
    }
    // Ctrl+S (Save Page)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      emit(2007, { k: 'ctrl+s' })
    }
  })

  // ── 5. Session 开始 ──
  emit(3001)

  // ── 6. Session 结束 + 批量 flush（beforeunload）──
  window.addEventListener('beforeunload', () => {
    emit(3002)
    _flushBatch() // beforeunload 时紧急 flush 剩余的批量队列
  })
}
