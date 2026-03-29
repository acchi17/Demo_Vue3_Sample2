import { createApp } from 'vue'
import App from './App.vue'
import appConfig from './config/app-config'
import EntryManager from './classes/EntryManager'
import EntryParamManager from './classes/EntryParamManager'
import FileService from './services/file/FileService'
import EntryExecutionService from './services/entry_execution/EntryExecutionService'
import ExecutionLogService from './services/log/ExecutionLogService'
import EntryDefinitionService from './services/entry_definition/EntryDefinitionService'
import './assets/styles/variables.css'

const app = createApp(App)

// Create Managers
const entryManager = new EntryManager()
const entryParamManager = new EntryParamManager()

// Create Services
const fileService = new FileService()
const executionLogService = new ExecutionLogService()
const entryExecutionService = new EntryExecutionService(appConfig, executionLogService)
const entryDefinitionService = new EntryDefinitionService(appConfig, fileService)

// Provide
app.provide('entryManager', entryManager)
app.provide('entryParamManager', entryParamManager)
app.provide('fileService', fileService)
app.provide('executionLogService', executionLogService)
app.provide('entryExecutionService', entryExecutionService)
app.provide('entryDefinitionService', entryDefinitionService)

app.mount('#app')
