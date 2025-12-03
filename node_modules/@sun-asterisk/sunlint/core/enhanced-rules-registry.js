/**
 * Enhanced Rules Registry
 * Following Rule C005: Single responsibility - registry management
 * Following Rule C015: Use domain language - clear registry terms
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class EnhancedRulesRegistry {
  constructor() {
    this.rulesRegistry = {};
    this.enginePreferences = new Map();
    this.ruleAnalyzers = new Map();
    this.aiContexts = {};
  }

  /**
   * Load enhanced rules registry
   * Following Rule C006: Verb-noun naming
   * @param {Object} options - Options including verbose flag
   */
  async loadRegistry(options = {}) {
    try {
      // Load base rules registry
      await this.loadBaseRulesRegistry(options);
      
      // Load AI contexts
      await this.loadAIContexts(options);
      
      // Load engine preferences
      await this.loadEnginePreferences(options);
      
      // Scan for existing analyzers
      await this.scanExistingAnalyzers(options);
      
      if (options.verbose) {
      if (options.verbose) {
        console.log(chalk.green(`📋 Enhanced registry loaded: ${Object.keys(this.rulesRegistry).length} rules`));
      }
      }
      
    } catch (error) {
      console.error('Failed to load enhanced rules registry:', error.message);
      throw error;
    }
  }

  /**
   * Load base rules registry
   * Following Rule C006: Verb-noun naming
   */
  async loadBaseRulesRegistry(options = {}) {
    const registryPath = path.resolve(__dirname, '../config/rules/rules-registry.json');
    
    if (fs.existsSync(registryPath)) {
      const registry = require(registryPath);
      this.rulesRegistry = registry.rules || {};
      if (options.verbose) {
        console.log(chalk.blue(`📋 Loaded ${Object.keys(this.rulesRegistry).length} base rules`));
      }
    } else {
      console.warn('⚠️ Base rules registry not found at', registryPath);
      this.rulesRegistry = {};
    }
  }

  /**
   * Load AI contexts
   * Following Rule C006: Verb-noun naming
   */
  async loadAIContexts(options = {}) {
    const contextsPath = path.resolve(__dirname, '../config/defaults/ai-rules-context.json');
    
    if (fs.existsSync(contextsPath)) {
      const contexts = require(contextsPath);
      this.aiContexts = contexts.contexts || {};
      if (options.verbose) {
        console.log(chalk.blue(`🤖 Loaded ${Object.keys(this.aiContexts).length} AI contexts`));
      }
    } else {
      console.warn('⚠️ AI contexts not found at', contextsPath);
      this.aiContexts = {};
    }
  }

  /**
   * Load engine preferences
   * Following Rule C006: Verb-noun naming
   */
  loadEnginePreferences(options = {}) {
    // Define engine preferences based on rule complexity and capabilities
    const preferences = {
      // ESLint-friendly rules (static analysis)
      'C001': ['eslint', 'heuristic', 'openai'],
      'C002': ['eslint', 'heuristic', 'openai'],
      'C003': ['heuristic', 'eslint', 'openai'],
      'C004': ['eslint', 'heuristic', 'openai'],
      'C006': ['eslint', 'heuristic', 'openai'],
      'C007': ['eslint', 'heuristic', 'openai'],
      'C014': ['eslint', 'heuristic', 'openai'],
      'C018': ['heuristic', 'eslint'],
      'C033': ['heuristic', 'eslint'],
      'C035': ['heuristic', 'eslint'],
      'C040': ['eslint', 'heuristic'],
      
      // AI-enhanced rules (complex logic analysis)
      'C005': ['openai', 'heuristic'],
      'C012': ['openai', 'heuristic'],
      'C015': ['openai', 'heuristic'],
      'C032': ['openai', 'heuristic'],
      'C034': ['openai', 'heuristic'],
      'C037': ['openai', 'heuristic', 'eslint'],
      'C038': ['openai', 'heuristic']
    };

    for (const [ruleId, engines] of Object.entries(preferences)) {
      this.enginePreferences.set(ruleId, engines);
    }

    if (options.verbose) {
      console.log(chalk.blue(`⚙️ Loaded ${this.enginePreferences.size} engine preferences`));
    }
  }

  /**
   * Scan existing analyzers
   * Following Rule C006: Verb-noun naming
   */
  async scanExistingAnalyzers(options = {}) {
    const rulesDir = path.resolve(__dirname, '../rules');
    
    if (!fs.existsSync(rulesDir)) {
      console.warn('⚠️ Rules directory not found');
      return;
    }

    try {
      const ruleFolders = fs.readdirSync(rulesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const ruleFolder of ruleFolders) {
        const ruleId = this.extractRuleId(ruleFolder);
        const analyzerPath = path.join(rulesDir, ruleFolder, 'analyzer.js');
        
        if (fs.existsSync(analyzerPath)) {
          this.ruleAnalyzers.set(ruleId, {
            path: analyzerPath,
            folder: ruleFolder,
            available: true
          });
        }
      }

      if (options.verbose) {
        console.log(chalk.blue(`🔍 Found ${this.ruleAnalyzers.size} existing analyzers`));
      }
      
    } catch (error) {
      console.warn('⚠️ Failed to scan existing analyzers:', error.message);
    }
  }

  /**
   * Extract rule ID from folder name
   * Following Rule C006: Verb-noun naming
   */
  extractRuleId(folderName) {
    // Extract from patterns like "C019_log_level_usage" or "S005_sql_injection"
    const match = folderName.match(/^([CST]\d{3})/);
    return match ? match[1] : folderName;
  }

  /**
   * Get rule information with engine preferences
   * Following Rule C006: Verb-noun naming
   */
  getRuleInfo(ruleId) {
    const baseRule = this.rulesRegistry[ruleId];
    if (!baseRule) {
      return null;
    }

    return {
      ...baseRule,
      id: ruleId,
      enginePreferences: this.enginePreferences.get(ruleId) || ['heuristic', 'openai'],
      hasAnalyzer: this.ruleAnalyzers.has(ruleId),
      hasAIContext: this.aiContexts[ruleId] !== undefined,
      aiContext: this.aiContexts[ruleId] || null,
      analyzer: this.ruleAnalyzers.get(ruleId) || null
    };
  }

  /**
   * Get rules by category
   * Following Rule C006: Verb-noun naming
   */
  getRulesByCategory(category) {
    const rules = [];
    
    for (const [ruleId, rule] of Object.entries(this.rulesRegistry)) {
      if (rule.category === category) {
        rules.push(this.getRuleInfo(ruleId));
      }
    }
    
    return rules;
  }

  /**
   * Get rules by engine preference
   * Following Rule C006: Verb-noun naming
   */
  getRulesByEngine(engineId) {
    const rules = [];
    
    for (const [ruleId, preferences] of this.enginePreferences.entries()) {
      if (preferences.includes(engineId)) {
        const ruleInfo = this.getRuleInfo(ruleId);
        if (ruleInfo) {
          rules.push(ruleInfo);
        }
      }
    }
    
    return rules;
  }

  /**
   * Get all available rules
   * Following Rule C006: Verb-noun naming
   */
  getAllRules() {
    const rules = [];
    
    for (const ruleId of Object.keys(this.rulesRegistry)) {
      const ruleInfo = this.getRuleInfo(ruleId);
      if (ruleInfo) {
        rules.push(ruleInfo);
      }
    }
    
    return rules;
  }

  /**
   * Get rules with analyzers
   * Following Rule C006: Verb-noun naming
   */
  getRulesWithAnalyzers() {
    return this.getAllRules().filter(rule => rule.hasAnalyzer);
  }

  /**
   * Get rules with AI context
   * Following Rule C006: Verb-noun naming
   */
  getRulesWithAIContext() {
    return this.getAllRules().filter(rule => rule.hasAIContext);
  }

  /**
   * Get registry statistics
   * Following Rule C006: Verb-noun naming
   */
  getRegistryStats() {
    const allRules = this.getAllRules();
    
    return {
      totalRules: allRules.length,
      rulesWithAnalyzers: allRules.filter(r => r.hasAnalyzer).length,
      rulesWithAIContext: allRules.filter(r => r.hasAIContext).length,
      engineCoverage: {
        heuristic: this.getRulesByEngine('heuristic').length,
        openai: this.getRulesByEngine('openai').length,
        eslint: this.getRulesByEngine('eslint').length
      },
      categories: this.getCategoryStats(allRules)
    };
  }

  /**
   * Get category statistics
   * Following Rule C006: Verb-noun naming
   */
  getCategoryStats(rules) {
    const categories = {};
    
    for (const rule of rules) {
      if (!categories[rule.category]) {
        categories[rule.category] = 0;
      }
      categories[rule.category]++;
    }
    
    return categories;
  }

  /**
   * Display registry overview
   * Following Rule C006: Verb-noun naming
   */
  displayOverview(options = {}) {
    if (!options.verbose) return;
    
    const stats = this.getRegistryStats();
    
    console.log(chalk.blue.bold('📊 Enhanced Rules Registry Overview'));
    console.log(chalk.gray('='.repeat(50)));
    console.log(chalk.green(`📋 Total Rules: ${stats.totalRules}`));
    console.log(chalk.blue(`🔍 With Analyzers: ${stats.rulesWithAnalyzers}`));
    console.log(chalk.cyan(`🤖 With AI Context: ${stats.rulesWithAIContext}`));
    console.log();
    
    console.log(chalk.yellow('🎯 Engine Coverage:'));
    Object.entries(stats.engineCoverage).forEach(([engine, count]) => {
      console.log(`  • ${engine}: ${count} rules`);
    });
    console.log();
    
    console.log(chalk.yellow('📂 Categories:'));
    Object.entries(stats.categories).forEach(([category, count]) => {
      console.log(`  • ${category}: ${count} rules`);
    });
    console.log();
  }
}

module.exports = EnhancedRulesRegistry;
