import { ref, onMounted, onUnmounted } from 'vue'

/**
 * PostMessage 消息类型
 */
export type PluginMessageType =
  | 'INIT'
  | 'PLUGIN_READY'
  | 'TOKEN_UPDATE'
  | 'TOKEN_REFRESH_REQUEST'
  | 'TOKEN_EXPIRED'
  | 'REQUEST'
  | 'RESPONSE'
  | 'EVENT'
  | 'DESTROY'

/**
 * PostMessage 消息格式
 */
export interface PluginMessage {
  /** 消息类型 */
  type: PluginMessageType
  /** 消息唯一 ID */
  id: string
  /** 消息负载（可选） */
  payload?: Record<string, unknown>
  /** 关联的请求 ID，用于请求-响应配对（可选） */
  requestId?: string
}

/**
 * INIT 消息的 payload 结构
 */
export interface InitPayload {
  /** 用户的 JWT access token */
  token: string
  /** 用户的 refresh token（可选） */
  refreshToken?: string
  /** 插件的额外配置 */
  config?: Record<string, string | number | boolean>
}

/**
 * TOKEN_UPDATE 消息的 payload 结构
 */
export interface TokenUpdatePayload {
  /** 新的 JWT access token */
  token: string
  /** 新的 refresh token（可选） */
  refreshToken?: string
}

/**
 * 插件通信桥接 Composable
 * 
 * 提供与主系统的 PostMessage 通信能力：
 * - 接收主系统的 INIT 消息（包含 token 和配置）
 * - 接收主系统的 TOKEN_UPDATE 消息（token 刷新）
 * - 接收主系统的 DESTROY 消息（插件即将销毁）
 * - 向主系统发送消息
 * 
 * @example
 * ```ts
 * const { isReady, token, config, sendToParent } = usePluginBridge({
 *   onInit: (payload) => {
 *     console.log('Plugin initialized with token:', payload.token)
 *   },
 *   onTokenUpdate: (payload) => {
 *     console.log('Token updated:', payload.token)
 *   },
 *   onDestroy: () => {
 *     console.log('Plugin is being destroyed')
 *   }
 * })
 * ```
 */
export function usePluginBridge(options?: {
  /** INIT 消息回调 */
  onInit?: (payload: InitPayload) => void
  /** TOKEN_UPDATE 消息回调 */
  onTokenUpdate?: (payload: TokenUpdatePayload) => void
  /** DESTROY 消息回调 */
  onDestroy?: () => void
}) {
  /** 插件是否已准备好（已收到 INIT 消息） */
  const isReady = ref(false)
  /** 当前的 access token */
  const token = ref<string | null>(null)
  /** 插件配置 */
  const config = ref<Record<string, string | number | boolean>>({})

  /**
   * 检查是否在 iframe 中运行
   */
  function isInIframe(): boolean {
    try {
      return window.self !== window.top
    } catch {
      return true
    }
  }

  /**
   * 向主系统发送消息
   */
  function sendToParent(message: Omit<PluginMessage, 'id'> & { id?: string }) {
    if (!isInIframe()) {
      console.warn('[PluginBridge] Not in iframe, cannot send message to parent')
      return
    }

    const fullMessage: PluginMessage = {
      ...message,
      id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    window.parent.postMessage(fullMessage, '*')
  }

  /**
   * 处理 INIT 消息
   */
  function handleInit(payload: InitPayload) {
    token.value = payload.token
    config.value = payload.config || {}
    isReady.value = true

    console.log('[PluginBridge] Received INIT message', {
      hasToken: !!payload.token,
      config: payload.config
    })

    // 调用用户提供的回调
    options?.onInit?.(payload)

    // 通知主系统插件已准备好
    sendToParent({
      type: 'PLUGIN_READY'
    })
  }

  /**
   * 处理 TOKEN_UPDATE 消息
   */
  function handleTokenUpdate(payload: TokenUpdatePayload) {
    token.value = payload.token

    console.log('[PluginBridge] Token updated')

    // 调用用户提供的回调
    options?.onTokenUpdate?.(payload)
  }

  /**
   * 处理 DESTROY 消息
   */
  function handleDestroy() {
    console.log('[PluginBridge] Received DESTROY message')

    // 调用用户提供的回调
    options?.onDestroy?.()

    // 清理状态
    isReady.value = false
    token.value = null
    config.value = {}
  }

  /**
   * PostMessage 事件处理器
   */
  function handleMessage(event: MessageEvent) {
    // 安全检查：只接受来自父窗口的消息
    if (event.source !== window.parent) {
      return
    }

    const message = event.data as PluginMessage
    if (!message || !message.type) {
      return
    }

    switch (message.type) {
      case 'INIT':
        if (message.payload) {
          handleInit(message.payload as unknown as InitPayload)
        }
        break
      case 'TOKEN_UPDATE':
        if (message.payload) {
          handleTokenUpdate(message.payload as unknown as TokenUpdatePayload)
        }
        break
      case 'DESTROY':
        handleDestroy()
        break
      // 其他消息类型可以在这里扩展
      default:
        console.log('[PluginBridge] Received message:', message.type)
    }
  }

  // 生命周期：挂载时开始监听消息
  onMounted(() => {
    if (isInIframe()) {
      window.addEventListener('message', handleMessage)
      console.log('[PluginBridge] Started listening for parent messages')
    } else {
      console.warn('[PluginBridge] Not running in iframe, PostMessage bridge disabled')
    }
  })

  // 生命周期：卸载时停止监听消息
  onUnmounted(() => {
    window.removeEventListener('message', handleMessage)
    console.log('[PluginBridge] Stopped listening for parent messages')
  })

  return {
    /** 插件是否已准备好（已收到 INIT 消息） */
    isReady,
    /** 当前的 access token */
    token,
    /** 插件配置 */
    config,
    /** 检查是否在 iframe 中运行 */
    isInIframe,
    /** 向主系统发送消息 */
    sendToParent
  }
}
