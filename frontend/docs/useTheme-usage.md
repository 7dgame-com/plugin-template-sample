# useTheme 使用指南

## 概述

`useTheme` 是一个 Vue 组合式函数（Composable），用于在插件中实现主题适配。它能够：

- 从 URL 参数读取初始主题
- 监听主系统的 THEME_CHANGE 消息
- 动态应用主题样式（设置 data-theme 属性和 dark class）
- 自动适配 Element Plus 暗色模式

## 工作原理

主系统通过两种方式传递主题信息：

1. **初始加载**：在 iframe URL 中附带 `theme=xxx` 参数（如 `?lang=zh-CN&theme=edu-friendly`）
2. **动态切换**：通过 PostMessage 发送 `THEME_CHANGE` 消息

插件通过 `useTheme` 接收这些信息，并设置 `html` 元素的 `data-theme` 属性和 `dark` class，配合 CSS 变量实现主题适配。

```
┌─────────────────────────────────────┐
│  主系统 (Parent Window)              │
│                                     │
│  1. 初始加载：                       │
│     iframe.src = "...?theme=xxx"    │
│                                     │
│  2. 动态切换：                       │
│     postMessage({                   │
│       type: 'THEME_CHANGE',         │
│       payload: { theme: 'xxx' }     │
│     })                              │
│                                     │
│    <iframe>                         │
│      ┌───────────────────────────┐  │
│      │  插件 (Plugin)             │  │
│      │                           │  │
│      │  <html data-theme="dark"  │  │
│      │        class="dark">      │  │
│      │    CSS 变量自动生效 ✓      │  │
│      └───────────────────────────┘  │
│    </iframe>                        │
└─────────────────────────────────────┘
```

## 基础用法

### 1. 在 App.vue 中初始化

```vue
<script setup lang="ts">
import { useTheme } from './composables/useTheme'

// 初始化主题适配（自动从 URL 读取并监听 THEME_CHANGE 消息）
useTheme()
</script>
```

### 2. 在组件中使用主题信息

```vue
<template>
  <div class="my-component">
    <p>当前主题: {{ currentTheme }}</p>
    <p>暗色模式: {{ isDark ? '是' : '否' }}</p>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

const { currentTheme, isDark } = useTheme()
</script>
```

### 3. 在样式中使用 CSS 变量

```vue
<template>
  <div class="themed-card">
    <h3 class="card-title">标题</h3>
    <p class="card-content">内容</p>
  </div>
</template>

<style scoped>
.themed-card {
  /* 使用 CSS 变量，自动适配所有主题 */
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
}

.card-title {
  color: var(--text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-sm);
}

.card-content {
  color: var(--text-secondary);
  font-size: var(--font-size-md);
  line-height: 1.6;
}
</style>
```

## API 参考

### 返回值

```typescript
interface UseThemeReturn {
  /** 当前主题名称 */
  currentTheme: Ref<string>
  
  /** 是否为暗色主题 */
  isDark: Ref<boolean>
  
  /** 检查主题是否为暗色 */
  checkIsDark: (themeName: string) => boolean
  
  /** 应用主题样式到 DOM */
  applyTheme: (themeName: string) => void
}
```

### 方法说明

#### `checkIsDark(themeName: string)`

检查指定主题是否为暗色主题。

**参数：**
- `themeName`: 主题名称（如 'deep-space', 'cyber-tech', 'modern-blue' 等）

**返回值：**
- `boolean`: 如果是暗色主题返回 `true`，否则返回 `false`

**示例：**
```typescript
const { checkIsDark } = useTheme()

console.log(checkIsDark('deep-space'))  // true
console.log(checkIsDark('modern-blue')) // false
```

#### `applyTheme(themeName: string)`

手动应用指定主题。通常不需要手动调用，因为 `useTheme` 会自动从 URL 读取并监听主题变化。

**参数：**
- `themeName`: 主题名称

**示例：**
```typescript
const { applyTheme } = useTheme()

// 手动切换到暗色主题
applyTheme('deep-space')
```

## 可用的 CSS 变量

### 颜色变量

