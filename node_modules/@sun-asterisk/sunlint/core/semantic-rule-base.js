/**
 * SunLint Semantic Rule Base
 * Base class for semantic analysis rules using shared Symbol Table
 * 
 * Provides common functionality for semantic rules in SunLint
 */

const path = require('path');

class SemanticRuleBase {
  constructor(ruleId, config = {}) {
    this.ruleId = ruleId;
    this.config = {
      // Rule metadata
      category: config.category || 'semantic',
      severity: config.severity || 'warning',
      description: config.description || '',
      
      // Analysis options
      crossFileAnalysis: config.crossFileAnalysis !== false,
      requiresTypeChecker: config.requiresTypeChecker || false,
      cacheResults: config.cacheResults !== false,
      
      // Performance
      timeout: config.timeout || 30000, // 30 seconds
      maxFiles: config.maxFiles || 1000,
      
      ...config
    };
    
    this.semanticEngine = null;
    this.violations = [];
    this.stats = {
      filesAnalyzed: 0,
      violationsFound: 0,
      analysisTime: 0,
      cacheHits: 0
    };
  }

  /**
   * Initialize rule with SemanticEngine instance
   */
  initialize(semanticEngine, options = {}) {
    this.semanticEngine = semanticEngine;
    
    if (!this.semanticEngine || !this.semanticEngine.initialized) {
      throw new Error(`${this.ruleId}: SemanticEngine is required and must be initialized`);
    }
    
    if (options?.verbose) {
      console.log(`🔧 Rule ${this.ruleId} initialized with semantic analysis`);
    }
  }

  /**
   * Main analysis method - to be overridden by specific rules
   */
  async analyze(filePaths, options = {}) {
    const startTime = Date.now();
    this.violations = [];
    
    try {
      console.log(`🔍 ${this.ruleId}: Starting semantic analysis...`);
      
      // Filter and validate files
      const validFiles = await this.filterFiles(filePaths);
      
      if (validFiles.length === 0) {
        console.log(`ℹ️  ${this.ruleId}: No valid files to analyze`);
        return this.generateReport();
      }
      
      // Analyze each file
      for (const filePath of validFiles) {
        await this.analyzeFile(filePath, options);
        this.stats.filesAnalyzed++;
        
        // Check timeout
        if (Date.now() - startTime > this.config.timeout) {
          console.warn(`⚠️  ${this.ruleId}: Analysis timeout reached`);
          break;
        }
      }
      
      this.stats.analysisTime = Date.now() - startTime;
      this.stats.violationsFound = this.violations.length;
      
      console.log(`✅ ${this.ruleId}: Analysis complete - ${this.violations.length} violations found`);
      
      return this.generateReport();
      
    } catch (error) {
      console.error(`❌ ${this.ruleId}: Analysis failed:`, error.message);
      throw error;
    }
  }

  /**
   * Analyze single file - to be overridden by specific rules
   */
  async analyzeFile(filePath, options = {}) {
    throw new Error(`${this.ruleId}: analyzeFile() method must be implemented by subclass`);
  }

  /**
   * Filter files based on rule requirements
   */
  async filterFiles(filePaths) {
    const filtered = [];
    
    for (const filePath of filePaths) {
      // Check file extension
      if (this.isValidFileType(filePath)) {
        // Check if file exists in Symbol Table
        try {
          const symbolTable = await this.semanticEngine.getSymbolTable(filePath);
          if (symbolTable) {
            filtered.push(filePath);
          }
        } catch (error) {
          console.warn(`⚠️  ${this.ruleId}: Cannot analyze ${filePath}:`, error.message);
        }
      }
    }
    
    return filtered.slice(0, this.config.maxFiles);
  }

  /**
   * Check if file type is supported by this rule
   */
  isValidFileType(filePath) {
    const supportedExtensions = ['.ts', '.tsx', '.js', '.jsx'];
    const ext = path.extname(filePath);
    return supportedExtensions.includes(ext);
  }

