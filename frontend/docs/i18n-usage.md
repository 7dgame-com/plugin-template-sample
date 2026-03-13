# Vue I18n 使用指南

## 概述

本插件已配置 Vue I18n 支持五种语言的国际化：
- 简体中文 (zh-CN) - 默认语言
- 繁体中文 (zh-TW)
- 英语 (en-US)
- 日语 (ja-JP)
- 泰语 (th-TH)

## 配置说明

### 核心配置文件

- **`src/i18n/index.ts`**: Vue I18n 实例配置
- **`src/i18n/locales/`**: 语言文件目录

### 语言切换机制

插件通过 URL 参数 `lang` 自动切换语言：

```
?lang=zh-CN  // 简体中文
?lang=zh-TW  // 繁体中文
?lang=en-US  // 英语
?lang=ja-JP  // 日语
?lang=th-TH  // 泰语
```

如果 URL 中没有 `lang` 参数或参数值无效，将使用默认语言（简体中文）。

## 在组件中使用

### 模板中使用

```vue
<template>
  <div>
    <!-- 使用 $t() 函数 -->
    <h1>{{ $t('sample.title') }}</h1>
    <button>{{ $t('common.save') }}</button>
    
    <!-- 在属性中使用 -->
    <el-input :placeholder="$t('sample.namePlaceholder')" />
  </div>
</template>
```

### 脚本中使用

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 在函数中使用
const showMessage = () => {
  ElMessage.success(t('sample.messages.createSuccess'))
}
</script>
```

## 语言文件结构

每个语言文件导出一个对象，包含以下命名空间：

### common - 通用文本

```typescript
common: {
  search: '搜索',
  add: '添加',
  edit: '编辑',
  delete: '删除',
  // ...
}
```

### sample - 示例功能文本

```typescript
sample: {
  title: '示例管理',
  list: '示例列表',
  messages: {
    createSuccess: '创建成功',
    // ...
  }
}
```

### layout - 布局相关文本

```typescript
layout: {
  waitingAuth: '等待主系统授权...',
  requireMainSystem: '请从主系统打开此插件',
}
```

## 添加新的翻译

1. 在 `src/i18n/locales/zh-CN.ts` 中添加新的键值对
2. 在其他四个语言文件中添加对应的翻译
3. 在组件中使用 `$t('your.new.key')`

示例：

```typescript
// zh-CN.ts
export default {
  sample: {
    newFeature: '新功能',
  }
}

// en-US.ts
export default {
  sample: {
    newFeature: 'New Feature',
  }
}
```

## 最佳实践

1. **保持键名一致**：所有语言文件的键名结构必须完全一致
2. **使用命名空间**：按功能模块组织翻译文本（common、sample、layout 等）
3. **避免硬编码**：所有用户可见的文本都应该使用 i18n
4. **提供占位符**：表单输入框应提供 placeholder 翻译
5. **错误消息**：所有错误和成功消息都应该国际化

## 测试语言切换

在浏览器中访问插件时，在 URL 后添加 `?lang=en-US` 等参数测试不同语言：

```
http://localhost:5173/?lang=en-US
http://localhost:5173/?lang=ja-JP
http://localhost:5173/?lang=th-TH
```
