/**
 * Regex-based analyzer for C013 - No Dead Code
 * Purpose: Simple fallback detection for commented code and basic dead code patterns
 */

const { CommentDetector } = require('../../utils/rule-helpers');

class C013RegexBasedAnalyzer {
  constructor() {
    this.ruleId = 'C013';
    this.ruleName = 'No Dead Code (Regex-Based)';
    this.verbose = false;
  }

  initialize(options = {}) {
    this.verbose = options.verbose || false;
    
    if (this.verbose) {
      console.log(`[DEBUG] 🔧 C013 Regex-Based: Analyzer initialized`);
    }
  }

  async analyze(files, language, options = {}) {
    const violations = [];
    
    for (const filePath of files) {
      if (options.verbose) {
        console.log(`🔍 Running C013 regex analysis on ${require('path').basename(filePath)}`);
      }
      
      try {
        const content = require('fs').readFileSync(filePath, 'utf8');
        const fileViolations = this.analyzeFile(content, filePath);
        violations.push(...fileViolations);
      } catch (error) {
        console.warn(`⚠️ Failed to analyze ${filePath}: ${error.message}`);
      }
    }
    
    return violations;
  }

  analyzeFile(content, filePath) {
    const violations = [];
    const lines = content.split('\n');
    
    // 1. Detect commented out code
    const commentedCodeViolations = this.detectCommentedCode(lines, filePath);
    violations.push(...commentedCodeViolations);
    
    // 2. Detect simple unreachable code patterns
    const unreachableCodeViolations = this.detectUnreachableCode(lines, filePath);
    violations.push(...unreachableCodeViolations);
    
    return violations;
  }

