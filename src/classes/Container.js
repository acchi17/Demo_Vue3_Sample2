/**
 * Container class
 * Class that inherits from Entry class and corresponds to a lime-colored rectangle
 * Container can contain other entries (Block or Container) inside
 */
import { reactive } from 'vue';
import Entry from './Entry';

export default class Container extends Entry {
  /**
   * Constructor
   * @param {string|null} id - Unique ID of the container (auto-generated if null)
   */
  constructor(id = null) {
    super(id);
    this.type = 'container';  // Container type
    this._children = reactive([]); // Array of child elements
  }

  /**
   * Method to get array of child elements (overrides Entry.getChildren)
   * @returns {Array} Array of child elements
   */
  getChildren() {
    return this._children;
  }
}
