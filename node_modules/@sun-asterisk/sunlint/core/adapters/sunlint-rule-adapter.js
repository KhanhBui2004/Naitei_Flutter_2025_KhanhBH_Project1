const { SimpleRuleParser } = require('../../rules/parser/rule-parser-simple');
const { CATEGORY_PRINCIPLE_MAP, getCategoryPrinciples } = require('../constants/categories');
const fs = require('fs');
const path = require('path');

/**
 * SunLint Rule Adapter - Unified interface for rule access
 * 
 * Follows the same pattern as sunlint-vscode RuleAdapter for consistency
 * Provides abstraction layer between business logic and rule storage
 * 
 * Features:
 * - Singleton pattern for global rule access
 * - Caching for performance
 * - Unified interface across SunLint CLI and VSCode extension
 * - Support for multiple rule sources (origin-rules, registry)
 */
class SunlintRuleAdapter {
  constructor() {
    this.parser = new SimpleRuleParser();
    this.rulesCache = new Map();
    this.registryCache = null;
    this.isInitialized = false;
  }

  /**
   * Get singleton instance (same pattern as VSCode)
   */
  static getInstance() {
    if (!SunlintRuleAdapter.instance) {
      SunlintRuleAdapter.instance = new SunlintRuleAdapter();
    }
    return SunlintRuleAdapter.instance;
  }

  /**
   * Initialize the adapter - loads rules from available sources
   */
  async initialize(options = {}) {
    if (this.isInitialized) {
      return true;
    }

    try {
      const { rulesDir, useRegistry = true } = options;
      
      // Try to load from generated registry first (preferred)
      if (useRegistry) {
        await this.loadFromRegistry();
      }

      // Fallback to origin-rules parsing
      if (!this.registryCache) {
        await this.loadFromOriginRules(rulesDir);
      }

      this.isInitialized = true;
      console.log(`✅ SunlintRuleAdapter initialized with ${this.getAllRuleIds().length} rules`);
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize SunlintRuleAdapter:', error.message);
      return false;
    }
  }

