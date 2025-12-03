/**
 * C048 Symbol-based Analyzer - Advanced Do not bypass architectural layers (controller/service/repository)
 * Purpose: Use AST + Symbol Resolution to clear layered architecture, ensuring logic and data flow are well-structured and maintainable.
 */

// c048-symbol-analyzer.js
const path = require("path");
const { SyntaxKind } = require("ts-morph");

class C048SymbolBasedAnalyzer {
  constructor(semanticEngine = null) {
    this.ruleId = "C048";
    this.ruleName =
      "Error bypass architectural layers (controller/service/repository) (Symbol-Based)";
    this.semanticEngine = semanticEngine;
    this.verbose = false;

    this.layers = {
      controller: "controller",
      service: "service",
      repository: "repository",
      other: "other",
    };

    this.dirHints = {
      controller: [/^controllers?$/i, /controller/i],
      service: [/^services?$/i, /service/i],
      repository: [/^repositories?$/i, /repository/i, /repos?$/i],
    };

    this.classSuffix = {
      controller: /Controller$/,
      service: /Service$/,
      repository: /Repository$/,
    };

    // 🔧 FIX: arrays, not strings
    this.forbiddenImports = {
      controller: ["repository"], // Controllers must not import repositories
      service: ["controller"], // Services must not import controllers
    };
  }

  async initialize(semanticEngine = null) {
    if (semanticEngine) {
      this.semanticEngine = semanticEngine;
    }
    this.verbose = semanticEngine?.verbose || false;
    if (process.env.SUNLINT_DEBUG) {
      console.log(
        `🔧 [C048 Symbol-Based] Analyzer initialized, verbose: ${this.verbose}`
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
          "[C048 Symbol-Based] No semantic engine available, skipping analysis"
        );
      }
      return violations;
    }

    try {
      const sourceFile = this.semanticEngine.project.getSourceFile(filePath);
      if (!sourceFile) return violations;

      const fileLayer = this.inferLayer(sourceFile);
      if (verbose) {
        console.log(`🔍 Analyzing ${filePath} → layer = ${fileLayer}`);
      }

      if (
        ![this.layers.controller, this.layers.service].includes(fileLayer)
      ) {
        return violations;
      }

      const forbidden = new Set(this.forbiddenImports[fileLayer] || []);

      // 1) Import-based violations
      for (const imp of sourceFile.getImportDeclarations()) {
        const targetLayer = this.getImportedTargetLayer(imp);
        if (verbose) {
          console.log(
            `   import ${imp.getModuleSpecifierValue()} → layer ${targetLayer}`
          );
        }
        if (!targetLayer) continue;
        if (forbidden.has(targetLayer)) {
          violations.push({
            ruleId: this.ruleId,
            severity: "warning",
            message:
              fileLayer === this.layers.controller
                ? "Controllers should not import Repositories. Depend on a Service instead."
                : "Services should not import Controllers. Keep presentation layer out of service logic.",
            source: this.ruleId,
            file: filePath,
            line: imp.getStartLineNumber(),
            column: imp.getStart() - imp.getStartLinePos(),
            description: `[SYMBOL-BASED] Bypassing architectural layers detected: ${fileLayer} importing ${targetLayer}`,
            suggestion: "Refactor to use appropriate layer dependencies",
            category: "Architecture",
          });
        }
      }

      // 2) new XRepository() / new XController()
      const badSuffix =
        fileLayer === this.layers.controller
          ? this.classSuffix.repository
          : this.classSuffix.controller;

      sourceFile.forEachDescendant((node) => {
        if (node.getKind() === SyntaxKind.NewExpression) {
          const expr = node;
          const exprText = expr.getExpression().getText();
          if (badSuffix.test(exprText)) {
            violations.push({
              ruleId: this.ruleId,
              severity: "warning",
              message:
                fileLayer === this.layers.controller
                  ? "Controllers should not instantiate Repositories directly. Call a Service."
                  : "Services should not instantiate Controllers.",
              source: this.ruleId,
              file: filePath,
              line: expr.getStartLineNumber(),
              column: expr.getStart() - expr.getStartLinePos(),
              description: `[SYMBOL-BASED] Bypassing architectural layers detected: ${fileLayer} instantiating ${exprText}`,
              suggestion: "Refactor to use appropriate layer dependencies",
              category: "Architecture",
            });
          }
        }
      });

      // 3) property/param types referring to forbidden classes
      sourceFile.forEachDescendant((node) => {
        if (
          node.getKind() === SyntaxKind.PropertyDeclaration ||
          node.getKind() === SyntaxKind.Parameter ||
          node.getKind() === SyntaxKind.VariableDeclaration
        ) {
          const typeNode = node.getTypeNode?.();
          if (!typeNode) return;
          const t = typeNode.getText();
          if (badSuffix.test(t)) {
            violations.push({
              ruleId: this.ruleId,
              severity: "warning",
              message:
                fileLayer === this.layers.controller
                  ? "Controllers should not hold Repository-typed members. Inject a Service instead."
                  : "Services should not reference Controller types.",
              source: this.ruleId,
              file: filePath,
              line: node.getStartLineNumber(),
              column: node.getStart() - node.getStartLinePos(),
              description: `[SYMBOL-BASED] Bypassing architectural layers detected: ${fileLayer} using ${t} type`,
              suggestion: "Refactor to use appropriate layer dependencies",
              category: "Architecture",
            });
          }
        }
      });

      if (verbose) {
        console.log(
          `🔍 [C048 Symbol-Based] Total violations found: ${violations.length}`
        );
      }

      return violations;
    } catch (error) {
      if (verbose) {
        console.warn(
          `[C048 Symbol-Based] Analysis failed for ${filePath}:`,
          error.message
        );
      }
      return violations;
    }
  }

  inferLayerFromPath(filePath) {
    const parts = filePath.split(path.sep);
    for (const seg of parts) {
      for (const [layer, patterns] of Object.entries(this.dirHints)) {
        if (patterns.some((re) => re.test(seg))) return layer;
      }
    }
    const base = path.basename(filePath, path.extname(filePath));
    for (const [layer, re] of Object.entries(this.classSuffix)) {
      if (re.test(base)) return layer;
    }
    return this.layers.other;
  }

  inferLayerFromClasses(sourceFile) {
    const classes = sourceFile.getClasses();
    for (const cls of classes) {
      const name = cls.getName() || "";
      for (const [layer, re] of Object.entries(this.classSuffix)) {
        if (re.test(name)) return layer;
      }
    }
    return null;
  }

  inferLayer(sourceFile) {
    return (
      this.inferLayerFromClasses(sourceFile) ||
      this.inferLayerFromPath(sourceFile.getFilePath())
    );
  }

  getImportedTargetLayer(imp) {
    const target = imp.getModuleSpecifierSourceFile();
    if (!target) return null;
    return this.inferLayer(target);
  }
}

module.exports = C048SymbolBasedAnalyzer;
