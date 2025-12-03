/**
 * S007 Semantic Wrapper
 * Integrates S007SemanticAnalyzer with HeuristicEngine
 * Provides compatibility layer between semantic analysis and existing framework
 */

const S007SemanticAnalyzer = require('./semantic-analyzer');
const SemanticRuleBase = require('../../../core/semantic-rule-base');

class S007SemanticWrapper extends SemanticRuleBase {
  constructor(options = {}) {
    super('S007', {
      category: 'security',
      severity: 'error',
      description: 'Detects plaintext OTP storage and transmission using semantic analysis',
      crossFileAnalysis: true,
      requiresTypeChecker: false,
      cacheResults: true,
      ...options
    });
    
    this.semanticAnalyzer = new S007SemanticAnalyzer('S007');
    this.verbose = options.verbose || false;
  }

  /**
   * Initialize with semantic engine
   */
  async initialize(semanticEngine) {
    await super.initialize(semanticEngine);
    
    // Initialize the semantic analyzer
    await this.semanticAnalyzer.initialize(semanticEngine);
    
    if (this.verbose) {
      console.log(`🧠 S007SemanticWrapper initialized with semantic engine`);
    }
  }

  /**
   * Analyze single file using semantic analysis
   */
  async analyzeFile(filePath, options = {}) {
    if (this.verbose) {
      console.log(`🧠 S007: Analyzing ${filePath} with semantic analysis`);
    }

    try {
      // Delegate to semantic analyzer
      await this.semanticAnalyzer.analyzeFile(filePath, options);
      
      // Get violations from semantic analyzer
      const semanticViolations = this.semanticAnalyzer.getViolations();
      
      // Add violations to our collection
      for (const violation of semanticViolations) {
        this.addViolation(violation);
      }
      
      // Clear violations from semantic analyzer for next file
      this.semanticAnalyzer.clearViolations();
      
      if (this.verbose && semanticViolations.length > 0) {
        console.log(`🧠 S007: Found ${semanticViolations.length} semantic violations in ${filePath}`);
      }
      
    } catch (error) {
      console.error(`❌ S007: Semantic analysis failed for ${filePath}:`, error.message);
      
      // Fallback to regex analysis if semantic fails
      if (options.fallbackToRegex !== false) {
        await this.fallbackToRegexAnalysis(filePath, options);
      }
    }
  }

  /**
   * Fallback to regex analysis if semantic analysis fails
   */
  async fallbackToRegexAnalysis(filePath, options) {
    try {
      if (this.verbose) {
        console.log(`⚠️ S007: Falling back to regex analysis for ${filePath}`);
      }
      
      // Use the existing regex analyzer as fallback
      const RegexAnalyzer = require('./analyzer');
      const regexAnalyzer = new RegexAnalyzer();
      
      const regexViolations = await regexAnalyzer.analyze([filePath], 'typescript', options);
      
      // Add regex violations with lower confidence
      for (const violation of regexViolations) {
        this.addViolation({
          ...violation,
          analysisMethod: 'regex_fallback',
          confidence: 0.7, // Lower confidence for fallback
          source: 'regex_analyzer'
        });
      }
      
      if (this.verbose && regexViolations.length > 0) {
        console.log(`🔧 S007: Found ${regexViolations.length} regex violations (fallback) in ${filePath}`);
      }
      
    } catch (fallbackError) {
      console.error(`❌ S007: Fallback analysis also failed for ${filePath}:`, fallbackError.message);
    }
  }

  /**
   * Get supported file types
   */
  isValidFileType(filePath) {
    const supportedExtensions = ['.ts', '.tsx', '.js', '.jsx'];
    const path = require('path');
    const ext = path.extname(filePath);
    return supportedExtensions.includes(ext);
  }

