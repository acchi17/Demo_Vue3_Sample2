/**
 * EntryDefinitionService
 * Provides block definitions and category information loaded from JSON file
 */
export default class EntryDefinitionService {
  /**
   * Constructor
   * @param {Object} config Configuration object
   * @param {FileService} fileService File I/O service instance
   */
  constructor(config, fileService) {
    this.config = config;
    this.fileService = fileService;
    this.blockCategories = [];
    this.blockDefinitions = {};
  }

  /**
   * Load block definitions from JSON file
   * @return {Promise<Object>} Promise resolving to block definitions and category information
   */
  async loadBlockDefinitions() {
    // Initialize
    this.blockCategories = [];
    this.blockDefinitions = {};
    try {
      // Read JSON file
      const data = await this.fileService.readJsonFile(this.config.block.definitionsFile);
      // Process block categories and block definitions from JSON data
      if (Array.isArray(data && data.categories)) {
        data.categories.forEach(category => {
          const categoryInfo = {
            name: category.name,
            blocks: []
          };
          if (category.blocks && Array.isArray(category.blocks)) {
            category.blocks.forEach(block => {
              const blockName = block.name;
              categoryInfo.blocks.push(blockName);
              const blockDef = {
                name: blockName,
                category: category.name,
                command: block.command || '',
                parameters: {
                  input: [],
                  output: []
                }
              };
              if (block.parameters && Array.isArray(block.parameters)) {
                block.parameters.forEach(param => {
                  const paramDef = {
                    name: param.name,
                    dataType: param.dataType,
                    ctrlType: param.ctrlType,
                    default: param.default,
                    min: param.min,
                    max: param.max,
                    step: param.step,
                    items: param.items || []
                  };
                  if (param.prmType === 'input') {
                    blockDef.parameters.input.push(paramDef);
                  } else if (param.prmType === 'output') {
                    blockDef.parameters.output.push(paramDef);
                  }
                });
              }
              // Add block definition
              this.blockDefinitions[blockName] = blockDef;
            });
          }
          // Add block category
          this.blockCategories.push(categoryInfo);
        });
      }
      return {
        blockDefinitions: this.blockDefinitions,
        blockCategories: this.blockCategories
      };
    } catch (error) {
      console.error(`[${this.constructor.name}] loadBlockDefinitions() failed: ${error.message}`);
    }
  }

  /**
   * Get all categories
   * @return {Array} Array of categories
   */
  getCategories() {
    return this.categories;
  }

  /**
   * Get list of blocks in specified category
   * @param {string} categoryName - Category name
   * @return {Array} Array of block names
   */
  getBlocksByCategory(categoryName) {
    const category = this.categories.find(cat => cat.name === categoryName);
    return category ? category.blocks : [];
  }

  /**
   * Get default parameters for a block
   * @param {string} blockName - Block name
   * @return {Object} Object containing default input and output parameter values
   */
  getBlockDefaultParams(blockName) {
    const blockDef = this.blockDefinitions[blockName];
    if (!blockDef) return { input: {}, output: {} };
    
    const input = {};
    const output = {};
    
    blockDef.parameters.input.forEach(param => {
      input[param.name] = param.default !== undefined ? param.default : null;
    });
    
    blockDef.parameters.output.forEach(param => {
      output[param.name] = param.default !== undefined ? param.default : null;
    });
    
    return { input, output };
  }
}
