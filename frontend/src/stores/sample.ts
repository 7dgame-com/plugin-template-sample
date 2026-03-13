import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getSampleList,
  getSampleDetail,
  createSample,
  updateSample,
  deleteSample,
  batchDeleteSamples,
  type SampleItem,
  type SampleListResponse
} from '../api'

/**
 * 示例功能状态管理 Store
 * Sample Feature State Management Store
 * 
 * 功能特性 / Features:
 * - 管理示例数据列表 / Manage sample data list
 * - 提供 CRUD 操作 / Provide CRUD operations
 * - 统一的 loading 和 error 状态管理 / Unified loading and error state management
 * - 自动错误提示 / Automatic error notifications
 */
export const useSampleStore = defineStore('sample', () => {
  // ========== 状态 / State ==========
  
  /**
   * 示例列表数据 / Sample list data
   */
  const items = ref<SampleItem[]>([])
  
  /**
   * 当前选中的示例 / Currently selected sample
   */
  const currentItem = ref<SampleItem | null>(null)
  
  /**
   * 加载状态 / Loading state
   */
  const loading = ref(false)
  
  /**
   * 列表加载状态 / List loading state
   */
  const listLoading = ref(false)
  
  /**
   * 详情加载状态 / Detail loading state
   */
  const detailLoading = ref(false)
  
  /**
   * 提交状态（创建/更新） / Submit state (create/update)
   */
  const submitting = ref(false)
  
  /**
   * 删除状态 / Delete state
   */
  const deleting = ref(false)
  
  /**
   * 错误信息 / Error message
   */
  const error = ref<string | null>(null)
  
  /**
   * 分页信息 / Pagination info
   */
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0
  })
  
  /**
   * 搜索关键词 / Search keyword
   */
  const searchKeyword = ref('')
  
  /**
   * 状态筛选 / Status filter
   */
  const statusFilter = ref<'active' | 'inactive' | ''>('')
  
  // ========== 计算属性 / Computed ==========
  
  /**
   * 是否有数据 / Has data
   */
  const hasItems = computed(() => items.value.length > 0)
  
  /**
   * 是否为空 / Is empty
   */
  const isEmpty = computed(() => !listLoading.value && items.value.length === 0)
  
  /**
   * 总页数 / Total pages
   */
  const totalPages = computed(() => 
    Math.ceil(pagination.value.total / pagination.value.pageSize)
  )
  
  // ========== Actions ==========
  
  /**
   * 获取示例列表 / Fetch sample list
   * @param params 查询参数 / Query parameters
   */
  async function fetchList(params?: {
    page?: number
    pageSize?: number
    keyword?: string
    status?: string
  }) {
    listLoading.value = true
    error.value = null
    
    try {
      // 合并参数 / Merge parameters
      const queryParams = {
        page: params?.page ?? pagination.value.page,
        pageSize: params?.pageSize ?? pagination.value.pageSize,
        keyword: params?.keyword ?? searchKeyword.value,
        status: params?.status ?? statusFilter.value
      }
      
      // 发起请求 / Make request
      const response = await getSampleList(queryParams)
      const data: SampleListResponse = response.data
      
      // 更新状态 / Update state
      items.value = data.data
      pagination.value = {
        page: data.page,
        pageSize: data.pageSize,
        total: data.total
      }
      
      return data
    } catch (err: any) {
      // 处理错误 / Handle error
      const errorMessage = err.response?.data?.message || '获取列表失败 / Failed to fetch list'
      error.value = errorMessage
      ElMessage.error(errorMessage)
      throw err
    } finally {
      listLoading.value = false
    }
  }
  
  /**
   * 获取示例详情 / Fetch sample detail
   * @param id 示例 ID / Sample ID
   */
  async function fetchDetail(id: number) {
    detailLoading.value = true
    error.value = null
    
    try {
      const response = await getSampleDetail(id)
      currentItem.value = response.data
      return response.data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '获取详情失败 / Failed to fetch detail'
      error.value = errorMessage
      ElMessage.error(errorMessage)
      throw err
    } finally {
      detailLoading.value = false
    }
  }
  
  /**
   * 创建示例 / Create sample
   * @param data 示例数据 / Sample data
   */
  async function createItem(data: SampleItem) {
    submitting.value = true
    error.value = null
    
    try {
      const response = await createSample(data)
      const newItem = response.data
      
      // 添加到列表开头 / Add to list beginning
      items.value.unshift(newItem)
      pagination.value.total += 1
      
      ElMessage.success('创建成功 / Created successfully')
      return newItem
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '创建失败 / Failed to create'
      error.value = errorMessage
      ElMessage.error(errorMessage)
      throw err
    } finally {
      submitting.value = false
    }
  }
  
  /**
   * 更新示例 / Update sample
   * @param id 示例 ID / Sample ID
   * @param data 更新数据 / Update data
   */
  async function updateItem(id: number, data: Partial<SampleItem>) {
    submitting.value = true
    error.value = null
    
    try {
      const response = await updateSample(id, data)
      const updatedItem = response.data
      
      // 更新列表中的项 / Update item in list
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value[index] = updatedItem
      }
      
      // 更新当前项 / Update current item
      if (currentItem.value?.id === id) {
        currentItem.value = updatedItem
      }
      
      ElMessage.success('更新成功 / Updated successfully')
      return updatedItem
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '更新失败 / Failed to update'
      error.value = errorMessage
      ElMessage.error(errorMessage)
      throw err
    } finally {
      submitting.value = false
    }
  }
  
  /**
   * 删除示例 / Delete sample
   * @param id 示例 ID / Sample ID
   */
  async function deleteItem(id: number) {
    deleting.value = true
    error.value = null
    
    try {
      await deleteSample(id)
      
      // 从列表中移除 / Remove from list
      items.value = items.value.filter(item => item.id !== id)
      pagination.value.total -= 1
      
      // 清除当前项 / Clear current item
      if (currentItem.value?.id === id) {
        currentItem.value = null
      }
      
      ElMessage.success('删除成功 / Deleted successfully')
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '删除失败 / Failed to delete'
      error.value = errorMessage
      ElMessage.error(errorMessage)
      throw err
    } finally {
      deleting.value = false
    }
  }
  
  /**
   * 批量删除示例 / Batch delete samples
   * @param ids 示例 ID 数组 / Array of sample IDs
   */
  async function batchDelete(ids: number[]) {
    deleting.value = true
    error.value = null
    
    try {
      await batchDeleteSamples(ids)
      
      // 从列表中移除 / Remove from list
      items.value = items.value.filter(item => !ids.includes(item.id!))
      pagination.value.total -= ids.length
      
      // 清除当前项（如果被删除） / Clear current item if deleted
      if (currentItem.value && ids.includes(currentItem.value.id!)) {
        currentItem.value = null
      }
      
      ElMessage.success(`成功删除 ${ids.length} 项 / Successfully deleted ${ids.length} items`)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '批量删除失败 / Failed to batch delete'
      error.value = errorMessage
      ElMessage.error(errorMessage)
      throw err
    } finally {
      deleting.value = false
    }
  }
  
  /**
   * 设置搜索关键词 / Set search keyword
   * @param keyword 关键词 / Keyword
   */
  function setSearchKeyword(keyword: string) {
    searchKeyword.value = keyword
  }
  
  /**
   * 设置状态筛选 / Set status filter
   * @param status 状态 / Status
   */
  function setStatusFilter(status: 'active' | 'inactive' | '') {
    statusFilter.value = status
  }
  
  /**
   * 设置当前页 / Set current page
   * @param page 页码 / Page number
   */
  function setPage(page: number) {
    pagination.value.page = page
  }
  
  /**
   * 设置每页大小 / Set page size
   * @param pageSize 每页大小 / Page size
   */
  function setPageSize(pageSize: number) {
    pagination.value.pageSize = pageSize
  }
  
  /**
   * 重置筛选条件 / Reset filters
   */
  function resetFilters() {
    searchKeyword.value = ''
    statusFilter.value = ''
    pagination.value.page = 1
  }
  
  /**
   * 清除错误 / Clear error
   */
  function clearError() {
    error.value = null
  }
  
  /**
   * 清除当前项 / Clear current item
   */
  function clearCurrentItem() {
    currentItem.value = null
  }
  
  /**
   * 重置 Store / Reset store
   */
  function $reset() {
    items.value = []
    currentItem.value = null
    loading.value = false
    listLoading.value = false
    detailLoading.value = false
    submitting.value = false
    deleting.value = false
    error.value = null
    pagination.value = {
      page: 1,
      pageSize: 20,
      total: 0
    }
    searchKeyword.value = ''
    statusFilter.value = ''
  }
  
  // ========== 返回 / Return ==========
  
  return {
    // 状态 / State
    items,
    currentItem,
    loading,
    listLoading,
    detailLoading,
    submitting,
    deleting,
    error,
    pagination,
    searchKeyword,
    statusFilter,
    
    // 计算属性 / Computed
    hasItems,
    isEmpty,
    totalPages,
    
    // Actions
    fetchList,
    fetchDetail,
    createItem,
    updateItem,
    deleteItem,
    batchDelete,
    setSearchKeyword,
    setStatusFilter,
    setPage,
    setPageSize,
    resetFilters,
    clearError,
    clearCurrentItem,
    $reset
  }
})