  detectCommentedCode(lines, filePath) {
    const violations = [];
    
    // Use CommentDetector to filter out comment lines
    const filteredLines = CommentDetector.filterCommentLines(lines);
    
    // High-confidence patterns for commented out code (reduced false positives)
    const highConfidencePatterns = [
      /^(function\s+\w+\s*\()/,          // function declarations
      /^(const\s+\w+\s*=\s*)/,          // const assignments
      /^(let\s+\w+\s*=\s*)/,            // let assignments
      /^(if\s*\([^)]+\)\s*{)/,          // if statements with braces
      /^(for\s*\([^)]*\)\s*{)/,         // for loops with braces
      /^(while\s*\([^)]+\)\s*{)/,       // while loops with braces
      /^(return\s+[^;]+;?)/,            // return statements
      /^(import\s+.*from)/,             // import statements
      /^(export\s+(default\s+)?)/,       // export statements
      /^(class\s+\w+)/,                 // class declarations
      /^(\w+\s*\([^)]*\)\s*{)/          // method calls with braces
    ];
    
    for (let i = 0; i < filteredLines.length; i++) {
      const { line, lineNumber, isComment } = filteredLines[i];
      
      // Only process comment lines
      if (!isComment) continue;
      
      const trimmedLine = line.trim();
      
      // Skip obvious documentation comments
      if (this.isDocumentationComment(trimmedLine)) {
        continue;
      }
      
      // Extract comment content 
      let commentContent = '';
      if (trimmedLine.startsWith('//')) {
        commentContent = trimmedLine.substring(2).trim();
      } else if (trimmedLine.startsWith('/*') && trimmedLine.endsWith('*/')) {
        commentContent = trimmedLine.substring(2, trimmedLine.length - 2).trim();
      } else {
        continue; // Skip other comment types
      }
      
      // Skip very short comments or obvious explanations
      if (commentContent.length < 10 || this.isExplanatoryComment(commentContent)) {
        continue;
      }
      
      // Check for high-confidence code patterns
      const isLikelyCode = highConfidencePatterns.some(pattern => pattern.test(commentContent));
      
      if (isLikelyCode && this.looksLikeRealCode(commentContent)) {
        violations.push({
          file: filePath,
          line: lineNumber,
          column: line.indexOf(trimmedLine.charAt(0)) + 1,
          message: `Commented out code detected: "${commentContent.substring(0, 50)}...". Remove dead code or use Git for version history.`,
          severity: 'warning',
          ruleId: this.ruleId,
          type: 'commented-code'
        });
      }
    }
    
    return violations;
  }

  isExplanatoryComment(commentContent) {
    const explanatoryStarters = [
      'this', 'the', 'we', 'it', 'you', 'note:', 'warning:', 'todo:', 'fixme:',
      'explanation', 'reason', 'because', 'when', 'if you', 'make sure',
      'see', 'check', 'ensure', 'verify', 'remember', 'important'
    ];
    
    const lowerText = commentContent.toLowerCase();
    return explanatoryStarters.some(starter => lowerText.startsWith(starter));
  }

  isDocumentationComment(line) {
    // Skip JSDoc and obvious documentation
    if (line.startsWith('/**') || line.startsWith('*') || line.includes('TODO') || line.includes('FIXME')) {
      return true;
    }
    
    // Skip comments that are clearly explanatory
    const explanatoryWords = ['note', 'todo', 'fixme', 'hack', 'bug', 'issue', 'warning', 'caution'];
    const commentText = line.substring(2).toLowerCase().trim();
    
    return explanatoryWords.some(word => commentText.startsWith(word));
  }

  looksLikeRealCode(commentContent) {
    // Must have code-like characteristics  
    const hasCodeCharacteristics = (
      commentContent.includes('(') ||
      commentContent.includes('{') ||
      commentContent.includes('=') ||
      commentContent.includes(';') ||
      commentContent.includes('.') ||
      /\w+\.\w+/.test(commentContent) ||
      /const\s+\w+/.test(commentContent) ||
      /let\s+\w+/.test(commentContent) ||
      /return\s+/.test(commentContent) ||
      /console\./.test(commentContent) ||
      /\w+\s*=\s*/.test(commentContent)
    );
    
    // And be substantial enough (lowered threshold)
    const isLongEnough = commentContent.length >= 10;
    
    // And not be obvious explanatory text
    const isNotExplanatory = !this.isExplanatoryComment(commentContent);
    
    return hasCodeCharacteristics && isLongEnough && isNotExplanatory;
  }
  
  isExplanatoryComment(text) {
    const explanatoryStarters = [
      'this', 'the', 'we', 'it', 'you', 'note:', 'warning:', 'todo:', 'fixme:',
      'explanation', 'reason', 'because', 'when', 'if you', 'make sure',
      'describes', 'explanation:', 'note that', 'important:', 'remember'
    ];
    
    const lowerText = text.toLowerCase().trim();
    return explanatoryStarters.some(starter => lowerText.startsWith(starter));
  }

  checkCommentBlock(lines, startIndex, filePath) {
    let commentBlock = '';
    let endIndex = startIndex;
    
    // Collect the full comment block
    for (let j = startIndex; j < lines.length; j++) {
      commentBlock += lines[j] + '\n';
      if (lines[j].includes('*/')) {
        endIndex = j;
        break;
      }
    }
    
    // Clean the comment block
    const cleanedComment = commentBlock
      .replace(/\/\*|\*\/|\*\s*/g, '')
      .trim();
    
    // Check if it looks like commented code
    if (cleanedComment.length >= 50 && this.blockLooksLikeCode(cleanedComment)) {
      return {
        file: filePath,
        line: startIndex + 1,
        column: lines[startIndex].indexOf('/*') + 1,
        message: `Commented out code block detected. Remove dead code or use Git for version history.`,
        severity: 'warning',
        ruleId: this.ruleId,
        type: 'commented-code-block'
      };
    }
    
    return null;
  }

  blockLooksLikeCode(text) {
    const codeIndicators = [
      /function\s+\w+/g,
      /const\s+\w+\s*=/g,
      /let\s+\w+\s*=/g,
      /if\s*\(/g,
      /for\s*\(/g,
      /return\s+/g,
      /\w+\s*=\s*\w+/g,
      /\w+\.\w+/g
    ];
    
    let indicatorCount = 0;
    for (const indicator of codeIndicators) {
      const matches = text.match(indicator);
      if (matches) {
        indicatorCount += matches.length;
      }
    }
    
    // If we find multiple code indicators, it's likely commented code
    return indicatorCount >= 3;
  }

  detectUnreachableCode(lines, filePath) {
    const violations = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and comments
      if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
        continue;
      }
      
      // Look for simple return statements
      if (this.isSimpleReturn(line)) {
        // Check if there's code after this return within the same block
        const unreachableLines = this.findUnreachableCodeAfterReturn(lines, i);
        
        for (const unreachableLine of unreachableLines) {
          violations.push({
            file: filePath,
            line: unreachableLine + 1,
            column: 1,
            message: `Unreachable code detected after return statement. Remove dead code.`,
            severity: 'warning',
            ruleId: this.ruleId,
            type: 'unreachable-code'
          });
        }
      }
    }
    
    return violations;
  }

  isSimpleReturn(line) {
    // Match simple return statements
    const cleanLine = line.replace(/;?\s*$/, '');
    
    return (
      /^return\s*;?\s*$/.test(cleanLine) ||
      /^return\s+[^{}\[\(]+;?\s*$/.test(cleanLine) ||
      /^return\s+(true|false|null|undefined|\d+|"[^"]*"|'[^']*')\s*;?\s*$/.test(cleanLine)
    );
  }

  findUnreachableCodeAfterReturn(lines, returnLineIndex) {
    const unreachableLines = [];
    
    // Look for code after the return statement until we hit a closing brace
    for (let i = returnLineIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and comments
      if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
        continue;
      }
      
      // Stop if we hit a closing brace (end of function/block)
      if (line === '}' || line === '};' || line.startsWith('} ')) {
        break;
      }
      
      // Stop if we hit catch/finally blocks (these are reachable)
      if (line.includes('catch') || line.includes('finally') || 
          line.startsWith('} catch') || line.startsWith('} finally') ||
          line === '} catch (e) {' || line.match(/}\s*catch\s*\(/)) {
        break;
      }
      
      // This looks like unreachable code
      if (this.isExecutableCode(line)) {
        unreachableLines.push(i);
        break; // Only report the first unreachable line to avoid spam
      }
    }
    
    return unreachableLines;
  }

  isExecutableCode(line) {
    // Exclude lines that are just structural
    if (line === '}' || line === '};' || line === '},' || line.match(/^\s*}\s*$/)) {
      return false;
    }
    
    // Exclude catch/finally blocks and their variations
    if (line.includes('catch') || line.includes('finally') || 
        line.startsWith('} catch') || line.startsWith('} finally') ||
        line.match(/}\s*catch\s*\(/) || line.match(/}\s*finally\s*\{/)) {
      return false;
    }
    
    // Exclude plain closing braces with catch/finally
    if (line.match(/^\s*}\s*(catch|finally)/)) {
      return false;
    }
    
    // This looks like executable code
    return true;
  }
}

module.exports = C013RegexBasedAnalyzer;
