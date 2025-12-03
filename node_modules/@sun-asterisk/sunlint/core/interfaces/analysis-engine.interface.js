/**
 * Analysis Engine Interface
 * Following Rule C014: Dependency Injection interface
 * Following Rule C015: Use domain language - clear interface naming
 */

class AnalysisEngineInterface {
  /**
   * Constructor for Analysis Engine
   * @param {string} id - Engine ID (e.g., 'eslint', 'heuristic', 'openai')
   * @param {string} version - Engine version
   * @param {string[]} supportedLanguages - Array of supported languages
   */
  constructor(id, version, supportedLanguages = []) {
    this.id = id;
    this.version = version;
    this.supportedLanguages = supportedLanguages;
    this.initialized = false;
  }

  /**
   * Initialize the analysis engine
   * Following Rule C006: Verb-noun naming
   * @param {Object} config - Engine-specific configuration
   * @returns {Promise<void>}
   */
  async initialize(config) {
    throw new Error(`Method initialize() must be implemented by ${this.constructor.name}`);
  }

  /**
   * Analyze files with given rules
   * Following Rule C006: Verb-noun naming
   * @param {string[]} files - Array of file paths to analyze
   * @param {Object[]} rules - Array of rule objects to apply
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis results
   */
  async analyze(files, rules, options) {
    throw new Error(`Method analyze() must be implemented by ${this.constructor.name}`);
  }

  /**
   * Get supported rules for this engine
   * Following Rule C006: Verb-noun naming
   * @returns {string[]} Array of supported rule IDs
   */
  getSupportedRules() {
    throw new Error(`Method getSupportedRules() must be implemented by ${this.constructor.name}`);
  }

  /**
   * Check if a specific rule is supported
   * Following Rule C006: Verb-noun naming
   * @param {string} ruleId - Rule ID to check
   * @returns {boolean} True if rule is supported
   */
  isRuleSupported(ruleId) {
    return this.getSupportedRules().includes(ruleId);
  }

  /**
   * Check if a language is supported
   * Following Rule C006: Verb-noun naming
   * @param {string} language - Language to check
   * @returns {boolean} True if language is supported
   */
  isLanguageSupported(language) {
    return this.supportedLanguages.includes(language) || 
           this.supportedLanguages.includes('all') ||
           this.supportedLanguages.length === 0;
  }

  /**
   * Get engine metadata
   * Following Rule C006: Verb-noun naming
   * @returns {Object} Engine metadata
   */
  getEngineInfo() {
    return {
      name: this.name,
      version: this.version,
      supportedLanguages: this.supportedLanguages,
      supportedRules: this.getSupportedRules(),
      initialized: this.initialized
    };
  }

  /**
   * Cleanup engine resources
   * Following Rule C006: Verb-noun naming
   * @returns {Promise<void>}
   */
  async cleanup() {
    // Default implementation - engines can override if needed
    this.initialized = false;
  }
}

module.exports = AnalysisEngineInterface;
