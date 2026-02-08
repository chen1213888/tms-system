import Vue from 'vue'
import VueRouter from 'vue-router'
import Layout from '../components/Layout.vue'
import HomePage from '../pages/HomePage.vue'
import LoginPage from '../pages/LoginPage.vue'
import store from '../store'

Vue.use(VueRouter)

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { public: true, title: '登录' }
  },
  {
    path: '/',
    component: Layout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Home',
        component: HomePage,
        meta: { title: '首页' }
      },
      {
        path: 'drivers',
        name: 'Drivers',
        component: () => import('../pages/drivers/DriverList.vue'),
        meta: { title: '司机管理' }
      },
      {
        path: 'vehicles',
        name: 'Vehicles',
        component: () => import('../pages/vehicles/VehicleList.vue'),
        meta: { title: '车辆管理' }
      },
      {
        path: 'drivers/physical',
        name: 'PhysicalManage',
        component: () => import('../pages/drivers/PhysicalManage.vue'),
        meta: { title: '体检管理' }
      },
      {
        path: 'drivers/insurance',
        name: 'DriverInsurance',
        component: () => import('../pages/drivers/DriverInsurance.vue'),
        meta: { title: '司机保险' }
      },
      {
        path: 'vehicles/insurance',
        name: 'VehicleInsurance',
        component: () => import('../pages/vehicles/VehicleInsurance.vue'),
        meta: { title: '车辆保险' }
      },
      {
        path: 'vehicles/maintenance',
        name: 'VehicleMaintenance',
        component: () => import('../pages/vehicles/VehicleMaintenance.vue'),
        meta: { title: '车辆保养' }
      },
      {
        path: 'vehicles/inspection',
        name: 'VehicleInspection',
        component: () => import('../pages/vehicles/VehicleInspection.vue'),
        meta: { title: '车辆年审' }
      },
      {
        path: 'trailers',
        name: 'Trailers',
        component: () => import('../pages/vehicles/TrailerList.vue'),
        meta: { title: '挂车管理' }
      },
      {
        path: 'check',
        name: 'CheckList',
        component: () => import('../pages/check/CheckList.vue'),
        meta: { title: '出车检查' }
      },
      {
        path: 'system/users',
        name: 'UserManage',
        component: () => import('../pages/system/UserManage.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'system/roles',
        name: 'RoleManage',
        component: () => import('../pages/system/RoleManage.vue'),
        meta: { title: '角色管理' }
      },
      {
        path: 'system/driver-groups',
        name: 'DriverGroupManage',
        component: () => import('../pages/system/DriverGroupManage.vue'),
        meta: { title: '车队管理(司机)' }
      },
      {
        path: 'system/vehicle-groups',
        name: 'VehicleGroupManage',
        component: () => import('../pages/system/VehicleGroupManage.vue'),
        meta: { title: '车队管理(车辆)' }
      },
      {
        path: 'system/trailer-groups',
        name: 'TrailerGroupManage',
        component: () => import('../pages/system/TrailerGroupManage.vue'),
        meta: { title: '车队管理(挂车)' }
      },
      {
        path: 'system/logs',
        name: 'OperationLogs',
        component: () => import('../pages/system/OperationLogs.vue'),
        meta: { title: '操作日志' }
      }
    ]
  }
]

const router = new VueRouter({
  mode: 'history',
  base: '/',
  routes
})

router.beforeEach((to, from, next) => {
  const isLoggedIn = store.getters.isLoggedIn
  
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isLoggedIn) {
      next('/login')
    } else {
      // 角色权限检查
      const user = store.state.userInfo
      if (to.path.startsWith('/system') && user.role_id !== 1) {
        Vue.prototype.$message.error('您没有权限访问该页面')
        next('/')
      } else {
        next()
      }
    }
  } else {
    // 防止已登录用户重复访问登录页
    if (to.path === '/login' && isLoggedIn) {
      next('/')
    } else {
      next()
    }
  }

  // 动态修改标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 车队管理系统`
  } else {
    document.title = '车队管理系统'
  }
})

export default router
