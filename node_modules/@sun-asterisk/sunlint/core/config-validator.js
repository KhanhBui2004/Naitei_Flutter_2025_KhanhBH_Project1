/**
 * Handles configuration validation and rule value normalization
 * Rule C005: Single responsibility - chỉ validation và normalization
 * Rule C015: Domain language - ConfigValidator
 * Rule C031: Validation logic tách riêng
 */
class ConfigValidator {

  constructor() {
    this.validFormats = ['eslint', 'json', 'summary', 'table'];
    this.validRuleValues = ['error', 'warning', 'info', 'warn', 'off', true, false, 0, 1, 2];
    this.ruleValueMapping = {
      0: 'off',
      1: 'warning', 
      2: 'error',
      'warn': 'warning',
      true: 'warning',
      false: 'off'
    };
  }

  /**
   * Rule C006: validateConfiguration - verb-noun naming
   * Rule C031: Main validation method
   */
  validateConfiguration(config) {
    this.validateRulesSection(config.rules);
    this.validateLanguagesSection(config.languages);
    this.validateIncludeExcludePatterns(config.include, config.exclude);
    this.validateOutputFormat(config.output);
    this.validateRuleValues(config.rules);
  }

  /**
   * Rule C006: validateRulesSection - verb-noun naming
   * Rule C031: Specific validation logic
   */
  validateRulesSection(rules) {
    if (rules && typeof rules !== 'object') {
      throw new Error('Config error: rules must be an object');
    }
  }

  /**
   * Rule C006: validateLanguagesSection - verb-noun naming
   * Rule C031: Specific validation logic
   */
  validateLanguagesSection(languages) {
    if (languages && !Array.isArray(languages) && typeof languages !== 'object') {
      throw new Error('Config error: languages must be an array or object');
    }
  }

  /**
   * Rule C006: validateIncludeExcludePatterns - verb-noun naming
   * Rule C031: Specific validation logic
   */
  validateIncludeExcludePatterns(include, exclude) {
    if (include && !Array.isArray(include)) {
      throw new Error('Config error: include must be an array');
    }

    if (exclude && !Array.isArray(exclude)) {
      throw new Error('Config error: exclude must be an array');
    }
  }

  /**
   * Rule C006: validateOutputFormat - verb-noun naming
   * Rule C031: Specific validation logic
   */
  validateOutputFormat(output) {
    if (output && output.format && !this.validFormats.includes(output.format)) {
      throw new Error(`Config error: invalid output format '${output.format}'. Valid formats: ${this.validFormats.join(', ')}`);
    }
  }

  /**
   * Rule C006: validateRuleValues - verb-noun naming
   * Rule C031: Specific validation logic
   */
  validateRuleValues(rules) {
    if (!rules) return;

    for (const [ruleId, ruleValue] of Object.entries(rules)) {
      if (!this.validRuleValues.includes(ruleValue)) {
        throw new Error(`Config error: invalid value '${ruleValue}' for rule '${ruleId}'. Valid values: ${this.validRuleValues.join(', ')}`);
      }
    }
  }

  /**
   * Rule C006: normalizeRuleValue - verb-noun naming
   * Rule C012: Pure function - no side effects
   */
  normalizeRuleValue(value) {
    return this.ruleValueMapping[value] || value;
  }

  /**
   * Rule C006: getEffectiveRuleConfiguration - verb-noun naming
   * Rule C014: Accept rulesRegistry as dependency injection
   */
  getEffectiveRuleConfiguration(ruleId, config, rulesRegistry) {
    // Check direct rule configuration
    if (config.rules && config.rules[ruleId] !== undefined) {
      return this.normalizeRuleValue(config.rules[ruleId]);
    }

    // Check category configuration
    const rule = rulesRegistry.rules[ruleId];
    
    if (rule && config.categories && config.categories[rule.category] !== undefined) {
      return this.normalizeRuleValue(config.categories[rule.category]);
    }

    // Use rule default
    if (rule) {
      return this.normalizeRuleValue(rule.severity);
    }

    return 'off';
  }
}

module.exports = ConfigValidator;
