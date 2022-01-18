import { createPinia } from 'pinia'
import piniaPersist from './plugins/piniaPersist'

export const pinia = createPinia()
pinia.use(piniaPersist)
