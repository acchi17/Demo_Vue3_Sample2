import { createApp } from 'vue'
import App from './App.vue'
import EntryManager from './classes/EntryManager'

const app = createApp(App)

// Provide EntryManager as a provider
const entryManager = new EntryManager()
app.provide('entryManager', entryManager)

app.mount('#app')
