/**
 * Engine Factory
 * Creates and manages engine instances with plugin support
 * Following Rule C005: Single responsibility - Engine creation
 */

const PluginManager = require('../core/plugin-manager');
const BaseEngine = require('./core/base-engine');

// Engine imports
const HeuristicEngine = require('../engines/heuristic-engine');
const ESLintEngine = require('../engines/eslint-engine'); 
const OpenAIEngine = require('../engines/openai-engine');

class EngineFactory {
  constructor() {
    this.pluginManager = null;
    this.engines = new Map();
    this.verbose = false;
  }

  /**
   * Initialize factory with plugin manager
   * @param {Object} config - Configuration options
   */
  async initialize(config = {}) {
    this.verbose = config.verbose || false;
    
    // Initialize plugin manager
    this.pluginManager = new PluginManager();
    await this.pluginManager.initialize(config);
    
    if (this.verbose) {
      console.log('🏭 Engine Factory initialized');
    }
  }

  /**
   * Create an engine instance
   * @param {string} engineType - Type of engine to create
   * @param {Object} config - Engine configuration
   * @returns {BaseEngine} Engine instance
   */
  async createEngine(engineType, config = {}) {
    const engineConfig = {
      ...config,
      verbose: this.verbose,
      pluginManager: this.pluginManager
    };

    let engine = null;

    switch (engineType.toLowerCase()) {
      case 'auto':
        // Auto-detection: default to heuristic for best performance/compatibility
        engine = new HeuristicEngine();
        if (this.verbose) {
          console.log('🤖 Auto-detected engine: heuristic (best performance/compatibility)');
        }
        break;
      case 'heuristic':
        engine = new HeuristicEngine();
        break;
      case 'eslint':
        engine = new ESLintEngine();
        break;
      case 'openai':
        engine = new OpenAIEngine();
        break;
      default:
        throw new Error(`Unknown engine type: ${engineType}`);
    }

    // Set plugin manager and initialize
    if (engine instanceof BaseEngine) {
      engine.setPluginManager(this.pluginManager);
      await engine.initialize(engineConfig);
    }

    // Cache engine instance
    this.engines.set(engineType, engine);

    if (this.verbose) {
      console.log(`🔧 Created ${engineType} engine with ${engine.ruleRegistry.size} rules`);
    }

    return engine;
  }

  /**
   * Get an existing engine or create a new one
   * @param {string} engineType - Type of engine
   * @param {Object} config - Engine configuration
   * @returns {BaseEngine} Engine instance
   */
  async getEngine(engineType, config = {}) {
    if (this.engines.has(engineType)) {
      return this.engines.get(engineType);
    }

    return await this.createEngine(engineType, config);
  }

  /**
   * Get all available engines
   * @returns {Map} Map of engine type to engine instance
   */
  getAllEngines() {
    return this.engines;
  }

  /**
   * Check if engine type is supported
   * @param {string} engineType - Engine type to check
   * @returns {boolean} True if supported
   */
  isEngineSupported(engineType) {
    const supportedEngines = ['heuristic', 'eslint', 'openai'];
    return supportedEngines.includes(engineType.toLowerCase());
  }

  /**
   * Get engine metadata
   * @param {string} engineType - Engine type
   * @returns {Object|null} Engine metadata
   */
  getEngineMetadata(engineType) {
    const engine = this.engines.get(engineType);
    return engine ? engine.getMetadata() : null;
  }

  /**
   * Reload custom rules in all engines
   * @param {Object} config - Configuration options
   */
  async reloadCustomRules(config = {}) {
    if (this.pluginManager) {
      await this.pluginManager.reloadCustomRules(config);
      
      // Reinitialize all engines to pick up new rules
      for (const [engineType, engine] of this.engines) {
        if (engine instanceof BaseEngine) {
          await engine.initialize({ ...config, verbose: this.verbose });
        }
      }

      if (this.verbose) {
        console.log('🔄 Reloaded custom rules in all engines');
      }
    }
  }

  /**
   * Get compatible engines for a language
   * @param {string} language - Programming language
   * @returns {Array} Array of compatible engine types
   */
  getCompatibleEngines(language) {
    const compatible = [];

    for (const [engineType, engine] of this.engines) {
      if (engine.supportedLanguages.includes(language.toLowerCase())) {
        compatible.push(engineType);
      }
    }

    return compatible;
  }

  /**
   * Create multiple engines from configuration
   * @param {Object} engineConfig - Engine configuration object
   * @returns {Map} Map of created engines
   */
  async createEnginesFromConfig(engineConfig = {}) {
    const engines = new Map();

    for (const [engineType, config] of Object.entries(engineConfig)) {
      if (this.isEngineSupported(engineType)) {
        try {
          const engine = await this.createEngine(engineType, config);
          engines.set(engineType, engine);
        } catch (error) {
          if (this.verbose) {
            console.warn(`⚠️ Failed to create ${engineType} engine: ${error.message}`);
          }
        }
      }
    }

    return engines;
  }

  /**
   * Analyze files using best engine for language
   * @param {Array} files - Files to analyze
   * @param {string} language - Programming language
   * @param {Array} rules - Rules to apply
   * @param {Object} options - Analysis options
   * @returns {Array} Array of violations
   */
  async analyzeWithBestEngine(files, language, rules, options = {}) {
    const compatibleEngines = this.getCompatibleEngines(language);
    
    if (compatibleEngines.length === 0) {
      throw new Error(`No compatible engines found for language: ${language}`);
    }

    // Priority: heuristic > eslint > openai
    const enginePriority = ['heuristic', 'eslint', 'openai'];
    const bestEngine = enginePriority.find(type => compatibleEngines.includes(type));

    if (!bestEngine) {
      throw new Error(`No suitable engine found for language: ${language}`);
    }

    const engine = await this.getEngine(bestEngine, options);
    return await engine.analyze(files, rules, { ...options, language });
  }

  /**
   * Cleanup all engines and plugin manager
   */
  async cleanup() {
    // Cleanup all engines
    for (const [engineType, engine] of this.engines) {
      try {
        if (engine.cleanup) {
          await engine.cleanup();
        }
      } catch (error) {
        if (this.verbose) {
          console.warn(`⚠️ Error cleaning up ${engineType} engine: ${error.message}`);
        }
      }
    }

    // Cleanup plugin manager
    if (this.pluginManager) {
      await this.pluginManager.cleanup();
    }

    this.engines.clear();
    this.pluginManager = null;

    if (this.verbose) {
      console.log('🧹 Engine Factory cleanup completed');
    }
  }

  /**
   * Get factory statistics
   * @returns {Object} Factory statistics
   */
  getStatistics() {
    const stats = {
      engineCount: this.engines.size,
      engines: {},
      totalRules: 0
    };

    for (const [engineType, engine] of this.engines) {
      const metadata = engine.getMetadata ? engine.getMetadata() : {};
      stats.engines[engineType] = {
        ...metadata,
        ruleCount: engine.ruleRegistry ? engine.ruleRegistry.size : 0
      };
      stats.totalRules += stats.engines[engineType].ruleCount;
    }

    if (this.pluginManager) {
      stats.pluginManager = {
        totalPlugins: this.pluginManager.getAllPlugins().size,
        customRules: this.pluginManager.customRules.size
      };
    }

    return stats;
  }
}

module.exports = EngineFactory;
