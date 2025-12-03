/**
 * C076 Main Analyzer - Explicit Function Argument Types
 * 
 * SEMANTIC-ONLY RULE:
 * This rule requires ts-morph and semantic analysis for accurate type checking.
 * No regex fallback is provided because type system analysis cannot be reliably
 * done with regex patterns.
 * 
 * Primary: Symbol-based analysis (100% of cases)
 * Fallback: None - will gracefully fail if ts-morph unavailable
 */

const C076SemanticAnalyzer = require('./semantic-analyzer');

class C076Analyzer {
  constructor(semanticEngine = null) {
    this.ruleId = 'C076';
    this.ruleName = 'Explicit Function Argument Types';
    this.description = 'All public functions must declare explicit types for arguments';
    this.semanticEngine = semanticEngine;
    this.verbose = false;
    
    // Initialize analyzer
    this.semanticAnalyzer = new C076SemanticAnalyzer();
    
    // Configuration - semantic only
    this.config = {
      semanticOnly: true,        // This rule requires semantic analysis
      fallbackToRegex: false,    // No regex fallback available
      requiresTypeChecker: true  // Type checker is mandatory
    };
  }

  /**
   * Initialize with semantic engine
   */
  async initialize(semanticEngine = null) {
    if (semanticEngine) {
      this.semanticEngine = semanticEngine;
    }
    this.verbose = semanticEngine?.verbose || false;
    
    // Check if semantic engine is available
    if (!this.semanticEngine?.project) {
      if (this.verbose) {
        console.log(`[DEBUG] ⚠️  C076: No semantic engine available - this rule requires ts-morph for type analysis`);
      }
      return false;
    }
    
    // Initialize semantic analyzer
    await this.semanticAnalyzer.initialize(semanticEngine);
    
    if (this.verbose) {
      console.log(`[DEBUG] 🔧 C076: Analyzer initialized - Semantic-only mode ✅`);
    }
    
    return true;
  }

  async analyze(files, language, options = {}) {
    const violations = [];
    
    // Check if semantic engine is available
    if (!this.semanticEngine?.project) {
      if (this.verbose) {
        console.log(`[DEBUG] ❌ C076: Skipping analysis - semantic engine required but not available`);
        console.log(`[DEBUG] 💡 C076: Install ts-morph and ensure TypeScript project setup for type checking`);
      }
      return violations;
    }

    let analyzedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
      if (file.language === 'typescript' || file.language === 'javascript') {
        try {
          const fileViolations = await this.analyzeFile(file.path, options);
          violations.push(...fileViolations);
          analyzedCount++;
        } catch (error) {
          skippedCount++;
          if (this.verbose) {
            console.log(`[DEBUG] ⚠️  C076: Error analyzing ${file.path}: ${error.message}`);
          }
        }
      } else {
        skippedCount++;
      }
    }

    // Summary
    if (this.verbose && (analyzedCount > 0 || skippedCount > 0)) {
      console.log(`[DEBUG] 📊 C076: Analysis summary:`);
      console.log(`[DEBUG]    🧠 Semantic analysis: ${analyzedCount} files`);
      console.log(`[DEBUG]    ⏭️  Skipped: ${skippedCount} files`);
      console.log(`[DEBUG]    📈 Type-checked: ${analyzedCount}/${analyzedCount + skippedCount} files`);
    }
    
    return violations;
  }

  async analyzeFile(filePath, options = {}) {
    // Check if semantic engine and type checker are available
    if (!this.semanticEngine?.project) {
      if (this.verbose) {
        console.log(`[DEBUG] ⚠️  C076: ${filePath}: No semantic engine - type analysis requires ts-morph`);
      }
      return [];
    }

    try {
      const sourceFile = this.semanticEngine.project.getSourceFileByFilePath(filePath);
      if (sourceFile) {
        const violations = await this.semanticAnalyzer.analyzeFileBasic(filePath, options);
        
        if (this.verbose) {
          console.log(`[DEBUG] 🧠 C076: ${filePath}: Found ${violations.length} violations`);
        }
        
        return violations.map(v => ({ 
          ...v, 
          analysisStrategy: 'semantic-only',
          requiresTypeChecker: true 
        }));
      } else {
        if (this.verbose) {
          console.log(`[DEBUG] ⚠️  C076: ${filePath}: Source file not found in ts-morph project`);
        }
        return [];
      }
    } catch (error) {
      if (this.verbose) {
        console.log(`[DEBUG] ❌ C076: ${filePath}: Semantic analysis failed: ${error.message}`);
      }
      return [];
    }
  }

  // Compatibility method for heuristic engine
  async analyzeFileBasic(filePath, options = {}) {
    return await this.analyzeFile(filePath, options);
  }

  // Configuration methods
  enableSemanticOnly() {
    this.config.semanticOnly = true;
    this.config.fallbackToRegex = false;
  }

  // Information methods
  getCapabilities() {
    return {
      requiresSemanticEngine: true,
      requiresTypeChecker: true,
      supportsRegexFallback: false,
      analysisAccuracy: 'high',
      recommendedFor: 'TypeScript projects with strict type checking'
    };
  }

  getRequirements() {
    return {
      dependencies: ['ts-morph'],
      projectSetup: 'TypeScript project with tsconfig.json',
      minimumAccuracy: 'semantic-only'
    };
  }
}

module.exports = C076Analyzer;
