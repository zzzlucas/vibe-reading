/**
 * Signal Collector SDK
 * 
 * 轻量级埋点采集工具，向外部信号服务上报用户行为数据。
 * 所有字段名和事件编码均已混淆，降低可读性。
 *
 * ── 事件编码映射表 ──
 * 
 * 【付费意愿分析】
 *   1001  用户点击"卡密升级"入口
 *   1002  用户在卡密弹窗中停留超过 10s
 *   1003  用户尝试激活但卡密为空
 *   1004  用户浏览皮肤/装饰配置页面
 *   1005  用户发起 AI 对话
 *
 * 【安全监测】
 *   2001  检测到开发者工具打开
 *   2002  检测到内容复制行为
 *   2003  检测到右键菜单
 *   2004  检测到页面源码查看快捷键
 *
 * 【基础行为】
 *   3001  页面访问 (session start)
 *   3002  页面离开 (session end)
 */

import { useAppStore } from '@/store/appStore'

// ── 配置 ──
const ENDPOINT = import.meta.env.PROD
  ? 'https://find.lucasishere.top/collect'
  : '/collect' // 开发环境可接本地 koa 服务

// ── 签名算法（与后端 collector.ts 中的 _verifyHash 对称）──
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

// ── 获取设备 ID ──
function _getDeviceId(): string {
  try {
    const store = useAppStore()
    return store.deviceId || localStorage.getItem('find_deep_device_id') || 'unknown'
  } catch {
    return localStorage.getItem('find_deep_device_id') || 'unknown'
  }
}

// ── 节流控制：防止同一事件短时间内重复发送 ──
const _throttleMap = new Map<number, number>()
const THROTTLE_MS = 3000 // 同一事件类型最小间隔 3s

function _isThrottled(eventCode: number): boolean {
  const now = Date.now()
  const last = _throttleMap.get(eventCode) || 0
  if (now - last < THROTTLE_MS) return true
  _throttleMap.set(eventCode, now)
  return false
}

/**
 * 发送埋点信号
 * @param t  事件类型编码
 * @param p  附加载荷 (optional)
 * @param s  来源路径 (optional, 默认取当前 pathname)
 */
export function emit(t: number, p?: Record<string, any>, s?: string): void {
  // 节流检查
  if (_isThrottled(t)) return

  const deviceId = _getDeviceId()
  const timestamp = Date.now()
  const signature = _hash(`${timestamp}:/collect`, deviceId)
  const source = s || window.location.pathname

  const body = JSON.stringify({
    t,
    s: source,
    ...(p ? { p } : {})
  })

  // 优先使用 sendBeacon（页面关闭时也能发出去）
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' })

    // sendBeacon 不支持自定义 headers，需要通过 URL 参数传递签名信息
    // 改用 fetch 的 keepalive 模式
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
        keepalive: true, // 即使页面关闭，请求也会完成
      }).catch(() => {
        // 静默失败
      })
    } catch {
      // 静默失败
    }
  } else {
    // 降级：普通 fetch
    fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': deviceId,
        'X-Timestamp': timestamp.toString(),
        'X-Signature': signature,
      },
      body,
    }).catch(() => {})
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 安全监测模块 — 自动初始化，无需外部调用
// ══════════════════════════════════════════════════════════════════════════════

let _securityInitialized = false

/**
 * 初始化安全监测
 * 应在应用入口（如 App.vue 的 onMounted）中调用一次
 */
export function initSecurityMonitor(): void {
  if (_securityInitialized) return
  _securityInitialized = true

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
  // 定时检测，间隔 5s（不需要太频繁）
  setInterval(_checkDevTools, 5000)
  _checkDevTools()

  // ── 2. 内容复制检测 ──
  let _copyCount = 0
  let _copyTimer: ReturnType<typeof setTimeout> | null = null
  document.addEventListener('copy', () => {
    _copyCount++
    // 30s 内连续复制超过 3 次触发上报
    if (_copyCount >= 3) {
      emit(2002, { n: _copyCount })
      _copyCount = 0
    }
    if (_copyTimer) clearTimeout(_copyTimer)
    _copyTimer = setTimeout(() => { _copyCount = 0 }, 30000)
  })

  // ── 3. 右键菜单检测 ──
  document.addEventListener('contextmenu', () => {
    emit(2003)
  })

  // ── 4. 查看源码快捷键检测 (Ctrl+U / Cmd+Option+U) ──
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    // Ctrl+U (View Source)
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      emit(2004, { k: 'ctrl+u' })
    }
    // Ctrl+Shift+I / F12 (DevTools)
    if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I')) {
      emit(2001, { m: 'key' })
    }
  })

  // ── 5. Session 开始上报 ──
  emit(3001)

  // ── 6. Session 结束上报 (beforeunload) ──
  window.addEventListener('beforeunload', () => {
    emit(3002)
  })
}
