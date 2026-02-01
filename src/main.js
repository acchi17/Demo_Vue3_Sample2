import { createApp } from 'vue'
import App from './App.vue'
import appConfig from './config/app-config'
import EntryManager from './classes/EntryManager'
import EntryExecutionService from './services/entry_execution/EntryExecutionService'
import ExecutionLogService from './services/log/ExecutionLogService'

// Import CSS variables
import './assets/styles/variables.css'

const app = createApp(App)

// Provide EntryManager, ExecutionLogService, EntryExecutionService
const entryManager = new EntryManager()
app.provide('entryManager', entryManager)
const executionLogService = new ExecutionLogService()
app.provide('executionLogService', executionLogService)
const entryExecutionService = new EntryExecutionService(appConfig, executionLogService)
app.provide('entryExecutionService', entryExecutionService)

app.mount('#app')