  /**
   * Load rules from generated registry (preferred method)
   */
  async loadFromRegistry() {
    try {
      const registryPath = path.join(__dirname, '../../config/rules/rules-registry-generated.json');
      
      if (fs.existsSync(registryPath)) {
        const registryData = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
        this.registryCache = registryData.rules || {};
        console.log(`📊 Loaded ${Object.keys(this.registryCache).length} rules from registry`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('⚠️  Failed to load registry:', error.message);
      return false;
    }
  }

  /**
   * Load rules from origin-rules directory (fallback method)
   */
  async loadFromOriginRules(customRulesDir = null) {
    try {
      const rules = this.parser.parseAllRules(customRulesDir);
      
      // Convert to cache format
      this.rulesCache.clear();
      rules.forEach(rule => {
        if (rule.id) {
          this.rulesCache.set(rule.id, this.normalizeRule(rule));
        }
      });

      console.log(`📋 Loaded ${this.rulesCache.size} rules from origin-rules`);
      return true;
    } catch (error) {
      console.error('❌ Failed to load from origin-rules:', error.message);
      return false;
    }
  }

  /**
   * Normalize rule format for consistent interface
   */
  normalizeRule(rule) {
    return {
      id: rule.id,
      name: rule.title || rule.name || `${rule.id} Rule`,
      description: rule.description || 'No description available',
      title: rule.title || rule.name || `${rule.id} Rule`,
      details: Array.isArray(rule.details) ? rule.details : [rule.details || ''],
      tools: rule.tools || [],
      principles: rule.principles || [],
      version: rule.version || '1.0.0',
      status: rule.status || 'activated',
      severity: rule.severity || 'warning',
      category: rule.category || 'quality',
      languages: rule.languages || ['typescript', 'javascript'],
      framework: rule.framework,
      // Metadata
      source: this.registryCache ? 'registry' : 'origin-rules'
    };
  }

  /**
   * Get rule by ID
   */
  getRuleById(ruleId) {
    if (!this.isInitialized) {
      console.warn('⚠️  RuleAdapter not initialized. Call initialize() first.');
      return null;
    }

    // Normalize rule ID to uppercase for consistency
    const normalizedRuleId = ruleId.toUpperCase();

    // Try registry first with normalized ID
    if (this.registryCache && this.registryCache[normalizedRuleId]) {
      return this.normalizeRule({
        id: normalizedRuleId,
        ...this.registryCache[normalizedRuleId]
      });
    }

    // Try cache with normalized ID
    if (this.rulesCache.has(normalizedRuleId)) {
      return this.rulesCache.get(normalizedRuleId);
    }

    // Also try original case for backward compatibility
    if (this.registryCache && this.registryCache[ruleId]) {
      return this.normalizeRule({
        id: ruleId,
        ...this.registryCache[ruleId]
      });
    }

    if (this.rulesCache.has(ruleId)) {
      return this.rulesCache.get(ruleId);
    }

    return null;
  }

  /**
   * Get all rules
   */
  getAllRules() {
    if (!this.isInitialized) {
      console.warn('⚠️  RuleAdapter not initialized. Call initialize() first.');
      return [];
    }

    const rules = [];

    if (this.registryCache) {
      // From registry
      Object.entries(this.registryCache).forEach(([ruleId, ruleData]) => {
        rules.push(this.normalizeRule({ id: ruleId, ...ruleData }));
      });
    } else {
      // From cache
      rules.push(...this.rulesCache.values());
    }

    return rules;
  }

  /**
   * Get all rule IDs
   */
  getAllRuleIds() {
    if (this.registryCache) {
      return Object.keys(this.registryCache);
    }
    return Array.from(this.rulesCache.keys());
  }

  /**
   * Validate rule ID
   */
  isValidRuleId(ruleId) {
    return this.getAllRuleIds().includes(ruleId);
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category) {
    return this.getAllRules().filter(rule => 
      rule.category && rule.category.toLowerCase() === category.toLowerCase()
    );
  }

  /**
   * Get rules by principles (enhanced for category filtering)
   */
  getRulesByPrinciples(principles) {
    const principlesArray = Array.isArray(principles) ? principles : [principles];
    return this.getAllRules().filter(rule => {
      if (!rule.principles || rule.principles.length === 0) return false;
      return principlesArray.some(principle => 
        rule.principles.some(rulePrinciple => 
          rulePrinciple.toLowerCase().includes(principle.toLowerCase())
        )
      );
    });
  }

  /**
   * Get rules for specific category using core files approach
   * Based on actual principles in the rule catalog
   */
  getRulesByStandardCategory(category) {
    // Use centralized mapping instead of hardcoded
    const principles = getCategoryPrinciples(category);
    if (!principles || principles.length === 0) {
      console.warn(`⚠️  Unknown category: ${category}`);
      return [];
    }

    return this.getRulesByPrinciples(principles);
  }

  /**
   * Get rules from core files only (common-en.md + security-en.md)
   * This follows the standardization approach for category commands
   */
  getCoreRules() {
    // For now, we filter by source files if available in metadata
    // In future, we can enhance this to track source files
    return this.getAllRules().filter(rule => {
      // If we have metadata about source files, use it
      if (rule.sourceFile) {
        return rule.sourceFile.includes('common-en') || 
               rule.sourceFile.includes('security-en');
      }
      
      // Fallback: include rules that don't seem language-specific
      const languageSpecificPrefixes = ['T0', 'J0', 'D0', 'K0', 'SW0', 'P0', 'R0'];
      const isLanguageSpecific = languageSpecificPrefixes.some(prefix => 
        rule.id.startsWith(prefix)
      );
      
      return !isLanguageSpecific;
    });
  }

  /**
   * Get standardized category rules (core files + principle filtering)
   * This is the recommended method for --security, --quality, etc.
   */
  getStandardCategoryRules(category) {
    const coreRules = this.getCoreRules();
    
    // Use centralized mapping
    const principles = getCategoryPrinciples(category);
    if (!principles || principles.length === 0) {
      console.warn(`⚠️  Unknown standard category: ${category}`);
      return [];
    }

    // Filter core rules by principles
    return coreRules.filter(rule => {
      if (!rule.principles || rule.principles.length === 0) return false;
      return principles.some(principle => 
        rule.principles.some(rulePrinciple => 
          rulePrinciple.toLowerCase().includes(principle.toLowerCase())
        )
      );
    });
  }

  /**
   * Search rules by text
   */
  searchRules(query) {
    const lowerQuery = query.toLowerCase();
    return this.getAllRules().filter(rule => 
      rule.id.toLowerCase().includes(lowerQuery) ||
      rule.name.toLowerCase().includes(lowerQuery) ||
      rule.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get rules summary
   */
  getRulesSummary() {
    const rules = this.getAllRules();
    const categories = {};
    
    rules.forEach(rule => {
      const category = rule.category || 'unknown';
      categories[category] = (categories[category] || 0) + 1;
    });

    return {
      total: rules.length,
      categories: categories,
      source: this.registryCache ? 'registry' : 'origin-rules'
    };
  }

  /**
   * Filter rules by criteria (unified interface)
   */
  filterRules(criteria = {}) {
    const {
      ruleIds,
      categories,
      principles,
      status = 'activated',
      engines,
      severity
    } = criteria;

    let rules = this.getAllRules();

    // Filter by rule IDs
    if (ruleIds && ruleIds.length > 0) {
      rules = rules.filter(rule => ruleIds.includes(rule.id));
    }

    // Filter by categories
    if (categories && categories.length > 0) {
      rules = rules.filter(rule => 
        categories.some(cat => 
          rule.category && rule.category.toLowerCase() === cat.toLowerCase()
        )
      );
    }

    // Filter by principles
    if (principles && principles.length > 0) {
      rules = rules.filter(rule => {
        if (!rule.principles) return false;
        return principles.some(principle => 
          rule.principles.some(rp => 
            rp.toLowerCase().includes(principle.toLowerCase())
          )
        );
      });
    }

    // Filter by status
    if (status) {
      rules = rules.filter(rule => 
        rule.status && rule.status.toLowerCase() === status.toLowerCase()
      );
    }

    // Filter by severity
    if (severity) {
      rules = rules.filter(rule => 
        rule.severity && rule.severity.toLowerCase() === severity.toLowerCase()
      );
    }

    return rules;
  }

  /**
   * Generate AI context for specific rules
   */
  generateAIContext(ruleIds) {
    const rules = ruleIds.map(id => this.getRuleById(id)).filter(Boolean);
    
    return rules.map(rule => ({
      id: rule.id,
      title: rule.name,
      description: rule.description,
      details: Array.isArray(rule.details) ? rule.details.join('\n') : rule.details,
      category: rule.category,
      severity: rule.severity,
      principles: rule.principles
    }));
  }

  /**
   * Get configuration for specific engine
   */
  getEngineRules(engine = 'heuristic') {
    const allRules = this.getAllRules();
    
    switch (engine.toLowerCase()) {
      case 'heuristic':
        // Heuristic engine supports most rules except ESLint-specific
        return allRules.filter(rule => !rule.id.startsWith('T'));
      
      case 'eslint':
        // ESLint engine supports TypeScript rules and some C-series
        return allRules.filter(rule => 
          rule.id.startsWith('T') || 
          ['C006', 'C010', 'C019', 'C029', 'C031'].includes(rule.id)
        );
      
      case 'ai':
        // AI engine supports all rules
        return allRules;
      
      default:
        return allRules;
    }
  }

  /**
   * Clear cache and reinitialize
   */
  async refresh(options = {}) {
    this.rulesCache.clear();
    this.registryCache = null;
    this.isInitialized = false;
    return await this.initialize(options);
  }
}

module.exports = SunlintRuleAdapter;
