import { ref, watchEffect, onMounted, computed } from 'vue'

export function useTheme() {
  // 初始化时直接获取偏好主题，而不是默认为 'light'
  const getPreferredTheme = () => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    // 默认使用 dark 模式
    return 'dark'
  }

  const theme = ref(getPreferredTheme())

  const applyTheme = (t) => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(t)
    localStorage.setItem('theme', t)
  }

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  onMounted(() => {
    // 移除 onMounted 中的重复赋值，避免闪烁或逻辑冲突
    applyTheme(theme.value)
  })

  watchEffect(() => {
    applyTheme(theme.value)
  })

  return {
    theme,
    toggleTheme,
    isDark: computed(() => theme.value === 'dark'),
  }
}
