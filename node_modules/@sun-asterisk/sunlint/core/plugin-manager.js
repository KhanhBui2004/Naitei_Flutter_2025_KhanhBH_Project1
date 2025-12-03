/**
 * Plugin Manager
 * Manages rule plugins lifecycle and loading
 * Following Rule C005: Single responsibility - Plugin management
 */

const fs = require('fs');
const path = require('path');
const { RulePluginInterface, SemanticRuleInterface, CustomRuleInterface } = require('./interfaces/rule-plugin.interface');
const { isValidCategory, getValidCategories, getDefaultCategory, normalizeCategory } = require('./constants/categories');

class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.customRules = new Map();
    this.loadedEngines = new Set();
    this.verbose = false;
  }

  /**
   * Initialize plugin manager
   * @param {Object} config - Configuration options
   */
  async initialize(config = {}) {
    this.verbose = config.verbose || false;
    
    // Load core rules first (always loaded)
    await this.loadCoreRules(config);
    
    // Load custom rules from .sunlint.json (additional support)
    await this.loadCustomRules(config);
    
    if (this.verbose) {
      console.log(`🔌 Plugin Manager initialized: ${this.plugins.size} rules loaded`);
    }
  }

  /**
   * Load core rules from rules directory
   * @param {Object} config - Configuration options
   */
  async loadCoreRules(config = {}) {
    const rulesDir = path.resolve(__dirname, '../../rules');
    
    if (!fs.existsSync(rulesDir)) {
      console.warn('⚠️ Rules directory not found');
      return;
    }

    const categories = fs.readdirSync(rulesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .filter(dirent => !['tests', 'docs', 'utils', 'migration'].includes(dirent.name))
      .map(dirent => dirent.name);

    for (const category of categories) {
      await this.loadCategoryRules(category, rulesDir, config);
    }
  }

  /**
   * Load rules from a category directory
   * @param {string} category - Category name
   * @param {string} rulesDir - Rules directory path
   * @param {Object} config - Configuration options
   */
  async loadCategoryRules(category, rulesDir, config) {
    const categoryPath = path.join(rulesDir, category);
    
    const ruleFolders = fs.readdirSync(categoryPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const ruleFolder of ruleFolders) {
      const rulePath = path.join(categoryPath, ruleFolder);
      await this.loadRulePlugin(ruleFolder, rulePath, category, config);
    }
  }

  /**
   * Load a single rule plugin
   * @param {string} ruleId - Rule identifier
   * @param {string} rulePath - Path to rule directory
   * @param {string} category - Rule category
   * @param {Object} config - Configuration options
   */
  async loadRulePlugin(ruleId, rulePath, category, config) {
    try {
      // Try to load semantic rule first
      const semanticPath = path.join(rulePath, 'semantic-analyzer.js');
      if (fs.existsSync(semanticPath)) {
        await this.loadSemanticRule(ruleId, semanticPath, category, config);
        return;
      }

      // Try AST analyzer
      const astPath = path.join(rulePath, 'ast-analyzer.js');
      if (fs.existsSync(astPath)) {
        await this.loadPluginRule(ruleId, astPath, category, 'ast', config);
        return;
      }

      // Try regex analyzer
      const regexPath = path.join(rulePath, 'analyzer.js');
      if (fs.existsSync(regexPath)) {
        await this.loadPluginRule(ruleId, regexPath, category, 'regex', config);
        return;
      }

      if (this.verbose) {
        console.warn(`⚠️ No analyzer found for rule ${ruleId}`);
      }

    } catch (error) {
      if (this.verbose) {
        console.warn(`⚠️ Failed to load rule ${ruleId}:`, error.message);
      }
    }
  }

  /**
   * Load semantic rule plugin
   * @param {string} ruleId - Rule identifier
   * @param {string} analyzerPath - Path to analyzer
   * @param {string} category - Rule category
   * @param {Object} config - Configuration options
   */
  async loadSemanticRule(ruleId, analyzerPath, category, config) {
    try {
      const AnalyzerClass = require(analyzerPath);
      const metadata = await this.loadRuleMetadata(ruleId, path.dirname(analyzerPath));
      
      const plugin = new AnalyzerClass(ruleId, { ...metadata, category, type: 'semantic' });
      
      if (plugin instanceof SemanticRuleInterface) {
        this.registerPlugin(ruleId, plugin, 'semantic');
        
        if (this.verbose) {
          console.log(`🧠 Loaded semantic rule: ${ruleId}`);
        }
      } else {
        throw new Error(`${ruleId} does not implement SemanticRuleInterface`);
      }

    } catch (error) {
      if (this.verbose) {
        console.warn(`⚠️ Failed to load semantic rule ${ruleId}:`, error.message);
      }
    }
  }

  /**
   * Load standard plugin rule
   * @param {string} ruleId - Rule identifier
   * @param {string} analyzerPath - Path to analyzer
   * @param {string} category - Rule category
   * @param {string} type - Analyzer type
   * @param {Object} config - Configuration options
   */
  async loadPluginRule(ruleId, analyzerPath, category, type, config) {
    try {
      const analyzerModule = require(analyzerPath);
      const AnalyzerClass = analyzerModule.default || analyzerModule;
      const metadata = await this.loadRuleMetadata(ruleId, path.dirname(analyzerPath));
      
      // Create plugin wrapper for legacy analyzers
      const plugin = this.createLegacyPluginWrapper(ruleId, AnalyzerClass, {
        ...metadata,
        category,
        type
      });
      
      this.registerPlugin(ruleId, plugin, type);
      
      if (this.verbose) {
        console.log(`🔧 Loaded ${type} rule: ${ruleId}`);
      }

    } catch (error) {
      if (this.verbose) {
        console.warn(`⚠️ Failed to load ${type} rule ${ruleId}:`, error.message);
      }
    }
  }

  /**
   * Create plugin wrapper for legacy analyzers
   * @param {string} ruleId - Rule identifier
   * @param {Function|Object} analyzer - Analyzer class or instance
   * @param {Object} metadata - Rule metadata
   * @returns {RulePluginInterface} Plugin wrapper
   */
  createLegacyPluginWrapper(ruleId, analyzer, metadata) {
    return new class extends RulePluginInterface {
      constructor() {
        super(ruleId, metadata);
        this.analyzer = typeof analyzer === 'function' ? new analyzer() : analyzer;
      }

      async initialize(config = {}) {
        if (this.analyzer.initialize) {
          await this.analyzer.initialize(config);
        }
      }

      async analyze(files, language, options = {}) {
        if (!this.analyzer.analyze) {
          throw new Error(`Analyzer for ${ruleId} missing analyze method`);
        }
        
        return await this.analyzer.analyze(files, language, options);
      }
    }();
  }

  /**
   * Load rule metadata from config.json
   * @param {string} ruleId - Rule identifier
   * @param {string} rulePath - Rule directory path
   * @returns {Object} Rule metadata
   */
  async loadRuleMetadata(ruleId, rulePath) {
    const configPath = path.join(rulePath, 'config.json');
    
    if (fs.existsSync(configPath)) {
      try {
        return require(configPath);
      } catch (error) {
        if (this.verbose) {
          console.warn(`⚠️ Failed to load config for ${ruleId}:`, error.message);
        }
      }
    }

    return {
      name: ruleId,
      description: `Analysis for rule ${ruleId}`,
      severity: 'warning'
    };
  }

  /**
   * Load custom rules from .sunlint.json
   * @param {Object} config - Configuration options
   */
  async loadCustomRules(config = {}) {
    const configPath = path.resolve(process.cwd(), '.sunlint.json');
    
    if (!fs.existsSync(configPath)) {
      return;
    }

    try {
      const sunlintConfig = require(configPath);
      
      // Support both new and legacy config formats
      const customRules = sunlintConfig.customRules || 
                         sunlintConfig.custom || 
                         {}; // Default to empty if no custom rules

      for (const [ruleId, ruleConfig] of Object.entries(customRules)) {
        await this.loadCustomRule(ruleId, ruleConfig, config);
      }

      if (this.verbose && Object.keys(customRules).length > 0) {
        console.log(`📋 Loaded ${Object.keys(customRules).length} custom rules from config`);
      }

    } catch (error) {
      if (this.verbose) {
        console.warn(`⚠️ Failed to load custom rules config:`, error.message);
      }
    }
  }

  /**
   * Load a custom rule
   * @param {string} ruleId - Rule identifier
   * @param {Object} ruleConfig - Rule configuration
   * @param {Object} config - Global configuration
   */
  async loadCustomRule(ruleId, ruleConfig, config) {
    try {
      if (!ruleConfig.path) {
        throw new Error(`Custom rule ${ruleId} missing path`);
      }

      // Validate and normalize category
      const originalCategory = ruleConfig.category;
      ruleConfig.category = normalizeCategory(ruleConfig.category);
      
      if (originalCategory && originalCategory !== ruleConfig.category) {
        console.warn(`⚠️ Invalid category '${originalCategory}' for rule ${ruleId}. Valid categories: ${getValidCategories().join(', ')}`);
        console.warn(`   Auto-corrected to: '${ruleConfig.category}'`);
      }

      const rulePath = path.resolve(process.cwd(), ruleConfig.path);
      
      if (!fs.existsSync(rulePath)) {
        throw new Error(`Custom rule file not found: ${rulePath}`);
      }

      const CustomRuleClass = require(rulePath);
      const plugin = new CustomRuleClass(ruleId, ruleConfig);

      if (!(plugin instanceof CustomRuleInterface)) {
        throw new Error(`Custom rule ${ruleId} must extend CustomRuleInterface`);
      }

      this.registerPlugin(ruleId, plugin, 'custom');
      this.customRules.set(ruleId, { path: rulePath, config: ruleConfig });

      if (this.verbose) {
        console.log(`🎨 Loaded custom rule: ${ruleId} (category: ${ruleConfig.category || 'common'})`);
      }

    } catch (error) {
      if (this.verbose) {
        console.warn(`⚠️ Failed to load custom rule ${ruleId}:`, error.message);
      }
    }
  }

  /**
   * Register a plugin
   * @param {string} ruleId - Rule identifier
   * @param {RulePluginInterface} plugin - Plugin instance
   * @param {string} type - Plugin type
   */
  registerPlugin(ruleId, plugin, type) {
    this.plugins.set(ruleId, {
      plugin,
      type,
      engines: [], // Will be populated when engines request rules
      metadata: plugin.getMetadata()
    });
  }

  /**
   * Get rules for a specific engine
   * @param {string} engineName - Engine name
   * @param {Object} config - Configuration options
   * @returns {Map} Map of rule ID to plugin info
   */
  async loadRulesForEngine(engineName, config = {}) {
    const engineRules = new Map();

    for (const [ruleId, pluginInfo] of this.plugins) {
      // Check if rule is compatible with engine
      if (this.isRuleCompatibleWithEngine(ruleId, engineName, pluginInfo)) {
        engineRules.set(ruleId, {
          plugin: pluginInfo.plugin,
          type: pluginInfo.type,
          metadata: pluginInfo.metadata
        });

        // Track which engines use this rule
        if (!pluginInfo.engines.includes(engineName)) {
          pluginInfo.engines.push(engineName);
        }
      }
    }

    this.loadedEngines.add(engineName);
    return engineRules;
  }

  /**
   * Check if rule is compatible with engine
   * @param {string} ruleId - Rule identifier
   * @param {string} engineName - Engine name
   * @param {Object} pluginInfo - Plugin information
   * @returns {boolean} True if compatible
   */
  isRuleCompatibleWithEngine(ruleId, engineName, pluginInfo) {
    const { type, plugin } = pluginInfo;

    // Engine compatibility rules
    const compatibility = {
      heuristic: ['semantic', 'ast', 'regex', 'custom'],
      eslint: ['eslint', 'custom'],
      openai: ['semantic', 'custom']
    };

    return compatibility[engineName]?.includes(type) || false;
  }

  /**
   * Get plugin information
   * @param {string} ruleId - Rule identifier
   * @returns {Object|null} Plugin information
   */
  getPlugin(ruleId) {
    return this.plugins.get(ruleId) || null;
  }

  /**
   * Get all loaded plugins
   * @returns {Map} All plugins
   */
  getAllPlugins() {
    return this.plugins;
  }

  /**
   * Reload custom rules (for hot-reload during development)
   * @param {Object} config - Configuration options
   */
  async reloadCustomRules(config = {}) {
    // Clear existing custom rules
    for (const [ruleId, pluginInfo] of this.plugins) {
      if (pluginInfo.type === 'custom') {
        this.plugins.delete(ruleId);
      }
    }
    this.customRules.clear();

    // Reload custom rules
    await this.loadCustomRules(config);

    if (this.verbose) {
      const customCount = Array.from(this.plugins.values()).filter(p => p.type === 'custom').length;
      console.log(`🔄 Reloaded ${customCount} custom rules`);
    }
  }

  /**
   * Cleanup plugin manager
   */
  async cleanup() {
    for (const [ruleId, pluginInfo] of this.plugins) {
      try {
        await pluginInfo.plugin.cleanup();
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    this.plugins.clear();
    this.customRules.clear();
    this.loadedEngines.clear();

    if (this.verbose) {
      console.log('🔌 Plugin Manager cleanup completed');
    }
  }
}

module.exports = PluginManager;
