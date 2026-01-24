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
   * Script execution result type definition
   * @typedef {Object} ScriptExecutionResult
   * @property {boolean} success Execution success flag (required)
   * @property {string} errorMessage Error message when error occurs
   * @property {number} executionTime Execution time (milliseconds)
   *
   * In addition to the standard properties above, this object may include
   * arbitrary additional data returned by the executed script. The property names
   * and structure of additional data vary depending on the script implementation.
   */
  /**
   * Normalize execution result
   * @param {Object} result Execution result object
   * @param {Object} [options] Additional options to override result properties
   * @param {boolean} [options.success] Override success flag
   * @param {string} [options.errorMessage] Override error message
   * @param {Array} [options.childResults] Array of child execution results
   * @returns {ScriptExecutionResult} Normalized execution result object
   */
  _normalizeResult(result = {}, options = {}) {
    const newResult = result;

    try {
      // Apply success flag from options or use default logic
      if (options.success !== undefined) {
        newResult.success = options.success;
      } else if (newResult.success === undefined) {
        // If childResults exists, determine success based on child results
        if (options.childResults) {
          // every() returns true for empty arrays, all child results must succeed otherwise
          newResult.success = options.childResults.every(childResult => childResult.success === true);
        } else {
          newResult.success = false;
        }
      }
      // Apply error message from options or use default logic
      if (options.errorMessage !== undefined) {
        newResult.errorMessage = options.errorMessage;
      } else if (newResult.errorMessage === undefined) {
        if (newResult.success === true) {
          newResult.errorMessage = '';
        } else {
          newResult.errorMessage = 'Unknown error occurred.';
        }
      }
    } catch (error) {
      newResult.success = false;
      newResult.errorMessage = error.message;
    }
    return newResult;
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
    const options = {};

    try {
      // Execute script based on block name
      result = await this.scriptExecutionService.executeScript(block.name);
    } catch (error) {
      options.errorMessage = error.message;
    }
    return this._normalizeResult(result, options);
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
    const options = {};
    const childResults = [];
    
    try {
      // Execute child entries sequentially
      for (const childEntry of container.children) {
          const childResult = await this.executeEntry(childEntry, traceId);
          childResults.push(childResult);
      }
      options.childResults = childResults;
    } catch (error) {
      options.errorMessage = error.message;
    }
    return this._normalizeResult(result, options);
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
