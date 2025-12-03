const fs = require('fs');
const path = require('path');

/**
 * Handles loading and resolving configuration presets
 * Rule C005: Single responsibility - chỉ xử lý presets
 * Rule C015: Domain language - ConfigPresetResolver
 */
class ConfigPresetResolver {
  constructor() {
    this.presetMap = {
      '@sun/sunlint/recommended': 'config/presets/recommended.json',
      '@sun/sunlint/security': 'config/presets/security.json',
      '@sun/sunlint/quality': 'config/presets/quality.json',
      '@sun/sunlint/beginner': 'config/presets/beginner.json',
      '@sun/sunlint/ci': 'config/presets/ci.json',
      '@sun/sunlint/strict': 'config/presets/strict.json',
      '@sun/sunlint/maintainability': 'config/presets/maintainability.json',
      '@sun/sunlint/performance': 'config/presets/performance.json',
      '@sun/sunlint/all': 'config/presets/all.json'
    };
  }

  /**
   * Rule C006: loadPresetConfiguration - verb-noun naming
   */
  async loadPresetConfiguration(presetName) {
    const presetPath = this.presetMap[presetName];
    if (!presetPath) {
      throw new Error(`Unknown preset: ${presetName}`);
    }

    const fullPath = path.join(__dirname, '..', presetPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Preset file not found: ${fullPath}`);
    }

    try {
      const presetConfig = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      return presetConfig;
    } catch (error) {
      throw new Error(`Failed to load preset ${presetName}: ${error.message}`);
    }
  }

  /**
   * Rule C006: resolvePresetFromRegistry - verb-noun naming
   */
  resolvePresetFromRegistry(presetName, rulesRegistry) {
    const preset = rulesRegistry.presets[presetName];
    if (!preset) {
      throw new Error(`Preset '${presetName}' not found`);
    }

    return {
      rules: preset.rules,
      output: { format: 'eslint', console: true, summary: true },
      performance: { maxConcurrentRules: 5, timeoutMs: 30000 }
    };
  }

  /**
   * Rule C006: checkPresetExists - verb-noun naming
   */
  checkPresetExists(presetName) {
    return this.presetMap.hasOwnProperty(presetName);
  }
}

module.exports = ConfigPresetResolver;
