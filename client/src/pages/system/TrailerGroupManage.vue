<template>
  <div class="trailer-group-container p-8 min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="page-header mb-8 flex justify-between items-center">
      <div>
        <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-200">🚜 挂车组别管理</h2>
        <p class="text-gray-500 dark:text-gray-400 mt-1">管理挂车分组类型</p>
      </div>
      <el-button type="primary" icon="el-icon-plus" class="cartoon-button" @click="handleAdd">添加组别</el-button>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm mb-6 flex gap-4">
      <el-input 
        v-model="query.name" 
        placeholder="搜索组别名称..." 
        prefix-icon="el-icon-search"
        class="cartoon-input w-64"
        @keyup.enter.native="handleSearch"
      ></el-input>
      <el-button type="primary" class="cartoon-button-sm" @click="handleSearch">搜索 🔍</el-button>
      <el-button class="cartoon-button-sm" @click="resetSearch">重置 🔄</el-button>
    </div>

    <!-- 列表 -->
    <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-sm overflow-hidden p-6">
      <el-table :data="list" v-loading="loading" style="width: 100%">
        <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
        <el-table-column prop="name" label="组别名称" width="200">
          <template slot-scope="scope">
            <span class="font-bold text-gray-700 dark:text-gray-300">{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="300"></el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template slot-scope="scope">
            {{ new Date(scope.row.created_at).toLocaleDateString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template slot-scope="scope">
            <el-button size="mini" type="primary" circle icon="el-icon-edit" @click="handleEdit(scope.row)"></el-button>
            <el-button size="mini" type="danger" circle icon="el-icon-delete" @click="handleDelete(scope.row)"></el-button>
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
      :title="dialogType === 'add' ? '✨ 添加组别' : '📝 编辑组别'" 
      :visible.sync="dialogVisible"
      width="500px"
      custom-class="cartoon-dialog"
    >
      <el-form :model="form" :rules="rules" ref="form" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" class="cartoon-input-sm" placeholder="请输入组别名称"></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" v-model="form.description" class="cartoon-input-sm" placeholder="请输入描述" :rows="3"></el-input>
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
import { getTrailerGroups, createTrailerGroup, updateTrailerGroup, deleteTrailerGroup } from '@/api/trailerGroups'

export default {
  name: 'TrailerGroupManage',
  data() {
    return {
      list: [],
      total: 0,
      loading: false,
      query: {
        page: 1,
        limit: 10,
        name: ''
      },
      dialogVisible: false,
      dialogType: 'add',
      form: {
        id: undefined,
        name: '',
        description: ''
      },
      rules: {
        name: [{ required: true, message: '请输入组别名称', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      this.loading = true
      try {
        const res = await getTrailerGroups(this.query)
        this.list = res.data.list
        this.total = res.data.total
      } catch (error) {
        console.error('Fetch trailer groups error:', error)
      } finally {
        this.loading = false
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
    resetSearch() {
      this.query.name = ''
      this.handleSearch()
    },
    handleAdd() {
      this.dialogType = 'add'
      this.form = { name: '', description: '' }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.form.clearValidate()
      })
    },
    handleEdit(row) {
      this.dialogType = 'edit'
      this.form = { ...row }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.form.clearValidate()
      })
    },
    async handleDelete(row) {
      try {
        await this.$confirm('确认删除该组别吗？', '提示', { type: 'warning' })
        await deleteTrailerGroup(row.id)
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
              await createTrailerGroup(this.form)
              this.$message.success('添加成功')
            } else {
              await updateTrailerGroup(this.form.id, this.form)
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
/* Dark mode adaptations */
.dark ::v-deep .cartoon-input .el-input__inner {
  background-color: #374151;
  border-color: #4b5563;
  color: #e5e7eb;
}
.dark ::v-deep .cartoon-input-sm .el-input__inner {
  background-color: #374151;
  border-color: #4b5563;
  color: #e5e7eb;
}
.dark ::v-deep .el-dialog {
  background-color: #1f2937;
}
.dark ::v-deep .el-dialog__header {
  background-color: #374151;
}
.dark ::v-deep .el-dialog__title {
  color: #e5e7eb;
}
.dark ::v-deep .el-table {
  background-color: #1f2937;
  color: #e5e7eb;
}
.dark ::v-deep .el-table th, .dark ::v-deep .el-table tr {
  background-color: #1f2937;
  color: #e5e7eb;
}
.dark ::v-deep .el-table--enable-row-hover .el-table__body tr:hover > td {
  background-color: #374151;
}
</style>
