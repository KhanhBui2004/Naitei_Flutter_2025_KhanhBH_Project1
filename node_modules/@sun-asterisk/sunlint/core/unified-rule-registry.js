/**
 * Unified Rule Registry - Single Source of Truth
 * Following Rule C005: Single responsibility - centralized rule management
 * Following Rule C015: Use domain language - clear registry terms
 */

const fs = require('fs');
const path = require('path');

class UnifiedRuleRegistry {
  constructor() {
    this.rules = new Map();
    this.engineCapabilities = new Map();
    this.initialized = false;
    this.verbose = false;
  }

  /**
   * Initialize registry with auto-discovery
   * @param {Object} options - Configuration options
   */
  async initialize(options = {}) {
    if (this.initialized) return;
    
    this.verbose = options.verbose || false;
    
    try {
      // 1. Load master rule definitions
      await this.loadMasterRegistry();
      
      // 2. Auto-discover analyzer files  
      await this.autoDiscoverAnalyzers();
      
      // 3. Register engine capabilities
      this.registerEngineCapabilities();
      
      // 4. Validate consistency
      await this.validateRegistry();
      
      this.initialized = true;
      
      if (this.verbose) {
        console.log(`✅ Unified Registry initialized: ${this.rules.size} rules`);
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize Unified Rule Registry:', error.message);
      throw error;
    }
  }

  /**
   * Load master rule definitions from primary source
   */
  async loadMasterRegistry() {
    // Try enhanced registry first, fall back to original
    const registryPaths = [
      path.resolve(__dirname, '../config/rules/enhanced-rules-registry.json'),
      path.resolve(__dirname, '../config/rules/rules-registry.json')
    ];
    
    let registryPath = null;
    for (const tryPath of registryPaths) {
      if (fs.existsSync(tryPath)) {
        registryPath = tryPath;
        break;
      }
    }
    
    if (!registryPath) {
      throw new Error('No master registry found in config/rules/');
    }

    if (this.verbose) {
      console.log(`📋 Loading enhanced registry from: ${path.basename(registryPath)}`);
    }
    
    try {
      const registryData = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      const rules = registryData.rules || registryData;
      
      for (const [ruleId, ruleConfig] of Object.entries(rules)) {
        const ruleDefinition = {
          id: ruleId,
          name: ruleConfig.name,
          description: ruleConfig.description,
          category: ruleConfig.category,
          severity: ruleConfig.severity || 'warning',
          languages: ruleConfig.languages || ['javascript', 'typescript'],
          
          // Use existing analyzer paths or initialize empty
          analyzers: ruleConfig.analyzers || {},
          
          // Use existing engine mappings or initialize empty
          engineMappings: ruleConfig.engineMappings || {},
          
          // Use existing strategy or initialize default
          strategy: ruleConfig.strategy || {
            preferred: 'regex',
            fallbacks: ['ast'],
            accuracy: {}
          },
          
          // Metadata
          version: ruleConfig.version || '1.0.0',
          status: ruleConfig.status || 'stable',
          tags: ruleConfig.tags || []
        };
        
        this.rules.set(ruleId, ruleDefinition);
      }
      
      if (this.verbose) {
        console.log(`📋 Loaded ${this.rules.size} rules from master registry`);
      }
      
    } catch (error) {
      throw new Error(`Failed to parse master registry: ${error.message}`);
    }
  }

  /**
   * Auto-discover analyzer files for all rules
   */
  async autoDiscoverAnalyzers() {
    const rulesBaseDir = path.resolve(__dirname, '../rules');
    
    for (const [ruleId, ruleDefinition] of this.rules.entries()) {
      const analyzers = await this.discoverAnalyzersForRule(ruleId, rulesBaseDir);
      ruleDefinition.analyzers = analyzers;
      
      // Infer preferred analysis strategy based on available analyzers
      if (analyzers.semantic) {
        ruleDefinition.strategy.preferred = 'semantic';
        ruleDefinition.strategy.fallbacks = ['ast', 'regex'];
      } else if (analyzers.ast) {
        ruleDefinition.strategy.preferred = 'ast';
        ruleDefinition.strategy.fallbacks = ['regex'];
      } else if (analyzers.regex || analyzers.legacy) {
        ruleDefinition.strategy.preferred = 'regex';
        ruleDefinition.strategy.fallbacks = [];
      }
    }
    
    if (this.verbose) {
      const rulesWithAnalyzers = Array.from(this.rules.values()).filter(rule => 
        Object.keys(rule.analyzers).length > 0
      ).length;
      console.log(`🔍 Auto-discovered analyzers for ${rulesWithAnalyzers}/${this.rules.size} rules`);
    }
  }

  /**
   * Discover analyzer files for a specific rule
   * @param {string} ruleId - Rule ID
   * @param {string} rulesBaseDir - Base rules directory
   * @returns {Object} Analyzer file paths
   */
  async discoverAnalyzersForRule(ruleId, rulesBaseDir) {
    const analyzers = {};
    
    // Direct search in common directory using exact folder names
    const commonRulesDir = path.join(rulesBaseDir, 'common');
    
    if (fs.existsSync(commonRulesDir)) {
      const ruleFolders = fs.readdirSync(commonRulesDir);
      
      // Look for folder that starts with rule ID
      const matchingFolder = ruleFolders.find(folder => 
        folder.startsWith(ruleId + '_') || folder === ruleId
      );
      
      if (matchingFolder) {
        const rulePath = path.join(commonRulesDir, matchingFolder);
        
        // Check for different analyzer files
        const analyzerFiles = {
          semantic: path.join(rulePath, 'semantic-analyzer.js'),
          ast: path.join(rulePath, 'ast-analyzer.js'),
          regex: path.join(rulePath, 'regex-analyzer.js'),
          legacy: path.join(rulePath, 'analyzer.js')
        };
        
        for (const [type, filePath] of Object.entries(analyzerFiles)) {
          if (fs.existsSync(filePath)) {
            analyzers[type] = filePath;
          }
        }
      }
    }
    
    // Also check other category directories (security, typescript, etc.)
    const otherDirs = ['security', 'typescript', 'react'];
    for (const categoryDir of otherDirs) {
      const categoryPath = path.join(rulesBaseDir, categoryDir);
      
      if (fs.existsSync(categoryPath)) {
        const ruleFolders = fs.readdirSync(categoryPath);
        const matchingFolder = ruleFolders.find(folder => 
          folder.startsWith(ruleId + '_') || folder === ruleId
        );
        
        if (matchingFolder) {
          const rulePath = path.join(categoryPath, matchingFolder);
          
          const analyzerFiles = {
            semantic: path.join(rulePath, 'semantic-analyzer.js'),
            ast: path.join(rulePath, 'ast-analyzer.js'),
            regex: path.join(rulePath, 'regex-analyzer.js'),
            legacy: path.join(rulePath, 'analyzer.js')
          };
          
          for (const [type, filePath] of Object.entries(analyzerFiles)) {
            if (fs.existsSync(filePath)) {
              analyzers[type] = filePath;
            }
          }
          
          // If we found analyzers, stop searching
          if (Object.keys(analyzers).length > 0) {
            break;
          }
        }
      }
    }
    
    return analyzers;
  }

  /**
   * Expand glob-like patterns to actual paths
   * @param {string} baseDir - Base directory
   * @param {string} pattern - Pattern with * wildcards
   * @returns {string[]} Expanded paths
   */
  expandPattern(baseDir, pattern) {
    if (!pattern.includes('*')) {
      return [path.join(baseDir, pattern)];
    }
    
    const parts = pattern.split('/');
    let currentPaths = [baseDir];
    
    for (const part of parts) {
      if (part === '') continue;
      
      const newPaths = [];
      for (const currentPath of currentPaths) {
        if (part.includes('*')) {
          // Wildcard part - expand
          if (fs.existsSync(currentPath)) {
            const entries = fs.readdirSync(currentPath);
            const regex = new RegExp('^' + part.replace(/\*/g, '.*') + '$');
            
            for (const entry of entries) {
              if (regex.test(entry)) {
                newPaths.push(path.join(currentPath, entry));
              }
            }
          }
        } else {
          // Literal part
          newPaths.push(path.join(currentPath, part));
        }
      }
      currentPaths = newPaths;
    }
    
    return currentPaths;
  }

  /**
   * Register engine capabilities
   */
  registerEngineCapabilities() {
    // Define what each engine can handle
    this.engineCapabilities.set('heuristic', ['semantic', 'ast', 'regex']);
    this.engineCapabilities.set('eslint', ['ast', 'regex']);
    this.engineCapabilities.set('openai', ['semantic']);
    
    // Load ESLint mappings
    this.loadESLintMappings();
  }

  /**
   * Load ESLint rule mappings
   */
  loadESLintMappings() {
    const eslintMappingPath = path.resolve(__dirname, '../config/eslint-rule-mapping.json');
    
    if (fs.existsSync(eslintMappingPath)) {
      try {
        const mappingData = JSON.parse(fs.readFileSync(eslintMappingPath, 'utf8'));
        const mappings = mappingData.mappings || mappingData;
        
        for (const [ruleId, eslintRules] of Object.entries(mappings)) {
          if (this.rules.has(ruleId)) {
            this.rules.get(ruleId).engineMappings.eslint = eslintRules;
          }
        }
        
        if (this.verbose) {
          console.log(`🔗 Loaded ESLint mappings for ${Object.keys(mappings).length} rules`);
        }
        
      } catch (error) {
        console.warn(`⚠️ Failed to load ESLint mappings: ${error.message}`);
      }
    }
  }

  /**
   * Validate registry consistency
   */
  async validateRegistry() {
    const issues = [];
    
    for (const [ruleId, ruleDefinition] of this.rules.entries()) {
      // Check if rule has at least one analyzer
      if (Object.keys(ruleDefinition.analyzers).length === 0) {
        issues.push(`${ruleId}: No analyzers found`);
      }
      
      // Check if analyzer files actually exist
      for (const [type, filePath] of Object.entries(ruleDefinition.analyzers)) {
        if (!fs.existsSync(filePath)) {
          issues.push(`${ruleId}: ${type} analyzer not found at ${filePath}`);
        }
      }
    }
    
    if (issues.length > 0 && this.verbose) {
      console.warn(`⚠️ Registry validation found ${issues.length} issues:`);
      issues.slice(0, 5).forEach(issue => console.warn(`  - ${issue}`));
      if (issues.length > 5) {
        console.warn(`  ... and ${issues.length - 5} more`);
      }
    }
  }

  // === PUBLIC API ===

  /**
   * Get rule definition by ID
   * @param {string} ruleId - Rule ID
   * @returns {Object|null} Rule definition
   */
  getRuleDefinition(ruleId) {
    return this.rules.get(ruleId) || null;
  }

  /**
   * Get all rules supported by an engine
   * @param {string} engine - Engine name
   * @returns {Object[]} Array of rule definitions
   */
  getRulesForEngine(engine) {
    const capabilities = this.engineCapabilities.get(engine) || [];
    const supportedRules = [];
    
    for (const [ruleId, ruleDefinition] of this.rules.entries()) {
      // Check if engine can handle this rule's preferred strategy
      if (capabilities.includes(ruleDefinition.strategy.preferred)) {
        supportedRules.push(ruleDefinition);
      }
      // Or if engine can handle any fallback strategy
      else if (ruleDefinition.strategy.fallbacks.some(fallback => capabilities.includes(fallback))) {
        supportedRules.push(ruleDefinition);
      }
    }
    
    return supportedRules;
  }

  /**
   * Get all supported rule IDs
   * @returns {string[]} Array of rule IDs
   */
  getSupportedRules() {
    return Array.from(this.rules.keys());
  }

  /**
   * Resolve analyzer path for a rule and engine
   * @param {string} ruleId - Rule ID
   * @param {string} engine - Engine name  
   * @returns {string|null} Analyzer file path
   */
  resolveAnalyzerPath(ruleId, engine) {
    const ruleDefinition = this.rules.get(ruleId);
    if (!ruleDefinition) return null;
    
    const capabilities = this.engineCapabilities.get(engine) || [];
    const analyzers = ruleDefinition.analyzers;
    
    // Try preferred strategy first
    const preferred = ruleDefinition.strategy.preferred;
    if (capabilities.includes(preferred) && analyzers[preferred]) {
      return analyzers[preferred];
    }
    
    // Try fallback strategies
    for (const fallback of ruleDefinition.strategy.fallbacks) {
      if (capabilities.includes(fallback) && analyzers[fallback]) {
        return analyzers[fallback];
      }
    }
    
    // Fall back to legacy analyzer if available and engine supports regex/ast
    if (analyzers.legacy && (capabilities.includes('regex') || capabilities.includes('ast'))) {
      return analyzers.legacy;
    }
    
    return null;
  }

  /**
   * Get engine mapping for a rule (ESLint specific)
   * @param {string} ruleId - Rule ID
   * @param {string} engine - Engine name
   * @returns {string[]} Array of engine-specific rule names
   */
  getEngineMapping(ruleId, engine) {
    const ruleDefinition = this.rules.get(ruleId);
    if (!ruleDefinition) return [];
    
    return ruleDefinition.engineMappings[engine] || [];
  }

  /**
   * Check if rule is supported by engine
   * @param {string} ruleId - Rule ID
   * @param {string} engine - Engine name
   * @returns {boolean} True if supported
   */
  isRuleSupported(ruleId, engine) {
    const analyzerPath = this.resolveAnalyzerPath(ruleId, engine);
    return analyzerPath !== null;
  }

  /**
   * Get registry statistics
   * @returns {Object} Registry stats
   */
  getStats() {
    const stats = {
      totalRules: this.rules.size,
      rulesByCategory: {},
      rulesByEngine: {},
      rulesWithAnalyzers: 0
    };
    
    for (const ruleDefinition of this.rules.values()) {
      // Count by category
      const category = ruleDefinition.category;
      stats.rulesByCategory[category] = (stats.rulesByCategory[category] || 0) + 1;
      
      // Count rules with analyzers
      if (Object.keys(ruleDefinition.analyzers).length > 0) {
        stats.rulesWithAnalyzers++;
      }
    }
    
    // Count by engine
    for (const engine of this.engineCapabilities.keys()) {
      stats.rulesByEngine[engine] = this.getRulesForEngine(engine).length;
    }
    
    return stats;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  UnifiedRuleRegistry,
  getInstance: () => {
    if (!instance) {
      instance = new UnifiedRuleRegistry();
    }
    return instance;
  }
};