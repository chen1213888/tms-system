<template>
  <div class="dashboard-container p-8 bg-gray-50 min-h-screen">
    <div class="mb-8">
      <h2 class="text-3xl font-bold text-gray-800 mb-2">👋 欢迎回来，管理员</h2>
      <p class="text-gray-500">这里是您的车队运营概览</p>
    </div>

    <!-- 核心指标 -->
    <el-row :gutter="24" class="mb-8">
      <el-col :span="8">
        <div class="stat-card bg-blue-100 text-blue-600">
          <div class="icon-wrapper bg-white">
            <i class="el-icon-truck text-3xl"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalVehicles }}</div>
            <div class="stat-label">总车辆数 🚛</div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card bg-green-100 text-green-600">
          <div class="icon-wrapper bg-white">
            <i class="el-icon-ship text-3xl"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalTrailers }}</div>
            <div class="stat-label">总挂车数 🚛</div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card bg-yellow-100 text-yellow-600">
          <div class="icon-wrapper bg-white">
            <i class="el-icon-user text-3xl"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalDrivers }}</div>
            <div class="stat-label">总司机数 👨‍✈️</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 预警信息 -->
    <h3 class="text-xl font-bold text-gray-800 mb-4">⚠️ 待办预警 (已过期)</h3>
    <el-row :gutter="24">
      <el-col :span="6" v-for="(item, index) in warnings" :key="index" class="mb-4">
        <el-card 
          shadow="hover" 
          class="warning-card border-none cursor-pointer" 
          :body-style="{ padding: '20px' }"
          @click.native="handleWarningClick(item)"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="text-gray-500 text-sm mb-1">{{ item.label }}</div>
              <div class="text-2xl font-bold" :class="item.count > 0 ? 'text-red-500' : 'text-gray-400'">
                {{ item.count }}
              </div>
            </div>
            <div class="text-3xl">{{ item.emoji }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { getStatistics } from '@/api/dashboard'

export default {
  name: 'Dashboard',
  data() {
    return {
      stats: {
        totalVehicles: 0,
        totalTrailers: 0,
        totalDrivers: 0,
        expiringPhysical: 0,
        expiringDriverInsurance: 0,
        expiringVehicleInsurance: 0,
        expiringTrailerInsurance: 0,
        expiringVehicleMaintenance: 0,
        expiringTrailerMaintenance: 0,
        expiringVehicleInspection: 0,
        expiringTrailerInspection: 0
      }
    }
  },
  computed: {
    warnings() {
      return [
        { label: '司机体检已过期', count: this.stats.expiringPhysical, emoji: '🏥', path: '/drivers/physical' },
        { label: '司机保险已过期', count: this.stats.expiringDriverInsurance, emoji: '🛡️', path: '/drivers/insurance' },
        { label: '车辆保险已过期', count: this.stats.expiringVehicleInsurance, emoji: '🛡️', path: '/vehicles/insurance' },
        { label: '挂车保险已过期', count: this.stats.expiringTrailerInsurance, emoji: '🛡️', path: '/trailers/insurance' },
        { label: '车辆保养已过期', count: this.stats.expiringVehicleMaintenance, emoji: '🔧', path: '/vehicles/maintenance' },
        { label: '挂车保养已过期', count: this.stats.expiringTrailerMaintenance, emoji: '🔧', path: '/trailers/maintenance' },
        { label: '车辆年审已过期', count: this.stats.expiringVehicleInspection, emoji: '📅', path: '/vehicles/inspection' },
        { label: '挂车年审已过期', count: this.stats.expiringTrailerInspection, emoji: '📅', path: '/trailers/inspection' }
      ]
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      try {
        const res = await getStatistics()
        this.stats = res.data
      } catch (error) {
        console.error(error)
      }
    },
    handleWarningClick(item) {
      if (item.path) {
        this.$router.push(item.path)
      }
    }
  }
}
</script>

<style scoped>
.stat-card {
  border-radius: 24px;
  padding: 24px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  cursor: pointer;
}
.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.05);
}
.icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}
.stat-value {
  font-size: 32px;
  font-weight: bold;
  line-height: 1.2;
}
.stat-label {
  font-size: 14px;
  opacity: 0.8;
}
.warning-card {
  border-radius: 16px;
  border: 1px solid #f0f0f0;
}
</style>