```css
/* 主色调 */
--primary-color        /* 主题主色 */
--primary-hover        /* 主色悬停态 */
--primary-light        /* 主色浅色（10% 透明度） */
--primary-dark         /* 主色深色 */

/* 文字颜色 */
--text-primary         /* 一级标题/主要内容 */
--text-secondary       /* 正文/次要内容 */
--text-muted           /* 辅助信息/禁用态 */
--text-inverse         /* 反色（通常为白色） */

/* 背景颜色 */
--bg-page              /* 页面背景 */
--bg-card              /* 卡片/容器背景 */
--bg-hover             /* 悬停态背景 */
--bg-active            /* 激活态背景 */
--bg-secondary         /* 次要背景 */
--bg-tertiary          /* 第三级背景 */

/* 边框颜色 */
--border-color         /* 标准边框 */
--border-color-hover   /* 悬停态边框 */
--border-color-active  /* 激活态边框 */

/* 语义色 */
--success-color        /* 成功/正确 */
--success-light        /* 成功浅色 */
--warning-color        /* 警告 */
--warning-light        /* 警告浅色 */
--danger-color         /* 危险/错误 */
--danger-light         /* 危险浅色 */
--info-color           /* 信息 */
--info-light           /* 信息浅色 */
```

### 间距变量

```css
--spacing-xs           /* 4px */
--spacing-sm           /* 8px */
--spacing-md           /* 16px */
--spacing-lg           /* 24px */
--spacing-xl           /* 32px */
```

### 圆角变量

```css
--radius-sm            /* 12px */
--radius-md            /* 20px */
--radius-lg            /* 24px */
--radius-full          /* 9999px */
```

### 阴影变量

```css
--shadow-sm            /* 0 1px 3px rgba(0, 0, 0, 0.05) */
--shadow-md            /* 0 4px 12px rgba(0, 0, 0, 0.08) */
--shadow-lg            /* 0 8px 24px rgba(0, 0, 0, 0.12) */
```

### 字体变量

```css
--font-family          /* 字体族 */
--font-size-xs         /* 12px */
--font-size-sm         /* 13px */
--font-size-md         /* 14px */
--font-size-lg         /* 16px */
--font-size-xl         /* 18px */
--font-weight          /* 400 */
--font-weight-medium   /* 500 */
--font-weight-bold     /* 600 */
```

### 过渡变量

```css
--transition-fast      /* 0.15s ease */
--transition-normal    /* 0.2s ease */
--transition-slow      /* 0.3s ease */
```

## 支持的主题

主系统支持 6 种预设主题：

| 主题名称 | 主色 | 模式 | 特点 |
|---------|------|------|------|
| `modern-blue` | #00BAFF | 亮色 | 科技蓝，现代简洁（默认） |
| `deep-space` | #2D68FF | **暗色** | 深空蓝，专业沉浸 |
| `cyber-tech` | #00F2FF | **暗色** | 赛博霓虹，未来感 |
| `edu-friendly` | #FF6B35 | 亮色 | 活力橙，温暖友好 |
| `neo-brutalism` | #FFF000 | 亮色 | 大胆黄，艺术风格 |
| `minimal-pure` | #000000 | 亮色 | 极简黑白，专注 |

**暗色主题列表：** `deep-space`、`cyber-tech`

当主题为暗色时，`html` 元素会自动添加 `dark` class，Element Plus 的暗色模式会自动生效。

## 高级用法

### 1. 根据主题动态调整样式

```vue
<template>
  <div :class="['my-component', { 'dark-mode': isDark }]">
    <p>内容</p>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

const { isDark } = useTheme()
</script>

<style scoped>
.my-component {
  /* 默认样式 */
  background: var(--bg-card);
}

.my-component.dark-mode {
  /* 暗色模式特殊样式 */
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
```

### 2. 监听主题变化

```vue
<script setup lang="ts">
import { watch } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { currentTheme, isDark } = useTheme()

// 监听主题名称变化
watch(currentTheme, (newTheme, oldTheme) => {
  console.log(`主题从 ${oldTheme} 切换到 ${newTheme}`)
  
  // 执行主题切换后的逻辑
  // 例如：重新加载某些资源、更新图表配色等
})

// 监听暗色模式切换
watch(isDark, (dark) => {
  console.log('暗色模式:', dark ? '开启' : '关闭')
})
</script>
```

### 3. 条件渲染不同主题的内容

