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
}

header h1 {
  color: #42b883;
  margin-bottom: 0.5rem;
}

header p {
  color: #666;
  margin-bottom: 2rem;
}

.status {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1rem 0;
}

.status h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.status ul {
  list-style: none;
  padding: 0;
}

.status li {
  padding: 0.5rem 0;
  font-size: 1.1rem;
}
</style>
