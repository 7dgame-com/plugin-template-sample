/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>
  export default component
}

interface ImportMetaEnv {
  /**
   * 主后端 API 地址
   * Main backend API URL for plugin authentication and authorization
   * @example 'http://localhost:8082'
   */
  readonly VITE_MAIN_API_URL: string

  /**
   * 插件后端 API 地址（如果使用前后端分离架构）
   * Plugin backend API URL (if using full-stack architecture)
   * @example 'http://localhost:8085'
   */
  readonly VITE_PLUGIN_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