```vue
<template>
  <div class="logo-container">
    <!-- 暗色主题显示白色 logo -->
    <img v-if="isDark" src="/logo-white.svg" alt="Logo" />
    <!-- 亮色主题显示深色 logo -->
    <img v-else src="/logo-dark.svg" alt="Logo" />
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

const { isDark } = useTheme()
</script>
```

## 最佳实践

### ✅ 推荐做法

1. **始终使用 CSS 变量**
   ```css
   /* 推荐 */
   .my-element {
     color: var(--text-primary);
     background: var(--bg-card);
   }
   ```

2. **在 App.vue 中初始化主题**
   ```typescript
   // 在根组件中初始化，确保主题尽早应用
   useTheme()
   ```

3. **提供 fallback 值**
   ```css
   /* 为不支持 CSS 变量的旧浏览器提供 fallback */
   .my-element {
     color: #333; /* fallback */
     color: var(--text-primary);
   }
   ```

4. **使用 isDark 判断而非主题名称**
   ```typescript
   // 推荐：使用 isDark 判断
   if (isDark.value) {
     // 暗色主题的逻辑
   }
   
   // 避免：依赖特定主题名称
   if (currentTheme.value === 'deep-space') {
     // 特定主题的逻辑
   }
   ```

### ❌ 避免做法

1. **不要硬编码颜色值**
   ```css
   /* 避免 */
   .my-element {
     color: #333333;
     background: #FFFFFF;
   }
   ```

2. **不要忘记导入 Element Plus 暗色样式**
   ```typescript
   // 在 main.ts 中必须导入
   import 'element-plus/theme-chalk/dark/css-vars.css'
   ```

3. **不要依赖特定主题的颜色值**
   ```typescript
   // 避免
   if (currentTheme.value === 'modern-blue') {
     // 特定主题的逻辑
   }
   ```

## 故障排查

### 问题：CSS 变量没有生效

**可能原因：**
1. 主系统的 CSS 变量未正确定义
2. CSS 变量名拼写错误
3. 浏览器不支持 CSS 变量

**解决方案：**
```css
/* 1. 检查 CSS 变量名 */
.my-element {
  /* 确保变量名正确 */
  color: var(--text-primary);
}

/* 2. 提供 fallback 值 */
.my-element {
  color: #333; /* fallback */
  color: var(--text-primary);
}
```

### 问题：主题切换后样式没有更新

**可能原因：**
1. 使用了硬编码的颜色值
2. 没有使用响应式的 CSS 变量
3. Element Plus 暗色样式未导入

**解决方案：**
```typescript
// 1. 在 main.ts 中导入 Element Plus 暗色样式
import 'element-plus/theme-chalk/dark/css-vars.css'
```

```css
/* 2. 确保使用 CSS 变量，而不是硬编码 */
.my-element {
  /* 错误：硬编码 */
  color: #00BAFF;
  
  /* 正确：使用 CSS 变量 */
  color: var(--primary-color);
}
```

### 问题：暗色模式下 Element Plus 组件样式不正确

**可能原因：**
Element Plus 暗色样式未导入

**解决方案：**
```typescript
// 在 main.ts 中导入
import 'element-plus/theme-chalk/dark/css-vars.css'
```

### 问题：初始加载时出现亮色闪烁

**可能原因：**
主题应用时机太晚

**解决方案：**
在 `index.html` 中添加早期检测脚本：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>Plugin Template</title>
  
  <!-- 早期主题检测，避免闪烁 -->
  <script>
    (function() {
      const params = new URLSearchParams(window.location.search)
      const theme = params.get('theme')
      const darkThemes = ['deep-space', 'cyber-tech']
      
      if (darkThemes.includes(theme)) {
        document.documentElement.setAttribute('data-theme', 'dark')
        document.documentElement.classList.add('dark')
      }
    })()
  </script>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

## 参考资源

- [插件设计指南](../../../../web/docs/plugin-design-guide.md) - 完整的设计规范
- [插件开发指南](../../../../web/docs/plugin-development-guide.md) - 插件开发技术文档
- [usePluginBridge 使用指南](./usePluginBridge-usage.md) - 插件通信桥接
- [CSS 变量 MDN 文档](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Using_CSS_custom_properties)
