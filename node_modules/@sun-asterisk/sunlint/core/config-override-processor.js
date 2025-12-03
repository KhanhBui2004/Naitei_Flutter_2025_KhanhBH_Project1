/**
 * Handles configuration file overrides based on file patterns
 * Rule C005: Single responsibility - chỉ xử lý overrides theo file patterns
 * Rule C015: Domain language - ConfigOverrideProcessor
 */
class ConfigOverrideProcessor {

  constructor() {
    // Rule C014: Dependency injection for minimatch
    this.minimatch = require('minimatch');
  }

  /**
   * Rule C006: applyFileOverrides - verb-noun naming
   * Rule C012: Pure function with clear input/output
   */
  applyFileOverrides(config, filePath) {
    if (!config.overrides || config.overrides.length === 0) {
      return config;
    }

    let fileConfig = { ...config };

    for (const override of config.overrides) {
      if (this.shouldApplyOverride(override, filePath)) {
        fileConfig = this.applyOverride(fileConfig, override);
      }
    }

    return fileConfig;
  }

  /**
   * Rule C006: shouldApplyOverride - verb-noun naming
   * Rule C005: Single responsibility check
   * Rule C012: Pure function - query operation
   */
  shouldApplyOverride(override, filePath) {
    const { files } = override;
    
    if (!files || !Array.isArray(files)) {
      return false;
    }

    return files.some(pattern => this.minimatch(filePath, pattern));
  }

  /**
   * Rule C006: applyOverride - verb-noun naming
   * Rule C005: Single responsibility application
   */
  applyOverride(fileConfig, override) {
    const { files, rules, ...otherSettings } = override;
    const updatedConfig = { ...fileConfig };

    // Apply rule overrides
    if (rules) {
      updatedConfig.rules = { ...updatedConfig.rules, ...rules };
    }
    
    // Apply other setting overrides
    for (const [key, value] of Object.entries(otherSettings)) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        updatedConfig[key] = { ...updatedConfig[key], ...value };
      } else {
        updatedConfig[key] = value;
      }
    }

    return updatedConfig;
  }
}

module.exports = ConfigOverrideProcessor;
