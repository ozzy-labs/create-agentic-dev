<script setup lang="ts">
import { APP_NAME } from "../index.js";
</script>

<template>
  <main class="main">
    <h1>{{ APP_NAME }}</h1>
    <p>Edit src/pages/index.vue and save to see changes.</p>
  </main>
</template>

<style scoped>
.main {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
}
</style>
