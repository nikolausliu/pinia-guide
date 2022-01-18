import { defineStore } from 'pinia'
export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    double: (state) => state.count * 2,
  },
  actions: {
    increment() {
      this.count++
    },
  },
  persist: {
    enabled: true,
    strategies: [
      {
        storage: localStorage,
        key: 'PINIA_COUNTER',
      },
    ],
  },
})
