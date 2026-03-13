<template>
  <div class="sample-form">
    <div class="form-card">
      <div class="form-header">
        <h3>{{ isEdit ? t('sample.editSample') : t('sample.createSample') }}</h3>
      </div>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        style="max-width: 500px; padding: var(--spacing-lg)"
        @submit.prevent="handleSubmit"
      >
        <!-- 名称 / Name -->
        <el-form-item :label="t('sample.name')" prop="name">
          <el-input
            v-model="form.name"
            :placeholder="t('sample.namePlaceholder')"
          />
        </el-form-item>

        <!-- 描述 / Description -->
        <el-form-item :label="t('sample.description')" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            :placeholder="t('sample.descriptionPlaceholder')"
          />
        </el-form-item>

        <!-- 状态 / Status -->
        <el-form-item :label="t('common.status')" prop="status">
          <el-select v-model="form.status" style="width: 100%">
            <el-option :label="t('common.active')" value="active" />
            <el-option :label="t('common.inactive')" value="inactive" />
          </el-select>
        </el-form-item>

        <!-- 操作按钮 / Action Buttons -->
        <el-form-item>
          <el-button
            v-if="canSave"
            type="primary"
            :loading="store.submitting"
            native-type="submit"
          >
            {{ isEdit ? t('sample.saveChanges') : t('sample.createSample') }}
          </el-button>
          <el-button @click="router.push('/list')">
            {{ t('common.cancel') }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useSampleStore } from '../stores/sample'
import { usePermissions } from '../composables/usePermissions'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useSampleStore()
const { can, fetchAllowedActions } = usePermissions()

const formRef = ref<FormInstance>()

/**
 * 判断是否为编辑模式（路由包含 :id 参数）
 * Determine if in edit mode (route contains :id param)
 */
const isEdit = computed(() => !!route.params.id)

/**
 * 权限检查：是否可以保存
 * Permission check: whether can save
 */
const canSave = computed(() =>
  isEdit.value ? can('update-sample') : can('create-sample')
)

/**
 * 表单数据 / Form data
 */
const form = reactive({
  name: '',
  description: '',
  status: 'active' as 'active' | 'inactive',
})

/**
 * 表单验证规则 / Form validation rules
 */
const rules = computed(() => ({
  name: [
    { required: true, message: t('sample.messages.nameRequired'), trigger: 'blur' },
    { min: 2, message: t('sample.messages.nameMinLength'), trigger: 'blur' },
  ],
}))

/**
 * 加载示例详情（编辑模式）
 * Load sample detail (edit mode)
 */
async function loadDetail() {
  if (!isEdit.value) return
  try {
    const id = Number(route.params.id)
    const item = await store.fetchDetail(id)
    if (item) {
      form.name = item.name || ''
      form.description = item.description || ''
      form.status = item.status || 'active'
    }
  } catch {
    ElMessage.error(t('sample.messages.loadFailed'))
    router.push('/list')
  }
}

/**
 * 提交表单 / Submit form
 */
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  // 权限二次检查 / Double-check permission
  if (!canSave.value) {
    ElMessage.error(t('sample.messages.noPermission'))
    return
  }

  try {
    const payload = {
      name: form.name,
      description: form.description,
      status: form.status,
    }

    if (isEdit.value) {
      await store.updateItem(Number(route.params.id), payload)
    } else {
      await store.createItem(payload as any)
    }

    // 保存成功后返回列表 / Navigate back to list after successful save
    router.push('/list')
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || t('sample.messages.operationFailed'))
  }
}

onMounted(async () => {
  await fetchAllowedActions()

  // 无权限时提示 / Show error when no permission
  if (!canSave.value) {
    ElMessage.warning(t('sample.messages.noPermission'))
  }

  await loadDetail()
})
</script>

<style scoped>
.sample-form {
  padding: var(--spacing-md);
}

.form-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.form-header {
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.form-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}
</style>
