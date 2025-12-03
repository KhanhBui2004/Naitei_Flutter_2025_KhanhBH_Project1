/**
 * C052 Symbol-based Analyzer - Advanced Parsing or data transformation logic must be separated from controllers
 * Purpose: Use AST + Symbol controllers should only handle requests and delegate processing, improving testability, maintainability, and reuse.
 */

// c052-symbol-analyzer.js
const { SyntaxKind } = require("ts-morph");

class C052SymbolBasedAnalyzer {
  constructor(semanticEngine = null) {
    this.ruleId = "C052";
    this.ruleName =
      "Error bypass architectural layers (controller/service/repository) (Symbol-Based)";
    this.semanticEngine = semanticEngine;
    this.verbose = false;
  }

  async initialize(semanticEngine = null) {
    if (semanticEngine) {
      this.semanticEngine = semanticEngine;
    }
    this.verbose = semanticEngine?.verbose || false;
    if (process.env.SUNLINT_DEBUG) {
      console.log(
        `🔧 [C052 Symbol-Based] Analyzer initialized, verbose: ${this.verbose}`
      );
    }
  }

  async analyzeFileBasic(filePath, options = {}) {
    return await this.analyzeFileWithSymbols(filePath, options);
  }

  async analyzeFileWithSymbols(filePath, options = {}) {
    const violations = [];
    const verbose = options.verbose || this.verbose;

    if (!this.semanticEngine?.project) {
      if (verbose) {
        console.warn(
          "[C052 Symbol-Based] No semantic engine available, skipping analysis"
        );
      }
      return violations;
    }

    // Only check controller files
    if (!filePath.toLowerCase().includes('controller')) {
      return violations;
    }


    try {
      const sourceFile = this.semanticEngine.project.getSourceFile(filePath);
      if (!sourceFile) return violations;

      sourceFile.forEachDescendant((node) => {
        // Check suspicious call expressions
        if (node.getKind() === SyntaxKind.CallExpression) {
          const expression = node.getExpression();
          const exprText = expression.getText();

          // Known suspicious functions
          const suspicious = [
            "parseInt",
            "parseFloat",
            "JSON.parse",
            "JSON.stringify",
            "toLowerCase",
            "toUpperCase",
            "trim",
            "toISOString",
          ];

          for (const s of suspicious) {
            if (exprText.includes(s)) {
              violations.push({
                ruleId: this.ruleId,
                severity: "warning",
                message: `Controller should not perform data parsing or transformation directly (uses ${s}).`,
                source: this.ruleId,
                file: filePath,
                line: node.getStartLineNumber(),
                column: node.getStart() - node.getStartLinePos(),
                description: `[SYMBOL-BASED] Data parsing/transformation detected in controller (calls ${s})`,
                suggestion: "Refactor to delegate parsing/transformation to a service",
                category: "maintainability",
              });
            }
          }
        }

        // Check if new Date(...) used
        if (node.getKind() === SyntaxKind.NewExpression) {
          const exp = node.getExpression();
          if (exp && exp.getText() === "Date") {
            violations.push({
              ruleId: this.ruleId,
              severity: "warning",
              message: `Controller should not perform data parsing or transformation directly (uses new Date()).`,
              source: this.ruleId,
              file: filePath,
              line: node.getStartLineNumber(),
              column: node.getStart() - node.getStartLinePos(),
              description: `[SYMBOL-BASED] Data parsing/transformation detected in controller (uses new Date())`,
              suggestion: "Refactor to delegate parsing/transformation to a service",
              category: "maintainability",
            });
          }
        }
      });

      if (verbose) {
        console.log(
          `🔍 [C052 Symbol-Based] Total violations found: ${violations.length}`
        );
      }

      return violations;
    } catch (error) {
      if (verbose) {
        console.warn(
          `[C052 Symbol-Based] Analysis failed for ${filePath}:`,
          error.message
        );
      }
      return violations;
    }
  }
}

module.exports = C052SymbolBasedAnalyzer;
