<template>
  <div class="record-container p-8 min-h-screen bg-gray-50">
    <div class="page-header mb-8 flex justify-between items-center">
      <div>
        <h2 class="text-3xl font-bold text-gray-800">🛡️ 保险管理</h2>
        <p class="text-gray-500 mt-1">管理车辆和挂车的保险单据</p>
      </div>
      <el-button type="primary" icon="el-icon-plus" class="cartoon-button" @click="handleAdd">添加记录</el-button>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar bg-white p-4 rounded-2xl shadow-sm mb-6 flex gap-4 items-center">
      <el-radio-group v-model="query.type" size="medium" @change="handleTypeChange">
        <el-radio-button label="vehicle">车辆</el-radio-button>
        <el-radio-button label="trailer">挂车</el-radio-button>
      </el-radio-group>

      <el-select 
        v-model="query.group_name" 
        :placeholder="query.type === 'vehicle' ? '车辆组别' : '挂车组别'"
        class="cartoon-select w-40"
        @change="handleSearch"
        clearable
      >
        <el-option
          v-for="item in groupOptions"
          :key="item.id"
          :label="item.name"
          :value="item.name"
        ></el-option>
      </el-select>

      <el-select 
        v-model="query.target_id" 
        filterable 
        remote 
        :placeholder="query.type === 'vehicle' ? '搜索车辆车牌...' : '搜索挂车号...'" 
        :remote-method="searchTargets"
        :loading="targetLoading"
        class="cartoon-select w-64"
        @change="handleSearch"
        clearable
      >
        <el-option v-for="item in targetOptions" :key="item.id" :label="item.plate_number" :value="item.id"></el-option>
      </el-select>
      <el-button type="primary" class="cartoon-button-sm" @click="handleSearch">搜索 🔍</el-button>
      <el-button class="cartoon-button-sm" @click="resetSearch">重置 🔄</el-button>
    </div>

    <!-- 列表 -->
    <div class="bg-white rounded-3xl shadow-sm overflow-hidden p-6">
      <el-table :data="list" v-loading="loading" style="width: 100%" height="calc(100vh - 320px)">
        <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
        <el-table-column prop="target_id" :label="query.type === 'vehicle' ? '车辆' : '挂车'" width="120">
          <template slot-scope="scope">
            {{ getPlateNumber(scope.row.target_id) }}
          </template>
        </el-table-column>
        <el-table-column prop="group_name" label="所属组别" width="120">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.group_name" size="small" class="rounded-lg">{{ scope.row.group_name }}</el-tag>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="insurance_company" label="保险公司" min-width="150"></el-table-column>
        <el-table-column prop="policy_number" label="保单号" width="180"></el-table-column>
        <el-table-column prop="end_date" label="到期日期" width="150">
          <template slot-scope="scope">
            <span :class="{'text-red-500 font-bold': isExpired(scope.row.end_date)}">
              {{ formatDate(scope.row.end_date) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="premium" label="保费(元)" width="120"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="statusMap[scope.row.status].type" effect="dark" class="rounded-full">
              {{ statusMap[scope.row.status].label }}
            </el-tag>
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
      :title="dialogType === 'add' ? '✨ 添加保险记录' : '📝 编辑保险记录'" 
      :visible.sync="dialogVisible"
      width="500px"
      custom-class="cartoon-dialog"
    >
      <el-form :model="form" :rules="rules" ref="form" label-width="100px">
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="form.type" @change="handleFormTypeChange" :disabled="dialogType === 'edit'">
            <el-radio label="vehicle">车辆</el-radio>
            <el-radio label="trailer">挂车</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="form.type === 'vehicle' ? '车辆' : '挂车'" prop="target_id">
          <el-select 
            v-model="form.target_id" 
            filterable 
            remote 
            :placeholder="form.type === 'vehicle' ? '搜索车辆' : '搜索挂车'" 
            :remote-method="searchTargets"
            :loading="targetLoading"
            class="w-full"
            :disabled="dialogType === 'edit'"
          >
            <el-option v-for="item in targetOptions" :key="item.id" :label="item.plate_number" :value="item.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="保险公司" prop="insurance_company">
          <el-input v-model="form.insurance_company" class="cartoon-input-sm"></el-input>
        </el-form-item>
        <el-form-item label="保单号" prop="policy_number">
          <el-input v-model="form.policy_number" class="cartoon-input-sm"></el-input>
        </el-form-item>
        <el-form-item label="购买日期" prop="start_date">
          <el-date-picker v-model="form.start_date" type="date" placeholder="选择日期" class="w-full" value-format="yyyy-MM-dd" @change="handleStartDateChange"></el-date-picker>
        </el-form-item>
        <el-form-item label="到期日期" prop="end_date">
          <el-date-picker v-model="form.end_date" type="date" placeholder="选择日期" class="w-full" value-format="yyyy-MM-dd"></el-date-picker>
        </el-form-item>
        <el-form-item label="保费" prop="premium">
          <el-input v-model="form.premium" type="number" class="cartoon-input-sm"></el-input>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="active">生效中</el-radio>
            <el-radio label="expired">已过期</el-radio>
          </el-radio-group>
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
import { getRecords, createRecord, updateRecord, deleteRecord } from '@/api/records'
import { getVehicles } from '@/api/vehicles'
import { getTrailers } from '@/api/trailers'
import { getAllVehicleGroups } from '@/api/vehicleGroups'
import { getAllTrailerGroups } from '@/api/trailerGroups'

export default {
  name: 'InsuranceManage',
  data() {
    return {
      list: [],
      total: 0,
      loading: false,
      query: { page: 1, limit: 10, type: 'vehicle', target_id: '', group_name: '' },
      targetOptions: [],
      groupOptions: [],
      targetLoading: false,
      targetMap: { vehicle: {}, trailer: {} }, // 缓存车辆和挂车信息
      dialogVisible: false,
      dialogType: 'add',
      form: {
        id: undefined,
        type: 'vehicle',
        target_id: '',
        insurance_company: '',
        policy_number: '',
        start_date: '',
        end_date: '',
        premium: '',
        status: 'active'
      },
      rules: {
        type: [{ required: true, message: '请选择资产类型', trigger: 'change' }],
        target_id: [{ required: true, message: '请选择资产', trigger: 'change' }],
        insurance_company: [{ required: true, message: '请输入保险公司', trigger: 'blur' }],
        policy_number: [{ required: true, message: '请输入保单号', trigger: 'blur' }],
        end_date: [{ required: true, message: '请选择到期日期', trigger: 'change' }]
      },
      statusMap: {
        active: { label: '生效中', type: 'success' },
        expired: { label: '已过期', type: 'danger' },
        cancelled: { label: '已取消', type: 'info' }
      }
    }
  },
  created() {
    this.fetchData()
    this.fetchGroups()
    this.searchTargets('')
  },
  methods: {
    async fetchGroups() {
      try {
        const api = this.query.type === 'vehicle' ? getAllVehicleGroups : getAllTrailerGroups
        const res = await api()
        this.groupOptions = res.data
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
    getPlateNumber(id) {
      return this.targetMap[this.query.type][id] ? this.targetMap[this.query.type][id].plate_number : id
    },
    async fetchData() {
      this.loading = true
      try {
        const res = await getRecords('insurance', this.query)
        this.list = res.data.list
        this.total = res.data.total
      } catch (error) {
        console.error(error)
      } finally {
        this.loading = false
      }
    },
    async searchTargets(query) {
      this.targetLoading = true
      try {
        const api = this.query.type === 'vehicle' ? getVehicles : getTrailers
        const params = this.query.type === 'vehicle' ? { keyword: query, limit: 50 } : { keyword: query, limit: 50 }
        const res = await api(params)
        this.targetOptions = res.data.list
        // 更新缓存
        this.targetOptions.forEach(v => {
          this.$set(this.targetMap[this.query.type], v.id, v)
        })
      } catch (error) {
        console.error(error)
      } finally {
        this.targetLoading = false
      }
    },
    handleTypeChange() {
      this.query.target_id = ''
      this.query.group_name = ''
      this.targetOptions = []
      this.groupOptions = []
      this.handleSearch()
      this.searchTargets('')
      this.fetchGroups()
    },
    handleFormTypeChange() {
      this.form.target_id = ''
      this.targetOptions = []
      this.searchTargets('')
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
      this.query.target_id = ''
      this.query.group_name = ''
      this.handleSearch()
    },
    handleStartDateChange(val) {
      if (val) {
        const date = new Date(val)
        date.setFullYear(date.getFullYear() + 1)
        date.setDate(date.getDate() - 1)
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const d = String(date.getDate()).padStart(2, '0')
        this.form.end_date = `${y}-${m}-${d}`
      }
    },
    handleAdd() {
      this.dialogType = 'add'
      this.form = { type: this.query.type, status: 'active' }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.form.clearValidate()
      })
    },
    handleEdit(row) {
      this.dialogType = 'edit'
      this.form = { ...row }
      if (this.form.start_date) this.form.start_date = this.form.start_date.split('T')[0]
      if (this.form.end_date) this.form.end_date = this.form.end_date.split('T')[0]
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.form.clearValidate()
      })
    },
    async handleDelete(row) {
      try {
        await this.$confirm('确认删除该记录吗？', '提示', { type: 'warning' })
        await deleteRecord('insurance', row.id)
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
              await createRecord('insurance', this.form)
              this.$message.success('添加成功')
            } else {
              await updateRecord('insurance', this.form.id, this.form)
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
