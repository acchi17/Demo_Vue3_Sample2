import { reactive } from 'vue'

/**
 * EntryParamManager class
 * Class that manages parameter values of entries
 * Manages input and output parameters separately using two different maps
 */
export default class EntryParamManager {
  constructor() {
    // Dictionary of entry IDs and their input parameters
    this._inputParamsMap = new Map(); // entryId -> inputs
    // Dictionary of entry IDs and their output parameters (reactive for UI updates)
    this._outputParamsMap = reactive({}); // entryId -> outputs
  }

  /**
   * Get a specific input parameter value
   * @param {string} entryId - ID of the entry
   * @param {string} paramName - Name of the parameter
   * @returns {any} Parameter value or undefined
   */
  getInputParam(entryId, paramName) {
    const params = this._inputParamsMap.get(entryId);
    return params ? params[paramName] : undefined;
  }
  
  /**
   * Get a specific output parameter value
   * @param {string} entryId - ID of the entry
   * @param {string} paramName - Name of the parameter
   * @returns {any} Parameter value or undefined
   */
  getOutputParam(entryId, paramName) {
    const params = this._outputParamsMap[entryId];
    return params ? params[paramName] : undefined;
  }

  /**
   * Get input parameters for an entry
   * @param {string} entryId - ID of the entry
   * @returns {Object} Input parameters object
   */
  getInputParams(entryId) {
    return this._inputParamsMap.get(entryId) || {};
  }
  
  /**
   * Get output parameters for an entry
   * @param {string} entryId - ID of the entry
   * @returns {Object} Output parameters object
   */
  getOutputParams(entryId) {
    return this._outputParamsMap[entryId] || {};
  }

  /**
   * Get input parameter names for an entry
   * @param {string} entryId - ID of the entry
   * @returns {string[]} Array of input parameter names
   */
  getInputParamNames(entryId) {
    return Object.keys(this._inputParamsMap.get(entryId) || {});
  }

  /**
   * Get output parameter names for an entry
   * @param {string} entryId - ID of the entry
   * @returns {string[]} Array of output parameter names
   */
  getOutputParamNames(entryId) {
    return Object.keys(this._outputParamsMap[entryId] || {});
  }

  /**
   * Set entry input parameters by entry ID
   * Associates the entry ID with input parameters
   * @param {string} entryId - ID of the entry
   * @param {Object} inputParams - Input parameters to set
   * @returns {boolean} Whether the operation was successful
   */
  setInputParams(entryId, inputParams = {}) {
    if (!entryId) return false;
    
    // Set input parameters to the map
    this._inputParamsMap.set(entryId, inputParams);
    
    return true;
  }

  /**
   * Set entry output parameters by entry ID
   * Associates the entry ID with output parameters
   * @param {string} entryId - ID of the entry
   * @param {Object} outputParams - Output parameters to set
   * @returns {boolean} Whether the operation was successful
   */
  setOutputParams(entryId, outputParams = {}) {
    if (!entryId) return false;

    // Set output parameters to the reactive map
    this._outputParamsMap[entryId] = outputParams;

    return true;
  }

  /**
   * Set a single input parameter
   * @param {string} entryId - ID of the entry
   * @param {string} paramName - Name of the input parameter to set
   * @param {any} value - New value
   * @returns {boolean} Whether the operation was successful
   */
  setInputParam(entryId, paramName, value) {
    if (!entryId || !paramName) return false;
    
    // Create entry in map if it doesn't exist
    if (!this._inputParamsMap.has(entryId)) {
      this._inputParamsMap.set(entryId, {});
    }
    
    const params = this._inputParamsMap.get(entryId);
    params[paramName] = value;
    
    return true;
  }
  
  /**
   * Set a single output parameter
   * @param {string} entryId - ID of the entry
   * @param {string} paramName - Name of the output parameter to set
   * @param {any} value - New value
   * @returns {boolean} Whether the operation was successful
   */
  setOutputParam(entryId, paramName, value) {
    if (!entryId || !paramName) return false;

    // Create entry in reactive map if it doesn't exist
    if (!this._outputParamsMap[entryId]) {
      this._outputParamsMap[entryId] = {};
    }

    this._outputParamsMap[entryId][paramName] = value;

    return true;
  }
  
  /**
   * Remove all parameter data for an entry
   * @param {string} entryId - ID of the entry
   * @returns {boolean} Whether the removal was successful
   */
  removeParams(entryId) {
    if (!entryId) return false;

    // Remove parameter values from both maps
    this._inputParamsMap.delete(entryId);
    delete this._outputParamsMap[entryId];

    return true;
  }  
}
