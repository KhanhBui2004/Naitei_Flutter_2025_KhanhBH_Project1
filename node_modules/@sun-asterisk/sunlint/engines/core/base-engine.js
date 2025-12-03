/**
 * Base Engine Abstract Class
 * Following Rule C005: Single responsibility - Base engine functionality
 * Following Rule C014: Dependency injection - Plugin architecture
 */

const EventEmitter = require('events');

class BaseEngine extends EventEmitter {
  constructor(name, version, supportedLanguages = []) {
    super();
    this.name = name;
    this.version = version;
    this.supportedLanguages = supportedLanguages;
    this.initialized = false;
    this.verbose = false;
    this.ruleRegistry = new Map();
    this.pluginManager = null;
  }

  /**
   * Set plugin manager for this engine
   * @param {PluginManager} pluginManager - Plugin manager instance
   */
  setPluginManager(pluginManager) {
    this.pluginManager = pluginManager;
  }

  /**
   * Abstract method - must be implemented by subclasses
   */
  async initialize(config) {
    this.verbose = config.verbose || false;
    
    // Load rules from plugin manager if available
    if (this.pluginManager) {
      const engineRules = await this.pluginManager.loadRulesForEngine(this.name, config);
      this.ruleRegistry = engineRules;
      
      if (this.verbose) {
        console.log(`🔧 [${this.name}] Loaded ${engineRules.size} rules from Plugin Manager`);
      }
    }
    
    this.initialized = true;
  }

  /**
   * Abstract method - must be implemented by subclasses
   */
  async analyze(files, rules, options) {
    throw new Error('analyze() must be implemented by subclass');
  }

  /**
   * Analyze files with a specific rule plugin
   * @param {string} ruleId - Rule identifier
   * @param {Array} files - Files to analyze
   * @param {string} language - Programming language
   * @param {Object} options - Analysis options
   * @returns {Array} Array of violations
   */
  async analyzeWithRule(ruleId, files, language, options = {}) {
    const ruleInfo = this.ruleRegistry.get(ruleId);
    
    if (!ruleInfo) {
      if (this.verbose) {
        console.warn(`⚠️ [${this.name}] Rule ${ruleId} not found`);
      }
      return [];
    }

    try {
      const violations = await ruleInfo.plugin.analyze(files, language, {
        ...options,
        engine: this.name,
        metadata: ruleInfo.metadata
      });

      // Ensure violations have correct rule ID
      return violations.map(violation => ({
        ...violation,
        ruleId: ruleId,
        engine: this.name,
        pluginType: ruleInfo.type
      }));

    } catch (error) {
      if (this.verbose) {
        console.error(`❌ [${this.name}] Error analyzing with rule ${ruleId}: ${error.message}`);
      }
      return [];
    }
  }

  /**
   * Check if a rule is supported by this engine
   * @param {string} ruleId - Rule ID to check
   * @returns {boolean} True if rule is supported
   */
  isRuleSupported(ruleId) {
    return this.ruleRegistry.has(ruleId);
  }

  /**
   * Get engine information
   * @returns {Object} Engine metadata
   */
  getEngineInfo() {
    return {
      name: this.name,
      version: this.version,
      supportedLanguages: this.supportedLanguages,
      initialized: this.initialized,
      rulesLoaded: this.ruleRegistry.size
    };
  }

  /**
   * Register a rule with the engine
   * @param {string} ruleId - Rule identifier
   * @param {Object} ruleInfo - Rule information and analyzer
   */
  registerRule(ruleId, ruleInfo) {
    this.ruleRegistry.set(ruleId, ruleInfo);
    this.emit('ruleRegistered', { ruleId, engine: this.name });
  }

  /**
   * Unregister a rule from the engine
   * @param {string} ruleId - Rule identifier
   */
  unregisterRule(ruleId) {
    const removed = this.ruleRegistry.delete(ruleId);
    if (removed) {
      this.emit('ruleUnregistered', { ruleId, engine: this.name });
    }
    return removed;
  }

  /**
   * Get all registered rules
   * @returns {string[]} Array of rule IDs
   */
  getRegisteredRules() {
    return Array.from(this.ruleRegistry.keys());
  }

  /**
   * Set plugin manager
   * @param {Object} pluginManager - Plugin manager instance
   */
  setPluginManager(pluginManager) {
    this.pluginManager = pluginManager;
  }

  /**
   * Load rules using plugin manager
   * @param {Object} config - Configuration options
   */
  async loadRules(config = {}) {
    if (!this.pluginManager) {
      throw new Error('Plugin manager not set');
    }
    
    const rules = await this.pluginManager.loadRulesForEngine(this.name, config);
    
    for (const [ruleId, ruleInfo] of rules) {
      this.registerRule(ruleId, ruleInfo);
    }
    
    if (this.verbose) {
      console.log(`📚 [${this.name}] Loaded ${rules.size} rules`);
    }
  }

  /**
   * Cleanup engine resources
   */
  async cleanup() {
    this.ruleRegistry.clear();
    this.initialized = false;
    this.emit('cleanup', { engine: this.name });
    
    if (this.verbose) {
      console.log(`🔧 [${this.name}] Engine cleanup completed`);
    }
  }

  /**
   * Group files by programming language
   * @param {string[]} files - Files to group
   * @returns {Object} Files grouped by language
   */
  groupFilesByLanguage(files) {
    const groups = {};

    for (const file of files) {
      const language = this.detectLanguage(file);
      if (!groups[language]) {
        groups[language] = [];
      }
      groups[language].push(file);
    }

    return groups;
  }

  /**
   * Detect programming language from file extension
   * @param {string} filePath - File path
   * @returns {string} Detected language
   */
  detectLanguage(filePath) {
    const path = require('path');
    const ext = path.extname(filePath).toLowerCase();
    
    const languageMap = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript', 
      '.jsx': 'javascript',
      '.dart': 'dart',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.kts': 'kotlin',
      '.java': 'java',
      '.py': 'python',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby'
    };

    return languageMap[ext] || 'unknown';
  }

  /**
   * Check if language is supported
   * @param {string} language - Language to check
   * @returns {boolean} True if supported
   */
  isLanguageSupported(language) {
    return this.supportedLanguages.includes(language) || 
           this.supportedLanguages.includes('all');
  }
}

module.exports = BaseEngine;
