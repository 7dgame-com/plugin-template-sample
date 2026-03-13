<template>
  <div class="sample-list">
    <!-- 搜索栏 / Search Bar -->
    <div class="toolbar">
      <el-input
        v-model="searchKeyword"
        :placeholder="t('sample.searchPlaceholder')"
        clearable
        style="width: 260px"
        @clear="handleSearch"
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select
        v-model="statusFilter"
        :placeholder="t('common.status')"
        clearable
        style="width: 120px"
        @change="handleSearch"
      >
        <el-option :label="t('common.active')" value="active" />
        <el-option :label="t('common.inactive')" value="inactive" />
      </el-select>
      <el-button
        v-if="can('create-sample')"
        type="primary"
        @click="$router.push('/create')"
      >
        <el-icon><Plus /></el-icon>
        {{ t('sample.addSample') }}
      </el-button>
    </div>

    <!-- 示例表格 / Sample Table -->
    <div class="table-card">
      <el-table
        :data="store.items"
        v-loading="store.listLoading"
        stripe
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column
          prop="name"
          :label="t('sample.name')"
          min-width="180"
        />
        <el-table-column
          prop="description"
          :label="t('sample.description')"
          min-width="240"
        />
        <el-table-column :label="t('common.status')" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'active' ? 'success' : 'info'"
              size="small"
            >
              {{ row.status === 'active' ? t('common.active') : t('common.inactive') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('sample.createdAt')" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="can('update-sample') || can('delete-sample')"
          :label="t('common.actions')"
          width="160"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              v-if="can('update-sample')"
              link
              type="primary"
              @click="$router.push(`/edit/${row.id}`)"
            >
              {{ t('common.edit') }}
            </el-button>
            <el-popconfirm
              v-if="can('delete-sample')"
              :title="t('sample.deleteConfirm')"
              @confirm="handleDelete(row.id)"
            >
              <template #reference>
                <el-button link type="danger">
                  {{ t('common.delete') }}
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 / Pagination -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="store.pagination.page"
          v-model:page-size="store.pagination.pageSize"
          :total="store.pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Search, Plus } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useSampleStore } from '../stores/sample'
import { usePermissions } from '../composables/usePermissions'

const { t, locale } = useI18n()
const store = useSampleStore()
const { can, fetchAllowedActions } = usePermissions()

// 搜索和筛选状态 / Search and filter state
const searchKeyword = ref('')
const statusFilter = ref<'active' | 'inactive' | ''>('')

/**
 * 处理搜索 / Handle search
 */
async function handleSearch() {
  store.setSearchKeyword(searchKeyword.value)
  store.setStatusFilter(statusFilter.value)
  store.setPage(1) // 重置到第一页 / Reset to first page
  await store.fetchList()
}

/**
 * 处理页码变化 / Handle page change
 */
async function handlePageChange(page: number) {
  store.setPage(page)
  await store.fetchList()
}

/**
 * 处理每页大小变化 / Handle page size change
 */
async function handleSizeChange(pageSize: number) {
  store.setPageSize(pageSize)
  store.setPage(1) // 重置到第一页 / Reset to first page
  await store.fetchList()
}

/**
 * 处理删除 / Handle delete
 * @param id 示例 ID / Sample ID
 */
async function handleDelete(id: number) {
  try {
    await store.deleteItem(id)
    // 如果当前页没有数据且不是第一页，返回上一页
    // If current page has no data and not first page, go to previous page
    if (store.items.length === 0 && store.pagination.page > 1) {
      store.setPage(store.pagination.page - 1)
      await store.fetchList()
    }
  } catch {
    // 错误已在 store 中处理 / Error already handled in store
  }
}

/**
 * 格式化时间（根据当前语言环境） / Format time (based on current locale)
 * @param dateString 日期字符串 / Date string
 */
function formatTime(dateString?: string) {
  if (!dateString) return '-'
  try {
    // 根据当前 i18n 语言映射到 Intl locale
    // Map current i18n locale to Intl locale
    const localeMap: Record<string, string> = {
      'zh-CN': 'zh-CN',
      'zh-TW': 'zh-TW',
      'en-US': 'en-US',
      'ja-JP': 'ja-JP',
      'th-TH': 'th-TH',
    }
    const intlLocale = localeMap[locale.value] || 'zh-CN'
    return new Date(dateString).toLocaleString(intlLocale)
  } catch {
    return '-'
  }
}

// 组件挂载时加载权限和数据 / Load permissions and data on component mount
onMounted(async () => {
  // 先加载权限，再加载数据（确保按钮显示正确）
  // Load permissions first, then data (ensure buttons display correctly)
  await fetchAllowedActions()
  await store.fetchList()
})
</script>

<style scoped>
.sample-list {
  padding: var(--spacing-md);
}

.toolbar {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  margin-bottom: var(--spacing-md);
  flex-wrap: wrap;
}

.table-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.pagination {
  padding: var(--spacing-md);
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--border-color);
}
</style>
