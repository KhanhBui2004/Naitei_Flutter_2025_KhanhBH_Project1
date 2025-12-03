/**
 * Heuristic analyzer for: S026 – JSON Schema Validation cho dữ liệu đầu vào
 * Purpose: Detect unvalidated JSON inputs while avoiding false positives on styles/config objects
 */

class S026Analyzer {
  constructor() {
    this.ruleId = 'S026';
    this.ruleName = 'JSON Schema Validation Required';
    this.description = 'Áp dụng JSON Schema Validation cho dữ liệu đầu vào để đảm bảo an toàn';
    
    // Patterns that indicate actual HTTP/API input (should be validated)
    this.httpInputPatterns = [
      'req.body', 'req.query', 'request.body', 'request.query',
      'ctx.body', 'ctx.query', 'context.body', 'context.query',
      'event.body', 'event.queryStringParameters'
    ];
    
    // Patterns that are NOT JSON inputs (should not be flagged)
    this.nonInputPatterns = [
      'styles.', 'css.', 'theme.', 'colors.',
      'config.', 'settings.', 'options.',
      'data.', 'props.', 'state.',
      'const.', 'static.', 'default.'
    ];
    
    // Validation patterns that indicate input is being validated
    this.validationPatterns = [
      'schema.validate', 'joi.validate', 'ajv.validate',
      'validate(', 'validateInput(', 'validateBody(',
      'isValid(', 'checkSchema(', 'parseSchema(',
      '.validate(', '.valid(', '.check('
    ];
    
    // Express/HTTP framework patterns
    this.httpFrameworkPatterns = [
      'app.post(', 'app.put(', 'app.patch(',
      'router.post(', 'router.put(', 'router.patch(',
      'express()', '.post(', '.put(', '.patch('
    ];
  }

  async analyze(files, language, options = {}) {
    const violations = [];
    
    for (const filePath of files) {
      if (options.verbose) {
        console.log(`🔍 Running S026 analysis on ${require('path').basename(filePath)}`);
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
    
    // Find all potential JSON inputs
    const potentialInputs = this.findPotentialInputs(lines);
    
    // Check if they're validated
    const validatedInputs = this.findValidatedInputs(content);
    
    // Report unvalidated inputs
    potentialInputs.forEach(input => {
      if (!this.isInputValidated(input, validatedInputs) && 
          this.isActualJSONInput(input, content)) {
        violations.push({
          file: filePath,
          line: input.line,
          column: input.column,
          message: `JSON input '${input.expression}' should be validated using a JSON schema before use. Consider using schema.validate(), joi.validate(), or similar validation library.`,
          severity: 'warning',
          ruleId: this.ruleId,
          type: 'unvalidated_json_input',
          inputExpression: input.expression
        });
      }
    });
    
    return violations;
  }
  
  findPotentialInputs(lines) {
    const inputs = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip comments and imports
      if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || 
          trimmedLine.startsWith('import') || trimmedLine.startsWith('export')) {
        return;
      }
      
      // Look for .body or .query patterns
      const bodyMatches = [...line.matchAll(/(\w+\.\w*body\w*)/g)];
      const queryMatches = [...line.matchAll(/(\w+\.\w*query\w*)/g)];
      
      [...bodyMatches, ...queryMatches].forEach(match => {
        const expression = match[1];
        const column = match.index + 1;
        
        inputs.push({
          expression,
          line: index + 1,
          column,
          originalLine: line
        });
      });
    });
    
    return inputs;
  }
  
  findValidatedInputs(content) {
    const validatedInputs = new Set();
    
    // Find validation calls
    this.validationPatterns.forEach(pattern => {
      const regex = new RegExp(pattern.replace('(', '\\(') + '\\s*\\(([^)]+)\\)', 'g');
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        const validatedInput = match[1].trim();
        validatedInputs.add(validatedInput);
        
        // Also add simplified version (e.g., req.body from schema.validate(req.body))
        const simplifiedInput = validatedInput.replace(/^\w+\./, '').replace(/\s+/g, '');
        if (simplifiedInput.includes('.')) {
          validatedInputs.add(simplifiedInput);
        }
      }
    });
    
    return validatedInputs;
  }
  
  isInputValidated(input, validatedInputs) {
    const expression = input.expression;
    
    // Check exact match
    if (validatedInputs.has(expression)) {
      return true;
    }
    
    // Check if any validated input contains this expression
    for (const validated of validatedInputs) {
      if (validated.includes(expression) || expression.includes(validated)) {
        return true;
      }
    }
    
    // Check if validation happens in the same line or nearby
    const lineContent = input.originalLine.toLowerCase();
    if (this.validationPatterns.some(pattern => lineContent.includes(pattern.toLowerCase()))) {
      return true;
    }
    
    return false;
  }
  
  isActualJSONInput(input, content) {
    const expression = input.expression.toLowerCase();
    
    // Skip known non-input patterns (user feedback - styles, config, etc.)
    if (this.nonInputPatterns.some(pattern => expression.startsWith(pattern.toLowerCase()))) {
      return false;
    }
    
    // Skip React/CSS style objects
    if (this.isStyleOrConfigObject(input, content)) {
      return false;
    }
    
    // Check if it matches HTTP input patterns
    if (this.httpInputPatterns.some(pattern => expression.includes(pattern.toLowerCase()))) {
      return true;
    }
    
    // Check if it's in HTTP handler context
    if (this.isInHTTPHandlerContext(input, content)) {
      return true;
    }
    
    // Default to false to avoid false positives
    return false;
  }
  
  isStyleOrConfigObject(input, content) {
    const expression = input.expression;
    const lineContent = input.originalLine.toLowerCase();
    
    // Check for React/CSS style usage patterns
    const styleIndicators = [
      'style=', 'css=', 'theme=', 'styles=',
      'background', 'color:', 'font', 'margin:', 'padding:',
      'import', 'const styles', 'const css', 'const theme'
    ];
    
    if (styleIndicators.some(indicator => lineContent.includes(indicator))) {
      return true;
    }
    
    // Check context around the input for style/config patterns
    const lines = content.split('\n');
    const inputLineIndex = input.line - 1;
    const contextStart = Math.max(0, inputLineIndex - 3);
    const contextEnd = Math.min(lines.length, inputLineIndex + 3);
    const contextLines = lines.slice(contextStart, contextEnd).join('\n').toLowerCase();
    
    const contextIndicators = [
      'const styles', 'const css', 'const config', 'const theme',
      'styleshet.create', 'react', 'jsx', '<div', '</div>', 'component',
      'export default', 'props', 'state'
    ];
    
    return contextIndicators.some(indicator => contextLines.includes(indicator));
  }
  
  isInHTTPHandlerContext(input, content) {
    const lines = content.split('\n');
    const inputLineIndex = input.line - 1;
    
    // Check surrounding context for HTTP framework patterns
    const contextStart = Math.max(0, inputLineIndex - 10);
    const contextEnd = Math.min(lines.length, inputLineIndex + 5);
    const contextLines = lines.slice(contextStart, contextEnd).join('\n').toLowerCase();
    
    // Look for HTTP handler patterns in context
    const httpIndicators = [
      'app.post', 'app.put', 'app.patch', 'app.delete',
      'router.post', 'router.put', 'router.patch',
      '(req, res)', 'request, response', 'ctx.body', 'ctx.query',
      'express', 'fastify', 'koa', 'hapi'
    ];
    
    return httpIndicators.some(indicator => contextLines.includes(indicator));
  }
}

module.exports = S026Analyzer;
