# 全局样式使用指南

## 概述

`src/styles/index.css` 包含了插件模板的全局样式，使用 CSS 变量适配主系统的 6 种主题。

## 导入方式

在 `src/main.ts` 中导入全局样式：

```typescript
import { createApp } from 'vue'
import App from './App.vue'
import './styles/index.css'  // 导入全局样式

const app = createApp(App)
app.mount('#app')
```

## 支持的主题

样式文件自动适配以下 6 种主题：

1. **modern-blue** - 科技蓝，现代简洁（默认）
2. **deep-space** - 深空蓝，专业沉浸
3. **cyber-tech** - 赛博霓虹，未来感
4. **edu-friendly** - 活力橙，温暖友好
5. **neo-brutalism** - 大胆黄，艺术风格
6. **minimal-pure** - 极简黑白，专注

## CSS 变量说明

### 颜色变量

```css
/* 主色调 */
--primary-color          /* 主题主色 */
--primary-hover          /* 主色悬停态 */
--primary-light          /* 主色浅色（10% 透明度） */
--primary-dark           /* 主色深色 */

/* 文字颜色 */
--text-primary           /* 一级标题/主要内容 */
--text-secondary         /* 正文/次要内容 */
--text-muted             /* 辅助信息/禁用态 */
--text-inverse           /* 反色（通常为白色） */

/* 背景颜色 */
--bg-page                /* 页面背景 */
--bg-card                /* 卡片/容器背景 */
--bg-hover               /* 悬停态背景 */
--bg-active              /* 激活态背景 */

/* 边框颜色 */
--border-color           /* 标准边框 */
--border-color-hover     /* 悬停态边框 */
--border-color-active    /* 激活态边框 */

/* 语义色 */
--success-color          /* 成功/正确 */
--warning-color          /* 警告 */
--danger-color           /* 危险/错误 */
--info-color             /* 信息 */
```

### 间距变量

```css
--spacing-xs: 4px        /* 微小间距 */
--spacing-sm: 8px        /* 小间距 */
--spacing-md: 16px       /* 标准间距 */
--spacing-lg: 24px       /* 大间距 */
--spacing-xl: 32px       /* 超大间距 */
```

### 圆角变量

```css
--radius-sm: 12px        /* 小圆角（按钮、输入框） */
--radius-md: 20px        /* 中圆角（卡片、对话框） */
--radius-lg: 24px        /* 大圆角（容器） */
--radius-full: 9999px    /* 完全圆形 */
```

### 阴影变量

```css
--shadow-sm              /* 小阴影 */
--shadow-md              /* 中阴影 */
--shadow-lg              /* 大阴影 */
--shadow-primary         /* 主色阴影 */
```

### 过渡变量

```css
--transition-fast: 0.15s ease      /* 快速反馈 */
--transition-normal: 0.2s ease     /* 标准过渡 */
--transition-slow: 0.3s ease       /* 缓慢过渡 */
```

## 使用示例

### 1. 使用预定义的组件类

```vue
<template>
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">卡片标题</h3>
    </div>
    <div class="card-body">
      <p>卡片内容</p>
    </div>
    <div class="card-footer">
      <button class="btn btn-primary">确认</button>
      <button class="btn btn-secondary">取消</button>
    </div>
  </div>
</template>
```

### 2. 使用 CSS 变量自定义样式

```vue
<template>
  <div class="custom-component">
    <h2>自定义组件</h2>
  </div>
</template>

<style scoped>
.custom-component {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
}

.custom-component:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.custom-component h2 {
  color: var(--primary-color);
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-sm);
}
</style>
```

### 3. 使用工具类

```vue
<template>
  <div class="flex items-center justify-between gap-md p-md">
    <span class="text-primary font-bold">标题</span>
    <button class="btn btn-primary rounded-sm shadow-sm">操作</button>
  </div>
</template>
```

## 预定义组件类

### 按钮

- `.btn` - 基础按钮
- `.btn-primary` - 主要按钮
- `.btn-secondary` - 次要按钮
- `.btn-danger` - 危险按钮
- `.btn-link` - 链接样式按钮

