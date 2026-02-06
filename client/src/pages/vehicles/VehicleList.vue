<template>
  <div class="vehicle-container p-8 min-h-screen bg-gray-50">
    <div class="page-header mb-8 flex justify-between items-center">
      <div>
        <h2 class="text-3xl font-bold text-gray-800">🚛 车辆管理</h2>
        <p class="text-gray-500 mt-1">管理所有牵引车和单体车</p>
      </div>
      <el-button type="primary" icon="el-icon-plus" class="cartoon-button" @click="handleAdd">添加车辆</el-button>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar bg-white p-4 rounded-2xl shadow-sm mb-6 flex gap-4 items-center">
      <div class="flex-1 flex gap-4">
        <el-input 
          v-model="query.keyword" 
          placeholder="搜索车牌号、车架号..." 
          prefix-icon="el-icon-search"
          class="cartoon-input w-64"
          @keyup.enter.native="handleSearch"
        ></el-input>
        <el-select v-model="query.type" placeholder="车辆类型" class="cartoon-select w-40" @change="handleSearch" clearable>
          <el-option label="牵引车" value="tractor"></el-option>
          <el-option label="单体车" value="single_truck"></el-option>
        </el-select>
        <el-select v-model="query.group_name" placeholder="选择组别" class="cartoon-select w-40" @change="handleSearch" clearable>
          <el-option
            v-for="item in vehicleGroupOptions"
            :key="item.id"
            :label="item.name"
            :value="item.name"
          ></el-option>
        </el-select>
      </div>
      <el-button type="primary" class="cartoon-button-sm" @click="handleSearch">搜索 🔍</el-button>
      <el-button class="cartoon-button-sm" @click="resetSearch">重置 🔄</el-button>
    </div>

    <!-- 列表 -->
    <div class="bg-white rounded-3xl shadow-sm overflow-hidden p-6">
      <el-table :data="list" v-loading="loading" style="width: 100%" height="calc(100vh - 320px)">
        <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
        <el-table-column prop="plate_number" label="车牌号" width="150">
          <template slot-scope="scope">
            <div class="bg-blue-600 text-white px-2 py-1 rounded text-center font-bold text-sm inline-block">
              {{ scope.row.plate_number }}
            </div>
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
        <el-table-column prop="registration_date" label="注册日期" width="120">
          <template slot-scope="scope">{{ formatDate(scope.row.registration_date) }}</template>
        </el-table-column>
        <el-table-column prop="vehicle_type" label="类型" width="120">
          <template slot-scope="scope">
            <el-tag :type="scope.row.vehicle_type === 'tractor' ? 'warning' : 'info'" effect="light" class="rounded-full">
              {{ scope.row.vehicle_type === 'tractor' ? '🚜 牵引车' : '🚚 单体车' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="brand" label="品牌/型号" width="180">
          <template slot-scope="scope">
            {{ scope.row.brand }} {{ scope.row.model }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="statusMap[scope.row.status].type" effect="dark" class="rounded-full px-3">
              {{ statusMap[scope.row.status].label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="current_mileage" label="里程(km)" width="120"></el-table-column>
        <el-table-column label="操作" min-width="200">
          <template slot-scope="scope">
            <el-button size="mini" type="primary" circle icon="el-icon-edit" @click="handleEdit(scope.row)"></el-button>
            <el-button size="mini" type="danger" circle icon="el-icon-delete" @click="handleDelete(scope.row)"></el-button>
            <el-button size="mini" type="warning" circle icon="el-icon-setting" title="保养"></el-button>
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
      :title="dialogType === 'add' ? '✨ 添加新车辆' : '📝 编辑车辆信息'" 
      :visible.sync="dialogVisible"
      width="600px"
      custom-class="cartoon-dialog"
    >
      <el-form :model="form" :rules="rules" ref="form" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="车牌号" prop="plate_number">
              <el-input v-model="form.plate_number" class="cartoon-input-sm" placeholder="粤A·88888"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="注册日期" prop="registration_date">
              <el-date-picker v-model="form.registration_date" type="date" placeholder="选择注册日期" class="w-full" value-format="yyyy-MM-dd"></el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="车辆类型" prop="vehicle_type">
              <el-select v-model="form.vehicle_type" class="w-full">
                <el-option label="牵引车" value="tractor"></el-option>
                <el-option label="单体车" value="single_truck"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属组别" prop="group_name">
              <el-select v-model="form.group_name" class="w-full" placeholder="请选择组别" clearable>
                <el-option
                  v-for="item in vehicleGroupOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.name"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="品牌" prop="brand">
              <el-input v-model="form.brand" class="cartoon-input-sm"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="型号" prop="model">
              <el-input v-model="form.model" class="cartoon-input-sm"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="车架号" prop="vin_code">
          <el-input v-model="form.vin_code" class="cartoon-input-sm"></el-input>
        </el-form-item>
        <el-form-item label="当前里程" prop="current_mileage">
          <el-input v-model.number="form.current_mileage" type="number" class="cartoon-input-sm">
            <template slot="append">km</template>
          </el-input>
        </el-form-item>
        <el-form-item label="状态" prop="status" v-if="dialogType === 'edit'">
          <el-select v-model="form.status" class="w-full">
            <el-option label="运营中" value="active"></el-option>
            <el-option label="维修中" value="maintenance"></el-option>
            <el-option label="事故" value="accident"></el-option>
            <el-option label="报废" value="retired"></el-option>
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
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '@/api/vehicles'
import { getAllVehicleGroups } from '@/api/vehicleGroups'

export default {
  name: 'VehicleList',
  data() {
    return {
      list: [],
      total: 0,
      loading: false,
      vehicleGroupOptions: [],
      query: {
        page: 1,
        limit: 10,
        keyword: '',
        type: '',
        group_name: ''
      },
      statusMap: {
        active: { label: '运营中', type: 'success' },
        maintenance: { label: '维修中', type: 'warning' },
        accident: { label: '事故', type: 'danger' },
        retired: { label: '报废', type: 'info' }
      },
      dialogVisible: false,
      dialogType: 'add',
      form: {
        id: undefined,
        plate_number: '',
        registration_date: '',
        vehicle_type: 'tractor',
        brand: '',
        model: '',
        color: '',
        vin_code: '',
        engine_number: '',
        purchase_date: '',
        purchase_price: '',
        current_mileage: 0,
        status: 'active',
        group_name: ''
      },
      rules: {
        plate_number: [{ required: true, message: '请输入车牌号', trigger: 'blur' }],
        vehicle_type: [{ required: true, message: '请选择车辆类型', trigger: 'change' }]
      }
    }
  },
  created() {
    this.fetchData()
    this.fetchVehicleGroups()
  },
  methods: {
    async fetchVehicleGroups() {
      try {
        const res = await getAllVehicleGroups()
        this.vehicleGroupOptions = res.data
      } catch (error) {
        console.error(error)
      }
    },
    async fetchData() {
      this.loading = true
      try {
        const res = await getVehicles(this.query)
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
      this.query.keyword = ''
      this.query.type = ''
      this.query.group_name = ''
      this.handleSearch()
    },
    formatDate(date) {
      return date ? new Date(date).toLocaleDateString() : '-'
    },
    handleAdd() {
      this.dialogType = 'add'
      this.form = { vehicle_type: 'tractor', status: 'active', current_mileage: 0, group_name: '' }
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
        await this.$confirm('确认删除该车辆吗？', '提示', { type: 'warning' })
        await deleteVehicle(row.id)
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
              await createVehicle(this.form)
              this.$message.success('添加成功')
            } else {
              await updateVehicle(this.form.id, this.form)
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
