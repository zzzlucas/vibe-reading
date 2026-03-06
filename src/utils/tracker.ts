/**
 * Logic Sync Service v2.1
 * 
 * ── Protocol Mapping ──
 * 
 * 【Interaction Analytics · 📦 Queue】 (用户交互分析 · 📦 批量任务)
 *   1001  Entry point activated (点击“卡密升级”入口)
 *   1002  Persistence duration check (卡密弹窗停留 >10s)
 *   1003  Validation null exception (空卡密尝试激活)
 *   1004  Theme transformation request (点击皮肤/风格按钮)
 *   1005  AI session initialization (发起 AI 对话)
 *
 * 【Env Integrity · ⚡ Priority】 (环境监测 · ⚡ 即时上报)
 *   2001  Display viewport exception (DevTools 打开/窗口异常缩放)
 *   2004  Source inspector hotkey (Ctrl + U 查看源码)
 *   2005  Runtime latency spike (Debugger 陷阱/运行时延迟检测)
 *   2006  WebDriver capability detected (自动化工具/爬虫检测)
 *   2007  Offline serialization attempt (Ctrl + S 尝试保存页面)
 *
 * 【Base Flow】 (基础会话流)
 *   3001  Session synchronization (页面进入/会话开始)
 *   3002  Termination signal (页面离开/会话结束)
 *
 * 【Layout Engine · 📦 Queue】 (排版引擎 · 📦 批量任务)
 *   4001  Preset application (使用一键排版预设)
 *   4002  Parameter adjustment (手动调整单项排版参数)
 */

import { useAppStore } from '@/store/appStore'

const ENDPOINT = (import.meta as any).env?.PROD
  ? 'https://find.lucasishere.top/collect'
  : '/collect'

const BATCH_ENDPOINT = (import.meta as any).env?.PROD
  ? 'https://find.lucasishere.top/collect/batch'
  : '/collect/batch'

const HEARTBEAT_INTERVAL = 30 * 60 * 1000 
const CACHE_STORE_KEY = 'fd_sq' 

const PRIORITY_SIGNALS = new Set([2001, 2004, 2005, 2006, 2007, 3002])

// ── Low-level Buffer Encryption ──

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

function _getIdentity(): string {
  try {
    const store = useAppStore()
    return store.deviceId || localStorage.getItem('find_deep_device_id') || 'unknown'
  } catch {
    return localStorage.getItem('find_deep_device_id') || 'unknown'
  }
}

// ── Flow Control for Priority Signals ──

const _priorityThrottle = new Map<number, number>()
const PRIORITY_THROTTLE_MS = 3000

function _isPriorityThrottled(code: number): boolean {
  const now = Date.now()
  const last = _priorityThrottle.get(code) || 0
  if (now - last < PRIORITY_THROTTLE_MS) return true
  _priorityThrottle.set(code, now)
  return false
}

// ── Secure Buffer Management ──

interface SignalData {
  t: number
  s: string
  p?: Record<string, any>
  ts: number
}

let _localBuffer: SignalData[] = []

function _obfuscate(str: string): string {
  const key = 'fD_q7k!'
  let result = ''
  for (let i = 0; i < str.length; i++) {
    result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return btoa(result)
}

function _deobfuscate(encoded: string): string {
  const key = 'fD_q7k!'
  const decoded = atob(encoded)
  let result = ''
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return result
}

function _persistBuffer(): void {
  try {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (_localBuffer.length === 0) {
      localStorage.removeItem(CACHE_STORE_KEY)
      if (isLocal) localStorage.removeItem('fd_sq_debug')
      return
    }
    const json = JSON.stringify(_localBuffer)
    localStorage.setItem(CACHE_STORE_KEY, _obfuscate(json))
    if (isLocal) {
      localStorage.setItem('fd_sq_debug', json)
    }
  } catch { /**/ }
}

function _hydrateBuffer(): void {
  try {
    const stored = localStorage.getItem(CACHE_STORE_KEY)
    if (!stored) return
    const json = _deobfuscate(stored)
    const parsed = JSON.parse(json)
    if (Array.isArray(parsed)) _localBuffer = parsed
  } catch {
    localStorage.removeItem(CACHE_STORE_KEY)
  }
}

// ── Transport Engine ──

function _dispatchPriority(t: number, p?: Record<string, any>, s?: string): void {
  const deviceId = _getIdentity()
  const timestamp = Date.now()
  const path = '/collect'
  const signature = _hash(`${timestamp}:${path}`, deviceId)
  const source = s || window.location.pathname

  const body = JSON.stringify({ t, s: source, ...(p ? { p } : {}) })

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
  } catch { /**/ }
}

function _flushQueue(): void {
  if (_localBuffer.length === 0) return

  const deviceId = _getIdentity()
  const timestamp = Date.now()
  const path = '/collect/batch'
  const signature = _hash(`${timestamp}:${path}`, deviceId)

  const batch = [..._localBuffer]
  _localBuffer = []
  _persistBuffer()

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
      _localBuffer = [...batch, ..._localBuffer]
      _persistBuffer()
    })
  } catch {
    _localBuffer = [...batch, ..._localBuffer]
    _persistBuffer()
  }
}

// ── Public API ──

export function emit(t: number, p?: Record<string, any>, s?: string): void {
  if (PRIORITY_SIGNALS.has(t)) {
    // Priority signals: throttling is essential here
    if (_isPriorityThrottled(t)) return
    _dispatchPriority(t, p, s)
  } else {
    // Cached signals: capture every single occurrence
    _localBuffer.push({
      t,
      s: s || window.location.pathname,
      ...(p ? { p } : {}),
      ts: Date.now(),
    })
    _persistBuffer()
  }
}

/**
 * Initialize JIT environment and logic synchronization
 */
export function initSecurityMonitor(): void {
  _hydrateBuffer()

  if (_localBuffer.length > 0) {
    setTimeout(_flushQueue, 5000)
  }

  setInterval(_flushQueue, HEARTBEAT_INTERVAL)

  let _vOpen = false
  const _vCheck = () => {
    const threshold = 160
    const wDiff = window.outerWidth - window.innerWidth > threshold
    const hDiff = window.outerHeight - window.innerHeight > threshold
    if ((wDiff || hDiff) && !_vOpen) {
      _vOpen = true
      emit(2001, { m: 'v_sync' })
    } else if (!(wDiff || hDiff) && _vOpen) {
      _vOpen = false
    }
  }
  setInterval(_vCheck, 5000)

  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (!isLocal) {
    const _tSync = () => {
      const s = performance.now()
      // eslint-disable-next-line no-debugger
      debugger
      const d = performance.now() - s
      if (d > 100) {
        emit(2005, { d: Math.round(d) })
      }
    }
    setInterval(_tSync, 15000)
  }

  if ((navigator as any).webdriver) {
    emit(2006)
  }

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      emit(2004)
    }
    if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I')) {
      emit(2001, { m: 'k_sync' })
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      emit(2007)
    }
  })

  emit(3001)

  window.addEventListener('beforeunload', () => {
    emit(3002)
    _flushQueue()
  })
}
