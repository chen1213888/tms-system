<template>
  <div class="login-container flex items-center justify-center min-h-screen bg-blue-50">
    <div class="login-card bg-white p-8 rounded-3xl shadow-lg w-full max-w-md">
      <div class="text-center mb-8">
        <div class="text-6xl mb-4">🚛</div>
        <h2 class="text-3xl font-bold text-gray-800">车队管理系统</h2>
        <p class="text-gray-500 mt-2">欢迎回来！请登录您的账号</p>
      </div>

      <el-form ref="loginForm" :model="loginForm" :rules="rules" class="login-form">
        <el-form-item prop="username">
          <el-input 
            v-model="loginForm.username" 
            prefix-icon="el-icon-user" 
            placeholder="请输入用户名"
            class="cartoon-input"
          ></el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input 
            v-model="loginForm.password" 
            prefix-icon="el-icon-lock" 
            type="password" 
            placeholder="请输入密码"
            class="cartoon-input"
            @keydown.enter.native="handleLogin"
          ></el-input>
        </el-form-item>
        
        <el-button 
          type="primary" 
          class="w-full cartoon-button mt-4" 
          :loading="loading" 
          @click="handleLogin"
        >
          登 录 🚀
        </el-button>
      </el-form>

      <div class="text-center mt-6 text-sm text-gray-400">
        默认账号: admin / 123456
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginPage',
  data() {
    return {
      loginForm: {
        username: '',
        password: ''
      },
      rules: {
        username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
      },
      loading: false
    }
  },
  methods: {
    handleLogin() {
      this.$refs.loginForm.validate(async valid => {
        if (valid) {
          this.loading = true
          try {
            await this.$store.dispatch('login', this.loginForm)
            this.$message.success('登录成功！🎉')
            this.$router.push('/')
          } catch (error) {
            console.error(error)
          } finally {
            this.loading = false
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.login-container {
  background-image: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}
.login-card {
  border: 4px solid #fff;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  transform: translateY(0);
  transition: all 0.3s;
}
.login-card:hover {
  transform: translateY(-5px);
}
.cartoon-button {
  height: 48px;
  font-size: 18px;
  border-radius: 24px;
  font-weight: bold;
  background: linear-gradient(to right, #4facfe 0%, #00f2fe 100%);
  border: none;
  transition: transform 0.1s;
}
.cartoon-button:active {
  transform: scale(0.98);
}
/* Element UI 覆盖样式 */
::v-deep .el-input__inner {
  border-radius: 24px;
  height: 48px;
  background-color: #f8fafc;
  border: 2px solid #e2e8f0;
}
::v-deep .el-input__inner:focus {
  border-color: #4facfe;
}
</style>
