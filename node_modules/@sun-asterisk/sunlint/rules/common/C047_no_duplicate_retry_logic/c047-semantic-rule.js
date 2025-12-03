/**
 * C047 Semantic Rule - Adapted for Shared Symbol Table
 */

const C047SymbolAnalyzerEnhanced = require('./symbol-analyzer-enhanced');

class C047SemanticRule extends C047SymbolAnalyzerEnhanced {
  constructor(options = {}) {
    super();
    this.options = options;
    this.verbose = options.verbose || false; // Store verbose setting
    this.currentViolations = []; // Store violations for heuristic engine compatibility
  }

  /**
   * Initialize the semantic rule (required by heuristic engine)
   */
  async initialize(semanticEngine = null) {
    if (this.verbose) {
      console.log(`[DEBUG] 🔧 Initializing C047 semantic rule...`);
    }
    // Store semantic engine reference if provided
    if (semanticEngine) {
      this.semanticEngine = semanticEngine;
    }
    // Load configuration from parent class
    await this.loadConfiguration();
    if (this.verbose) {
      console.log(`[DEBUG] ✅ C047 semantic rule initialized`);
    }
  }

  /**
   * Analyze single file (required by heuristic engine)
   */
  async analyzeFile(filePath, options = {}) {
    if (this.verbose) {
      console.log(`[DEBUG] 🔍 C047: Analyzing file ${filePath}`);
    }
    try {
      // Use parent analyze method for single file
      const violations = await this.analyze([filePath], 'typescript', options);
      this.currentViolations = violations || [];
      if (this.verbose || options.verbose) {
        console.log(`✅ C047: Found ${this.currentViolations.length} violations in ${filePath}`);
      }
    } catch (error) {
      if (this.verbose || options.verbose) {
        console.error(`❌ C047 analysis failed for ${filePath}:`, error.message);
      }
      this.currentViolations = [];
    }
  }

  /**
   * Get violations (required by heuristic engine)
   */
  getViolations() {
    return this.currentViolations;
  }

  /**
   * Clear violations (required by heuristic engine)
   */
  clearViolations() {
    this.currentViolations = [];
  }

  /**
   * New method: Analyze using shared Symbol Table
   * This is more efficient than creating separate ts-morph projects
   */
  async analyzeWithSymbolTable(symbolTable, options = {}) {
    if (this.verbose) {
      console.log(`[DEBUG] 🔍 C047 Semantic Rule: Using shared Symbol Table...`);
    }
    const startTime = Date.now();
    
    try {
      // Skip the project initialization since we use shared Symbol Table
      if (this.verbose) {
        console.log(`[DEBUG] 📋 Step 1: Using shared configuration...`);
      }
      await this.loadConfiguration();
      
      // Use shared Symbol Table instead of creating new project
      if (this.verbose) {
        console.log(`[DEBUG] 🏗️ Step 2: Using shared Symbol Table...`);
      }
      this.project = symbolTable.project;
      
      // Detect retry patterns using cached symbols
      if (this.verbose) {
        console.log(`[DEBUG] 🔍 Step 3: Detecting retry patterns with Symbol Table...`);
      }
      const allRetryPatterns = await this.detectRetryPatternsWithSymbolTable(symbolTable, options);
      if (this.verbose) {
        console.log(`[DEBUG] ✅ Pattern detection complete: ${allRetryPatterns.length} patterns`);
      }
      
      // Group by layers and flows
      if (this.verbose) {
        console.log(`[DEBUG] 📊 Step 4: Grouping patterns...`);
      }
      const layeredPatterns = this.groupByLayersAndFlows(allRetryPatterns);
      if (this.verbose) {
        console.log(`[DEBUG] ✅ Grouping complete`);
      }
      
      // Apply violation detection logic
      if (this.verbose) {
        console.log(`[DEBUG] ⚠️ Step 5: Detecting violations...`);
      }
      const violations = this.detectViolations(layeredPatterns);
      if (this.verbose) {
        console.log(`[DEBUG] ✅ Violation detection complete: ${violations.length} violations`);
      }
      
      const duration = Date.now() - startTime;
      if (this.verbose) {
        console.log(`[DEBUG] 🎯 C047 Semantic analysis complete in ${duration}ms!`);
      }
      
      if (options.verbose) {
        this.printAnalysisStats(allRetryPatterns, layeredPatterns, violations);
      }
      
      return violations;
      
    } catch (error) {
      console.error('❌ C047 Semantic rule failed:', error.message);
      return [];
    }
  }

