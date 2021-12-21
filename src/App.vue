<template>
  <div>counter: {{ counterStore.count }}</div>
  <div>double: {{ counterStore.double }}</div>
  <button @click="counterStore.increment">+</button>
</template>

<script setup lang="ts">
import { useCounterStore } from './store/modules/counter'
const counterStore = useCounterStore()
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
