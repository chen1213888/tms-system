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
    meta: { public: true }
  },
  {
    path: '/',
    component: Layout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Home',
        component: HomePage
      },
      {
        path: 'drivers',
        name: 'Drivers',
        component: () => import('../pages/drivers/DriverList.vue')
      },
      {
        path: 'vehicles',
        name: 'Vehicles',
        component: () => import('../pages/vehicles/VehicleList.vue')
      },
      {
        path: 'drivers/physical',
        name: 'PhysicalManage',
        component: () => import('../pages/drivers/PhysicalManage.vue')
      },
      {
        path: 'drivers/insurance',
        name: 'DriverInsurance',
        component: () => import('../pages/drivers/DriverInsurance.vue')
      },
      {
        path: 'vehicles/insurance',
        name: 'VehicleInsurance',
        component: () => import('../pages/vehicles/VehicleInsurance.vue')
      },
      {
        path: 'vehicles/maintenance',
        name: 'VehicleMaintenance',
        component: () => import('../pages/vehicles/VehicleMaintenance.vue')
      },
      {
        path: 'vehicles/inspection',
        name: 'VehicleInspection',
        component: () => import('../pages/vehicles/VehicleInspection.vue')
      },
      {
        path: 'trailers',
        name: 'Trailers',
        component: () => import('../pages/vehicles/TrailerList.vue')
      },
      {
        path: 'check',
        name: 'CheckList',
        component: () => import('../pages/check/CheckList.vue')
      },
      {
        path: 'system/users',
        name: 'UserManage',
        component: () => import('../pages/system/UserManage.vue')
      },
      {
        path: 'system/roles',
        name: 'RoleManage',
        component: () => import('../pages/system/RoleManage.vue')
      },
      {
        path: 'system/driver-groups',
        name: 'DriverGroupManage',
        component: () => import('../pages/system/DriverGroupManage.vue')
      },
      {
        path: 'system/vehicle-groups',
        name: 'VehicleGroupManage',
        component: () => import('../pages/system/VehicleGroupManage.vue')
      },
      {
        path: 'system/trailer-groups',
        name: 'TrailerGroupManage',
        component: () => import('../pages/system/TrailerGroupManage.vue')
      },
      {
        path: 'system/logs',
        name: 'OperationLogs',
        component: () => import('../pages/system/OperationLogs.vue')
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
})

export default router
