<template>
  <div class="layout-container h-screen flex">
    <!-- 侧边栏 -->
    <div class="sidebar w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col transition-all duration-300 z-10">
      <div class="logo-area h-16 flex items-center justify-center border-b border-gray-100 dark:border-gray-700">
        <div class="text-3xl mr-2">🚛</div>
        <div class="text-xl font-bold text-gray-800 dark:text-gray-200">车队管理</div>
      </div>
      
      <el-menu
        :default-active="$route.path"
        class="flex-1 border-none py-4"
        router
        unique-opened
        text-color="#4a5568"
        active-text-color="#3182ce"
        :background-color="isDark ? '#1f2937' : '#ffffff'"
        :text-color="isDark ? '#e5e7eb' : '#4a5568'"
        :active-text-color="isDark ? '#60a5fa' : '#3182ce'"
      >
        <el-menu-item index="/">
          <i class="el-icon-s-home"></i>
          <span slot="title">首页概览</span>
        </el-menu-item>
        
        <el-submenu index="drivers">
          <template slot="title">
            <i class="el-icon-user"></i>
            <span>司机管理</span>
          </template>
          <el-menu-item index="/drivers">
            <i class="el-icon-s-grid"></i>
            <span slot="title">司机列表</span>
          </el-menu-item>
          <el-menu-item index="/drivers/physical">
            <i class="el-icon-first-aid-kit"></i>
            <span slot="title">体检记录</span>
          </el-menu-item>
          <el-menu-item index="/drivers/insurance">
            <i class="el-icon-umbrella"></i>
            <span slot="title">保险记录</span>
          </el-menu-item>
        </el-submenu>
        
        <el-submenu index="vehicles">
          <template slot="title">
            <i class="el-icon-truck"></i>
            <span>车辆管理</span>
          </template>
          <el-menu-item index="/vehicles">
            <i class="el-icon-s-grid"></i>
            <span slot="title">车辆列表</span>
          </el-menu-item>
          <el-menu-item index="/trailers">
            <i class="el-icon-ship"></i>
            <span slot="title">挂车列表</span>
          </el-menu-item>
          <el-menu-item index="/vehicles/insurance">
            <i class="el-icon-umbrella"></i>
            <span slot="title">保险记录</span>
          </el-menu-item>
          <el-menu-item index="/vehicles/maintenance">
            <i class="el-icon-s-tools"></i>
            <span slot="title">保养记录</span>
          </el-menu-item>
          <el-menu-item index="/vehicles/inspection">
            <i class="el-icon-date"></i>
            <span slot="title">年审记录</span>
          </el-menu-item>
        </el-submenu>
        <el-submenu index="check">
          <template slot="title">
            <i class="el-icon-circle-check"></i>
            <span>车辆点检</span>
          </template>
          <el-menu-item index="/check">
            <i class="el-icon-s-grid"></i>
            <span slot="title">点检列表</span>
          </el-menu-item>
        </el-submenu>
        <el-submenu index="system" v-if="user.role_id === 1">
          <template slot="title">
            <i class="el-icon-setting"></i>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/system/users">
            <i class="el-icon-user-solid"></i>
            <span slot="title">用户管理</span>
          </el-menu-item>
          <el-menu-item index="/system/roles">
            <i class="el-icon-s-custom"></i>
            <span slot="title">角色管理</span>
          </el-menu-item>
          <el-menu-item index="/system/driver-groups">
            <i class="el-icon-collection"></i>
            <span slot="title">司机组别管理</span>
          </el-menu-item>
          <el-menu-item index="/system/vehicle-groups">
            <i class="el-icon-collection"></i>
            <span slot="title">车辆组别管理</span>
          </el-menu-item>
          <el-menu-item index="/system/trailer-groups">
            <i class="el-icon-collection"></i>
            <span slot="title">挂车组别管理</span>
          </el-menu-item>
          <el-menu-item index="/system/logs">
            <i class="el-icon-document"></i>
            <span slot="title">操作日志</span>
          </el-menu-item>
        </el-submenu>
      </el-menu>
    </div>

    <!-- 主内容区 -->
    <div class="main-content flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden transition-colors duration-300">
      <!-- 头部 -->
      <div class="header h-16 bg-white dark:bg-gray-800 shadow-sm flex items-center justify-between px-8 z-10 transition-colors duration-300">
        <div class="text-gray-500 dark:text-gray-400 text-sm">
          {{ currentDate }}
        </div>
        
        <div class="flex items-center gap-4">
          <!-- 主题切换按钮 -->
          <div class="theme-toggle cursor-pointer p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" @click="toggleTheme">
            <span v-if="isDark" class="text-xl">🌞</span>
            <span v-else class="text-xl">🌙</span>
          </div>

          <div class="text-right mr-2">
            <div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ user.username || 'Admin' }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">{{ user.role_name || '普通用户' }}</div>
          </div>
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="avatar-wrapper cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-full transition-colors">
              <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xl border-2 border-white dark:border-gray-600 shadow-sm">
                👨‍💼
              </div>
            </div>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="logout" class="text-red-500">
                <i class="el-icon-switch-button"></i> 退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </div>

      <!-- 页面内容 -->
      <div class="page-content flex-1 overflow-auto p-6 scroll-smooth">
        <transition name="fade-transform" mode="out-in">
          <router-view></router-view>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
import { useTheme } from '@/composables/useTheme'

export default {
  name: 'Layout',
  setup() {
    const { isDark, toggleTheme } = useTheme()
    return { isDark, toggleTheme }
  },
  data() {
    return {
      currentDate: new Date().toLocaleDateString('zh-CN', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
  },
  computed: {
    user() {
      return this.$store.state.userInfo || {}
    }
  },
  methods: {
    handleCommand(command) {
      if (command === 'logout') {
        this.$store.dispatch('logout')
        this.$router.push('/login')
        this.$message.success('已安全退出 👋')
      }
    }
  }
}
</script>

<style scoped>
.layout-container {
  font-family: 'Nunito', sans-serif;
}

/* 侧边栏样式优化 */
::v-deep .el-menu {
  background-color: transparent;
}
::v-deep .el-menu-item, ::v-deep .el-submenu__title {
  height: 56px;
  line-height: 56px;
  margin: 4px 16px;
  border-radius: 12px;
}
::v-deep .el-menu-item:hover, ::v-deep .el-submenu__title:hover {
  background-color: #f7fafc !important;
  color: #3182ce !important;
}
.dark ::v-deep .el-menu-item:hover, .dark ::v-deep .el-submenu__title:hover {
  background-color: #374151 !important;
  color: #60a5fa !important;
}
::v-deep .el-menu-item.is-active {
  background-color: #ebf8ff !important;
  font-weight: bold;
}
.dark ::v-deep .el-menu-item.is-active {
  background-color: #1e3a8a !important;
  color: #60a5fa !important;
}
::v-deep .el-menu-item i, ::v-deep .el-submenu__title i {
  color: #a0aec0;
  margin-right: 12px;
  font-size: 18px;
}
::v-deep .el-menu-item.is-active i {
  color: #3182ce;
}
.dark ::v-deep .el-menu-item.is-active i {
  color: #60a5fa;
}

/* 页面切换动画 */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.3s;
}
.fade-transform-enter {
  opacity: 0;
  transform: translateX(-10px);
}
.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
</style>
