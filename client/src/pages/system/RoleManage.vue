<template>
  <div class="role-container p-8 min-h-screen bg-gray-50">
    <div class="page-header mb-8 flex justify-between items-center">
      <div>
        <h2 class="text-3xl font-bold text-gray-800">🛡️ 角色管理</h2>
        <p class="text-gray-500 mt-1">配置系统角色及权限</p>
      </div>
      <el-button type="primary" icon="el-icon-plus" class="cartoon-button" @click="handleAdd">添加角色</el-button>
    </div>

    <!-- 列表 -->
    <div class="bg-white rounded-3xl shadow-sm overflow-hidden p-6">
      <el-table :data="list" v-loading="loading" style="width: 100%" height="calc(100vh - 240px)">
        <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
        <el-table-column prop="name" label="角色名称" width="200">
          <template slot-scope="scope">
            <span class="font-bold text-gray-700">{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述"></el-table-column>
        <el-table-column label="权限概览">
          <template slot-scope="scope">
            <el-tag v-for="(val, key) in scope.row.permissions" :key="key" size="small" class="mr-2 mb-1">
              {{ key }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template slot-scope="scope">
            <el-button size="mini" type="primary" circle icon="el-icon-edit" @click="handleEdit(scope.row)" :disabled="scope.row.id === 1"></el-button>
            <el-button size="mini" type="danger" circle icon="el-icon-delete" @click="handleDelete(scope.row)" :disabled="scope.row.id === 1"></el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 表单弹窗 -->
    <el-dialog 
      :title="dialogType === 'add' ? '✨ 添加新角色' : '📝 编辑角色'" 
      :visible.sync="dialogVisible"
      width="600px"
      custom-class="cartoon-dialog"
    >
      <el-form :model="form" :rules="rules" ref="form" label-width="100px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" class="cartoon-input-sm" :disabled="form.id === 1"></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" class="cartoon-input-sm"></el-input>
        </el-form-item>
        <el-form-item label="权限配置">
          <div class="p-4 bg-gray-50 rounded-xl">
            <div v-for="mod in modules" :key="mod.key" class="mb-4">
              <div class="font-bold mb-2">{{ mod.label }}</div>
              <el-checkbox-group v-model="form.permissions[mod.key]">
                <el-checkbox label="read">查看</el-checkbox>
                <el-checkbox label="write">编辑</el-checkbox>
              </el-checkbox-group>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false" class="rounded-full">取 消</el-button>
        <el-button type="primary" @click="submitForm" class="rounded-full bg-blue-500 border-none">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getRoles, createRole, updateRole, deleteRole } from '@/api/system'

export default {
  name: 'RoleManage',
  data() {
    return {
      list: [],
      loading: false,
      dialogVisible: false,
      dialogType: 'add',
      form: {
        id: undefined,
        name: '',
        description: '',
        permissions: {}
      },
      rules: {
        name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
      },
      modules: [
        { label: '司机管理', key: 'drivers' },
        { label: '车辆管理', key: 'vehicles' },
        { label: '挂车管理', key: 'trailers' }
      ]
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      this.loading = true
      try {
        const res = await getRoles()
        this.list = res.data
      } catch (error) {
        console.error(error)
      } finally {
        this.loading = false
      }
    },
    handleAdd() {
      this.dialogType = 'add'
      this.form = { name: '', description: '', permissions: {
        drivers: [], vehicles: [], trailers: []
      }}
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.form.clearValidate()
      })
    },
    handleEdit(row) {
      this.dialogType = 'edit'
      // Parse permissions if string, otherwise use object
      let perms = row.permissions
      if (typeof perms === 'string') {
        try { perms = JSON.parse(perms) } catch (e) { perms = {} }
      }
      
      // Ensure all modules exist in permissions object
      this.modules.forEach(m => {
        if (!perms[m.key]) perms[m.key] = []
      })

      this.form = { ...row, permissions: perms }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.form.clearValidate()
      })
    },
    async handleDelete(row) {
      try {
        await this.$confirm('确认删除该角色吗？', '提示', { type: 'warning' })
        await deleteRole(row.id)
        this.$message.success('删除成功')
        this.fetchData()
      } catch (error) {
        if (error !== 'cancel') console.error(error)
      }
    },
    submitForm() {
      this.$refs.form.validate(async valid => {
        if (valid) {
          try {
            if (this.dialogType === 'add') {
              await createRole(this.form)
              this.$message.success('添加成功')
            } else {
              await updateRole(this.form.id, this.form)
              this.$message.success('更新成功')
            }
            this.dialogVisible = false
            this.fetchData()
          } catch (error) {
            console.error(error)
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.cartoon-button {
  border-radius: 20px;
  font-weight: bold;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}
.cartoon-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 8px -1px rgba(0, 0, 0, 0.1);
}
.cartoon-input-sm ::v-deep .el-input__inner {
  border-radius: 12px;
  background-color: #f7fafc;
}
::v-deep .el-dialog {
  border-radius: 24px;
  overflow: hidden;
}
::v-deep .el-dialog__header {
  background-color: #ebf8ff;
  padding: 20px;
}
</style>
