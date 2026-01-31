import ScriptExecutionService from '../script_execution/ScriptExecutionService';

/**
 * Entry Execution Service
 * Provides unified interface for executing entries (Block or Container)
 */
export default class EntryExecutionService {
  /**
   * Constructor
   * @param {Object} config Configuration object
   * @param {ExecutionLogService} executionLogService Execution log service instance (optional)
   */
  constructor(config, executionLogService = null) {
    this.scriptExecutionService = new ScriptExecutionService(config.script);
    this.executionLogService = executionLogService;
    this._executionStack = []; // Stack to track currently executing entries
    
    // Centralized management of execution IDs
    this._sessionId = `session_${Date.now()}`;
    this._executionSequence = 0;
  }

  /**
   * Generate a new execution ID
   * @param {string} entryId The ID of the entry being executed
   * @returns {string} Generated execution ID
   * @private
   */
  _generateExecutionId(entryId) {
    this._executionSequence++;
    return `${this._sessionId}_${this._executionSequence}_${entryId}`;
  }

  /**
   * Execute a block entry
   * @param {Block} block Block to execute
   * @return {Promise<ScriptExecutionResult>} 
   *         Execution result object conforming to ScriptExecutionResult type
   * @private
   */
  async _executeBlock(block) {
    let result = {};
    try {
      // Execute script based on block name
      result = await this.scriptExecutionService.executeScript(block.name);
    } catch (error) {
      result.errorMessage = error.message;
    }
    if (result.success === undefined) {
      result.success = false;
    }
    return result;
  }

  /**
   * Execute a container entry
   * @param {Container} container Container to execute
   * @param {string} traceId Trace ID for execution tracking
   * @return {Promise<ScriptExecutionResult>}
   *         Execution result object conforming to ScriptExecutionResult type
   * @private
   */
  async _executeContainer(container, traceId) {
    let result = {};
    const childResults = [];
    try {
      // Execute child entries sequentially
      for (const childEntry of container.children) {
          const childResult = await this.executeEntry(childEntry, traceId);
          childResults.push(childResult);
      }
      result.success = childResults.every(childResult => childResult.success === true);
    } catch (error) {
      result.errorMessage = error.message;
    }
    if (result.success === undefined) {
      result.success = false;
    }
    return result;
  }

  /**
   * Check if any entry is currently executing
   * @return {boolean} True if an entry is executing, false otherwise
   */
  isExecuting() {
    return this._executionStack.length > 0;
  }

  /**
   * Execute an entry
   * @param {Entry} entry Entry to execute (Block or Container)
   * @param {string} traceId Trace ID for execution tracking (optional)
   * @return {Promise<*>} Execution result
   */
  async executeEntry(entry, traceId = null) {
    let result = {};
    try {
      // Push entry ID onto the stack when execution starts
      this._executionStack.push(entry.id);
      // Generate execution ID
      const executionId = this._generateExecutionId(entry.id);
      // Log execution start if execution log service is available
      if (this.executionLogService) {
        this.executionLogService.addLog(entry, executionId, traceId);
      }
      // Execute an entry
      if (entry.type === 'block') {
        result = await this._executeBlock(entry);
      } else if (entry.type === 'container') {
        result = await this._executeContainer(entry, executionId);
      }
      // Log execution result if execution log service is available
      if (this.executionLogService) {
        this.executionLogService.updateLog(executionId, result);
      }
    } catch (error) {
      console.log(error.message);
    } finally {
      // Pop entry ID from stack when execution ends
      this._executionStack.pop();
    }
    return result;
  }

  /**
   * Terminate the service
   * Performs cleanup operations for ScriptExecutionService
   */
  terminate() {   
    if (this.scriptExecutionService) {
      this.scriptExecutionService.terminate();
    }
    this._executionStack = [];
  }
}