  /**
   * Detect retry patterns using cached Symbol Table
   */
  async detectRetryPatternsWithSymbolTable(symbolTable, options) {
    if (this.verbose) {
      console.log(`[DEBUG] 🔍 Detecting retry patterns with Symbol Table...`);
    }
    const allPatterns = [];
    
    // Use cached source files from Symbol Table
    const sourceFiles = symbolTable.sourceFiles;
    if (this.verbose) {
      console.log(`[DEBUG] 📄 Found ${sourceFiles.length} source files in Symbol Table`);
    }
    
    for (let i = 0; i < sourceFiles.length; i++) {
      const sourceFile = sourceFiles[i];
      const fileName = sourceFile.getBaseName();
      
      if (this.verbose || options.verbose) {
        console.log(`[DEBUG]     🔍 Analyzing ${i + 1}/${sourceFiles.length}: ${fileName}`);
      }
      
      try {
        // Check if symbols are already cached
        const cachedSymbols = symbolTable.getSymbols(sourceFile.getFilePath());
        let filePatterns;
        
        if (cachedSymbols && this.options.useSymbolCache) {
          // Use cached symbols for faster analysis
          filePatterns = await this.analyzeWithCachedSymbols(sourceFile, cachedSymbols);
        } else {
          // Fallback to direct AST analysis
          filePatterns = await this.analyzeSourceFile(sourceFile);
        }
        
        allPatterns.push(...filePatterns);
        
        if (this.verbose || options.verbose) {
          console.log(`[DEBUG]     ✅ Found ${filePatterns.length} patterns in ${fileName}`);
        }
      } catch (error) {
        if (this.verbose) {
          console.warn(`[DEBUG]     ⚠️ Error analyzing ${fileName}: ${error.message}`);
        }
      }
    }
    
    if (this.verbose) {
      console.log(`[DEBUG] 🎯 Total patterns detected: ${allPatterns.length}`);
    }
    return allPatterns;
  }

  /**
   * Analyze using pre-cached symbols (faster)
   */
  async analyzeWithCachedSymbols(sourceFile, cachedSymbols) {
    const patterns = [];
    const filePath = sourceFile.getFilePath() || sourceFile.getBaseName();
    
    if (this.verbose) {
      console.log(`[DEBUG]   📁 Analyzing ${require('path').basename(filePath)} with cached symbols`);
    }
    
    // Process cached classes
    for (const classSymbol of cachedSymbols.classes) {
      if (this.verbose) {
        console.log(`[DEBUG]       📦 Cached class: ${classSymbol.name}`);
      }
      
      for (const methodName of classSymbol.methods) {
        const fullFunctionName = `${classSymbol.name}.${methodName}`;
        if (this.verbose) {
          console.log(`[DEBUG]           🎯 Cached method: ${fullFunctionName}`);
        }
        
        // Get the actual AST node for detailed analysis
        const classNode = sourceFile.getClasses().find(c => c.getName() === classSymbol.name);
        if (classNode) {
          const methodNode = classNode.getMethods().find(m => m.getName() === methodName);
          if (methodNode) {
            const patterns_found = await this.analyzeFunction(methodNode, fullFunctionName, filePath);
            patterns.push(...patterns_found);
          }
        }
      }
    }
    
    // Process cached functions
    for (const functionSymbol of cachedSymbols.functions) {
      if (this.verbose) {
        console.log(`[DEBUG]       🔧 Cached function: ${functionSymbol.name}`);
      }
      
      const functionNode = sourceFile.getFunctions().find(f => f.getName() === functionSymbol.name);
      if (functionNode) {
        const patterns_found = await this.analyzeFunction(functionNode, functionSymbol.name, filePath);
        patterns.push(...patterns_found);
      }
    }
    
    // Process cached variables (for React components)
    for (const variableSymbol of cachedSymbols.variables) {
      if (this.verbose) {
        console.log(`[DEBUG]       ⚡ Cached variable: ${variableSymbol.name}`);
      }
      
      const varDecl = sourceFile.getVariableDeclarations().find(v => v.getName() === variableSymbol.name);
      if (varDecl) {
        const initializer = varDecl.getInitializer();
        if (initializer && (initializer.getKind() === require('ts-morph').SyntaxKind.ArrowFunction || 
                            initializer.getKind() === require('ts-morph').SyntaxKind.FunctionExpression)) {
          
          // Check for useQuery calls with retry
          const useQueryPatterns = this.detectUseQueryRetryPatterns(initializer, variableSymbol.name, filePath);
          patterns.push(...useQueryPatterns);
          
          // Also analyze for standard retry patterns
          const patterns_found = await this.analyzeFunction(initializer, variableSymbol.name, filePath);
          patterns.push(...patterns_found);
        }
      }
    }
    
    if (this.verbose) {
      console.log(`[DEBUG]     📊 Total patterns found with cached symbols: ${patterns.length}`);
    }
    return patterns;
  }

  /**
   * Traditional analyze method (for backward compatibility)
   */
  async analyze(files, language, options = {}) {
    if (this.verbose) {
      console.log(`[DEBUG] ⚠️ C047: Using traditional analysis (consider upgrading to Symbol Table)`);
    }
    return super.analyze(files, language, options);
  }
}

module.exports = C047SemanticRule;
