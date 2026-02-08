import axios from 'axios'
import { Message } from 'element-ui'
import store from '@/store'
import router from '@/router'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 5000
})

service.interceptors.request.use(
  config => {
    const token = localStorage.getItem('fleet_token')
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code !== 200) {
      const errMsg = res.message || 'Error'
      Message({
        message: errMsg,
        type: 'error',
        duration: 5 * 1000
      })
      return Promise.reject(new Error(errMsg))
    } else {
      return res
    }
  },
  error => {
    console.log('err' + error)
    let message = error.message
    
    if (error.response && error.response.data) {
      // 优先使用后端返回的错误信息
      message = error.response.data.message || message
      
      // 处理 401 错误
      if (error.response.status === 401) {
        // 如果不是登录接口报错，说明是 Token 失效
        if (!error.config.url.includes('/auth/login')) {
          Message({
            message: '登录状态已过期，请重新登录',
            type: 'warning',
            duration: 3 * 1000
          })
          store.dispatch('logout')
          router.push('/login')
        }
      }
    }

    Message({
      message: message,
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)

export default service
