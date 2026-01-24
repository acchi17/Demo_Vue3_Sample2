import ScriptExecutionFactory from './ScriptExecutionFactory';

/**
 * Script Execution Service
 * Unified interface for script execution
 */
export default class ScriptExecutionService {
  /**
   * Constructor
   * @param {Object} configScript Script configuration object (optional)
   */
  constructor(configScript) {   
    this.engineName = configScript?.engineName || 'javascript';
    this.scriptsDir = configScript?.scriptsDir || '';
    
    // Create engine instance using factory
    this.scriptExecutionEngine = ScriptExecutionFactory.createEngine(
      this.engineName,
      this.scriptsDir
    );
  }
  
  /**
   * Execute script
   * @param {string} scriptName Script file name
   * @param {Object} inputParams Input parameters (optional)
   * @return {Promise<Object>} Execution result object
   */
  async executeScript(scriptName = '', inputParams = {}) {
    try {
      return await this.scriptExecutionEngine.executeScript(scriptName, inputParams);
    } catch (error) {
      console.log(`[${this.constructor.name}] executeScript() failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Service termination process
   */
  terminate() {
    if (this.scriptExecutionEngine) {
      this.scriptExecutionEngine.terminate();
    }
  }
}
