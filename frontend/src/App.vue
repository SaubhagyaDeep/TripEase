<script setup lang="ts">
import { ref, onMounted } from 'vue';
import TripManager from './components/TripManager.vue';

const currentTheme = ref('dark');
const showThemeMenu = ref(false);

function toggleTheme() {
  showThemeMenu.value = !showThemeMenu.value;
}

function setTheme(theme: string) {
  currentTheme.value = theme;
  showThemeMenu.value = false;
  
  // Update CSS variables based on theme
  const root = document.documentElement;
  
  switch (theme) {
    case 'light':
      root.style.setProperty('--background', '#f8f9fa');
      root.style.setProperty('--surface', '#ffffff');
      root.style.setProperty('--surface-alt', '#e9ecef');
      root.style.setProperty('--text', '#212529');
      root.style.setProperty('--accent', '#6f42c1');
      root.style.setProperty('--primary', '#8b5cf6');
      root.style.setProperty('--secondary', '#ec4899');
      root.style.setProperty('--danger', '#dc3545');
      root.style.setProperty('--border', '#dee2e6');
      break;
    case 'purple':
      root.style.setProperty('--background', '#1a1a2e');
      root.style.setProperty('--surface', '#16213e');
      root.style.setProperty('--surface-alt', '#0f3460');
      root.style.setProperty('--text', '#e94560');
      root.style.setProperty('--accent', '#e94560');
      root.style.setProperty('--primary', '#8b5cf6');
      root.style.setProperty('--secondary', '#ec4899');
      root.style.setProperty('--danger', '#ef4444');
      root.style.setProperty('--border', '#374151');
      break;
    case 'ocean':
      root.style.setProperty('--background', '#0f172a');
      root.style.setProperty('--surface', '#1e293b');
      root.style.setProperty('--surface-alt', '#334155');
      root.style.setProperty('--text', '#e2e8f0');
      root.style.setProperty('--accent', '#06b6d4');
      root.style.setProperty('--primary', '#0891b2');
      root.style.setProperty('--secondary', '#0ea5e9');
      root.style.setProperty('--danger', '#ef4444');
      root.style.setProperty('--border', '#475569');
      break;
    default: // dark
      root.style.setProperty('--background', '#23272f');
      root.style.setProperty('--surface', '#2d323c');
      root.style.setProperty('--surface-alt', '#353b47');
      root.style.setProperty('--text', '#f3f3f7');
      root.style.setProperty('--accent', '#8ecae6');
      root.style.setProperty('--primary', '#219ebc');
      root.style.setProperty('--secondary', '#ec4899');
      root.style.setProperty('--danger', '#e63946');
      root.style.setProperty('--border', '#444a57');
      break;
  }
  
  // Save theme preference
  localStorage.setItem('tripEase-theme', theme);
}

onMounted(() => {
  // Load saved theme preference
  const savedTheme = localStorage.getItem('tripEase-theme');
  if (savedTheme) {
    setTheme(savedTheme);
  }
});
</script>

<template>
  <div id="app" class="app-container">
    <header>
      <h1>TripEase</h1>
      <p class="subtitle">Your trips, all in one chic place</p>
      <div class="theme-switcher">
        <button @click="toggleTheme" class="theme-btn">
          {{ currentTheme === 'dark' ? '🌙' : currentTheme === 'light' ? '☀️' : currentTheme === 'purple' ? '🟣' : '🌊' }}
        </button>
        <div v-if="showThemeMenu" class="theme-menu">
          <button @click="setTheme('dark')" class="theme-option" :class="{ active: currentTheme === 'dark' }">
            🌙 Dark
          </button>
          <button @click="setTheme('light')" class="theme-option" :class="{ active: currentTheme === 'light' }">
            ☀️ Light
          </button>
          <button @click="setTheme('purple')" class="theme-option" :class="{ active: currentTheme === 'purple' }">
            🟣 Purple
          </button>
          <button @click="setTheme('ocean')" class="theme-option" :class="{ active: currentTheme === 'ocean' }">
            🌊 Ocean
          </button>
        </div>
      </div>
    </header>
    <main>
      <TripManager />
    </main>
  </div>
</template>

<style>
@import './style.css';

.app-container {
  min-height: 100vh;
  background: var(--background);
  color: var(--text);
  display: flex;
  flex-direction: column;
  align-items: center;
}
header {
  margin-top: 2rem;
  text-align: center;
  width: 100%;
  position: relative;
}
header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: 2px;
}
.subtitle {
  color: var(--accent);
  font-size: 1.1rem;
  margin-top: 0.5rem;
}
main {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
}

/* Theme Switcher Styles */
.theme-switcher {
  position: absolute;
  top: 1rem;
  right: 2rem;
  z-index: 1000;
}

.theme-btn {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-btn:hover {
  background: var(--surface-alt);
  transform: scale(1.1);
}

.theme-menu {
  position: absolute;
  top: 60px;
  right: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 0.5rem;
  min-width: 120px;
  z-index: 1001;
}

.theme-option {
  display: block;
  width: 100%;
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  color: var(--text);
  cursor: pointer;
  text-align: left;
  border-radius: var(--radius);
  transition: background 0.2s;
}

.theme-option:hover {
  background: var(--surface-alt);
}

.theme-option.active {
  background: var(--primary);
  color: white;
}

@media (max-width: 768px) {
  .theme-switcher {
    position: relative;
    top: auto;
    right: auto;
    margin-top: 1rem;
  }
  
  .theme-menu {
    position: absolute;
    top: 60px;
    right: 0;
  }
}
</style>
