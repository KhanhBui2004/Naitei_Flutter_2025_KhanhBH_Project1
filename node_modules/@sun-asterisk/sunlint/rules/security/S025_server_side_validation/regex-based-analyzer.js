/**
 * S025 Regex-Based Analyzer - Always validate client-side data on the server
 * Fallback analysis using regex patterns
 * 
 * Detects common patterns of server-side validation violations:
 * 1. Missing ValidationPipe in NestJS
 * 2. @Body() without DTO validation
 * 3. Direct req.body/req.query usage without validation
 * 4. Sensitive fields trusted from client
 * 5. SQL injection via string concatenation
 * 6. File upload without server-side validation
 */

const fs = require("fs");

class S025RegexBasedAnalyzer {
  constructor(semanticEngine = null) {
    this.semanticEngine = semanticEngine;
    this.ruleId = "S025";
    this.category = "security";

    // Sensitive field patterns that should not come from client
    this.sensitiveFields = [
      "userId", "user_id", "id",
      "role", "roles", "permissions", 
      "price", "amount", "total", "cost",
      "isAdmin", "is_admin", "admin",
      "discount", "balance", "credits",
      "isActive", "is_active", "enabled",
      "status", "state", "level"
    ];

    // Validation indicators
    this.validationPatterns = [
      /ValidationPipe/gi,
      /class-validator/gi,
      /IsString|IsInt|IsEmail|IsUUID|IsOptional|IsArray/gi,
      /validateOrReject|plainToClass/gi,
      /joi\.validate|yup\.validate|zod\.parse/gi,
      /fileFilter|mimetype|file\.size/gi
    ];

    // Patterns for missing validation
    this.missingValidationPatterns = [
      // NestJS @Body() without DTO
      {
        pattern: /@Body\(\)\s+\w+:\s*any/g,
        message: "Using @Body() with 'any' type - use DTO with validation instead"
      },
      {
        pattern: /@Body\(\)\s+\w+:\s*Record<string,\s*any>/g,
        message: "Using @Body() with Record<string,any> - use DTO with validation instead"
      },
      
      // Express req usage without validation
      {
        pattern: /(?:const|let|var)\s+\w+\s*=\s*req\.body(?:\.\w+)?(?:[^;]*;)/g,
        message: "Direct use of req.body without server-side validation"
      },
      {
        pattern: /(?:const|let|var)\s+\w+\s*=\s*req\.query(?:\.\w+)?(?:[^;]*;)/g,
        message: "Direct use of req.query without server-side validation"
      },
      {
        pattern: /(?:const|let|var)\s+\w+\s*=\s*req\.params(?:\.\w+)?(?:[^;]*;)/g,
        message: "Direct use of req.params without server-side validation"
      },

      // SQL injection patterns
      {
        pattern: /\.query\s*\(\s*[`"'][^`"']*\$\{[^}]+\}[^`"']*[`"']/g,
        message: "Potential SQL injection: use parameterized queries instead of template literals"
      },
      {
        pattern: /\.query\s*\(\s*[`"'][^`"']*\+[^`"']*[`"']/g,
        message: "Potential SQL injection: use parameterized queries instead of string concatenation"
      },

      // File upload without validation
      {
        pattern: /@UploadedFile\(\)\s+\w+(?![^}]*fileFilter)/g,
        message: "File upload missing server-side validation (type, size, content)"
      }
    ];

    // Sensitive field usage patterns - exclude req.user access
    this.sensitiveFieldPatterns = this.sensitiveFields.map(field => ({
      pattern: new RegExp(`(?:const|let|var)\\s+${field}\\s*=\\s*req\\.body(?:\\.|\\[)`, 'g'),
      message: `Sensitive field "${field}" should not be trusted from client data - verify on server`
    }));

    // Additional patterns for destructuring from req.body
    this.destructuringPatterns = this.sensitiveFields.map(field => ({
      pattern: new RegExp(`\\{[^}]*\\b${field}\\b[^}]*\\}\\s*=\\s*req\\.body`, 'g'),
      message: `Sensitive field "${field}" should not be trusted from client data - verify on server`
    }));
  }

  async analyze(filePath) {
    if (this.verbose) {
      console.log(`🔍 [${this.ruleId}] Regex-based analysis for: ${filePath}`);
    }

    try {
      const content = fs.readFileSync(filePath, "utf8");
      return this.analyzeContent(content, filePath);
    } catch (error) {
      if (this.verbose) {
        console.log(
          `🔍 [${this.ruleId}] Regex: Error reading file:`,
          error.message
        );
      }
      return [];
    }
  }

  analyzeContent(content, filePath) {
    const violations = [];
    const lines = content.split("\n");

    // Remove comments to avoid false positives
    const cleanContent = this.removeComments(content);

    try {
      // Check framework type
      const isNestJS = this.isNestJSFile(cleanContent);
      const isExpress = this.isExpressFile(cleanContent);

      if (this.verbose) {
        console.log(`🔍 [${this.ruleId}] Framework detection - NestJS: ${isNestJS}, Express: ${isExpress}`);
      }

      // 1. Check for missing ValidationPipe in NestJS
      if (isNestJS) {
        violations.push(...this.checkNestJSValidation(cleanContent, filePath));
      }

      // 2. Check general missing validation patterns
      violations.push(...this.checkMissingValidationPatterns(cleanContent, filePath));

      // 3. Check sensitive field usage
      violations.push(...this.checkSensitiveFieldUsage(cleanContent, filePath));

      // 4. Check Express specific patterns
      if (isExpress) {
        violations.push(...this.checkExpressPatterns(cleanContent, filePath));
      }

      // 5. Check file upload patterns
      violations.push(...this.checkFileUploadPatterns(cleanContent, filePath));

    } catch (error) {
      if (this.verbose) {
        console.log(
          `🔍 [${this.ruleId}] Regex: Error in analysis:`,
          error.message
        );
      }
    }

    return violations;
  }

  isNestJSFile(content) {
    return /(@Controller|@Post|@Get|@Put|@Delete|@Body\(\)|@nestjs\/)/i.test(content);
  }

  isExpressFile(content) {
    return /(express|req\.body|req\.query|req\.params|app\.post|app\.get)/i.test(content);
  }

  checkNestJSValidation(content, filePath) {
    const violations = [];

    // Check if ValidationPipe is configured
    const hasGlobalValidationPipe = /useGlobalPipes.*ValidationPipe/i.test(content);

    if (!hasGlobalValidationPipe) {
      // Check individual route methods
      const routeMethodPattern = /@(Post|Put|Patch|Delete)\s*\([^)]*\)[^{]*\{[^}]*@Body\(\)/gi;
      let match;

      while ((match = routeMethodPattern.exec(content)) !== null) {
        const methodBody = this.extractMethodBody(content, match.index);
        
        // Check if the method has validation
        const hasValidation = this.validationPatterns.some(pattern => 
          pattern.test(methodBody)
        );

        if (!hasValidation) {
          const lineNumber = this.getLineNumber(content, match.index);
          violations.push({
            rule: this.ruleId,
            source: filePath,
            category: this.category,
            line: lineNumber,
            column: 1,
            message: `NestJS route missing ValidationPipe or DTO validation`,
            severity: "error",
          });
        }
      }
    }

    return violations;
  }

  checkMissingValidationPatterns(content, filePath) {
    const violations = [];

    for (const patternConfig of this.missingValidationPatterns) {
      let match;
      while ((match = patternConfig.pattern.exec(content)) !== null) {
        // Check if validation is present in the surrounding context
        const context = this.getContext(content, match.index, 500);
        const hasValidation = this.validationPatterns.some(pattern => 
          pattern.test(context)
        );

        if (!hasValidation) {
          const lineNumber = this.getLineNumber(content, match.index);
          violations.push({
            rule: this.ruleId,
            source: filePath,
            category: this.category,
            line: lineNumber,
            column: 1,
            message: patternConfig.message,
            severity: "error",
          });
        }
      }
    }

    return violations;
  }

  checkSensitiveFieldUsage(content, filePath) {
    const violations = [];

    // Check both direct assignment and destructuring patterns
    const allPatterns = [...this.sensitiveFieldPatterns, ...this.destructuringPatterns];

    for (const fieldConfig of allPatterns) {
      let match;
      while ((match = fieldConfig.pattern.exec(content)) !== null) {
        // Skip if this appears to be from req.user (auth context)
        const context = this.getContext(content, match.index, 200);
        if (/req\.user/i.test(context)) {
          continue;
        }

        const lineNumber = this.getLineNumber(content, match.index);
        violations.push({
          rule: this.ruleId,
          source: filePath,
          category: this.category,
          line: lineNumber,
          column: 1,
          message: fieldConfig.message,
          severity: "error",
        });
      }
    }

    return violations;
  }

  checkExpressPatterns(content, filePath) {
    const violations = [];

    // Check for middleware usage patterns - more sophisticated check
    const routePattern = /app\.(post|put|patch|delete)\s*\([^,]+,\s*([^{]*)\{[^}]*req\.body/gi;
    let match;

    while ((match = routePattern.exec(content)) !== null) {
      const middlewareSection = match[2];
      
      // Check if validation middleware is present
      const hasValidationMiddleware = /validate|body\(|query\(|param\(/i.test(middlewareSection);
      
      if (!hasValidationMiddleware) {
        const context = this.getContext(content, match.index, 500);
        
        // Check for nearby validation patterns or schema validation
        const hasNearbyValidation = this.validationPatterns.some(pattern => pattern.test(context));
        const hasSchemaValidation = /validateAsync|joi\.|yup\.|zod\./i.test(context);
        
        if (!hasNearbyValidation && !hasSchemaValidation) {
          const lineNumber = this.getLineNumber(content, match.index);
          violations.push({
            rule: this.ruleId,
            source: filePath,
            category: this.category,
            line: lineNumber,
            column: 1,
            message: "Express route missing validation middleware",
            severity: "error",
          });
        }
      }
    }

    return violations;
  }

  checkFileUploadPatterns(content, filePath) {
    const violations = [];

    // Check for file upload without proper validation
    const fileUploadPattern = /@UseInterceptors\s*\(\s*FileInterceptor[^)]*\)[^{]*\{[^}]*@UploadedFile\(\)/gi;
    let match;

    while ((match = fileUploadPattern.exec(content)) !== null) {
      const context = this.getContext(content, match.index, 1000);
      
      // Check if file validation is present
      const hasFileValidation = /fileFilter|mimetype|file\.size|multer.*limits/i.test(context);

      if (!hasFileValidation) {
        const lineNumber = this.getLineNumber(content, match.index);
        violations.push({
          rule: this.ruleId,
          source: filePath,
          category: this.category,
          line: lineNumber,
          column: 1,
          message: "File upload missing server-side validation (type, size, security checks)",
          severity: "error",
        });
      }
    }

    return violations;
  }

  extractMethodBody(content, startIndex) {
    // Find the opening brace
    let braceCount = 0;
    let i = startIndex;
    
    // Find first opening brace
    while (i < content.length && content[i] !== '{') {
      i++;
    }
    
    if (i >= content.length) return "";
    
    const start = i;
    braceCount = 1;
    i++;
    
    // Find matching closing brace
    while (i < content.length && braceCount > 0) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') braceCount--;
      i++;
    }
    
    return content.substring(start, i);
  }

  getContext(content, index, radius = 200) {
    const start = Math.max(0, index - radius);
    const end = Math.min(content.length, index + radius);
    return content.substring(start, end);
  }

  removeComments(content) {
    // Remove single-line comments
    content = content.replace(/\/\/.*$/gm, "");
    // Remove multi-line comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, "");
    return content;
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split("\n").length;
  }

  cleanup() {
    // Cleanup resources if needed
  }
}

module.exports = S025RegexBasedAnalyzer;
