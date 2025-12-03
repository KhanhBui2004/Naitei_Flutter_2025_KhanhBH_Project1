const fs = require('fs');
const path = require('path');

/**
 * Rule C030 - Use Custom Error Classes
 * Enforce using application-specific error classes instead of generic system errors
 * Examples to flag: throw new Error(), throw new TypeError(), Promise.reject(new Error(...))
 */
class C030UseCustomErrorClassesAnalyzer {
  constructor(options = {}) {
    this.ruleId = 'C030';
    this.ruleName = 'Use Custom Error Classes';
    this.description = 'Use custom error classes instead of generic system errors';
    this.severity = 'warning';
    this.verbose = options.verbose || false;

    this.builtinErrorNames = [
      'Error',
      'TypeError',
      'RangeError',
      'ReferenceError',
      'SyntaxError',
      'URIError',
      'EvalError'
    ];

    // Precompile regexes for speed
    const namesGroup = this.builtinErrorNames.join('|');
    this.patterns = [
      // throw new Error(...)
      new RegExp(`\\bthrow\\s+new\\s+(${namesGroup})\\s*\\(`),
      // throw Error(...)
      new RegExp(`\\bthrow\\s+(${namesGroup})\\s*\\(`),
      // Promise.reject(new Error(...))
      new RegExp(`Promise\\.reject\\s*\\(\\s*new\\s+(${namesGroup})\\s*\\(`),
      // reject(new Error(...))
      new RegExp(`\\breject\\s*\\(\\s*new\\s+(${namesGroup})\\s*\\(`),
      // Throwing string literals (single, double quotes)
      /\bthrow\s+['"][^'"]*['"]/,
      // Throwing template literals
      /\bthrow\s+`[^`]*`/,
      // Throwing numbers
      /\bthrow\s+\d+/,
      // Throwing variables (simple identifiers) - remove $ anchor to allow comments
      /\bthrow\s+[a-zA-Z_$][a-zA-Z0-9_$]*(?:\s*;|\s*\/\/|\s*$)/
    ];
  }

  async analyze(files, language, config = {}) {
    const violations = [];

    for (const filePath of files) {
      try {
        // Handle both file paths and direct content
        let content;
        if (typeof filePath === 'string' && fs.existsSync(filePath)) {
          content = fs.readFileSync(filePath, 'utf8');
        } else if (typeof filePath === 'object' && filePath.content) {
          // Handle test cases with direct content
          content = filePath.content;
          filePath = filePath.path || 'test.js';
        } else {
          if (this.verbose) {
            console.warn(`C030: Skipping invalid file path: ${filePath}`);
          }
          continue;
        }
        
        const fileViolations = await this.analyzeFile(filePath, content, language, config);
        violations.push(...fileViolations);
      } catch (error) {
        if (this.verbose) {
          console.warn(`C030 analysis error for ${path.basename(filePath)}: ${error.message}`);
        }
      }
    }

    return violations;
  }

  async analyzeFile(filePath, content, language, config = {}) {
    const violations = [];

    // Only target JS/TS for now
    if (!this.isJsLike(filePath)) {
      return violations;
    }

    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip comments-only lines quickly
      if (this.isCommentOnly(trimmed)) {
        continue;
      }

      for (const pattern of this.patterns) {
        const match = trimmed.match(pattern);
        if (match) {
          const column = line.indexOf(match[0]) + 1;
          const builtInName = this.extractBuiltinName(match);
          const violationType = this.getViolationType(pattern, trimmed);

          const suggestion = this.getSuggestion(builtInName, violationType);

          violations.push({
            ruleId: this.ruleId,
            file: filePath,
            line: i + 1,
            column: Math.max(column, 1),
            message: this.getMessage(violationType),
            severity: this.severity,
            code: trimmed,
            type: violationType,
            suggestion
          });

          // Avoid double-reporting same line on multiple patterns
          break;
        }
      }
    }

    return violations;
  }

  isJsLike(filePath) {
    return /\.(js|jsx|ts|tsx|mjs|cjs)$/.test(filePath);
  }

  isCommentOnly(trimmedLine) {
    return trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine === '';
  }

  extractBuiltinName(regexMatch) {
    if (!regexMatch || regexMatch.length < 2) return null;
    const candidate = regexMatch[1];
    return this.builtinErrorNames.includes(candidate) ? candidate : null;
  }

  getViolationType(pattern, line) {
    if (pattern.source.includes('new\\s+(')) {
      return 'generic_system_error_constructor';
    } else if (pattern.source.includes('\\s+(') && pattern.source.includes('\\(')) {
      return 'generic_system_error_call';
    } else if (pattern.source.includes('Promise\\.reject')) {
      return 'promise_reject_generic_error';
    } else if (pattern.source.includes('reject\\s*\\(')) {
      return 'reject_generic_error';
    } else if (pattern.source.includes('`[^`]*`')) {
      return 'throw_template_literal';
    } else if (pattern.source.includes("['\"")) {
      return 'throw_string_literal';
    } else if (pattern.source.includes('\\d+')) {
      return 'throw_number';
    } else if (pattern.source.includes('[a-zA-Z_$]')) {
      return 'throw_variable';
    }
    return 'generic_system_error_usage';
  }

  getMessage(violationType) {
    const messages = {
      'generic_system_error_constructor': 'Use custom error classes instead of generic system error constructors',
      'generic_system_error_call': 'Use custom error classes instead of generic system error calls',
      'promise_reject_generic_error': 'Use custom error classes instead of rejecting with generic errors',
      'reject_generic_error': 'Use custom error classes instead of rejecting with generic errors',
      'throw_string_literal': 'Use custom error classes instead of throwing string literals',
      'throw_template_literal': 'Use custom error classes instead of throwing template literals',
      'throw_number': 'Use custom error classes instead of throwing numbers',
      'throw_variable': 'Use custom error classes instead of throwing variables',
      'generic_system_error_usage': 'Use custom error classes instead of generic system errors'
    };
    return messages[violationType] || messages['generic_system_error_usage'];
  }

  getSuggestion(builtInName, violationType) {
    if (builtInName) {
      return `Define and throw a custom error class (e.g., DomainError extends Error) instead of ${builtInName}`;
    }
    
    const suggestions = {
      'throw_string_literal': 'Define and throw a custom error class (e.g., DomainError extends Error) instead of throwing string literals',
      'throw_template_literal': 'Define and throw a custom error class (e.g., DomainError extends Error) instead of throwing template literals',
      'throw_number': 'Define and throw a custom error class (e.g., DomainError extends Error) instead of throwing numbers',
      'throw_variable': 'Define and throw a custom error class (e.g., DomainError extends Error) instead of throwing variables',
      'promise_reject_generic_error': 'Define and throw a custom error class (e.g., DomainError extends Error) instead of rejecting with generic errors',
      'reject_generic_error': 'Define and throw a custom error class (e.g., DomainError extends Error) instead of rejecting with generic errors'
    };
    
    return suggestions[violationType] || 'Define and throw a custom error class (e.g., DomainError extends Error)';
  }
}

module.exports = new C030UseCustomErrorClassesAnalyzer();


