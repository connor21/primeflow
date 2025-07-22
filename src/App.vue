<template>
  <div id="app">
    <DemoApp />
  </div>
</template>

<script setup lang="ts">
import DemoApp from './examples/DemoApp.vue'
</script>

<style scoped>
#app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
}

header h1 {
  color: var(--accent-primary);
  margin-bottom: 0.5rem;
}

header p {
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.status {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1rem 0;
}

.status h2 {
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.status ul {
  list-style: none;
  padding: 0;
}

.status li {
  padding: 0.5rem 0;
  font-size: 1.1rem;
  color: var(--text-primary);
}
</style>
