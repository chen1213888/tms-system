import Vue from 'vue'
import Vuex from 'vuex'
import request from '@/utils/request'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    token: localStorage.getItem('fleet_token') || '',
    userInfo: JSON.parse(localStorage.getItem('fleet_user_info') || '{}')
  },
  mutations: {
    SET_TOKEN(state, token) {
      state.token = token
      localStorage.setItem('fleet_token', token)
    },
    SET_USER_INFO(state, info) {
      state.userInfo = info
      localStorage.setItem('fleet_user_info', JSON.stringify(info))
    },
    LOGOUT(state) {
      state.token = ''
      state.userInfo = {}
      localStorage.removeItem('fleet_token')
      localStorage.removeItem('fleet_user_info')
    }
  },
  actions: {
    async login({ commit }, loginForm) {
      const res = await request({
        url: '/auth/login',
        method: 'post',
        data: loginForm
      })
      
      const { token, userInfo } = res.data
      commit('SET_TOKEN', token)
      commit('SET_USER_INFO', userInfo)
      return res
    },
    logout({ commit }) {
      commit('LOGOUT')
    }
  },
  getters: {
    isLoggedIn: state => !!state.token,
    currentUser: state => state.userInfo
  }
})
