/**
 * JavaScript AST Parser
 * Uses Tree-sitter for JavaScript parsing
 * Rule C005: Single responsibility - JavaScript AST parsing only
 */

const BaseASTParser = require('../base-parser');

class JavaScriptParser extends BaseASTParser {
  constructor() {
    super('javascript');
  }

  async initialize() {
    try {
      const Parser = require('tree-sitter');
      const JavaScript = require('tree-sitter-javascript');
      
      this.parser = new Parser();
      this.parser.setLanguage(JavaScript);
      
      return true;
    } catch (error) {
      console.warn('⚠️ Tree-sitter JavaScript parser not available:', error.message);
      return false;
    }
  }

  async parse(code, filePath) {
    if (!this.parser) {
      const initialized = await this.initialize();
      if (!initialized) return null;
    }

    try {
      const tree = this.parser.parse(code);
      return tree.rootNode;
    } catch (error) {
      console.warn(`⚠️ JavaScript AST parsing failed for ${filePath}:`, error.message);
      return null;
    }
  }

  async analyzeRule(ruleId, code, filePath) {
    const rootNode = await this.parse(code, filePath);
    if (!rootNode) return null;

    switch (ruleId) {
      case 'C010':
        return this.analyzeC010(rootNode, code, filePath);
      case 'C012':
        return this.analyzeC012(rootNode, code, filePath);
      default:
        return null;
    }
  }

  /**
   * Analyze C010: Limit block nesting depth
   */
  analyzeC010(rootNode, code, filePath) {
    const violations = [];
    const maxDepth = 4; // Default limit
    
    const blockTypes = [
      'if_statement',
      'for_statement', 
      'for_in_statement',
      'while_statement',
      'do_statement',
      'try_statement',
      'switch_statement',
      'with_statement'
    ];

    this.traverseAST(rootNode, (node) => {
      if (blockTypes.includes(node.type)) {
        const depth = this.calculateNestingDepth(node, blockTypes);
        if (depth > maxDepth) {
          violations.push({
            ruleId: 'C010',
            severity: 'warning',
            message: `Block nesting depth (${depth}) exceeds maximum allowed (${maxDepth})`,
            line: node.startPosition.row + 1,
            column: node.startPosition.column + 1,
            endLine: node.endPosition.row + 1,
            endColumn: node.endPosition.column + 1,
            source: this.getNodeText(node, code)
          });
        }
      }
    });

    return violations;
  }

  /**
   * Analyze C012: Limit function/method complexity
   */
  analyzeC012(rootNode, code, filePath) {
    const violations = [];
    const maxComplexity = 10; // Default limit

    const functionTypes = [
      'function_declaration',
      'method_definition',
      'arrow_function',
      'function_expression'
    ];

    this.traverseAST(rootNode, (node) => {
      if (functionTypes.includes(node.type)) {
        const complexity = this.calculateCyclomaticComplexity(node);
        if (complexity > maxComplexity) {
          violations.push({
            ruleId: 'C012',
            severity: 'warning',
            message: `Function complexity (${complexity}) exceeds maximum allowed (${maxComplexity})`,
            line: node.startPosition.row + 1,
            column: node.startPosition.column + 1,
            endLine: node.endPosition.row + 1,
            endColumn: node.endPosition.column + 1,
            source: this.getNodeText(node, code)
          });
        }
      }
    });

    return violations;
  }

  /**
   * Calculate nesting depth from a given node
   */
  calculateNestingDepth(startNode, blockTypes) {
    let depth = 0;
    let current = startNode.parent;

    while (current) {
      if (blockTypes.includes(current.type)) {
        depth++;
      }
      current = current.parent;
    }

    return depth + 1; // Include the current node
  }

  /**
   * Calculate cyclomatic complexity
   */
  calculateCyclomaticComplexity(functionNode) {
    let complexity = 1; // Base complexity

    const complexityNodes = [
      'if_statement',
      'else_clause',
      'for_statement',
      'for_in_statement', 
      'while_statement',
      'do_statement',
      'switch_case',
      'try_statement',
      'catch_clause',
      'conditional_expression'
    ];

    this.traverseAST(functionNode, (node) => {
      if (complexityNodes.includes(node.type)) {
        complexity++;
      }
    });

    return complexity;
  }

  /**
   * Get text content of a node
   */
  getNodeText(node, code) {
    const startIndex = node.startIndex;
    const endIndex = node.endIndex;
    return code.slice(startIndex, endIndex);
  }
}

module.exports = JavaScriptParser;
