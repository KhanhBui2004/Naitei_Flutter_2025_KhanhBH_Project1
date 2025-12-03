/**
 * Regex-based analyzer for C010 - Block Nesting Detection
 * Purpose: Fallback analyzer when AST analysis is not available
 * Note: Less accurate than symbol-based approach but more performant
 */

const fs = require('fs');
const path = require('path');
const { CommentDetector } = require('../../utils/rule-helpers');

class C010RegexBasedAnalyzer {
  constructor(semanticEngine = null) {
    this.ruleId = 'C010';
    this.ruleName = 'Limit Block Nesting (Regex-Based)';
    this.description = 'Do not exceed maximum block nesting depth for better readability';
    this.severity = 'warning';
    this.maxDepth = 3;
    this.semanticEngine = semanticEngine;
    this.verbose = false;
    
    // Control flow blocks that create nesting - Match ESLint rule exactly
    // Only: if, for, while, do-while, switch, try-catch statements
    this.blockPatterns = [
      // if/else patterns - handle both same-line and multi-line blocks
      { pattern: /^\s*if\s*\(.*\)\s*\{/, type: 'if', opens: true },
      { pattern: /^\s*if\s*\(.*\)\s*$/, type: 'if-pending', opens: false, needsBrace: true },
      { pattern: /^\s*else\s*if\s*\(.*\)\s*\{/, type: 'else-if', opens: true },
      { pattern: /^\s*else\s*if\s*\(.*\)\s*$/, type: 'else-if-pending', opens: false, needsBrace: true },
      { pattern: /^\s*else\s*\{/, type: 'else', opens: true },
      { pattern: /^\s*else\s*$/, type: 'else-pending', opens: false, needsBrace: true },
      
      // Loop patterns - handle both same-line and multi-line blocks
      { pattern: /^\s*for\s*\(.*\)\s*\{/, type: 'for', opens: true },
      { pattern: /^\s*for\s*\(.*\)\s*$/, type: 'for-pending', opens: false, needsBrace: true },
      { pattern: /^\s*while\s*\(.*\)\s*\{/, type: 'while', opens: true },
      { pattern: /^\s*while\s*\(.*\)\s*$/, type: 'while-pending', opens: false, needsBrace: true },
      { pattern: /^\s*do\s*\{/, type: 'do-while', opens: true },
      { pattern: /^\s*do\s*$/, type: 'do-while-pending', opens: false, needsBrace: true },
      
      // Switch statements (not individual case blocks)
      { pattern: /^\s*switch\s*\(.*\)\s*\{/, type: 'switch', opens: true },
      { pattern: /^\s*switch\s*\(.*\)\s*$/, type: 'switch-pending', opens: false, needsBrace: true },
      
      // Try-catch patterns
      { pattern: /^\s*try\s*\{/, type: 'try', opens: true },
      { pattern: /^\s*try\s*$/, type: 'try-pending', opens: false, needsBrace: true },
      { pattern: /^\s*catch\s*\(.*\)\s*\{/, type: 'catch', opens: true },
      { pattern: /^\s*catch\s*\(.*\)\s*$/, type: 'catch-pending', opens: false, needsBrace: true },
      { pattern: /^\s*finally\s*\{/, type: 'finally', opens: true },
      { pattern: /^\s*finally\s*$/, type: 'finally-pending', opens: false, needsBrace: true },
      
      // With statements (rarely used but included for completeness)
      { pattern: /^\s*with\s*\(.*\)\s*\{/, type: 'with', opens: true },
      { pattern: /^\s*with\s*\(.*\)\s*$/, type: 'with-pending', opens: false, needsBrace: true },
      
      // Standalone opening brace (follows pending blocks)
      { pattern: /^\s*\{\s*$/, type: 'brace-block', opens: true }
    ];

    // Track pending blocks that expect a brace on next line
    this.pendingBlocks = [];
    
    // Patterns for inline blocks (without braces)
    this.inlineBlockPatterns = [
      { pattern: /^\s*if\s*\(.*\)\s*[^{]/, type: 'if-inline' },
      { pattern: /^\s*else\s+if\s*\(.*\)\s*[^{]/, type: 'else-if-inline' },
      { pattern: /^\s*else\s+[^{]/, type: 'else-inline' },
      { pattern: /^\s*for\s*\(.*\)\s*[^{]/, type: 'for-inline' },
      { pattern: /^\s*while\s*\(.*\)\s*[^{]/, type: 'while-inline' }
    ];
  }

  async initialize(semanticEngine = null) {
    if (semanticEngine) {
      this.semanticEngine = semanticEngine;
    }
    this.verbose = semanticEngine?.verbose || false;
    
    if (this.verbose) {
      console.log(`[DEBUG] 🔧 C010 Regex-Based: Analyzer initialized with max depth: ${this.maxDepth}`);
    }
  }

  async analyzeFileBasic(filePath, options = {}) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [C010 Regex] analyzeFileBasic() called for: ${filePath}`);
    }
    
    try {
      if (this.isTestFile(filePath)) {
        return [];
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const violations = await this.analyzeFile(filePath, fileContent, 'typescript', options);
      
      if (process.env.SUNLINT_DEBUG) {
        console.log(`🔧 [C010 Regex] Found ${violations.length} violations in ${filePath}`);
      }
      
      return violations;
    } catch (error) {
      console.warn(`C010 regex analysis error for ${filePath}:`, error.message);
      return [];
    }
  }

  async analyze(files, language, config = {}) {
    const violations = [];
    
    if (config?.rules?.C010?.maxDepth) {
      this.maxDepth = config.rules.C010.maxDepth;
    }

    for (const filePath of files) {
      try {
        if (this.isTestFile(filePath)) {
          continue;
        }
        
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const fileViolations = await this.analyzeFile(filePath, fileContent, language, config);
        violations.push(...fileViolations);
      } catch (error) {
        console.warn(`C010 analysis error for ${filePath}:`, error.message);
      }
    }
    
    return violations;
  }

  async analyzeFile(filePath, fileContent, language, config) {
    const violations = [];
    
    // Reset pending blocks for each file
    this.pendingBlocks = [];
    
    try {
      const lines = fileContent.split('\n');
      let controlFlowStack = []; // Only track control flow blocks
      
      // Use CommentDetector to filter comment lines
      const filteredLines = CommentDetector.filterCommentLines(lines);

      for (let i = 0; i < filteredLines.length; i++) {
        const { line, lineNumber, isComment } = filteredLines[i];
        
        // Skip comment lines
        if (isComment) {
          continue;
        }
        
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        // Track control flow statements
        const controlFlowMatch = this.detectControlFlow(trimmedLine);
        if (controlFlowMatch) {
          // Check if this line has opening brace (same line)
          if (trimmedLine.includes('{')) {
            controlFlowStack.push({
              type: controlFlowMatch.type,
              line: lineNumber,
              column: this.getBlockStartColumn(line)
            });
            
            // Check depth violation at the control flow statement
            if (controlFlowStack.length > this.maxDepth) {
              violations.push(this.createViolation(
                filePath, 
                lineNumber, 
                this.getBlockStartColumn(line), 
                line, 
                controlFlowStack.length, 
                controlFlowStack
              ));
            }
          } else {
            // Look ahead for opening brace on next line
            let braceLineIndex = -1;
            for (let j = i + 1; j < Math.min(i + 3, filteredLines.length); j++) {
              const nextFilteredLine = filteredLines[j];
              if (nextFilteredLine.isComment) continue; // Skip comment lines
              if (nextFilteredLine.line.trim() === '{') {
                braceLineIndex = nextFilteredLine.lineNumber - 1; // Convert back to 0-based
                break;
              }
              if (nextFilteredLine.line.trim() !== '') break; // Stop if non-empty, non-brace line
            }
            
            if (braceLineIndex >= 0) {
              controlFlowStack.push({
                type: controlFlowMatch.type,
                line: braceLineIndex + 1,
                column: this.getBlockStartColumn(lines[braceLineIndex])
              });
              
              // Check depth violation at the opening brace
              if (controlFlowStack.length > this.maxDepth) {
                violations.push(this.createViolation(
                  filePath, 
                  braceLineIndex + 1, 
                  this.getBlockStartColumn(lines[braceLineIndex]), 
                  lines[braceLineIndex], 
                  controlFlowStack.length, 
                  controlFlowStack
                ));
              }
            }
          }
        }
        
        // Handle closing braces - only remove if we have control flow blocks
        const closeBraces = (line.match(/\}/g) || []).length;
        for (let j = 0; j < closeBraces && controlFlowStack.length > 0; j++) {
          controlFlowStack.pop();
        }
      }
      
    } catch (error) {
      console.warn(`C010 analysis error for ${filePath}:`, error.message);
    }

    return violations;
  }
  
  detectControlFlow(line) {
    // Match control flow keywords that create nesting
    const patterns = [
      { pattern: /^\s*if\s*\(/, type: 'if' },
      { pattern: /^\s*else\s+if\s*\(/, type: 'else-if' },
      { pattern: /^\s*else\s*$/, type: 'else' },
      { pattern: /^\s*for\s*\(/, type: 'for' },
      { pattern: /^\s*while\s*\(/, type: 'while' },
      { pattern: /^\s*do\s*$/, type: 'do-while' },
      { pattern: /^\s*switch\s*\(/, type: 'switch' },
      { pattern: /^\s*try\s*$/, type: 'try' },
      { pattern: /^\s*catch\s*\(/, type: 'catch' },
      { pattern: /^\s*finally\s*$/, type: 'finally' },
      { pattern: /^\s*with\s*\(/, type: 'with' },
      // Handle closing brace followed by control flow
      { pattern: /^\s*}\s*else\s+if\s*\(/, type: 'else-if' },
      { pattern: /^\s*}\s*else\s*$/, type: 'else' },
      { pattern: /^\s*}\s*catch\s*\(/, type: 'catch' },
      { pattern: /^\s*}\s*finally\s*$/, type: 'finally' }
    ];
    
    for (const pattern of patterns) {
      if (pattern.pattern.test(line)) {
        return { type: pattern.type };
      }
    }
    
    return null;
  }
  
  detectBlockOpening(trimmedLine, fullLine) {
    // First check if this is a standalone opening brace that follows a pending block
    if (trimmedLine === '{' && this.pendingBlocks.length > 0) {
      const pendingBlock = this.pendingBlocks.pop();
      return {
        opens: true,
        type: pendingBlock.type.replace('-pending', ''),
        column: this.getBlockStartColumn(fullLine),
        inline: false
      };
    }
    
    // Check for block patterns
    for (const blockPattern of this.blockPatterns) {
      if (blockPattern.pattern.test(trimmedLine)) {
        if (blockPattern.needsBrace) {
          // This is a pending block, add to pending list
          this.pendingBlocks.push({
            type: blockPattern.type,
            line: fullLine
          });
          return { opens: false };
        } else {
          return {
            opens: blockPattern.opens,
            type: blockPattern.type,
            column: this.getBlockStartColumn(fullLine),
            inline: false
          };
        }
      }
    }
    
    return { opens: false };
  }
  
  detectInlineBlock(trimmedLine) {
    // Skip if line ends with { or ;
    if (trimmedLine.endsWith('{') || trimmedLine.endsWith(';')) {
      return null;
    }
    
    for (const pattern of this.inlineBlockPatterns) {
      if (pattern.pattern.test(trimmedLine)) {
        return { type: pattern.type };
      }
    }
    
    return null;
  }
  
  isClosingBrace(line) {
    // Match closing brace, possibly followed by else/catch/finally
    return /^\s*}\s*(else|catch|finally)?\s*(\{|$)/.test(line);
  }
  
  handleClosingBrace(blockStack) {
    if (blockStack.length > 0) {
      // Remove the most recent block
      blockStack.pop();
    }
  }
  
  calculateEffectiveDepth(blockStack) {
    // Count only non-inline blocks for depth calculation
    return blockStack.filter(block => !block.inline).length;
  }
  
  getBlockStartColumn(line) {
    const match = line.match(/^\s*/);
    return match ? match[0].length + 1 : 1;
  }
  
  isTestFile(filePath) {
    const testPatterns = [
      /\.test\.(js|ts|jsx|tsx)$/,
      /\.spec\.(js|ts|jsx|tsx)$/,
      /\/__tests__\//,
      /\/tests?\//,
      /\.e2e\./,
      /test\.config\./,
      /jest\.config\./,
      /vitest\.config\./,
      /cypress\//
    ];
    
    return testPatterns.some(pattern => pattern.test(filePath));
  }
  
  createViolation(filePath, lineNumber, column, sourceLine, depth, blockStack) {
    return {
      ruleId: this.ruleId,
      severity: this.severity,
      message: `🔄 [REGEX] Block nesting depth ${depth} exceeds maximum of ${this.maxDepth}. Consider refactoring to reduce complexity.`,
      filePath: filePath,
      line: lineNumber,
      column: column,
      source: sourceLine.trim(),
      suggestion: this.getSuggestion(depth),
      nestingStack: blockStack.map(b => ({ 
        type: b.type, 
        line: b.line,
        inline: b.inline || false
      }))
    };
  }
  
  getSuggestion(currentDepth) {
    const suggestions = [
      "Extract nested logic into separate functions",
      "Use early returns to reduce nesting",
      "Consider using guard clauses",
      "Break complex conditions into meaningful variables",
      "Use strategy pattern for complex conditional logic",
      "Consider using a state machine for complex flow control"
    ];
    
    const index = Math.min(currentDepth - this.maxDepth - 1, suggestions.length - 1);
    return suggestions[Math.max(0, index)];
  }
}

module.exports = C010RegexBasedAnalyzer;