### 卡片

- `.card` - 卡片容器
- `.card-header` - 卡片头部
- `.card-title` - 卡片标题
- `.card-body` - 卡片内容
- `.card-footer` - 卡片底部

### 表单

- `.form-group` - 表单组
- `.form-label` - 表单标签
- `.form-input` - 表单输入框

### 表格

- `.data-table` - 数据表格

### 徽章

- `.badge` - 基础徽章
- `.badge-success` - 成功徽章
- `.badge-warning` - 警告徽章
- `.badge-danger` - 危险徽章
- `.badge-info` - 信息徽章

### 布局

- `.container` - 容器
- `.page-header` - 页面头部
- `.page-title` - 页面标题
- `.toolbar` - 工具栏
- `.empty-state` - 空状态
- `.loading-state` - 加载状态

## 工具类

### 间距工具类

- `.mt-*`, `.mb-*`, `.ml-*`, `.mr-*` - 外边距（xs/sm/md/lg/xl）
- `.p-*` - 内边距（xs/sm/md/lg/xl）

### 文字工具类

- `.text-primary`, `.text-secondary`, `.text-muted`, `.text-inverse` - 文字颜色
- `.text-xs`, `.text-sm`, `.text-md`, `.text-lg`, `.text-xl` - 文字大小
- `.font-normal`, `.font-medium`, `.font-bold` - 字体粗细
- `.text-left`, `.text-center`, `.text-right` - 文字对齐

### 布局工具类

- `.flex`, `.flex-col`, `.flex-wrap` - Flexbox
- `.items-center`, `.items-start`, `.items-end` - 对齐
- `.justify-center`, `.justify-between`, `.justify-end` - 分布
- `.gap-*` - 间隙（xs/sm/md/lg）
- `.w-full`, `.h-full` - 宽高

### 显示工具类

- `.hidden`, `.block`, `.inline-block` - 显示方式

### 圆角工具类

- `.rounded-sm`, `.rounded-md`, `.rounded-lg`, `.rounded-full` - 圆角

### 阴影工具类

- `.shadow-sm`, `.shadow-md`, `.shadow-lg` - 阴影

## 响应式设计

样式文件包含响应式断点：

- **桌面端**: >= 1024px
- **平板端**: 768px - 1023px
- **手机端**: < 768px

在不同屏幕尺寸下，间距和布局会自动调整。

## Element Plus 集成

样式文件自动覆盖 Element Plus 的主题变量，确保 Element Plus 组件与主系统主题保持一致。

```css
:root {
  --el-color-primary: var(--primary-color);
  --el-bg-color: var(--bg-page);
  --el-text-color-primary: var(--text-primary);
  --el-border-color: var(--border-color);
}
```

## 最佳实践

### ✅ 推荐做法

1. **始终使用 CSS 变量**

```css
.my-component {
  background: var(--bg-card);
  color: var(--text-primary);
}
```

2. **使用预定义的间距和圆角**

```css
.my-component {
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
}
```

3. **使用工具类快速构建布局**

```vue
<div class="flex items-center gap-md p-md">
  <!-- 内容 -->
</div>
```

### ❌ 避免做法

1. **硬编码颜色值**

```css
/* 错误 */
.my-component {
  background: #ffffff;
  color: #333333;
}
```

2. **硬编码间距值**

```css
/* 错误 */
.my-component {
  padding: 16px;
  margin: 24px;
}
```

3. **不考虑主题适配**

```css
/* 错误 - 在深色主题下可能不可见 */
.my-component {
  color: black;
  background: white;
}
```

## 主题测试

在开发过程中，应该在所有 6 种主题下测试组件的视觉效果：

1. 在主系统中切换主题
2. 检查插件中的颜色、对比度、可读性
3. 验证悬停和激活状态
4. 测试响应式布局

## 参考资源

- **主系统设计指南**: `web/docs/plugin-design-guide.md`
- **设计系统索引**: `web/docs/DESIGN_SYSTEM_INDEX.md`
- **快速参考**: `web/docs/plugin-design-quick-reference.md`
