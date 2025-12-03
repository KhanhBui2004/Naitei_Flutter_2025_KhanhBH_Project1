/**
 * Base AST Parser Interface
 * Defines common interface for all language-specific AST parsers
 * Rule C005: Single responsibility - AST parser interface only
 */

class BaseASTParser {
  constructor(language) {
    this.language = language;
    this.parser = null;
  }

  /**
   * Initialize the parser (must be implemented by subclasses)
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclasses');
  }

  /**
   * Parse code into AST (must be implemented by subclasses)
   */
  async parse(code, filePath) {
    throw new Error('parse() must be implemented by subclasses');
  }

  /**
   * Analyze specific rule using AST (must be implemented by subclasses)
   */
  async analyzeRule(ruleId, code, filePath) {
    throw new Error('analyzeRule() must be implemented by subclasses');
  }

  /**
   * Common AST traversal utilities
   */
  traverseAST(node, callback) {
    if (!node) return;
    
    callback(node);
    
    // Traverse children (implementation varies by parser)
    if (node.children) {
      for (const child of node.children) {
        this.traverseAST(child, callback);
      }
    }
  }

  /**
   * Count nesting depth for block structures
   */
  countNestingDepth(node, blockTypes = ['if_statement', 'for_statement', 'while_statement', 'try_statement']) {
    let maxDepth = 0;
    let currentDepth = 0;

    this.traverseAST(node, (currentNode) => {
      if (blockTypes.includes(currentNode.type)) {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      }
    });

    return maxDepth;
  }

  /**
   * Find violations of specific rules
   */
  findRuleViolations(node, ruleChecker) {
    const violations = [];

    this.traverseAST(node, (currentNode) => {
      const violation = ruleChecker(currentNode);
      if (violation) {
        violations.push({
          ...violation,
          line: currentNode.startPosition?.row + 1 || 0,
          column: currentNode.startPosition?.column + 1 || 0,
          endLine: currentNode.endPosition?.row + 1 || 0,
          endColumn: currentNode.endPosition?.column + 1 || 0
        });
      }
    });

    return violations;
  }
}

module.exports = BaseASTParser;
