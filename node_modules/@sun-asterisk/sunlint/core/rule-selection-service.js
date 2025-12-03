/**
 * Rule Selection Service
 * Following Rule C005: Single responsibility - only handle rule selection
 * REFACTORED: Now uses SunlintRuleAdapter instead of direct registry access
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const RuleMappingService = require('./rule-mapping-service');
const SunlintRuleAdapter = require('./adapters/sunlint-rule-adapter');

class RuleSelectionService {
  constructor() {
    this.ruleAdapter = SunlintRuleAdapter.getInstance();
    this.ruleMappingService = new RuleMappingService();
    this.initialized = false;
  }

  async initialize() {
    if (!this.initialized) {
      await this.ruleAdapter.initialize();
      this.initialized = true;
    }
  }

  async selectRules(config, options) {
    // Ensure adapter is initialized
    await this.initialize();
    
    const allRules = config.rules || {};
    let selectedRules = [];

    // Determine rule selection strategy
    if (options.rule) {
      selectedRules = [options.rule];
    } else if (options.rules) {
      selectedRules = options.rules.split(',').map(r => r.trim());
    } else if (options.all) {
      // Handle --all shortcut (load from preset file)
      selectedRules = this.loadPresetRules('all');
      
      if (options.verbose) {
        console.log(chalk.blue(`📋 Selected ${selectedRules.length} rules from all preset file`));
      }
    } else if (options.quality) {
      // Handle --quality shortcut (load from preset file)
      selectedRules = this.loadPresetRules('quality');
      
      if (options.verbose) {
        console.log(chalk.blue(`📋 Selected ${selectedRules.length} quality rules from preset file`));
      }
    } else if (options.security) {
      // Handle --security shortcut (load from preset file)
      selectedRules = this.loadPresetRules('security');
      
      if (options.verbose) {
        console.log(chalk.blue(`📋 Selected ${selectedRules.length} security rules from preset file`));
      }
    } else if (options.category) {
      // Handle --category shortcut (standardized approach)
      const categoryRules = this.ruleAdapter.getStandardCategoryRules(options.category);
      selectedRules = categoryRules.map(rule => rule.id);
      
      if (options.verbose) {
        console.log(chalk.blue(`📋 Selected ${selectedRules.length} ${options.category} rules from core files`));
      }
    } else {
      // Default: use config rules or minimal set
      selectedRules = Object.keys(allRules).filter(ruleId => 
        allRules[ruleId] !== 'off' && allRules[ruleId] !== false
      );
      
      if (selectedRules.length === 0) {
        selectedRules = ['C006', 'C019']; // Default minimal set
      }
    }

    // Convert to rule objects
    return selectedRules.map(ruleId => {
      const adapterRule = this.ruleAdapter.getRuleById(ruleId);
      return {
        id: ruleId,
        name: this.getRuleName(ruleId),
        severity: 'warning',
        ...(adapterRule || {})
      };
    }).filter(rule => rule.id);
  }

  getMinimalRuleSet() {
    return {
      rules: {
        'C006': {
          name: 'Function Naming Convention',
          description: 'Function names should follow verb-noun pattern',
          category: 'naming',
          severity: 'warning'
        },
        'C019': {
          name: 'Log Level Usage',
          description: 'Use appropriate log levels',
          category: 'logging',
          severity: 'warning'
        }
      }
    };
  }

  getRulesByCategory(category) {
    // Use adapter to get rules by category
    return this.ruleAdapter.getRulesByCategory(category).map(rule => rule.id);
  }

  getRuleName(ruleId) {
    // Use adapter to get rule name
    const rule = this.ruleAdapter.getRuleById(ruleId);
    return rule ? rule.name : `Rule ${ruleId}`;
  }

  /**
   * Load rules from preset configuration files
   * @param {string} presetName - Name of preset (quality, security, all)
   * @returns {Array} Array of rule IDs
   */
  loadPresetRules(presetName) {
    try {
      const presetPath = path.join(__dirname, '../config/presets', `${presetName}.json`);
      
      if (!fs.existsSync(presetPath)) {
        console.warn(chalk.yellow(`⚠️  Preset file not found: ${presetPath}`));
        return [];
      }

      const presetConfig = JSON.parse(fs.readFileSync(presetPath, 'utf8'));
      const ruleIds = Object.keys(presetConfig.rules || {});
      
      if (ruleIds.length === 0) {
        console.warn(chalk.yellow(`⚠️  No rules found in preset: ${presetName}`));
        return [];
      }

      console.log(chalk.green(`✅ Loaded ${ruleIds.length} rules from ${presetName} preset`));
      return ruleIds;
      
    } catch (error) {
      console.error(chalk.red(`❌ Failed to load preset ${presetName}:`, error.message));
      return [];
    }
  }
}

module.exports = RuleSelectionService;
