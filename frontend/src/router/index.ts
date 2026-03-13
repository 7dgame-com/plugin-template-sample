import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { usePermissions } from '../composables/usePermissions'
import { ElMessage } from 'element-plus'

/**
 * 路由配置
 * 
 * 路由结构:
 * - /        列表页（默认页面，重定向到 /list）
 * - /create  创建页
 * - /edit/:id 编辑页
 * 
 * 权限守卫:
 * - 通过 meta.requiresPermission 声明所需权限
 * - 全局前置守卫调用 Plugin Auth API 验证
 */

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
          titleKey: 'sample.list',
          requiresPermission: 'view-sample'
        }
      },
      {
        path: 'create',
        name: 'SampleCreate',
        component: () => import('../views/SampleForm.vue'),
        meta: {
          titleKey: 'sample.createSample',
          requiresPermission: 'create-sample'
        }
      },
      {
        path: 'edit/:id',
        name: 'SampleEdit',
        component: () => import('../views/SampleForm.vue'),
        meta: {
          titleKey: 'sample.editSample',
          requiresPermission: 'update-sample'
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

/**
 * 全局前置守卫：权限检查
 * 
 * 1. 读取路由 meta.requiresPermission
 * 2. 调用 checkPermission 验证
 * 3. 无权限则阻止导航并提示
 */
router.beforeEach(async (to, from, next) => {
  const requiredPermission = to.meta.requiresPermission as string | undefined

  if (!requiredPermission) {
    next()
    return
  }

  const { checkPermission } = usePermissions()

  try {
    const hasPermission = await checkPermission(requiredPermission)

    if (hasPermission) {
      next()
    } else {
      ElMessage.error('您没有权限访问此页面')
      console.warn(`[Router] Access denied: missing permission "${requiredPermission}" for route "${to.path}"`)

      // 从其他路由导航过来则返回，否则重定向到列表页
      if (from.name) {
        next(false)
      } else {
        next('/list')
      }
    }
  } catch (error) {
    console.error('[Router] Permission check failed:', error)
    ElMessage.error('权限验证失败，请稍后重试')
    next(false)
  }
})

export default router
