/**
 * 应用入口文件
 *
 * 初始化 Vue 应用并注册所有插件：
 * - Element Plus（UI 组件库，全量引入）
 * - Pinia（状态管理）
 * - Vue Router（路由）
 * - Vue I18n（国际化，支持 5 种语言）
 * - 主题适配（自动初始化）
 * - 全局样式
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css' // Element Plus 暗色模式支持
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import './composables/useTheme' // 初始化主题（读取 URL 参数 + 监听主框架消息）
import './styles/index.css' // 全局样式（CSS 变量 + 通用组件样式）

// 创建 Vue 应用实例
const app = createApp(App)

// 注册插件
app.use(createPinia()) // 状态管理
app.use(router) // 路由
app.use(i18n) // 国际化
app.use(ElementPlus, { size: 'default' }) // UI 组件库

// 挂载应用到 DOM
app.mount('#app')
