# usePermissions 使用指南

## 概述

`usePermissions` 是一个 Vue 3 组合式函数，用于在插件前端中检查用户权限。它通过调用主后端的 Plugin Auth API 来验证用户是否有权限执行特定操作。

## 功能特性

- ✅ 调用主后端 Plugin Auth API 的 `check-permission` 方法
- ✅ 调用主后端 Plugin Auth API 的 `allowed-actions` 方法
- ✅ 权限结果缓存，避免重复 API 调用
- ✅ 支持单个权限检查
- ✅ 支持批量获取允许的操作
- ✅ 自动处理认证错误

## API 参考

### 状态

- `permissions` - 权限缓存对象（只读）
- `allowedActions` - 允许的操作列表（只读）
- `loaded` - 是否已加载权限（只读）
- `loading` - 是否正在加载权限（只读）

### 方法

#### `checkPermission(action: string): Promise<boolean>`

检查单个权限。如果缓存中已有结果，直接返回；否则调用主后端 API。

**参数：**
- `action` - 操作标识，如 `'view-sample'`、`'create-sample'`

**返回：**
- `Promise<boolean>` - 是否有权限

**示例：**
```typescript
const { checkPermission } = usePermissions()

// 检查是否有创建权限
const canCreate = await checkPermission('create-sample')
if (canCreate) {
  // 显示创建按钮
}
```

#### `fetchAllowedActions(): Promise<string[]>`

批量获取允许的操作列表。该方法会缓存结果，避免重复调用。

**返回：**
- `Promise<string[]>` - 允许的操作列表

**示例：**
```typescript
const { fetchAllowedActions } = usePermissions()

// 在组件初始化时获取所有权限
const actions = await fetchAllowedActions()
console.log('允许的操作:', actions)
// 输出: ['list-samples', 'view-sample', 'create-sample']
```

#### `can(action: string): boolean`

检查是否有指定权限（基于缓存）。使用此方法前需要先调用 `fetchAllowedActions()`。

**参数：**
- `action` - 操作标识

**返回：**
- `boolean` - 是否有权限

**示例：**
```typescript
const { fetchAllowedActions, can } = usePermissions()

// 先获取权限
await fetchAllowedActions()

// 然后使用 can 方法检查
if (can('create-sample')) {
  // 显示创建按钮
}
```

#### `hasAny(): boolean`

检查是否有任意权限。

**返回：**
- `boolean` - 是否有任意权限

**示例：**
```typescript
const { fetchAllowedActions, hasAny } = usePermissions()

await fetchAllowedActions()

if (!hasAny()) {
  // 显示无权限提示
  ElMessage.warning('您没有任何操作权限')
}
```

#### `clearCache(): void`

清除权限缓存。用于用户登出或切换用户时。

**示例：**
```typescript
const { clearCache } = usePermissions()

// 用户登出时清除缓存
function logout() {
  clearCache()
  // ... 其他登出逻辑
}
```

#### `reloadPermissions(): Promise<string[]>`

重新加载权限。强制从服务器重新获取权限信息。

**返回：**
- `Promise<string[]>` - 允许的操作列表

**示例：**
```typescript
const { reloadPermissions } = usePermissions()

// 权限变更后重新加载
await reloadPermissions()
```

## 使用场景

### 场景 1: 在组件初始化时获取权限

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { usePermissions } from '@/composables/usePermissions'

const { fetchAllowedActions, can, loading } = usePermissions()

onMounted(async () => {
  await fetchAllowedActions()
})
</script>

<template>
  <div v-loading="loading">
    <el-button v-if="can('create-sample')" type="primary">
      创建示例
    </el-button>
    <el-button v-if="can('delete-sample')" type="danger">
      删除示例
    </el-button>
  </div>
</template>
```

### 场景 2: 在执行操作前检查权限

```typescript
import { ElMessage } from 'element-plus'
import { usePermissions } from '@/composables/usePermissions'

const { checkPermission } = usePermissions()

