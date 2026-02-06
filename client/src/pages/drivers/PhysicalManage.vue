<template>
  <div class="record-container p-8 min-h-screen bg-gray-50">
    <div class="page-header mb-8 flex justify-between items-center">
      <div>
        <h2 class="text-3xl font-bold text-gray-800">🏥 体检管理</h2>
        <p class="text-gray-500 mt-1">管理司机体检记录</p>
      </div>
      <el-button type="primary" icon="el-icon-plus" class="cartoon-button" @click="handleAdd">添加记录</el-button>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar bg-white p-4 rounded-2xl shadow-sm mb-6 flex gap-4">
      <el-select 
        v-model="query.driver_id" 
        filterable 
        remote 
        placeholder="搜索司机姓名..." 
        :remote-method="searchDrivers"
        :loading="driverLoading"
        class="cartoon-select w-64"
        @change="handleSearch"
        clearable
      >
        <el-option v-for="item in driverOptions" :key="item.id" :label="item.name" :value="item.id">
          <span style="float: left">{{ item.name }}</span>
          <span style="float: right; color: #8492a6; font-size: 13px">{{ item.phone }}</span>
        </el-option>
      </el-select>
      <el-select 
        v-model="query.group_name" 
        placeholder="搜索组别..." 
        class="cartoon-select w-48"
        clearable
        @change="handleSearch"
      >
        <el-option
          v-for="item in driverGroupOptions"
          :key="item.id"
          :label="item.name"
          :value="item.name"
        >
        </el-option>
      </el-select>
      <el-button type="primary" class="cartoon-button-sm" @click="handleSearch">搜索 🔍</el-button>
      <el-button class="cartoon-button-sm" @click="resetSearch">重置 🔄</el-button>
    </div>

    <!-- 列表 -->
    <div class="bg-white rounded-3xl shadow-sm overflow-hidden p-6">
      <el-table :data="list" v-loading="loading" style="width: 100%" height="calc(100vh - 320px)">
        <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
        <el-table-column prop="driver_name" label="司机姓名" width="120">
          <template slot-scope="scope">
            <span class="font-bold text-gray-700">{{ scope.row.driver_name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="examination_date" label="体检日期" width="150">
          <template slot-scope="scope">{{ formatDate(scope.row.examination_date) }}</template>
        </el-table-column>
        <el-table-column prop="expiry_date" label="到期日期" width="150">
          <template slot-scope="scope">
            <span :class="{'text-red-500 font-bold': isExpired(scope.row.expiry_date)}">
              {{ formatDate(scope.row.expiry_date) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="hospital" label="体检医院" min-width="180"></el-table-column>
        <el-table-column prop="result" label="结果" width="100">
          <template slot-scope="scope">
            <el-tag :type="resultMap[scope.row.result].type" effect="dark" class="rounded-full">
              {{ resultMap[scope.row.result].label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="issue" label="问题点" min-width="150">
          <template slot-scope="scope">
            <span v-if="scope.row.result === 'unqualified'" class="text-red-500">{{ scope.row.issue }}</span>
            <span v-else>-</span>
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
      :title="dialogType === 'add' ? '✨ 添加体检记录' : '📝 编辑体检记录'" 
      :visible.sync="dialogVisible"
      width="500px"
      custom-class="cartoon-dialog"
    >
      <el-form :model="form" :rules="rules" ref="form" label-width="100px">
        <el-form-item label="司机" prop="driver_id">
          <el-select 
            v-model="form.driver_id" 
            filterable 
            remote 
            placeholder="请输入关键词" 
            :remote-method="searchDrivers"
            :loading="driverLoading"
            class="w-full"
            :disabled="dialogType === 'edit'"
          >
            <el-option v-for="item in driverOptions" :key="item.id" :label="item.name" :value="item.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="体检日期" prop="examination_date">
          <el-date-picker v-model="form.examination_date" type="date" placeholder="选择日期" class="w-full" value-format="yyyy-MM-dd"></el-date-picker>
        </el-form-item>
        <el-form-item label="到期日期" prop="expiry_date">
          <el-date-picker v-model="form.expiry_date" type="date" placeholder="选择日期" class="w-full" value-format="yyyy-MM-dd"></el-date-picker>
        </el-form-item>
        <el-form-item label="体检医院" prop="hospital">
          <el-input v-model="form.hospital" class="cartoon-input-sm"></el-input>
        </el-form-item>
        <el-form-item label="结果" prop="result">
          <el-radio-group v-model="form.result">
            <el-radio label="qualified">合格</el-radio>
            <el-radio label="unqualified">不合格</el-radio>
            <el-radio label="pending">待定</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="问题点" prop="issue" v-if="['unqualified', 'pending'].includes(form.result)">
          <el-input type="textarea" v-model="form.issue" class="cartoon-input-sm" placeholder="请输入具体情况"></el-input>
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
import { getDriverRecords, createDriverRecord, updateDriverRecord, deleteDriverRecord } from '@/api/records'
import { getDrivers } from '@/api/drivers'
import { getAllDriverGroups } from '@/api/driverGroups'

export default {
  name: 'PhysicalManage',
  data() {
    return {
      list: [],
      total: 0,
      loading: false,
      query: { page: 1, limit: 10, driver_id: '', group_name: '' },
      driverOptions: [],
      driverGroupOptions: [],
      driverLoading: false,
      dialogVisible: false,
      dialogType: 'add',
      form: {
        id: undefined,
        driver_id: '',
        examination_date: '',
        expiry_date: '',
        hospital: '',
        result: 'qualified',
        issue: ''
      },
      rules: {
        driver_id: [{ required: true, message: '请选择司机', trigger: 'change' }],
        examination_date: [{ required: true, message: '请选择日期', trigger: 'change' }],
        expiry_date: [{ required: true, message: '请选择日期', trigger: 'change' }]
      },
      resultMap: {
        qualified: { label: '合格', type: 'success' },
        unqualified: { label: '不合格', type: 'danger' },
        pending: { label: '待定', type: 'info' }
      }
    }
  },
  created() {
    this.fetchData()
    this.searchDrivers('') // Load initial drivers
    this.fetchDriverGroups()
  },
  methods: {
    async fetchDriverGroups() {
      try {
        const res = await getAllDriverGroups()
        this.driverGroupOptions = res.data
      } catch (error) {
        console.error(error)
      }
    },
    formatDate(date) {
      return date ? new Date(date).toLocaleDateString() : '-'
    },
    isExpired(date) {
      if (!date) return false
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return new Date(date) < today
    },
    async fetchData() {
      this.loading = true
      try {
        const res = await getDriverRecords('physical', this.query)
        this.list = res.data.list
        this.total = res.data.total
      } catch (error) {
        console.error(error)
      } finally {
        this.loading = false
      }
    },
    async searchDrivers(query) {
      this.driverLoading = true
      try {
        const res = await getDrivers({ keyword: query, limit: 20 })
        this.driverOptions = res.data.list
      } catch (error) {
        console.error(error)
      } finally {
        this.driverLoading = false
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
      this.query.driver_id = ''
      this.query.group_name = ''
      this.handleSearch()
    },
    handleAdd() {
      this.dialogType = 'add'
      this.form = { result: 'qualified' }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.form.clearValidate()
      })
    },
    handleEdit(row) {
      this.dialogType = 'edit'
      this.form = { ...row }
      // Ensure date format is correct for date picker
      if (this.form.examination_date) this.form.examination_date = this.form.examination_date.split('T')[0]
      if (this.form.expiry_date) this.form.expiry_date = this.form.expiry_date.split('T')[0]
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.form.clearValidate()
      })
    },
    async handleDelete(row) {
      try {
        await this.$confirm('确认删除该记录吗？', '提示', { type: 'warning' })
        await deleteDriverRecord('physical', row.id)
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
              await createDriverRecord('physical', this.form)
              this.$message.success('添加成功')
            } else {
              await updateDriverRecord('physical', this.form.id, this.form)
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
}
.cartoon-button:hover {
  transform: translateY(-2px);
}
.cartoon-button-sm {
  border-radius: 12px;
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
