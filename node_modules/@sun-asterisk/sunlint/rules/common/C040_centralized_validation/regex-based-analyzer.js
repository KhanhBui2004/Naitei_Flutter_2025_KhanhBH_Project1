/**
 * Regex-based analyzer for: C040 - Centralized Validation Logic
 * Purpose: Use regex patterns to detect scattered validation logic (fallback approach)
 */

class C040RegexBasedAnalyzer {
  constructor(semanticEngine = null) {
    this.ruleId = 'C040';
    this.ruleName = 'Centralized Validation Logic';
    this.description = 'Don\'t scatter validation logic across multiple classes - Move validation to dedicated validators';
    this.semanticEngine = semanticEngine;
    this.verbose = false;
    
    // Patterns for detecting validation logic
    this.validationPatterns = [
      // Function names (more specific - must be standalone words)
      /\b(?:validate|check|ensure|verify|sanitize|normalize)\w*/gi,
      /\b(?:is[A-Z][a-zA-Z]*|has[A-Z][a-zA-Z]*)\s*(?:\(|\s*:)/gi,
      
      // Validation frameworks
      /(?:zod|joi|yup|ajv)\.[\w.]+/gi,
      /(?:class-validator|validateSync|checkSchema)/gi,
      
      // Common validation patterns
      /\.test\s*\(\s*[^)]*(?:email|phone|url|uuid|password)/gi,
      /(?:email|phone|url|uuid).*\.match\s*\(/gi,
      /typeof\s+\w+\s*[!=]==?\s*['"](?:string|number|boolean)/gi,
      /\.length\s*[<>]=?\s*\d+/gi,
      
      // Error throwing patterns for validation
      /throw\s+new\s+(?:ValidationError|BadRequest|InvalidInput|TypeError)/gi,
      /if\s*\([^)]*(?:invalid|empty|null|undefined)\)\s*(?:throw|return.*error)/gi,
      
      // Schema validation patterns  
      /\.(?:required|optional|string|number|boolean|array|object)\(\)/gi,
      /\.(?:min|max|email|url|uuid|regex)\(\)/gi
    ];
    
    // Layer detection patterns
    this.layerPatterns = {
      controller: /\/controllers?\/|controller\.|Controller\./i,
      service: /\/services?\/|service\.|Service\./i,
      repository: /\/repositories?\/|repository\.|Repository\./i,
      validator: /\/validators?\/|validator\.|Validator\.|\/validation\//i,
      middleware: /\/middleware\//i
    };
  }

  async initialize(semanticEngine = null) {
    if (semanticEngine) {
      this.semanticEngine = semanticEngine;
    }
    this.verbose = semanticEngine?.verbose || false;
    
    if (this.verbose) {
      console.log(`[DEBUG] 🔄 C040 Regex-Based: Analyzer initialized`);
    }
  }

  async analyze(files, language, options = {}) {
    const violations = [];
    
    for (const filePath of files) {
      try {
        const fileViolations = await this.analyzeFileBasic(filePath, options);
        violations.push(...fileViolations);
      } catch (error) {
        if (this.verbose) {
          console.warn(`[C040 Regex] Analysis failed for ${filePath}:`, error.message);
        }
      }
    }
    
    return violations;
  }

  async analyzeFileBasic(filePath, options = {}) {
    try {
      const fs = require('fs');
      const content = fs.readFileSync(filePath, 'utf-8');
      const violations = [];
      
      const layer = this.detectLayer(filePath);
      const validationMatches = this.findValidationPatterns(content, filePath);
      
      if (validationMatches.length > 0) {
        // Check if validation logic is in wrong layer
        if (layer === 'controller' || layer === 'service') {
          const complexValidations = validationMatches.filter(match => 
            this.isComplexValidation(match.pattern)
          );
          
          if (complexValidations.length > 0) {
            violations.push({
              ruleId: this.ruleId,
              severity: 'warning',
              message: `Found ${complexValidations.length} validation pattern(s) in ${layer} layer. Consider moving to validators.`,
              file: filePath,
              line: complexValidations[0].line,
              column: complexValidations[0].column,
              details: {
                layer,
                validationCount: complexValidations.length,
                patterns: complexValidations.map(v => v.pattern),
                suggestion: 'Move validation logic to dedicated validator classes',
                ruleName: this.ruleName
              }
            });
          }
        }
        
        // Check for potential duplicates (simple heuristic)
        const duplicatePatterns = this.findPotentialDuplicates(validationMatches);
        if (duplicatePatterns.length > 0) {
          violations.push({
            ruleId: this.ruleId,
            severity: 'info',
            message: `Found potentially duplicate validation patterns: ${duplicatePatterns.join(', ')}`,
            file: filePath,
            line: validationMatches[0].line,
            column: validationMatches[0].column,
            details: {
              duplicatePatterns,
              suggestion: 'Consider consolidating similar validation logic',
              ruleName: this.ruleName
            }
          });
        }
      }
      
      return violations;
      
    } catch (error) {
      if (this.verbose) {
        console.warn(`[C040 Regex] Failed to analyze ${filePath}:`, error.message);
      }
      return [];
    }
  }

  detectLayer(filePath) {
    const path = filePath.toLowerCase();
    
    for (const [layer, pattern] of Object.entries(this.layerPatterns)) {
      if (pattern.test(path)) {
        return layer;
      }
    }
    
    return 'unknown';
  }

  findValidationPatterns(content, filePath) {
    const matches = [];
    const lines = content.split('\n');
    
    this.validationPatterns.forEach(pattern => {
      lines.forEach((line, lineIndex) => {
        const match = line.match(pattern);
        if (match) {
          matches.push({
            pattern: match[0],
            line: lineIndex + 1,
            column: line.indexOf(match[0]) + 1,
            type: 'regex',
            fullLine: line.trim()
          });
        }
      });
    });
    
    return matches;
  }

  isComplexValidation(pattern) {
    // Filter out false positives and keep only real validation patterns
    const excludePatterns = [
      /Promise/i,        // Promise types
      /Response/i,       // HTTP Response
      /Request/i,        // HTTP Request  
      /Service/i,        // Service classes
      /Controller/i,     // Controller classes
      /Repository/i,     // Repository classes
      /Interface/i,      // TypeScript interfaces
      /Type/i,          // Type definitions
      /Event/i,         // Event objects
      /Error/i,         // Error objects (unless ValidationError)
      /Component/i,     // React/Vue components
      /Module/i,        // Module definitions
      /Config/i,        // Configuration objects
      /Context/i,       // Context objects
      /Handler/i,       // Event handlers
      /Listener/i,      // Event listeners
      /Provider/i,      // Providers
      /Factory/i,       // Factory patterns
      /Builder/i,       // Builder patterns
      /Manager/i,       // Manager classes
      /Util/i,          // Utility functions
      /Helper/i         // Helper functions
    ];
    
    // Exclude common false positives
    if (excludePatterns.some(excludePattern => excludePattern.test(pattern))) {
      return false;
    }
    
    // Include validation-specific patterns
    const validationIndicators = [
      /validate/i,
      /check.*valid/i,
      /ensure.*valid/i,
      /verify/i,
      /sanitize/i,
      /normalize/i,
      /ValidationError/i,
      /BadRequest/i,
      /InvalidInput/i,
      /zod\./i,
      /joi\./i,
      /yup\./i,
      /\.required\(/i,
      /\.string\(/i,
      /\.email\(/i,
      /\.min\(/i,
      /\.max\(/i
    ];
    
    return validationIndicators.some(indicator => indicator.test(pattern));
  }

  findPotentialDuplicates(matches) {
    const patternCounts = {};
    
    matches.forEach(match => {
      const normalized = match.pattern.toLowerCase();
      patternCounts[normalized] = (patternCounts[normalized] || 0) + 1;
    });
    
    return Object.keys(patternCounts).filter(pattern => patternCounts[pattern] > 1);
  }
}

module.exports = C040RegexBasedAnalyzer;
