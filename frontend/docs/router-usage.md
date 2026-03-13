# 路由配置使用指南

## 概述

本文档说明插件模板的路由配置和权限守卫的使用方法。

## 路由结构

插件使用 Vue Router 定义了以下路由：

```
/                           # 根路径（重定向到 /list）
├── /list                   # 示例列表页
├── /create                 # 创建示例页
└── /edit/:id               # 编辑示例页（动态参数 :id）
```

## 路由配置

### 基本路由定义

```typescript
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('../layout/AppLayout.vue'),
    redirect: '/list',
    children: [
      {
        path: 'list',
        name: 'SampleList',
        component: () => import('../views/SampleList.vue'),
        meta: {
          title: '示例列表',
          requiresPermission: 'view-sample'
        }
      },
      // ... 其他路由
    ]
  }
]
```

### 路由 Meta 字段

每个路由可以定义以下 meta 字段：

- **title**: 页面标题，会自动设置到 `document.title`
- **requiresPermission**: 访问该路由所需的权限标识

## 权限守卫

### 工作原理

路由配置了全局前置守卫，在每次路由导航前自动检查权限：

1. 检查目标路由的 `meta.requiresPermission` 字段
2. 如果定义了权限要求，调用 `usePermissions().checkPermission()` 验证
3. 有权限则允许导航，无权限则阻止并显示错误提示

### 权限检查流程

```typescript
router.beforeEach(async (to, from, next) => {
  const requiredPermission = to.meta.requiresPermission as string | undefined

  if (requiredPermission) {
    const { checkPermission } = usePermissions()
    const hasPermission = await checkPermission(requiredPermission)

    if (hasPermission) {
      next() // 允许导航
    } else {
      ElMessage.error('您没有权限访问此页面')
      next(false) // 阻止导航
    }
  } else {
    next() // 不需要权限，直接允许
  }
})
```

### 权限标识

插件使用以下权限标识：

- `view-sample`: 查看示例列表
- `create-sample`: 创建示例
- `edit-sample`: 编辑示例
- `delete-sample`: 删除示例（在组件中检查）

这些权限标识需要在主系统的插件配置中定义。

## 编程式导航

### 使用路由名称导航

```typescript
import { useRouter } from 'vue-router'

const router = useRouter()

// 导航到列表页
router.push({ name: 'SampleList' })

// 导航到创建页
router.push({ name: 'SampleCreate' })

// 导航到编辑页（带参数）
router.push({ name: 'SampleEdit', params: { id: '123' } })
```

### 使用路径导航

```typescript
// 导航到列表页
router.push('/list')

// 导航到创建页
router.push('/create')

// 导航到编辑页
router.push('/edit/123')
```

## 添加新路由

### 步骤 1: 定义路由

在 `src/router/index.ts` 中添加新路由：

```typescript
{
  path: 'detail/:id',
  name: 'SampleDetail',
  component: () => import('../views/SampleDetail.vue'),
  meta: {
    title: '示例详情',
    requiresPermission: 'view-sample'
  }
}
```

### 步骤 2: 创建组件

创建对应的 Vue 组件文件 `src/views/SampleDetail.vue`。

### 步骤 3: 配置权限（如需要）

如果路由需要特定权限，在主系统的插件配置中添加相应的权限定义。

### 步骤 4: 添加导航链接

在其他组件中添加导航链接：

```vue
<template>
  <router-link :to="{ name: 'SampleDetail', params: { id: item.id } }">
    查看详情
  </router-link>
</template>
```

## 路由参数

### 获取路由参数

在组件中使用 `useRoute()` 获取路由参数：

```typescript
import { useRoute } from 'vue-router'

const route = useRoute()
const id = route.params.id // 获取 :id 参数
```

### 监听路由变化

```typescript
import { watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

watch(
  () => route.params.id,
  (newId) => {
    console.log('ID changed:', newId)
    // 重新加载数据
  }
)
```

## 最佳实践

### 1. 使用路由名称而非路径

推荐使用路由名称进行导航，这样在修改路径时不需要更新所有引用：

```typescript
// 推荐
router.push({ name: 'SampleEdit', params: { id: '123' } })

// 不推荐
router.push('/edit/123')
```

### 2. 在 meta 中定义权限

所有需要权限控制的路由都应在 meta 中定义 `requiresPermission`：

```typescript
meta: {
  requiresPermission: 'view-sample'
}
```

### 3. 懒加载组件

使用动态 import 实现组件懒加载，提高首屏加载速度：

```typescript
component: () => import('../views/SampleList.vue')
```

### 4. 统一错误处理

权限检查失败时，路由守卫会自动显示错误提示，无需在组件中重复处理。

## 调试

### 查看路由信息

在浏览器控制台中查看当前路由信息：

```javascript
// 当前路由
console.log(router.currentRoute.value)

// 所有路由
console.log(router.getRoutes())
```

### 权限检查日志

路由守卫会在控制台输出权限检查的警告信息：

```
[Router] Access denied: missing permission "create-sample" for route "/create"
```

## 参考资源

- [Vue Router 官方文档](https://router.vuejs.org/)
- [usePermissions 使用指南](./usePermissions-usage.md)
- [Plugin Auth API 参考](../../../web/docs/plugin-auth-api-reference.md)
