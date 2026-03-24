<script setup lang="ts">
import { APP_NAME } from "./index.js";
</script>

<template>
  <main>
    <h1>{{ APP_NAME }}</h1>
    <p>Edit src/App.vue and save to reload.</p>
  </main>
</template>

<style scoped>
:root {
  font-family:
    Inter,
    system-ui,
    Avenir,
    Helvetica,
    Arial,
    sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color: #213547;
  background-color: #ffffff;
}

main {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}
</style>