async function handleCreate() {
  // 检查权限
  const canCreate = await checkPermission('create-sample')
  
  if (!canCreate) {
    ElMessage.error('您没有创建权限')
    return
  }
  
  // 执行创建操作
  // ...
}
```

### 场景 3: 根据权限显示/隐藏菜单项

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { usePermissions } from '@/composables/usePermissions'

const { fetchAllowedActions, can } = usePermissions()

onMounted(async () => {
  await fetchAllowedActions()
})
</script>

<template>
  <el-menu>
    <el-menu-item v-if="can('list-samples')" index="1">
      示例列表
    </el-menu-item>
    <el-menu-item v-if="can('create-sample')" index="2">
      创建示例
    </el-menu-item>
    <el-menu-item v-if="can('manage-settings')" index="3">
      设置管理
    </el-menu-item>
  </el-menu>
</template>
```

### 场景 4: 在路由守卫中检查权限

```typescript
import { createRouter } from 'vue-router'
import { usePermissions } from '@/composables/usePermissions'

const router = createRouter({
  // ... 路由配置
})

router.beforeEach(async (to, from, next) => {
  // 如果路由需要权限检查
  if (to.meta.requiresPermission) {
    const { checkPermission } = usePermissions()
    const hasPermission = await checkPermission(to.meta.requiresPermission as string)
    
    if (!hasPermission) {
      ElMessage.error('您没有访问此页面的权限')
      next(false)
      return
    }
  }
  
  next()
})
```

## 权限配置

权限配置由管理员在主后端管理后台配置。插件开发者需要定义插件支持的操作标识（action）。

### 示例操作标识

```typescript
// 建议在插件中定义权限常量
export const PERMISSIONS = {
  LIST_SAMPLES: 'list-samples',
  VIEW_SAMPLE: 'view-sample',
  CREATE_SAMPLE: 'create-sample',
  UPDATE_SAMPLE: 'update-sample',
  DELETE_SAMPLE: 'delete-sample',
  MANAGE_SETTINGS: 'manage-settings',
} as const

// 使用时
import { PERMISSIONS } from '@/constants/permissions'

const canCreate = await checkPermission(PERMISSIONS.CREATE_SAMPLE)
```

## 注意事项

1. **插件标识配置**：确保 `usePermissions.ts` 中的 `PLUGIN_NAME` 常量与主系统中注册的插件名称一致。

2. **环境变量配置**：确保 `.env` 文件中配置了正确的主后端 API 地址：
   ```
   VITE_MAIN_API_URL=http://localhost:8082
   ```

3. **缓存策略**：
   - `checkPermission` 会缓存单个权限检查结果
   - `fetchAllowedActions` 会缓存所有允许的操作列表
   - 用户登出或切换用户时，应调用 `clearCache()` 清除缓存

4. **错误处理**：
   - API 调用失败时，默认返回无权限（`false` 或空数组）
   - 不会抛出异常，避免影响页面正常显示

5. **性能优化**：
   - 优先使用 `fetchAllowedActions()` + `can()` 的组合，避免多次 API 调用
   - 在组件初始化时调用 `fetchAllowedActions()`，后续使用 `can()` 检查

## API 端点说明

### 检查单个权限

```
GET /v1/plugin/check-permission?plugin_name=plugin-template-sample&action=create-sample
Authorization: Bearer {jwt_token}
```

**响应：**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "allowed": true,
    "user_id": 24,
    "roles": ["admin", "user"]
  }
}
```

### 批量获取允许的操作

```
GET /v1/plugin/allowed-actions?plugin_name=plugin-template-sample
Authorization: Bearer {jwt_token}
```

**响应：**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "actions": ["list-samples", "view-sample", "create-sample"],
    "user_id": 24,
    "roles": ["admin", "user"]
  }
}
```

## 相关文档

- [Plugin Auth API 使用指南](../../../../web/docs/plugin-auth-api-usage.md)
- [Plugin Auth API 参考](../../../../web/docs/plugin-auth-api-reference.md)
- [插件开发指南](../../../../web/docs/plugin-development-guide.md)
