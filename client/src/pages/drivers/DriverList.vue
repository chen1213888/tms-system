<template>
  <div class="driver-container p-8 min-h-screen bg-gray-50">
    <div class="page-header mb-8 flex justify-between items-center">
      <div>
        <h2 class="text-3xl font-bold text-gray-800">👨‍✈️ 司机管理</h2>
        <p class="text-gray-500 mt-1">管理车队的所有驾驶员信息</p>
      </div>
      <el-button type="primary" icon="el-icon-plus" class="cartoon-button" @click="handleAdd">添加司机</el-button>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar bg-white p-4 rounded-2xl shadow-sm mb-6 flex gap-4">
      <el-input 
        v-model="query.name" 
        placeholder="搜索姓名..." 
        prefix-icon="el-icon-search"
        class="cartoon-input w-48"
        @keyup.enter.native="handleSearch"
      ></el-input>
      <el-input 
        v-model="query.phone" 
        placeholder="搜索手机号..." 
        prefix-icon="el-icon-phone"
        class="cartoon-input w-48"
        @keyup.enter.native="handleSearch"
      ></el-input>
      <el-select 
        v-model="query.group_name" 
        placeholder="搜索组别..." 
        class="cartoon-input w-48"
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
        <el-table-column prop="name" label="姓名" width="120">
          <template slot-scope="scope">
            <span class="font-bold text-gray-700">{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="group_name" label="组别" width="120">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.group_name" type="info" effect="plain" size="small">
              {{ scope.row.group_name }}
            </el-tag>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="150"></el-table-column>
        <el-table-column prop="license_types" label="准驾车型" width="120">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.license_types" type="warning" effect="plain" size="small">
              {{ scope.row.license_types }}
            </el-tag>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="id_card" label="身份证号" width="200"></el-table-column>
        <el-table-column label="年龄" width="80" sortable :sort-method="sortAge">
          <template slot-scope="scope">
            {{ getAge(scope.row.id_card) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="statusMap[scope.row.status].type" effect="dark" class="rounded-full px-3">
              {{ statusMap[scope.row.status].label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="入职时间" width="180" sortable>
          <template slot-scope="scope">
            {{ new Date(scope.row.created_at).toLocaleDateString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="200">
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
      :title="dialogType === 'add' ? '✨ 添加新司机' : '📝 编辑司机信息'" 
      :visible.sync="dialogVisible"
      width="800px"
      custom-class="cartoon-dialog"
    >
      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="基本信息" name="basic">
          <el-form :model="form" :rules="rules" ref="form" label-width="100px" class="mt-4">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" class="cartoon-input-sm"></el-input>
            </el-form-item>
            <el-form-item label="组别" prop="group_name">
              <el-select v-model="form.group_name" class="w-full" placeholder="请选择组别" clearable>
                <el-option
                  v-for="item in driverGroupOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.name"
                >
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" class="cartoon-input-sm"></el-input>
            </el-form-item>
            <el-form-item label="身份证号" prop="id_card">
              <el-input v-model="form.id_card" class="cartoon-input-sm"></el-input>
            </el-form-item>
            <el-form-item label="地址" prop="address">
              <el-input v-model="form.address" class="cartoon-input-sm"></el-input>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" class="w-full">
                <el-option label="在职" value="active"></el-option>
                <el-option label="休假" value="inactive"></el-option>
                <el-option label="离职" value="retired"></el-option>
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="驾驶证" name="license" :disabled="dialogType === 'add'">
          <div v-if="dialogType === 'add'" class="p-10 text-center text-gray-400">
            <i class="el-icon-info"></i> 请先保存基本信息后再管理驾驶证
          </div>
          <div v-else>
            <div class="mb-4 flex justify-end" v-if="licenseList.length === 0">
              <el-button type="primary" icon="el-icon-plus" class="cartoon-button-sm" @click="handleAddLicense">添加记录</el-button>
            </div>
            <el-table :data="licenseList" v-loading="licenseLoading" style="width: 100%">
              <el-table-column prop="license_number" label="驾驶证号" width="180"></el-table-column>
              <el-table-column prop="license_type" label="准驾车型" width="100">
                <template slot-scope="scope">
                  <el-tag effect="plain">{{ scope.row.license_type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="expiry_date" label="有效期至" width="150">
                <template slot-scope="scope">
                  <span :class="{'text-red-500 font-bold': isExpired(scope.row.expiry_date)}">
                    {{ formatDate(scope.row.expiry_date) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template slot-scope="scope">
                  <el-tag :type="licenseStatusMap[scope.row.status].type" effect="dark" class="rounded-full">
                    {{ licenseStatusMap[scope.row.status].label }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150">
                <template slot-scope="scope">
                  <el-button size="mini" type="primary" circle icon="el-icon-edit" @click="handleEditLicense(scope.row)"></el-button>
                  <el-button size="mini" type="danger" circle icon="el-icon-delete" @click="handleDeleteLicense(scope.row)"></el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="电子档案" name="files">
          <el-form :model="form" label-width="120px" class="mt-4">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="婚姻状态" prop="marital_status">
                  <el-select v-model="form.marital_status" class="w-full">
                    <el-option label="未婚" value="unmarried"></el-option>
                    <el-option label="已婚" value="married"></el-option>
                    <el-option label="离异" value="divorced"></el-option>
                    <el-option label="丧偶" value="widowed"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="运输资质" prop="transport_qualification">
                  <el-select v-model="form.transport_qualification" class="w-full">
                    <el-option label="普通货运" value="general"></el-option>
                    <el-option label="危险品货物运输押运员" value="dangerous_goods"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="紧急联系人" prop="emergency_contact">
                  <el-input v-model="form.emergency_contact" class="cartoon-input-sm"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="紧急电话" prop="emergency_phone">
                  <el-input v-model="form.emergency_phone" class="cartoon-input-sm"></el-input>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false" class="rounded-full">关 闭</el-button>
        <el-button v-if="activeTab !== 'license'" type="primary" @click="submitForm" class="rounded-full bg-blue-500 border-none">保 存</el-button>
      </span>

      <!-- 驾驶证表单弹窗 (嵌套) -->
      <el-dialog
        :title="licenseFormType === 'add' ? '✨ 添加驾驶证' : '📝 编辑驾驶证'"
        :visible.sync="licenseFormVisible"
        width="500px"
        custom-class="cartoon-dialog"
        append-to-body
      >
        <el-form :model="licenseForm" :rules="licenseRules" ref="licenseForm" label-width="100px">
          <el-form-item label="驾驶证号" prop="license_number">
            <el-input v-model="licenseForm.license_number" class="cartoon-input-sm"></el-input>
          </el-form-item>
          <el-form-item label="准驾车型" prop="license_type">
            <el-select v-model="licenseForm.license_type" class="w-full" placeholder="请选择车型">
              <el-option v-for="type in ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']" :key="type" :label="type" :value="type"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="初次领证" prop="issue_date">
            <el-date-picker v-model="licenseForm.issue_date" type="date" placeholder="选择日期" class="w-full" value-format="yyyy-MM-dd"></el-date-picker>
          </el-form-item>
          <el-form-item label="有效期至" prop="expiry_date">
            <el-date-picker v-model="licenseForm.expiry_date" type="date" placeholder="选择日期" class="w-full" value-format="yyyy-MM-dd"></el-date-picker>
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="licenseForm.status">
              <el-radio label="valid">有效</el-radio>
              <el-radio label="expired">过期</el-radio>
              <el-radio label="suspended">吊销</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
          <el-button @click="licenseFormVisible = false" class="rounded-full">取 消</el-button>
          <el-button type="primary" @click="submitLicenseForm" class="rounded-full bg-blue-500 border-none">确 定</el-button>
        </span>
      </el-dialog>
    </el-dialog>
  </div>
</template>

<script>
import { getDrivers, createDriver, updateDriver, deleteDriver } from '@/api/drivers'
import { getDriverRecords, createDriverRecord, updateDriverRecord, deleteDriverRecord } from '@/api/records'
import { getAllDriverGroups } from '@/api/driverGroups'

export default {
  name: 'DriverList',
  data() {
    return {
      // Driver List Data
      list: [],
      total: 0,
      loading: false,
      driverGroupOptions: [],
      query: {
        page: 1,
        limit: 10,
        name: '',
        phone: '',
        group_name: ''
      },
      statusMap: {
        active: { label: '在职', type: 'success' },
        inactive: { label: '休假', type: 'warning' },
        retired: { label: '离职', type: 'info' }
      },
      activeTab: 'basic',
      dialogVisible: false,
      dialogType: 'add',
      form: {
        id: undefined,
        name: '',
        phone: '',
        id_card: '',
        address: '',
        group_name: '',
        marital_status: 'unmarried',
        transport_qualification: 'general',
        emergency_contact: '',
        emergency_phone: '',
        status: 'active'
      },
      rules: {
        name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
        phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
        id_card: [{ required: true, message: '请输入身份证号', trigger: 'blur' }]
      },

      // License Management Data
      licenseDialogVisible: false,
      licenseFormVisible: false,
      licenseLoading: false,
      currentDriver: null,
      licenseList: [],
      licenseFormType: 'add',
      licenseForm: {
        id: undefined,
        driver_id: '',
        license_number: '',
        license_type: '',
        issue_date: '',
        expiry_date: '',
        status: 'valid'
      },
      licenseRules: {
        license_number: [{ required: true, message: '请输入证号', trigger: 'blur' }],
        license_type: [{ required: true, message: '请输入车型', trigger: 'blur' }],
        issue_date: [{ required: true, message: '请选择日期', trigger: 'change' }],
        expiry_date: [{ required: true, message: '请选择日期', trigger: 'change' }]
      },
      licenseStatusMap: {
        valid: { label: '有效', type: 'success' },
        expired: { label: '过期', type: 'danger' },
        suspended: { label: '吊销', type: 'info' }
      }
    }
  },
  created() {
    this.fetchData()
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
    sortAge(a, b) {
      const ageA = this.getAge(a.id_card)
      const ageB = this.getAge(b.id_card)
      if (ageA === '-') return -1
      if (ageB === '-') return 1
      return ageA - ageB
    },
    getAge(idCard) {
      if (!idCard || idCard.length < 14) return '-';
      const year = parseInt(idCard.substring(6, 10));
      const month = parseInt(idCard.substring(10, 12));
      const day = parseInt(idCard.substring(12, 14));
      
      const now = new Date();
      let age = now.getFullYear() - year;
      
      if (now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day)) {
        age--;
      }
      return age;
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
    // Driver Methods
    async fetchData() {
      this.loading = true
      try {
        const res = await getDrivers(this.query)
        this.list = res.data.list
        this.total = res.data.total
      } catch (error) {
        console.error(error)
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
      this.query.phone = ''
      this.query.group_name = ''
      this.handleSearch()
    },
    handleAdd() {
      this.dialogType = 'add'
      this.activeTab = 'basic'
      this.form = {
        id: undefined,
        name: '',
        phone: '',
        id_card: '',
        address: '',
        group_name: '',
        marital_status: 'unmarried',
        transport_qualification: 'general',
        emergency_contact: '',
        emergency_phone: '',
        status: 'active'
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.form) {
          this.$refs.form.clearValidate()
        }
      })
    },
    handleEdit(row) {
      this.dialogType = 'edit'
      this.activeTab = 'basic'
      this.form = { ...row }
      this.currentDriver = row
      this.dialogVisible = true
      this.fetchLicenseData()
      this.$nextTick(() => {
        this.$refs.form.clearValidate()
      })
    },
    async handleDelete(row) {
      try {
        await this.$confirm('确认删除该司机吗？', '提示', { type: 'warning' })
        await deleteDriver(row.id)
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
              await createDriver(this.form)
              this.$message.success('添加成功')
            } else {
              await updateDriver(this.form.id, this.form)
              this.$message.success('更新成功')
            }
            this.dialogVisible = false
            this.fetchData()
          } catch (error) {
            console.error(error)
          }
        }
      })
    },

    // License Methods
    // handleManageLicense removed as it's merged into handleEdit
    async fetchLicenseData() {
      if (!this.currentDriver) return
      this.licenseLoading = true
      try {
        const res = await getDriverRecords('licenses', { driver_id: this.currentDriver.id, limit: 100 })
        this.licenseList = res.data.list
      } catch (error) {
        console.error(error)
      } finally {
        this.licenseLoading = false
      }
    },
    handleAddLicense() {
      this.licenseFormType = 'add'
      this.licenseForm = { 
        driver_id: this.currentDriver.id,
        license_number: this.currentDriver.id_card, // Auto-fill license number with ID card
        status: 'valid' 
      }
      this.licenseFormVisible = true
      this.$nextTick(() => {
        this.$refs.licenseForm && this.$refs.licenseForm.clearValidate()
      })
    },
    handleEditLicense(row) {
      this.licenseFormType = 'edit'
      this.licenseForm = { ...row }
      if (this.licenseForm.issue_date) this.licenseForm.issue_date = this.licenseForm.issue_date.split('T')[0]
      if (this.licenseForm.expiry_date) this.licenseForm.expiry_date = this.licenseForm.expiry_date.split('T')[0]
      this.licenseFormVisible = true
      this.$nextTick(() => {
        this.$refs.licenseForm && this.$refs.licenseForm.clearValidate()
      })
    },
    async handleDeleteLicense(row) {
      try {
        await this.$confirm('确认删除该驾驶证记录吗？', '提示', { type: 'warning' })
        await deleteDriverRecord('licenses', row.id)
        this.$message.success('删除成功')
        this.fetchLicenseData()
      } catch (error) {
        if (error !== 'cancel') console.error(error)
      }
    },
    submitLicenseForm() {
      this.$refs.licenseForm.validate(async valid => {
        if (valid) {
          try {
            if (this.licenseFormType === 'add') {
              await createDriverRecord('licenses', this.licenseForm)
              this.$message.success('添加成功')
            } else {
              await updateDriverRecord('licenses', this.licenseForm.id, this.licenseForm)
              this.$message.success('更新成功')
            }
            this.licenseFormVisible = false
            this.fetchLicenseData()
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
