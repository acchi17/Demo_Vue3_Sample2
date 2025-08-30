/**
 * Block class
 * Class that inherits from Entry class
 */
import Entry from './Entry';

export default class Block extends Entry {
  /**
   * Constructor
   * @param {string|null} id - Unique ID of the block (auto-generated if null)
   */
  constructor(id = null) {
    super(id);
    this.type = 'block';
  }
}
