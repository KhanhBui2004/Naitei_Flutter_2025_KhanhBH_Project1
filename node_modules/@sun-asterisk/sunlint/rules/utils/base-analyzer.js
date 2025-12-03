/**
 * Base Analyzer Class for SunLint Rules
 * Provides common functionality and consistent severity management
 */

const { getSeverity, isValidSeverity } = require('./severity-constants');

class BaseAnalyzer {
  constructor(ruleId, ruleName, description, category = 'QUALITY') {
    this.ruleId = ruleId;
    this.ruleName = ruleName;
    this.description = description;
    this.category = category;
    
    // Severity will be determined dynamically
    this._severity = null;
  }
  
  /**
   * Get severity for this rule, considering config overrides
   * @param {Object} config - Configuration object
   * @returns {string} Severity level
   */
  getSeverity(config = {}) {
    // Check if already cached
    if (this._severity) {
      return this._severity;
    }
    
    // Get from config override
    const configOverride = config?.rules?.[this.ruleId]?.severity || 
                          config?.rules?.[this.ruleId];
    
    this._severity = getSeverity(this.ruleId, this.category, configOverride);
    return this._severity;
  }
  
  /**
   * Set severity (for backward compatibility or testing)
   * @param {string} severity - Severity level
   */
  setSeverity(severity) {
    if (!isValidSeverity(severity)) {
      console.warn(`Invalid severity '${severity}' for rule ${this.ruleId}. Using default.`);
      return;
    }
    this._severity = severity;
  }
  
  /**
   * Create a violation object with consistent structure
   * @param {Object} params - Violation parameters
   * @returns {Object} Formatted violation
   */
  createViolation(params) {
    const {
      filePath,
      line,
      column,
      message,
      source,
      suggestion,
      additionalData = {}
    } = params;
    
    return {
      ruleId: this.ruleId,
      severity: this._severity || this.getSeverity(),
      message: message || this.description,
      filePath,
      line,
      column,
      source,
      suggestion,
      category: this.category,
      ...additionalData
    };
  }
  
  /**
   * Check if rule is enabled based on severity
   * @param {Object} config - Configuration
   * @returns {boolean} True if rule should run
   */
  isEnabled(config = {}) {
    const severity = this.getSeverity(config);
    return severity !== 'off';
  }
  
  /**
   * Abstract analyze method - must be implemented by subclasses
   */
  async analyze(files, language, config) {
    throw new Error(`analyze() method must be implemented by ${this.constructor.name}`);
  }
}

module.exports = BaseAnalyzer;
