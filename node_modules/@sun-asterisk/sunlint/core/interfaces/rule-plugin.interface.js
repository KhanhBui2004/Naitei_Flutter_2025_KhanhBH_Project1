/**
 * Rule Plugin Interface
 * Defines the contract for all rule plugins in SunLint
 * Following Rule C014: Dependency injection - Plugin interface
 */

class RulePluginInterface {
  constructor(ruleId, metadata = {}) {
    if (this.constructor === RulePluginInterface) {
      throw new Error('RulePluginInterface is abstract and cannot be instantiated');
    }
    
    this.ruleId = ruleId;
    this.metadata = {
      name: metadata.name || ruleId,
      description: metadata.description || '',
      category: metadata.category || 'custom',
      severity: metadata.severity || 'warning',
      languages: metadata.languages || ['javascript', 'typescript'],
      version: metadata.version || '1.0.0',
      author: metadata.author || '',
      tags: metadata.tags || [],
      ...metadata
    };
  }

  /**
   * Initialize the rule plugin
   * @param {Object} config - Rule configuration
   * @returns {Promise<void>}
   */
  async initialize(config = {}) {
    throw new Error('initialize() must be implemented by rule plugin');
  }

  /**
   * Analyze files for violations
   * @param {string[]} files - Files to analyze
   * @param {string} language - Programming language
   * @param {Object} options - Analysis options
   * @returns {Promise<Object[]>} Array of violations
   */
  async analyze(files, language, options = {}) {
    throw new Error('analyze() must be implemented by rule plugin');
  }

  /**
   * Get rule metadata
   * @returns {Object} Rule metadata
   */
  getMetadata() {
    return this.metadata;
  }

  /**
   * Check if rule supports a language
   * @param {string} language - Language to check
   * @returns {boolean} True if supported
   */
  supportsLanguage(language) {
    return this.metadata.languages.includes(language) ||
           this.metadata.languages.includes('all');
  }

  /**
   * Validate rule configuration
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result
   */
  validateConfig(config) {
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }

  /**
   * Get rule documentation
   * @returns {Object} Documentation object
   */
  getDocumentation() {
    return {
      name: this.metadata.name,
      description: this.metadata.description,
      examples: [],
      configuration: {},
      links: []
    };
  }

  /**
   * Cleanup rule resources
   * @returns {Promise<void>}
   */
  async cleanup() {
    // Default implementation - can be overridden
  }
}

/**
 * Semantic Rule Interface
 * For rules that use symbol table and semantic analysis
 */
class SemanticRuleInterface extends RulePluginInterface {
  constructor(ruleId, metadata = {}) {
    super(ruleId, { ...metadata, type: 'semantic' });
    this.semanticEngine = null;
    this.violations = [];
  }

  /**
   * Initialize with semantic engine
   * @param {Object} semanticEngine - Semantic analysis engine
   */
  initializeSemanticEngine(semanticEngine) {
    this.semanticEngine = semanticEngine;
  }

  /**
   * Analyze a single file using semantic analysis
   * @param {string} filePath - File to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<void>}
   */
  async analyzeFile(filePath, options = {}) {
    throw new Error('analyzeFile() must be implemented by semantic rule');
  }

  /**
   * Get violations found during analysis
   * @returns {Object[]} Array of violations
   */
  getViolations() {
    return this.violations;
  }

  /**
   * Clear violations for next analysis
   */
  clearViolations() {
    this.violations = [];
  }

  /**
   * Add a violation
   * @param {Object} violation - Violation object
   */
  addViolation(violation) {
    this.violations.push({
      ruleId: this.ruleId,
      severity: this.metadata.severity,
      ...violation
    });
  }
}

/**
 * Custom Rule Interface
 * For user-defined custom rules
 */
class CustomRuleInterface extends RulePluginInterface {
  constructor(ruleId, metadata = {}) {
    super(ruleId, { ...metadata, type: 'custom', source: 'user' });
    this.configSchema = null;
  }

  /**
   * Set configuration schema for validation
   * @param {Object} schema - JSON schema for configuration
   */
  setConfigSchema(schema) {
    this.configSchema = schema;
  }

  /**
   * Validate configuration against schema
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result
   */
  validateConfig(config) {
    if (!this.configSchema) {
      return super.validateConfig(config);
    }

    // TODO: Implement JSON schema validation
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }

  /**
   * Register custom helper methods
   * @param {Object} helpers - Helper methods
   */
  registerHelpers(helpers) {
    this.helpers = helpers;
  }
}

module.exports = {
  RulePluginInterface,
  SemanticRuleInterface,
  CustomRuleInterface
};
