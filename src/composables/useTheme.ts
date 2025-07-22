import { ref, watch } from 'vue'

export type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'primeflow-theme'

export function useTheme() {
  // Initialize theme from localStorage or default to dark
  const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') return 'dark'
    
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      return stored
    }
    
    // Default to dark theme
    return 'dark'
  }

  const currentTheme = ref<Theme>(getInitialTheme())

  // Apply theme to document
  const applyTheme = (theme: Theme) => {
    if (typeof document === 'undefined') return
    
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }

  // Apply initial theme
  applyTheme(currentTheme.value)

  // Watch for theme changes and apply them
  watch(currentTheme, (newTheme) => {
    applyTheme(newTheme)
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
  })

  // Toggle between light and dark
  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  }

  // Set specific theme
  const setTheme = (theme: Theme) => {
    currentTheme.value = theme
  }

  return {
    currentTheme,
    toggleTheme,
    setTheme,
    isDark: () => currentTheme.value === 'dark',
    isLight: () => currentTheme.value === 'light'
  }
}
