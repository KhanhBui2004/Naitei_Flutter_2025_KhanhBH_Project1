/**
 * C075 Rule: Functions must have explicit return type declarations
 * Ensures type safety by requiring explicit return type annotations
 * Severity: warning
 * Category: Quality
 */

const fs = require('fs');
const path = require('path');

class C075ExplicitReturnTypesAnalyzer {
  constructor() {
    this.ruleId = 'C075';
    this.ruleName = 'Explicit Function Return Types';
    this.description = 'Functions must have explicit return type declarations';
    this.severity = 'warning';
  }

  async analyze(files, language, config) {
    const violations = [];

    for (const filePath of files) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const fileViolations = await this.analyzeFile(filePath, fileContent, language, config);
        violations.push(...fileViolations);
      } catch (error) {
        console.warn(`C075 analysis error for ${filePath}:`, error.message);
      }
    }

    return violations;
  }

  async analyzeFile(filePath, fileContent, language, config) {
    const violations = [];
    
    try {
      // Skip non-TypeScript files
      if (!this.isTypeScriptFile(filePath)) {
        return violations;
      }

      // Simple regex-based analysis for now
      const lines = fileContent.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;
        
        // Look for function declarations without return types
        const functionPatterns = [
          /^(\s*)(function\s+\w+\s*\([^)]*\))\s*\{/,  // function name() {
          /^(\s*)(export\s+function\s+\w+\s*\([^)]*\))\s*\{/, // export function name() {
          /^(\s*)(\w+\s*=\s*function\s*\([^)]*\))\s*\{/, // name = function() {
          /^(\s*)(\w+\s*=\s*\([^)]*\)\s*=>\s*)\{/, // name = () => {
          /^(\s*)(\w+\([^)]*\))\s*\{/, // method() {
        ];

        for (const pattern of functionPatterns) {
          const match = line.match(pattern);
          if (match) {
            const fullMatch = match[2];
            
            // Skip if already has return type annotation
            if (fullMatch.includes('):') || line.includes('):')) {
              continue;
            }

            // Skip constructors
            if (fullMatch.includes('constructor')) {
              continue;
            }

            violations.push({
              ruleId: this.ruleId,
              severity: this.severity,
              message: `Function is missing explicit return type annotation`,
              filePath: filePath,
              line: lineNumber,
              column: match[1].length + 1,
              source: line.trim(),
              suggestion: 'Add explicit return type annotation (: ReturnType)'
            });
          }
        }
      }

    } catch (error) {
      console.warn(`C075 analysis error for ${filePath}:`, error.message);
    }

    return violations;
  }

  isTypeScriptFile(filePath) {
    return /\.(ts|tsx)$/.test(filePath);
  }
}

module.exports = C075ExplicitReturnTypesAnalyzer;

module.exports = C075ExplicitReturnTypesAnalyzer;
