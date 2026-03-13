# AppLayout 组件使用指南

## 概述

`AppLayout.vue` 是插件模板的主布局组件，提供响应式的侧边栏导航和顶部导航栏。该组件遵循 `web/docs/plugin-design-guide.md` 的布局规范，使用 CSS 变量适配主系统的 6 种主题。

## 功能特性

- ✅ 响应式布局（桌面端、平板端、手机端）
- ✅ 抽屉式侧边栏（移动端）
- ✅ 固定侧边栏（桌面端）
- ✅ 权限控制导航项显示
- ✅ 用户信息展示
- ✅ 主题适配（6 种主题）
- ✅ 多语言支持（5 种语言）

## 使用方法

### 1. 在 App.vue 中使用

```vue
<template>
  <AppLayout />
</template>

<script setup lang="ts">
import AppLayout from './layout/AppLayout.vue'
</script>
```

### 2. 配置路由

在 `router/index.ts` 中配置路由，并设置 `meta.title` 用于显示页面标题：

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '../layout/AppLayout.vue'
import SampleList from '../views/SampleList.vue'
import SampleForm from '../views/SampleForm.vue'

const routes = [
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: 'samples',
        name: 'SampleList',
        component: SampleList,
        meta: { title: '示例列表' }
      },
      {
        path: 'samples/create',
        name: 'CreateSample',
        component: SampleForm,
        meta: { title: '创建示例' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
```

### 3. 配置权限

在 `composables/usePermissions.ts` 中定义权限标识，并在主系统中配置对应的权限：

```typescript
// 权限标识示例
const PERMISSIONS = {
  LIST_SAMPLES: 'list-samples',      // 查看示例列表
  CREATE_SAMPLE: 'create-sample',    // 创建示例
  EDIT_SAMPLE: 'edit-sample',        // 编辑示例
  DELETE_SAMPLE: 'delete-sample'     // 删除示例
}
```

### 4. 自定义侧边栏导航

修改 `AppLayout.vue` 中的侧边栏导航项：

```vue
<nav class="sidebar-nav">
  <!-- 添加新的导航项 -->
  <router-link
    v-if="can('your-permission')"
    to="/your-route"
    class="sidebar-item"
    :class="{ active: $route.path === '/your-route' }"
    @click="sidebarOpen = false"
  >
    <el-icon><YourIcon /></el-icon>
    <span>{{ t('nav.yourLabel') }}</span>
  </router-link>
</nav>
```

## 布局结构

```
┌─────────────────────────────────────────────────────────┐
│  AppLayout                                              │
│  ┌──────────────┐  ┌──────────────────────────────────┐│
│  │              │  │  Navbar                          ││
│  │              │  │  ┌────────────────────────────┐  ││
│  │  Sidebar     │  │  │ Menu | Title | User Info  │  ││
│  │              │  │  └────────────────────────────┘  ││
│  │  - Nav Item  │  │                                  ││
│  │  - Nav Item  │  │  Content Area                    ││
│  │  - Nav Item  │  │  ┌────────────────────────────┐  ││
│  │              │  │  │                            │  ││
│  │              │  │  │  <router-view />           │  ││
│  │              │  │  │                            │  ││
│  │              │  │  └────────────────────────────┘  ││
│  └──────────────┘  └──────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

## 响应式行为

### 桌面端（≥1024px）

- 侧边栏固定显示在左侧（260px 宽度）
- 主内容区自动调整左边距
- 菜单按钮隐藏
- 侧边栏关闭按钮隐藏

### 平板端（768px - 1023px）

- 侧边栏变为抽屉式（默认隐藏）
- 点击菜单按钮打开侧边栏
- 点击遮罩层或导航项关闭侧边栏
- 内容区 padding 减小

### 手机端（<768px）

- 侧边栏变为抽屉式（默认隐藏）
- 导航栏 padding 减小
- 用户名隐藏，只显示图标和角色标签
- 内容区 padding 进一步减小

## CSS 变量使用

布局组件使用以下 CSS 变量，确保在所有主题下正确显示：

### 颜色变量

```css
--primary-color        /* 主色调 */
--text-primary         /* 主要文字颜色 */
--text-secondary       /* 次要文字颜色 */
--text-muted           /* 辅助文字颜色 */
--bg-page              /* 页面背景色 */
--bg-card              /* 卡片背景色 */
--bg-hover             /* 悬停背景色 */
--border-color         /* 边框颜色 */
--primary-light        /* 主色浅色（激活态背景） */
```

### 间距变量

```css
--spacing-xs           /* 4px */
--spacing-sm           /* 8px */
--spacing-md           /* 16px */
--spacing-lg           /* 24px */
```

### 圆角变量

```css
--radius-sm            /* 12px */
```

### 阴影变量

```css
--shadow-sm            /* 小阴影 */
--shadow-lg            /* 大阴影 */
```

### 过渡变量

```css
--transition-fast      /* 0.15s ease */
--transition-normal    /* 0.2s ease */
```

### 字体变量

```css
--font-family          /* 字体族 */
--font-size-sm         /* 13px */
--font-size-md         /* 14px */
--font-size-lg         /* 16px */
--font-size-xl         /* 18px */
--font-weight-medium   /* 500 */
--font-weight-bold     /* 600 */
```

## 权限控制

### 导航项权限控制

使用 `v-if="can('permission-name')"` 控制导航项的显示：

```vue
<router-link
  v-if="can('list-samples')"
  to="/samples"
  class="sidebar-item"
>
  <el-icon><List /></el-icon>
  <span>{{ t('nav.sampleList') }}</span>
</router-link>
```

### 无权限提示

当用户没有任何权限时，显示无权限提示：

```vue
<div v-if="loaded && !hasAny()" class="no-permission">
  <el-empty :description="t('common.noPermission')" />
</div>
```

## 多语言支持

### 使用翻译

在模板中使用 `t()` 函数：

```vue
<span>{{ t('nav.sampleList') }}</span>
<span>{{ t('app.title') }}</span>
```

### 配置翻译文件

在 `i18n/locales/` 目录下的各语言文件中添加翻译：

```typescript
// zh-CN.ts
export default {
  app: {
    title: '插件模板'
  },
  nav: {
    sampleList: '示例列表',
    createSample: '创建示例'
  },
  common: {
    noPermission: '您没有此插件的任何操作权限，请联系管理员配置'
  }
}
```

## 自定义样式

### 修改侧边栏宽度

```css
.sidebar {
  width: 280px; /* 默认 260px */
}

@media (min-width: 1024px) {
  .main-area {
    margin-left: 280px; /* 与侧边栏宽度一致 */
  }
}
```

### 修改导航栏高度

```css
.navbar {
  height: 64px; /* 默认 56px */
}
```

### 添加自定义样式

在 `<style scoped>` 中添加自定义样式，确保使用 CSS 变量：

```css
.custom-element {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: var(--spacing-md);
}
```

## 最佳实践

### 1. 使用 CSS 变量

❌ 避免硬编码颜色值：

```css
.element {
  background: #ffffff;
  color: #333333;
}
```

✅ 使用 CSS 变量：

```css
.element {
  background: var(--bg-card);
  color: var(--text-primary);
}
```

### 2. 权限检查

❌ 不检查权限直接显示：

```vue
<router-link to="/samples">示例列表</router-link>
```

✅ 使用权限检查：

```vue
<router-link v-if="can('list-samples')" to="/samples">
  示例列表
</router-link>
```

### 3. 多语言支持

❌ 硬编码文本：

```vue
<span>示例列表</span>
```

✅ 使用翻译函数：

```vue
<span>{{ t('nav.sampleList') }}</span>
```

### 4. 响应式设计

确保在所有屏幕尺寸下测试布局：

- 桌面端（1920px、1440px、1024px）
- 平板端（768px、1023px）
- 手机端（375px、414px、767px）

## 常见问题

### Q: 侧边栏导航项不显示？

A: 检查以下几点：
1. 是否调用了 `fetchAllowedActions()` 加载权限
2. 权限标识是否正确（与主系统配置一致）
3. 用户是否有对应的权限

### Q: 主题切换后样式不正确？

A: 确保所有样式都使用 CSS 变量，避免硬编码颜色值。

### Q: 移动端侧边栏无法关闭？

A: 检查是否正确绑定了 `@click="sidebarOpen = false"` 事件。

### Q: 用户信息不显示？

A: 检查后端 API `/samples/me` 是否正确返回用户信息。

## 参考资源

- **插件设计指南**: `web/docs/plugin-design-guide.md`
- **权限 API 参考**: `web/docs/plugin-auth-api-reference.md`
- **权限 API 使用指南**: `web/docs/plugin-auth-api-usage.md`
- **多语言指南**: `frontend/docs/I18N.md`
- **参考实现**: `plugins/user-management/frontend/src/layout/AppLayout.vue`

## 更新日志

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | 2024-03-13 | 初始版本 |

---

**维护者**: 插件模板团队  
**最后更新**: 2024-03-13
