/**
 * Heuristic analyzer for: C042 – Boolean variable names should start with proper prefixes
 * Purpose: Detect boolean variables that don't follow naming conventions
 */

class C042Analyzer {
  constructor() {
    this.ruleId = 'C042';
    this.ruleName = 'Boolean Variable Naming';
    this.description = 'Boolean variable names should start with is, has, should, can, will, must, may, or check';
    
    // User requested to add "check" prefix
    this.booleanPrefixes = [
      'is', 'has', 'should', 'can', 'will', 'must', 'may', 'check',
      'are', 'were', 'was', 'could', 'might', 'shall', 'need', 'want'
    ];
    
    // Common non-boolean patterns to ignore (user feedback)
    this.ignoredPatterns = [
      // Fallback/default patterns: var = value || fallback
      /\w+\s*=\s*\w+\s*\|\|\s*[^|]/,
      // Assignment patterns that are clearly not boolean
      /\w+\s*=\s*['"`][^'"`]*['"`]/, // String assignments
      /\w+\s*=\s*\d+/, // Number assignments
      /\w+\s*=\s*\{/, // Object assignments
      /\w+\s*=\s*\[/, // Array assignments
    ];
    
    // Variables that commonly aren't boolean but might look like it
    this.commonNonBooleans = [
      'value', 'result', 'data', 'config', 'name', 'id', 'key',
      'path', 'url', 'src', 'href', 'text', 'message', 'error',
      'response', 'request', 'params', 'options', 'settings'
    ];
  }

  async analyze(files, language, options = {}) {
    const violations = [];
    
    for (const filePath of files) {
      if (options.verbose) {
        console.log(`🔍 Running C042 analysis on ${require('path').basename(filePath)}`);
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
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines, comments, imports, and type declarations
      if (!line || line.startsWith('//') || line.startsWith('/*') || 
          line.startsWith('import') || line.startsWith('export') ||
          line.startsWith('declare') || line.startsWith('*')) {
        continue;
      }
      
      const lineViolations = this.analyzeDeclaration(line, i + 1);
      lineViolations.forEach(violation => {
        violations.push({
          ...violation,
          file: filePath
        });
      });
    }
    
    return violations;
  }
  
  analyzeDeclaration(line, lineNumber) {
    const violations = [];
    
    // Match variable declarations with boolean values
    const booleanAssignments = this.findBooleanAssignments(line);
    
    for (const assignment of booleanAssignments) {
      const { varName, isBooleanValue, hasPrefix, actualValue } = assignment;
      
      // Case 1: Variable is assigned a boolean value but doesn't have proper prefix
      if (isBooleanValue && !hasPrefix) {
        // Skip if this matches user feedback patterns (false positives)
        if (this.shouldSkipBooleanVariableCheck(varName, line, actualValue)) {
          continue;
        }
        
        violations.push({
          line: lineNumber,
          column: line.indexOf(varName) + 1,
          message: `Boolean variable '${varName}' should start with a descriptive prefix like 'is', 'has', 'should', 'can', or 'check'. Consider: ${this.generateSuggestions(varName).join(', ')}.`,
          severity: 'warning',
          ruleId: this.ruleId
        });
      }
      
      // Case 2: Variable has boolean prefix but is assigned a non-boolean value
      else if (hasPrefix && !isBooleanValue && actualValue && this.isDefinitelyNotBoolean(actualValue)) {
        // Only skip very basic cases for prefix misuse
        if (varName.length <= 2) {
          continue;
        }
        
        const prefix = this.extractPrefix(varName);
        violations.push({
          line: lineNumber,
          column: line.indexOf(varName) + 1,
          message: `Variable '${varName}' uses boolean prefix '${prefix}' but is assigned a non-boolean value. Consider renaming or changing the value.`,
          severity: 'warning',
          ruleId: this.ruleId
        });
      }
    }
    
    return violations;
  }
  
  findBooleanAssignments(line) {
    const assignments = [];
    
    // Match declaration patterns only (avoid duplicates)
    const patterns = [
      // let/const/var varName = value
      /(?:let|const|var)\s+(\w+)\s*(?::\s*\w+\s*)?=\s*(.+?)(?:;|$)/g,
    ];
    
    for (const pattern of patterns) {
      let match;
      const seenVariables = new Set(); // Avoid duplicates
      
      while ((match = pattern.exec(line)) !== null) {
        const varName = match[1];
        const value = match[2].trim();
        
        // Skip if already processed
        if (seenVariables.has(varName)) {
          continue;
        }
        seenVariables.add(varName);
        
        // Skip destructuring and complex patterns
        if (varName.includes('[') || varName.includes('{') || value.includes('{') || value.includes('[')) {
          continue;
        }
        
        const isBooleanValue = this.isBooleanValue(value);
        const hasPrefix = this.hasBooleanPrefix(varName);
        
        assignments.push({
          varName,
          isBooleanValue,
          hasPrefix,
          actualValue: value
        });
      }
    }
    
    return assignments;
  }
  
  isBooleanValue(value) {
    const trimmedValue = value.trim();
    
    // Direct boolean literals
    if (trimmedValue === 'true' || trimmedValue === 'false') {
      return true;
    }
    
    // Boolean expressions that clearly result in boolean
    const booleanExpressions = [
      /\w+\s*[<>!=]=/, // Comparisons
      /\w+\s*(&&|\|\|)/, // Logical operations (but not fallback patterns)
      /^\!\w+/, // Negation
      /instanceof\s+/, // instanceof
      /\.test\(/, // regex.test()
      /\.includes\(/, // array.includes()
      /\.hasOwnProperty\(/, // hasOwnProperty
      /\.some\(/, // array.some()
      /\.every\(/, // array.every()
      /typeof\s+.*\s*===/, // typeof checks
      /Math\.random\(\)\s*[<>]/, // Math.random() comparisons
      /\.length\s*[<>!=]=/, // Length comparisons
    ];
    
    // Exclude fallback patterns (user feedback - these are NOT boolean)
    if (trimmedValue.includes('||')) {
      // Check if it's a boolean expression or just a fallback
      // If the || is followed by a non-boolean value, it's likely a fallback
      const parts = trimmedValue.split('||');
      if (parts.length === 2) {
        const fallback = parts[1].trim();
        // If fallback is clearly not boolean, this is not a boolean assignment
        if (this.isDefinitelyNotBoolean(fallback) || /^\d+$/.test(fallback) || /^['"`]/.test(fallback)) {
          return false;
        }
      }
    }
    
    return booleanExpressions.some(pattern => pattern.test(trimmedValue));
  }
  
  hasBooleanPrefix(varName) {
    const lowerName = varName.toLowerCase();
    return this.booleanPrefixes.some(prefix => 
      lowerName.startsWith(prefix.toLowerCase()) && 
      lowerName.length > prefix.length
    );
  }
  
  extractPrefix(varName) {
    const lowerName = varName.toLowerCase();
    for (const prefix of this.booleanPrefixes) {
      if (lowerName.startsWith(prefix.toLowerCase())) {
        return prefix;
      }
    }
    return '';
  }
  
  shouldSkipBooleanVariableCheck(varName, line, value) {
    // Skip very short names  
    if (varName.length <= 2) {
      return true;
    }
    
    // Skip common non-boolean variable names
    if (this.commonNonBooleans.includes(varName.toLowerCase())) {
      return true;
    }
    
    // Skip user feedback patterns (fallback/default patterns)
    if (this.ignoredPatterns.some(pattern => pattern.test(line))) {
      return true;
    }
    
    // Skip function parameters and loop variables
    if (line.includes('function') || line.includes('for') || line.includes('=>')) {
      return true;
    }
    
    return false;
  }
  
  isDefinitelyNotBoolean(value) {
    const trimmedValue = value.trim();
    
    // String literals (including single quotes)
    if (trimmedValue.match(/^['"`][^'"`]*['"`]$/)) {
      return true;
    }
    
    // Number literals
    if (trimmedValue.match(/^\d+(\.\d+)?$/)) {
      return true;
    }
    
    // Object/array literals
    if (trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) {
      return true;
    }
    
    // null, undefined
    if (trimmedValue === 'null' || trimmedValue === 'undefined') {
      return true;
    }
    
    // Common non-boolean patterns
    if (trimmedValue.includes('new ') || trimmedValue.includes('function')) {
      return true;
    }
    
    return false;
  }
  
  generateSuggestions(varName) {
    const suggestions = [];
    const baseName = varName.replace(/^(is|has|should|can|will|must|may|check)/i, '');
    const capitalizedBase = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    
    // Generate a few reasonable suggestions
    suggestions.push(`is${capitalizedBase}`);
    suggestions.push(`has${capitalizedBase}`);
    suggestions.push(`should${capitalizedBase}`);
    
    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }
}

module.exports = C042Analyzer;
