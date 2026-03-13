<template>
  <!-- 等待主系统认证中 -->
  <div v-if="waiting" class="iframe-waiting">
    <p>{{ t('layout.waitingAuth') }}</p>
  </div>
  <!-- 未获取到 Token，提示需要在主系统中打开 -->
  <div v-else-if="!hasToken" class="iframe-waiting">
    <p>{{ t('layout.requireMainSystem') }}</p>
  </div>
  <!-- 已认证，渲染路由视图 -->
  <router-view v-else />
</template>

<script setup lang="ts">
/**
 * 根组件
 *
 * 职责：
 * 1. 初始化 PostMessage 通信桥接（usePluginBridge）
 * 2. 初始化主题适配（useTheme）
 * 3. 管理认证状态，控制页面渲染
 * 4. 全局错误处理
 */
import { ref, onMounted, onErrorCaptured } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePluginBridge } from './composables/usePluginBridge'
import { useTheme } from './composables/useTheme'
import { getToken, setToken, removeToken, isInIframe, listenForParentToken } from './utils/token'

const { t } = useI18n()

// 初始化主题适配（从 URL 参数读取 + 监听 THEME_CHANGE 消息）
useTheme()

// 初始化 PostMessage 通信桥接
const { isReady } = usePluginBridge({
  onInit: (payload) => {
    // 收到 INIT 消息，保存 Token 并更新状态
    if (payload.token) {
      setToken(payload.token)
      hasToken.value = true
      waiting.value = false
    }
  },
  onTokenUpdate: (payload) => {
    // Token 刷新，更新本地存储
    if (payload.token) {
      setToken(payload.token)
    }
  },
  onDestroy: () => {
    // 插件即将销毁，清理 Token
    removeToken()
    hasToken.value = false
  }
})

/** 是否正在等待主系统认证 */
const waiting = ref(false)
/** 是否已获取到有效 Token */
const hasToken = ref(!!getToken())

onMounted(() => {
  if (isInIframe()) {
    // 在 iframe 中运行：检查是否已有 Token（可能由 index.html 的早期监听器获取）
    if (getToken()) {
      hasToken.value = true
      return
    }
    // 没有 Token，显示等待状态
    waiting.value = true
    // 同时通过 token.ts 的监听器作为备用
    listenForParentToken((token) => {
      if (token) {
        waiting.value = false
        hasToken.value = true
      }
    })
  } else {
    // 独立运行模式：检查是否已有 Token（开发调试用）
    hasToken.value = !!getToken()
  }
})

/**
 * 全局错误处理
 * 捕获子组件中未处理的错误，避免整个应用崩溃
 */
onErrorCaptured((error, instance, info) => {
  console.error('[App] 捕获到未处理的错误:', {
    error,
    component: instance?.$options?.name || '未知组件',
    info
  })
  // 返回 false 阻止错误继续向上传播
  return false
})
</script>

<style scoped>
/* 等待认证状态样式 */
.iframe-waiting {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: var(--text-muted, #999);
  font-size: var(--font-size-md, 14px);
}
</style>
