<template>
  <div id="app">
    <header>
      <h1>Primeflow - Node Graph Editor</h1>
      <p>Vue 3 + TypeScript + Vite Project Initialized Successfully</p>
    </header>
    <main>
      <div class="status">
        <h2>Project Status</h2>
        <ul>
          <li>✅ Vue 3 with Composition API</li>
          <li>✅ TypeScript support</li>
          <li>✅ Vite build tool</li>
          <li>✅ ESLint & Prettier configured</li>
          <li>✅ Vitest testing framework</li>
        </ul>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// This is a basic Vue 3 component using Composition API with TypeScript
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
