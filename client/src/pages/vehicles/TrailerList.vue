<template>
  <div class="trailer-container p-8 min-h-screen bg-gray-50">
    <div class="page-header mb-8 flex justify-between items-center">
      <div>
        <h2 class="text-3xl font-bold text-gray-800">🚛 挂车管理</h2>
        <p class="text-gray-500 mt-1">管理车队的所有挂车设备</p>
      </div>
      <el-button type="primary" icon="el-icon-plus" class="cartoon-button" @click="handleAdd">添加挂车</el-button>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar bg-white p-4 rounded-2xl shadow-sm mb-6 flex gap-4">
      <el-input 
        v-model="query.keyword" 
        placeholder="搜索挂车牌号..." 
        prefix-icon="el-icon-search"
        class="cartoon-input w-64"
        @keyup.enter.native="handleSearch"
      ></el-input>
      <el-select v-model="query.group_name" placeholder="选择组别" class="cartoon-select w-40" @change="handleSearch" clearable>
        <el-option
          v-for="item in trailerGroupOptions"
          :key="item.id"
          :label="item.name"
          :value="item.name"
        ></el-option>
      </el-select>
      <el-button type="primary" class="cartoon-button-sm" @click="handleSearch">搜索 🔍</el-button>
      <el-button class="cartoon-button-sm" @click="resetSearch">重置 🔄</el-button>
    </div>

    <!-- 列表 -->
    <div class="bg-white rounded-3xl shadow-sm overflow-hidden p-6">
      <el-table :data="list" v-loading="loading" style="width: 100%" height="calc(100vh - 320px)">
        <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
        <el-table-column prop="plate_number" label="车牌号" width="150">
          <template slot-scope="scope">
            <el-tag effect="dark" class="plate-tag">{{ scope.row.plate_number }}</el-tag>
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
        <el-table-column prop="trailer_type" label="类型" width="150"></el-table-column>
        <el-table-column label="规格 (长x宽x高)" width="200">
          <template slot-scope="scope">
            {{ scope.row.length }} x {{ scope.row.width }} x {{ scope.row.height }} m
          </template>
        </el-table-column>
        <el-table-column prop="capacity" label="载重(吨)" width="120"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="statusMap[scope.row.status].type" effect="dark" class="rounded-full px-3">
              {{ statusMap[scope.row.status].label }}
            </el-tag>
          </template>
        </el-table-column>
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
      :title="dialogType === 'add' ? '✨ 添加新挂车' : '📝 编辑挂车信息'" 
      :visible.sync="dialogVisible"
      width="600px"
      custom-class="cartoon-dialog"
    >
      <el-form :model="form" :rules="rules" ref="form" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="车牌号" prop="plate_number">
              <el-input v-model="form.plate_number" class="cartoon-input-sm" placeholder="粤A·88888挂"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="注册日期" prop="registration_date">
              <el-date-picker v-model="form.registration_date" type="date" placeholder="选择注册日期" class="cartoon-input-sm w-full" value-format="yyyy-MM-dd"></el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="类型" prop="trailer_type">
              <el-select v-model="form.trailer_type" class="cartoon-input-sm w-full" placeholder="请选择类型">
                <el-option label="飞翼挂车" value="飞翼挂车"></el-option>
                <el-option label="柜车" value="柜车"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="所属组别" prop="group_name">
              <el-select v-model="form.group_name" class="cartoon-input-sm w-full" placeholder="请选择组别" clearable>
                <el-option
                  v-for="item in trailerGroupOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.name"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="长(m)" prop="length">
              <el-input v-model="form.length" class="cartoon-input-sm"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="宽(m)" prop="width">
              <el-input v-model="form.width" class="cartoon-input-sm"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="高(m)" prop="height">
              <el-input v-model="form.height" class="cartoon-input-sm"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="载重(吨)" prop="capacity">
              <el-input v-model="form.capacity" class="cartoon-input-sm"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="状态" prop="status" v-if="dialogType === 'edit'">
          <el-select v-model="form.status" class="w-full">
            <el-option label="运营中" value="active"></el-option>
            <el-option label="维修中" value="maintenance"></el-option>
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
import { getTrailers, createTrailer, updateTrailer, deleteTrailer } from '@/api/trailers'
import { getAllTrailerGroups } from '@/api/trailerGroups'

export default {
  name: 'TrailerList',
  data() {
    return {
      list: [],
      total: 0,
      loading: false,
      trailerGroupOptions: [],
      query: {
        page: 1,
        limit: 10,
        keyword: '',
        group_name: ''
      },
      statusMap: {
        active: { label: '运营中', type: 'success' },
        maintenance: { label: '维修中', type: 'warning' },
        retired: { label: '报废', type: 'info' }
      },
      dialogVisible: false,
      dialogType: 'add',
      form: {
        id: undefined,
        plate_number: '',
        registration_date: '',
        trailer_type: '',
        length: '',
        width: '',
        height: '',
        capacity: '',
        status: 'active',
        group_name: ''
      },
      rules: {
        plate_number: [
          { required: true, message: '请输入车牌号', trigger: 'blur' },
          { 
            pattern: /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵青藏川宁琼]{1}[A-Z]{1}[0-9A-HJ-NP-Z]{4}挂$/, 
            message: '请输入正确的挂车号牌格式（如：京A1234挂）', 
            trigger: 'blur' 
          }
        ],
        trailer_type: [{ required: true, message: '请选择挂车类型', trigger: 'change' }]
      }
    }
  },
  created() {
    this.fetchData()
    this.fetchTrailerGroups()
  },
  methods: {
    async fetchTrailerGroups() {
      try {
        const res = await getAllTrailerGroups()
        this.trailerGroupOptions = res.data
      } catch (error) {
        console.error(error)
      }
    },
    async fetchData() {
      this.loading = true
      try {
        const res = await getTrailers(this.query)
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
      this.query.group_name = ''
      this.handleSearch()
    },
    formatDate(date) {
      return date ? new Date(date).toLocaleDateString() : '-'
    },
    handleAdd() {
      this.dialogType = 'add'
      this.form = { status: 'active', group_name: '' }
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
        await this.$confirm('确认删除该挂车吗？', '提示', { type: 'warning' })
        await deleteTrailer(row.id)
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
              await createTrailer(this.form)
              this.$message.success('添加成功')
            } else {
              await updateTrailer(this.form.id, this.form)
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
.plate-tag {
  background-color: #f6e05e !important;
  color: #000 !important;
  border: 2px solid #000 !important;
  font-weight: bold;
  border-radius: 4px;
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
