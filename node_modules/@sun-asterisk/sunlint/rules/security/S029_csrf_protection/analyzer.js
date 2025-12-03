const fs = require('fs');
const path = require('path');

class S029Analyzer {
  constructor() {
    this.ruleId = 'S029';
    this.ruleName = 'CSRF Protection Required';
    this.description = 'Cần áp dụng cơ chế chống CSRF cho các chức năng xác thực';
  }

  async analyze(files, language, options = {}) {
    const violations = [];
    
    for (const filePath of files) {
      if (options.verbose) {
        console.log(`🔍 Running S029 analysis on ${path.basename(filePath)}`);
      }
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileViolations = await this.analyzeFile(filePath, content, language, options);
        violations.push(...fileViolations);
      } catch (error) {
        console.warn(`⚠️ Failed to analyze ${filePath}: ${error.message}`);
      }
    }
    
    return violations;
  }

  async analyzeFile(filePath, content, language, config) {
    switch (language) {
      case 'typescript':
      case 'javascript':
        return this.analyzeTypeScript(filePath, content, config);
      default:
        return [];
    }
  }

  async analyzeTypeScript(filePath, content, config) {
    const violations = [];
    const lines = content.split('\n');
    
    // Find lines where global CSRF protection is applied
    const globalCSRFLines = this.findGlobalCSRFLines(lines);
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // Skip comments and imports
      if (this.isCommentOrImport(trimmedLine)) {
        return;
      }

      // Look for Express route handlers that need CSRF protection
      const routeHandlers = this.findRouteHandlers(trimmedLine, line);
      
      routeHandlers.forEach(handler => {
        // Skip if this is a mock or test context
        if (this.isMockOrTestContext(content, handler.instance)) {
          return;
        }
        
        // Check if global CSRF protection was applied before this route
        const hasGlobalCSRFProtection = this.hasGlobalCSRFProtectionBeforeLine(globalCSRFLines, index, handler.instance);
        
        // Check if this specific route has CSRF protection
        const hasRouteCSRFProtection = this.hasRouteSpecificCSRFProtection(lines, index, handler);
        
        if (!hasGlobalCSRFProtection && !hasRouteCSRFProtection) {
          violations.push({
            ruleId: this.ruleId,
            file: filePath,
            line: lineNumber,
            column: handler.column,
            message: `CSRF protection is missing for route handler '${handler.route}'. Apply csurf() or equivalent middleware`,
            severity: 'error',
            code: trimmedLine,
            type: 'missing_csrf_protection',
            confidence: handler.confidence,
            suggestion: 'Add CSRF middleware: app.use(csurf()) or use CSRF token validation'
          });
        }
      });
    });

    return violations;
  }

  isCommentOrImport(line) {
    const trimmed = line.trim();
    return trimmed.startsWith('//') || 
           trimmed.startsWith('/*') || 
           trimmed.startsWith('*') ||
           trimmed.startsWith('import ') ||
           trimmed.startsWith('export ');
  }

  findRouteHandlers(line, originalLine) {
    const handlers = [];
    const foundMatches = new Set(); // Prevent duplicates
    
    // Only detect Express.js route patterns, not HTTP client methods
    const routePatterns = [
      // Express method with middleware: app.post('/path', middleware, handler)
      {
        regex: /\b(app|router|server)\s*\.\s*(post|put|delete|patch)\s*\(\s*(['"`][^'"`]*['"`])\s*,/gi,
        type: 'express_route_with_middleware',
        priority: 1 // Higher priority to check first
      },
      // app.post(), router.put(), etc.
      {
        regex: /\b(app|router|server)\s*\.\s*(post|put|delete|patch)\s*\(\s*(['"`][^'"`]*['"`])/gi,
        type: 'express_route',
        priority: 2
      }
    ];

    // Sort by priority to avoid duplicates
    routePatterns.sort((a, b) => a.priority - b.priority);

    routePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(line)) !== null) {
        const instance = match[1]; // app, router, server
        const method = match[2];   // post, put, delete, patch
        const route = match[3];    // '/path'
        const matchKey = `${instance}.${method}(${route})`; // Unique key
        
        // Skip duplicates
        if (foundMatches.has(matchKey)) {
          continue;
        }
        
        // Skip if it's clearly not Express.js context
        if (this.isNotExpressContext(line, instance)) {
          continue;
        }

        foundMatches.add(matchKey);
        handlers.push({
          type: pattern.type,
          instance: instance,
          method: method,
          route: route.replace(/['"]/g, ''),
          column: match.index + 1,
          confidence: this.calculateConfidence(line, pattern.type)
        });
      }
    });

    return handlers;
  }

  isNotExpressContext(line, instance) {
    // Skip HTTP client methods (like axios, fetch wrappers)
    const clientPatterns = [
      'public ', 'private ', 'protected ',  // Class methods
      'async ', 'function ',                // Function definitions
      'const ', 'let ', 'var ',            // Variable assignments
      ': Promise<', ': BaseResponse<',      // TypeScript return types
      'this.http', 'httpClient',            // HTTP client instances
      'axios.', 'fetch(',                   // HTTP client calls
    ];

    const lowerLine = line.toLowerCase();
    
    // If line contains client patterns, likely not Express route
    const hasClientPattern = clientPatterns.some(pattern => 
      lowerLine.includes(pattern.toLowerCase())
    );

    if (hasClientPattern) {
      return true;
    }

    // If instance name suggests HTTP client, skip
    const clientInstanceNames = ['httpclient', 'client', 'api', 'service'];
    if (clientInstanceNames.includes(instance.toLowerCase())) {
      return true;
    }

    return false;
  }

  // Check if the file content suggests this is a mock/test rather than real Express app
  isMockOrTestContext(content, instance) {
    const lowerContent = content.toLowerCase();
    
    // Look for mock object definitions
    const mockPatterns = [
      `const ${instance.toLowerCase()} = {`,
      `let ${instance.toLowerCase()} = {`,
      `var ${instance.toLowerCase()} = {`,
      `${instance.toLowerCase()}: {`,
    ];
    
    const hasMockDefinition = mockPatterns.some(pattern => 
      lowerContent.includes(pattern)
    );
    
    if (hasMockDefinition) {
      return true;
    }
    
    // Check for test file patterns
    const testIndicators = ['.test.', '.spec.', '__tests__', 'test case', 'mock'];
    const isTestContext = testIndicators.some(indicator => 
      lowerContent.includes(indicator)
    );
    
    return isTestContext;
  }

  hasCSRFProtection(content) {
    const csrfPatterns = [
      // Middleware usage
      'csurf()',
      'csrfProtection',
      'verifyCsrfToken',
      'checkCsrf',
      'csrf-token',
      '_csrf',
      
      // Manual CSRF checks
      'req.csrfToken',
      'csrf.verify',
      'validateCSRF',
      
      // Security headers
      'x-csrf-token',
      'x-xsrf-token',
      
      // Framework-specific
      'protect_from_forgery',  // Rails
      '@csrf',                 // Laravel
    ];

    const lowerContent = content.toLowerCase();
    
    return csrfPatterns.some(pattern => 
      lowerContent.includes(pattern.toLowerCase())
    );
  }

  hasGlobalCSRFProtection(content) {
    // Check for global CSRF middleware: app.use(csurf())
    const globalPatterns = [
      /\b(app|router|server)\s*\.\s*use\s*\(\s*csurf\(\)/gi,
      /\b(app|router|server)\s*\.\s*use\s*\(\s*csrfProtection/gi,
      /\b(app|router|server)\s*\.\s*use\s*\(\s*csrf\(\)/gi,
    ];

    return globalPatterns.some(pattern => pattern.test(content));
  }

  findGlobalCSRFLines(lines) {
    const csrfLines = [];
    
    lines.forEach((line, index) => {
      const globalPatterns = [
        /\b(app|router|server)\s*\.\s*use\s*\(\s*csurf\(\)/gi,
        /\b(app|router|server)\s*\.\s*use\s*\(\s*csrfProtection/gi,
        /\b(app|router|server)\s*\.\s*use\s*\(\s*csrf\(\)/gi,
      ];

      globalPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          csrfLines.push({
            lineIndex: index,
            instance: match[1], // app, router, server
            line: line.trim()
          });
        }
      });
    });

    return csrfLines;
  }

  hasGlobalCSRFProtectionBeforeLine(globalCSRFLines, routeLineIndex, routeInstance) {
    // Check if any global CSRF protection was applied for this instance before this route
    return globalCSRFLines.some(csrf => 
      csrf.instance === routeInstance && csrf.lineIndex < routeLineIndex
    );
  }

  hasRouteSpecificCSRFProtection(lines, currentIndex, handler) {
    // Check if the route has CSRF middleware as parameter
    // e.g. app.post('/path', csrfProtection, handler)
    const currentLine = lines[currentIndex];
    
    const csrfMiddlewarePatterns = [
      'csrfProtection',
      'csurf()',
      'verifyCsrfToken',
      'checkCsrf',
    ];

    return csrfMiddlewarePatterns.some(pattern => 
      currentLine.includes(pattern)
    );
  }

  calculateConfidence(line, patternType) {
    let confidence = 0.8;
    
    // Higher confidence for clear Express patterns
    if (patternType === 'express_route_with_middleware') {
      confidence += 0.1;
    }

    // Lower confidence if mixed with client-like patterns
    const clientIndicators = ['public', 'class', 'Promise<', 'async'];
    const hasClientIndicators = clientIndicators.some(indicator => 
      line.includes(indicator)
    );
    
    if (hasClientIndicators) {
      confidence -= 0.3;
    }

    return Math.max(0.3, Math.min(1.0, confidence));
  }
}

module.exports = new S029Analyzer();
