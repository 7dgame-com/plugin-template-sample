<template>
  <div class="app-layout">
    <!-- 侧边栏遮罩（移动端） -->
    <div
      v-if="sidebarOpen"
      class="sidebar-overlay"
      @click="sidebarOpen = false"
    />

    <!-- 抽屉式侧边栏 -->
    <aside v-if="hasAny()" class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <span class="sidebar-title">{{ t('sample.title') }}</span>
        <button class="sidebar-close" @click="sidebarOpen = false">
          <el-icon><Close /></el-icon>
        </button>
      </div>
      <nav class="sidebar-nav">
        <router-link
          v-if="can('view-sample')"
          to="/list"
          class="sidebar-item"
          :class="{ active: $route.path === '/list' }"
          @click="sidebarOpen = false"
        >
          <el-icon><List /></el-icon>
          <span>{{ t('sample.list') }}</span>
        </router-link>
        <router-link
          v-if="can('create-sample')"
          to="/create"
          class="sidebar-item"
          :class="{ active: $route.path === '/create' }"
          @click="sidebarOpen = false"
        >
          <el-icon><Plus /></el-icon>
          <span>{{ t('sample.createSample') }}</span>
        </router-link>
      </nav>
    </aside>

    <!-- 主内容区 -->
    <div class="main-area">
      <header class="navbar">
        <button v-if="hasAny()" class="menu-btn" @click="sidebarOpen = true">
          <el-icon :size="20"><Fold /></el-icon>
        </button>
        <h1 class="navbar-title">{{ currentTitle }}</h1>
        <div class="navbar-spacer" />
      </header>
      <main class="content">
        <div v-if="loaded && !hasAny()" class="no-permission">
          <el-empty :description="t('layout.noPermission')" />
        </div>
        <router-view v-else />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Close, Plus, Fold, List } from '@element-plus/icons-vue'
import { usePermissions } from '../composables/usePermissions'

const { t } = useI18n()
const route = useRoute()
const { fetchAllowedActions, can, hasAny, loaded } = usePermissions()

const sidebarOpen = ref(false)

/**
 * 当前页面标题（根据路由 meta.titleKey 动态获取翻译）
 */
const currentTitle = computed(() => {
  const titleKey = route.meta.titleKey as string | undefined
  return titleKey ? t(titleKey) : t('sample.title')
})

onMounted(async () => {
  try {
    await fetchAllowedActions()
  } catch {
    // 静默失败，不影响页面使用
  }
})
</script>

<style scoped>
/* ========== 整体布局 ========== */
.app-layout {
  min-height: 100vh;
  background: var(--bg-page);
}

/* ========== 侧边栏遮罩 ========== */
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 998;
  transition: opacity var(--transition-normal);
}

/* ========== 侧边栏 ========== */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 280px;
  background: var(--bg-card);
  border-right: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
  z-index: 999;
  transform: translateX(-100%);
  transition: transform var(--transition-normal);
  display: flex;
  flex-direction: column;
}

.sidebar.open {
  transform: translateX(0);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.sidebar-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--primary-color);
}

.sidebar-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: var(--spacing-xs);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.sidebar-close:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

/* ========== 侧边栏导航 ========== */
.sidebar-nav {
  flex: 1;
  padding: var(--spacing-sm);
  overflow-y: auto;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  margin: var(--spacing-sm);
  border: none;
  background: none;
  width: calc(100% - var(--spacing-md));
  font-size: var(--font-size-md);
  font-family: var(--font-family);
}

.sidebar-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.sidebar-item.active {
  background: var(--primary-light);
  color: var(--primary-color);
  font-weight: var(--font-weight-medium);
}

/* ========== 主内容区 ========== */
.main-area {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ========== 导航栏 ========== */
.navbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: 0 var(--spacing-lg);
  height: 64px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.menu-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
}

.menu-btn:hover {
  background: var(--bg-hover);
  color: var(--primary-color);
}

.navbar-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
}

.navbar-spacer {
  flex: 1;
}

/* ========== 内容区 ========== */
.content {
  flex: 1;
  padding: var(--spacing-lg);
}

.no-permission {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

/* ========== 响应式布局 ========== */

/* 桌面端：侧边栏常驻 */
@media (min-width: 1024px) {
  .sidebar {
    position: fixed;
    transform: translateX(0);
    box-shadow: none;
  }

  .sidebar-close {
    display: none;
  }

  .sidebar-overlay {
    display: none;
  }

  .menu-btn {
    display: none;
  }

  .main-area {
    margin-left: 280px;
  }
}

/* 平板端 */
@media (min-width: 768px) and (max-width: 1023px) {
  .content {
    padding: var(--spacing-md);
  }
}

/* 手机端 */
@media (max-width: 767px) {
  .navbar {
    padding: 0 var(--spacing-md);
  }

  .content {
    padding: var(--spacing-sm);
  }
}
</style>
