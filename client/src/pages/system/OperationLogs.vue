<template>
  <div class="logs-container p-8 min-h-screen bg-gray-50">
    <div class="page-header mb-8">
      <h2 class="text-3xl font-bold text-gray-800">📜 操作日志</h2>
      <p class="text-gray-500 mt-1">记录系统中所有的修改与删除操作</p>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar bg-white p-6 rounded-2xl shadow-sm mb-6 flex flex-wrap gap-4 items-end">
      <div class="flex flex-col gap-2">
        <span class="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">操作模块</span>
        <el-select v-model="query.module" placeholder="全部模块" clearable class="cartoon-select w-40">
          <el-option v-for="(label, value) in moduleMap" :key="value" :label="label" :value="value"></el-option>
        </el-select>
      </div>

      <div class="flex flex-col gap-2">
        <span class="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">操作类型</span>
        <el-select v-model="query.action" placeholder="全部类型" clearable class="cartoon-select w-32">
          <el-option label="创建" value="CREATE"></el-option>
          <el-option label="修改" value="UPDATE"></el-option>
          <el-option label="删除" value="DELETE"></el-option>
        </el-select>
      </div>

      <div class="flex flex-col gap-2">
        <span class="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">操作人</span>
        <el-input 
          v-model="query.username" 
          placeholder="搜索用户名..." 
          prefix-icon="el-icon-user"
          class="cartoon-input w-40"
          @keyup.enter.native="handleSearch"
        ></el-input>
      </div>

      <div class="flex flex-col gap-2">
        <span class="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">日期范围</span>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd"
          class="cartoon-range-picker"
          @change="handleDateChange"
        ></el-date-picker>
      </div>

      <div class="flex gap-2">
        <el-button type="primary" class="cartoon-button-sm" @click="handleSearch">搜索 🔍</el-button>
        <el-button class="cartoon-button-sm" @click="resetSearch">重置 🔄</el-button>
      </div>
    </div>

    <!-- 列表 -->
    <div class="bg-white rounded-3xl shadow-sm overflow-hidden p-6">
      <el-table :data="list" v-loading="loading" style="width: 100%" height="calc(100vh - 380px)">
        <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
        <el-table-column prop="username" label="操作人" width="120">
          <template slot-scope="scope">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-sm">👤</div>
              <span class="font-bold text-gray-700">{{ scope.row.username }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="150">
          <template slot-scope="scope">
            <el-tag size="small" effect="plain" class="rounded-lg border-blue-200 text-blue-600 bg-blue-50">
              {{ moduleMap[scope.row.module] || scope.row.module }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="操作" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="actionTypeMap[scope.row.action].type" effect="dark" class="rounded-full px-3">
              {{ actionTypeMap[scope.row.action].label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP地址" width="140"></el-table-column>
        <el-table-column prop="created_at" label="操作时间" width="180">
          <template slot-scope="scope">
            <span class="text-gray-500">{{ formatDateTime(scope.row.created_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="详情">
          <template slot-scope="scope">
            <el-button type="text" @click="viewDetail(scope.row)" class="text-blue-500 hover:text-blue-700 font-bold">查看详情 👁️</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="p-4 flex justify-end">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :total="total"
          :page-sizes="[20, 50, 100]"
          :page-size="query.limit"
          :current-page.sync="query.page"
          @current-change="fetchData"
          @size-change="handleSizeChange"
        >
        </el-pagination>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog title="📄 操作详情" :visible.sync="detailVisible" width="700px" custom-class="cartoon-dialog">
      <div v-if="currentLog" class="log-detail-content">
        <div class="grid grid-cols-2 gap-4 mb-6 bg-blue-50 p-4 rounded-2xl border border-blue-100">
          <div class="detail-item">
            <span class="label text-gray-400 text-xs block mb-1">操作人</span>
            <span class="value font-bold text-gray-800">{{ currentLog.username }} (ID: {{ currentLog.user_id }})</span>
          </div>
          <div class="detail-item">
            <span class="label text-gray-400 text-xs block mb-1">操作时间</span>
            <span class="value font-bold text-gray-800">{{ formatDateTime(currentLog.created_at) }}</span>
          </div>
          <div class="detail-item">
            <span class="label text-gray-400 text-xs block mb-1">操作模块</span>
            <span class="value font-bold text-gray-800">{{ moduleMap[currentLog.module] || currentLog.module }}</span>
          </div>
          <div class="detail-item">
            <span class="label text-gray-400 text-xs block mb-1">操作类型</span>
            <span class="value font-bold text-gray-800">{{ actionTypeMap[currentLog.action].label }}</span>
          </div>
        </div>
        
        <div class="detail-section">
          <h4 class="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
            <i class="el-icon-info text-blue-500"></i> 数据详情 (Payload)
          </h4>
          <div class="bg-gray-900 rounded-xl p-4 overflow-auto max-h-96">
            <pre class="text-green-400 text-xs leading-relaxed font-mono">{{ formatJson(currentLog.details) }}</pre>
          </div>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="detailVisible = false" class="rounded-full bg-blue-500 border-none px-8">关 闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import request from '@/utils/request'

export default {
  name: 'OperationLogs',
  data() {
    return {
      list: [],
      total: 0,
      loading: false,
      dateRange: [],
      query: {
        page: 1,
        limit: 20,
        module: '',
        action: '',
        username: '',
        startDate: '',
        endDate: ''
      },
      moduleMap: {
        'drivers': '司机管理',
        'vehicles': '车辆管理',
        'trailers': '挂车管理',
        'users': '用户管理',
        'roles': '角色管理',
        'records/insurance': '保险管理',
        'records/maintenance': '保养管理',
        'records/inspection': '年审管理',
        'driver-records/physical': '体检记录',
        'driver-records/licenses': '驾驶证管理'
      },
      actionTypeMap: {
        'CREATE': { label: '创建', type: 'success' },
        'UPDATE': { label: '修改', type: 'warning' },
        'DELETE': { label: '删除', type: 'danger' }
      },
      detailVisible: false,
      currentLog: null
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      this.loading = true
      try {
        const res = await request({
          url: '/logs',
          method: 'get',
          params: this.query
        })
        if (res.code === 200) {
          this.list = res.data.list
          this.total = res.data.total
        }
      } catch (error) {
        console.error('Fetch Logs Error:', error)
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
    handleDateChange(val) {
      if (val) {
        this.query.startDate = val[0]
        this.query.endDate = val[1]
      } else {
        this.query.startDate = ''
        this.query.endDate = ''
      }
    },
    resetSearch() {
      this.query = {
        page: 1,
        limit: 20,
        module: '',
        action: '',
        username: '',
        startDate: '',
        endDate: ''
      }
      this.dateRange = []
      this.handleSearch()
    },
    viewDetail(row) {
      this.currentLog = row
      this.detailVisible = true
    },
    formatDateTime(dateStr) {
      const date = new Date(dateStr)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    },
    formatJson(jsonStr) {
      try {
        const obj = JSON.parse(jsonStr)
        return JSON.stringify(obj, null, 2)
      } catch (e) {
        return jsonStr
      }
    }
  }
}
</script>

<style scoped>
.cartoon-button-sm {
  border-radius: 12px;
  font-weight: bold;
}
::v-deep .cartoon-select .el-input__inner,
::v-deep .cartoon-input .el-input__inner,
::v-deep .cartoon-range-picker {
  border-radius: 12px;
  border: 2px solid #edf2f7;
}
::v-deep .cartoon-range-picker.el-range-editor.is-active,
::v-deep .cartoon-select .el-input.is-focus .el-input__inner {
  border-color: #3182ce;
}
::v-deep .el-dialog {
  border-radius: 24px;
  overflow: hidden;
}
::v-deep .el-dialog__header {
  background-color: #ebf8ff;
  padding: 20px;
}
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