  /**
   * Enhanced violation adding with semantic context
   */
  addViolation(violation) {
    const enhancedViolation = {
      ...violation,
      
      // Add semantic metadata
      analysisEngine: 'semantic',
      analysisMethod: violation.analysisMethod || 'semantic',
      confidence: violation.confidence || 0.9,
      timestamp: Date.now(),
      
      // Ensure required fields
      ruleId: this.ruleId,
      category: this.config.category,
      severity: violation.severity || this.config.severity,
      
      // Add semantic-specific fields
      semanticContext: violation.symbolContext || {},
      crossFileReferences: violation.crossFileReferences || [],
      dataFlowAnalysis: violation.dataFlowAnalysis || null,
      
      // Enhanced suggestions for semantic violations
      suggestion: this.enhanceSemanticSuggestion(violation),
      
      // Code context
      codeSnippet: violation.codeSnippet || null,
      
      // Metadata
      metadata: {
        engineVersion: '3.0',
        analysisType: 'semantic',
        symbolTableUsed: true,
        crossFileAnalysis: this.config.crossFileAnalysis,
        ...violation.metadata
      }
    };
    
    super.addViolation(enhancedViolation);
  }

  /**
   * Enhance suggestions with semantic context
   */
  enhanceSemanticSuggestion(violation) {
    const baseSuggestion = violation.suggestion || 'Ensure OTP security best practices';
    
    // Add context-specific suggestions based on semantic analysis
    const contextSuggestions = [];
    
    if (violation.symbolContext) {
      const context = violation.symbolContext;
      
      if (context.operation) {
        contextSuggestions.push(`Consider replacing '${context.operation}' with a secure alternative`);
      }
      
      if (context.dataFlow && context.dataFlow.length > 1) {
        contextSuggestions.push('Review the data flow path to identify where encryption should be applied');
      }
      
      if (context.crossFileReferences && context.crossFileReferences.length > 0) {
        contextSuggestions.push('Ensure security measures are consistent across all files using this OTP symbol');
      }
    }
    
    // Combine base suggestion with context-specific suggestions
    if (contextSuggestions.length > 0) {
      return `${baseSuggestion}. Additional recommendations: ${contextSuggestions.join('; ')}.`;
    }
    
    return baseSuggestion;
  }

  /**
   * Generate analysis report with semantic insights
   */
  generateReport() {
    const baseReport = super.generateReport();
    
    // Add semantic-specific statistics
    const semanticStats = this.calculateSemanticStats();
    
    return {
      ...baseReport,
      semanticAnalysis: {
        enabled: true,
        symbolTableUsed: true,
        crossFileAnalysisPerformed: this.config.crossFileAnalysis,
        dataFlowAnalysisPerformed: true,
        statistics: semanticStats
      }
    };
  }

  /**
   * Calculate semantic analysis statistics
   */
  calculateSemanticStats() {
    const violations = this.getViolations();
    
    const stats = {
      totalViolations: violations.length,
      violationsByType: {},
      violationsByContext: {},
      averageConfidence: 0,
      crossFileViolations: 0,
      dataFlowViolations: 0
    };
    
    // Analyze violation types and contexts
    for (const violation of violations) {
      // Count by type
      const type = violation.type || 'unknown';
      stats.violationsByType[type] = (stats.violationsByType[type] || 0) + 1;
      
      // Count by context
      if (violation.symbolContext && violation.symbolContext.usageContext) {
        const context = violation.symbolContext.usageContext;
        stats.violationsByContext[context] = (stats.violationsByContext[context] || 0) + 1;
      }
      
      // Count cross-file violations
      if (violation.crossFileReferences && violation.crossFileReferences.length > 0) {
        stats.crossFileViolations++;
      }
      
      // Count data flow violations
      if (violation.dataFlowAnalysis) {
        stats.dataFlowViolations++;
      }
    }
    
    // Calculate average confidence
    if (violations.length > 0) {
      const totalConfidence = violations.reduce((sum, v) => sum + (v.confidence || 0.9), 0);
      stats.averageConfidence = totalConfidence / violations.length;
    }
    
    return stats;
  }

  /**
   * Cleanup semantic resources
   */
  async cleanup() {
    if (this.semanticAnalyzer && typeof this.semanticAnalyzer.cleanup === 'function') {
      await this.semanticAnalyzer.cleanup();
    }
    
    await super.cleanup();
    
    if (this.verbose) {
      console.log(`🧠 S007SemanticWrapper cleanup completed`);
    }
  }
}

module.exports = S007SemanticWrapper;