  /**
   * Get Symbol Table for a file with caching
   */
  async getSymbolTable(filePath) {
    const startTime = Date.now();
    
    try {
      const symbolTable = await this.semanticEngine.getSymbolTable(filePath);
      
      if (symbolTable) {
        this.stats.cacheHits++;
      }
      
      return symbolTable;
      
    } catch (error) {
      console.warn(`⚠️  ${this.ruleId}: Failed to get symbol table for ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Add a violation
   */
  addViolation(violation) {
    const enhancedViolation = {
      ruleId: this.ruleId,
      category: this.config.category,
      severity: this.config.severity,
      timestamp: Date.now(),
      
      // Required fields
      filePath: violation.filePath,
      line: violation.line,
      column: violation.column || 1,
      message: violation.message,
      
      // Optional fields
      endLine: violation.endLine,
      endColumn: violation.endColumn,
      suggestion: violation.suggestion,
      codeSnippet: violation.codeSnippet,
      
      // Semantic analysis context
      symbolContext: violation.symbolContext,
      crossFileReferences: violation.crossFileReferences,
      semanticDetails: violation.semanticDetails,
      
      ...violation
    };
    
    this.violations.push(enhancedViolation);
  }

  /**
   * Common semantic analysis utilities
   */
  
  /**
   * Find function calls by name with semantic context
   */
  findFunctionCalls(symbolTable, functionName) {
    return symbolTable.functionCalls.filter(call => 
      call.functionName === functionName ||
      call.functionName.includes(functionName)
    );
  }

  /**
   * Find method calls on specific objects
   */
  findMethodCalls(symbolTable, objectName, methodName) {
    return symbolTable.methodCalls.filter(call =>
      call.objectName === objectName && call.methodName === methodName
    );
  }

  /**
   * Check if a function call is within a retry context
   */
  isInRetryContext(symbolTable, functionCall) {
    // Check parent call stack for retry patterns
    const retryPatterns = ['retry', 'retries', 'withRetry', 'retryWhen'];
    
    if (functionCall.parentContext) {
      return retryPatterns.some(pattern => 
        functionCall.parentContext.includes(pattern)
      );
    }
    
    // Check nearby calls (previous/next lines)
    const nearbyLines = this.getNearbyLines(symbolTable, functionCall.line, 5);
    return nearbyLines.some(line => 
      retryPatterns.some(pattern => line.includes(pattern))
    );
  }

  /**
   * Get nearby lines for context analysis
   */
  getNearbyLines(symbolTable, targetLine, range = 3) {
    const lines = [];
    
    // Collect all calls around target line
    const allCalls = [
      ...symbolTable.functionCalls,
      ...symbolTable.methodCalls,
      ...symbolTable.hooks
    ];
    
    const nearbyCalls = allCalls.filter(call => 
      Math.abs(call.line - targetLine) <= range
    );
    
    return nearbyCalls.map(call => ({
      line: call.line,
      text: call.functionName || call.methodName || call.hookName
    }));
  }

  /**
   * Analyze React hooks for retry patterns
   */
  analyzeHooksForRetry(symbolTable) {
    const retryHooks = [];
    
    symbolTable.hooks.forEach(hook => {
      if (hook.isQueryHook && hook.retryConfig.hasRetryConfig) {
        retryHooks.push({
          ...hook,
          hasMultiLayerRetry: this.checkMultiLayerRetry(symbolTable, hook)
        });
      }
    });
    
    return retryHooks;
  }

  /**
   * Check for multi-layer retry patterns
   */
  checkMultiLayerRetry(symbolTable, queryHook) {
    // Look for additional retry mechanisms near the query hook
    const nearbyLines = this.getNearbyLines(symbolTable, queryHook.line, 10);
    
    // Check for retry patterns in nearby code
    const retryPatterns = nearbyLines.filter(line => 
      /retry|retries|attempt/i.test(line.text)
    );
    
    return retryPatterns.length > 1; // Multiple retry mechanisms
  }

  /**
   * Cross-file analysis utilities
   */
  
  /**
   * Find symbol usages across files
   */
  async findCrossFileUsages(symbolName, excludeFiles = []) {
    if (!this.config.crossFileAnalysis) {
      return [];
    }
    
    const usages = [];
    const allFiles = this.semanticEngine.project.getSourceFiles();
    
    for (const sourceFile of allFiles) {
      const filePath = sourceFile.getFilePath();
      
      if (excludeFiles.includes(filePath)) {
        continue;
      }
      
      const symbolTable = await this.getSymbolTable(filePath);
      if (!symbolTable) continue;
      
      // Search in various symbol collections
      const foundUsages = [
        ...this.searchInCollection(symbolTable.functionCalls, symbolName),
        ...this.searchInCollection(symbolTable.methodCalls, symbolName),
        ...this.searchInCollection(symbolTable.imports, symbolName),
        ...this.searchInCollection(symbolTable.variables, symbolName)
      ];
      
      foundUsages.forEach(usage => {
        usages.push({
          ...usage,
          filePath,
          crossFileReference: true
        });
      });
    }
    
    return usages;
  }

  searchInCollection(collection, symbolName) {
    return collection.filter(item => 
      item.name === symbolName ||
      item.functionName === symbolName ||
      item.methodName === symbolName ||
      (item.namedImports && item.namedImports.some(imp => imp.name === symbolName))
    );
  }

  /**
   * Generate analysis report
   */
  generateReport() {
    return {
      ruleId: this.ruleId,
      config: this.config,
      violations: this.violations,
      stats: this.stats,
      summary: {
        filesAnalyzed: this.stats.filesAnalyzed,
        violationsFound: this.stats.violationsFound,
        analysisTime: this.stats.analysisTime,
        averageTimePerFile: this.stats.filesAnalyzed > 0 
          ? Math.round(this.stats.analysisTime / this.stats.filesAnalyzed)
          : 0
      }
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.violations = [];
    this.stats = {
      filesAnalyzed: 0,
      violationsFound: 0,
      analysisTime: 0,
      cacheHits: 0
    };
  }

  /**
   * Validation helpers
   */
  
  validateRequiredFields(violation) {
    const required = ['filePath', 'line', 'message'];
    const missing = required.filter(field => !violation[field]);
    
    if (missing.length > 0) {
      throw new Error(`${this.ruleId}: Missing required violation fields: ${missing.join(', ')}`);
    }
  }

  /**
   * Code snippet extraction
   */
  extractCodeSnippet(symbolTable, line, range = 2) {
    // This would need implementation based on source file access
    // For now, return a placeholder
    return {
      startLine: Math.max(1, line - range),
      endLine: line + range,
      code: `// Code snippet around line ${line}`
    };
  }

  /**
   * Get current violations
   */
  getViolations() {
    return this.violations;
  }

  /**
   * Clear violations (for reuse)
   */
  clearViolations() {
    this.violations = [];
    this.stats.violationsFound = 0;
  }

  /**
   * Suggestion generation
   */
  generateSuggestion(violationType, context = {}) {
    // Base suggestions - to be overridden by specific rules
    const suggestions = {
      'multi-layer-retry': 'Consider consolidating retry logic into a single mechanism to avoid conflicts',
      'redundant-retry': 'Remove redundant retry configuration to simplify error handling',
      'missing-retry': 'Add retry configuration for better resilience'
    };
    
    return suggestions[violationType] || 'Review this code for best practices';
  }
}

module.exports = SemanticRuleBase;
