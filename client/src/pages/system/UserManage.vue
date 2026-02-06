<template>
  <div class="user-container p-8 min-h-screen bg-gray-50">
    <div class="page-header mb-8 flex justify-between items-center">
      <div>
        <h2 class="text-3xl font-bold text-gray-800">👥 用户管理</h2>
        <p class="text-gray-500 mt-1">管理系统登录用户及角色分配</p>
      </div>
      <el-button type="primary" icon="el-icon-plus" class="cartoon-button" @click="handleAdd">添加用户</el-button>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar bg-white p-4 rounded-2xl shadow-sm mb-6 flex gap-4">
      <el-input 
        v-model="query.keyword" 
        placeholder="搜索用户名、邮箱..." 
        prefix-icon="el-icon-search"
        class="cartoon-input flex-1"
        @keyup.enter.native="handleSearch"
      ></el-input>
      <el-button type="primary" class="cartoon-button-sm" @click="handleSearch">搜索 🔍</el-button>
    </div>

    <!-- 列表 -->
    <div class="bg-white rounded-3xl shadow-sm overflow-hidden p-6">
      <el-table :data="list" v-loading="loading" style="width: 100%" height="calc(100vh - 320px)">
        <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
        <el-table-column prop="username" label="用户名" width="150">
          <template slot-scope="scope">
            <span class="font-bold text-gray-700">{{ scope.row.username }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="role_name" label="角色" width="150">
          <template slot-scope="scope">
            <el-tag effect="light" class="rounded-full">{{ scope.row.role_name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" width="200"></el-table-column>
        <el-table-column prop="phone" label="手机号" width="150"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'" effect="dark" class="rounded-full px-3">
              {{ scope.row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="200">
          <template slot-scope="scope">
            <el-button size="mini" type="primary" circle icon="el-icon-edit" @click="handleEdit(scope.row)" :disabled="scope.row.id === 1"></el-button>
            <el-button size="mini" type="danger" circle icon="el-icon-delete" @click="handleDelete(scope.row)" :disabled="scope.row.id === 1"></el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="p-4 flex justify-end">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :total="total"
          :page-sizes="[10, 30, 50, 100]"
          :page-size="query.limit"
          :current-page.sync="query.page"
          @current-change="fetchData"
          @size-change="handleSizeChange"
        >
        </el-pagination>
      </div>
    </div>

    <!-- 表单弹窗 -->
    <el-dialog 
      :title="dialogType === 'add' ? '✨ 添加新用户' : '📝 编辑用户'" 
      :visible.sync="dialogVisible"
      width="500px"
      custom-class="cartoon-dialog"
    >
      <el-form :model="form" :rules="rules" ref="form" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" class="cartoon-input-sm" :disabled="dialogType === 'edit'"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password" :required="dialogType === 'add'">
          <el-input v-model="form.password" type="password" class="cartoon-input-sm" :placeholder="dialogType === 'edit' ? '留空不修改' : ''"></el-input>
        </el-form-item>
        <el-form-item label="角色" prop="role_id">
          <el-select v-model="form.role_id" class="w-full">
            <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" class="cartoon-input-sm"></el-input>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" class="cartoon-input-sm"></el-input>
        </el-form-item>
        <el-form-item label="状态" prop="status" v-if="dialogType === 'edit'">
          <el-select v-model="form.status" class="w-full">
            <el-option label="启用" value="active"></el-option>
            <el-option label="禁用" value="inactive"></el-option>
          </el-select>
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
import { getUsers, createUser, updateUser, deleteUser, getRoles } from '@/api/system'

export default {
  name: 'UserManage',
  data() {
    return {
      list: [],
      roles: [],
      total: 0,
      loading: false,
      query: {
        page: 1,
        limit: 10,
        keyword: ''
      },
      dialogVisible: false,
      dialogType: 'add',
      form: {
        id: undefined,
        username: '',
        password: '',
        email: '',
        phone: '',
        role_id: '',
        status: 'active'
      },
      rules: {
        username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
        role_id: [{ required: true, message: '请选择角色', trigger: 'change' }]
      }
    }
  },
  created() {
    this.fetchData()
    this.fetchRoles()
  },
  methods: {
    async fetchData() {
      this.loading = true
      try {
        const res = await getUsers(this.query)
        this.list = res.data.list
        this.total = res.data.total
      } catch (error) {
        console.error(error)
      } finally {
        this.loading = false
      }
    },
    async fetchRoles() {
      try {
        const res = await getRoles()
        this.roles = res.data
      } catch (error) {
        console.error(error)
      }
    },
    handleSearch() {
      this.query.page = 1
      this.fetchData()
    },
    handleSizeChange(val) {
      this.query.limit = val
      this.handleSearch()
    },
    handleAdd() {
      this.dialogType = 'add'
      this.form = { status: 'active' }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.form.clearValidate()
      })
    },
    handleEdit(row) {
      this.dialogType = 'edit'
      this.form = { ...row, password: '' } // Clear password field
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.form.clearValidate()
      })
    },
    async handleDelete(row) {
      try {
        await this.$confirm('确认删除该用户吗？', '提示', { type: 'warning' })
        await deleteUser(row.id)
        this.$message.success('删除成功')
        this.fetchData()
      } catch (error) {
        if (error !== 'cancel') console.error(error)
      }
    },
    submitForm() {
      this.$refs.form.validate(async valid => {
        if (valid) {
          // Custom validation for password in add mode
          if (this.dialogType === 'add' && !this.form.password) {
            this.$message.error('请输入密码')
            return
          }

          try {
            if (this.dialogType === 'add') {
              await createUser(this.form)
              this.$message.success('添加成功')
            } else {
              await updateUser(this.form.id, this.form)
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
.cartoon-button-sm {
  border-radius: 12px;
}
::v-deep .cartoon-input .el-input__inner {
  border-radius: 20px;
  border: 2px solid #edf2f7;
  padding-left: 40px;
}
::v-deep .cartoon-input .el-input__inner:focus {
  border-color: #4299e1;
}
::v-deep .cartoon-input-sm .el-input__inner {
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
