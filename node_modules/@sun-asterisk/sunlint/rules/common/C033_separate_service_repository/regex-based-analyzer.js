/**
 * Regex-based analyzer for: C033 – Tách logic xử lý và truy vấn dữ liệu trong service layer
 * Purpose: Use regex patterns to detect violations (fallback approach)
 */

class C033RegexBasedAnalyzer {
  constructor(semanticEngine = null) {
    this.ruleId = 'C033';
    this.ruleName = 'Separate Service and Repository Logic';
    this.description = 'Tách logic xử lý và truy vấn dữ liệu trong service layer - Repository chỉ chứa CRUD, Service chứa business logic';
    this.semanticEngine = semanticEngine;
    this.verbose = false;
    
    // Database method patterns to detect in Services - be very specific to avoid array methods
    this.dbMethods = [
      // ORM specific methods
      'findOneBy', 'findBy', 'findAndCount', 'findByIds',
      // Generic CRUD but avoid conflict with array methods
      'createQueryBuilder', 'getRepository', 'getManager', 'getConnection',
      'save', 'insert', 'upsert', 'persist',
      'update', 'patch', 'merge',
      'delete', 'remove', 'softDelete', 'destroy',
      'query', 'exec', 'execute', 'run',
      // Specific ORM methods 
      'flush', 'clear', 'refresh', 'reload',
      // SQL builder methods - be careful about join (conflicts with array.join)
      'select', 'from', 'where', 'innerJoin', 'leftJoin', 'rightJoin',
      'orderBy', 'groupBy', 'having', 'limit', 'offset'
    ];
    
    // Business logic indicators to detect in Repositories - be more specific
    this.businessLogicIndicators = [
      'calculateTotal', 'computeAmount', 'processPayment', 'transformData',
      'validateInput', 'verifyCredentials', 'checkPermission', 'ensureValid',
      'formatOutput', 'convertCurrency', 'parseRequest', 'serializeResponse',
      'applyBusinessRule', 'enforcePolicy', 'executeWorkflow'
    ];
  }

  /**
   * Initialize with semantic engine
   */
  async initialize(semanticEngine = null) {
    if (semanticEngine) {
      this.semanticEngine = semanticEngine;
    }
    this.verbose = semanticEngine?.verbose || false;
    
    if (this.verbose) {
      console.log(`[DEBUG] 🔧 C033: Semantic analyzer initialized`);
    }
  }

  async analyze(files, language, options = {}) {
    const violations = [];
    
    // Prefer semantic analysis if available
    if (this.semanticEngine?.project) {
      for (const filePath of files) {
        try {
          const fileViolations = await this.analyzeWithSemantics(filePath, options);
          violations.push(...fileViolations);
        } catch (error) {
          if (this.verbose || options.verbose) {
            console.warn(`[C033] Semantic analysis failed for ${filePath}:`, error.message);
          }
          // Fallback to basic heuristic analysis
          const fallbackViolations = await this.analyzeFileBasic(filePath, options);
          violations.push(...fallbackViolations);
        }
      }
    } else {
      // Fallback to basic analysis without ts-morph
      for (const filePath of files) {
        const fileViolations = await this.analyzeFileBasic(filePath, options);
        violations.push(...fileViolations);
      }
    }
    
    return violations;
  }

  /**
   * Analyze file using ts-morph semantic engine
   */
  async analyzeWithSemantics(filePath, options = {}) {
    const violations = [];
    
    const sourceFile = this.semanticEngine.project.getSourceFileByFilePath(filePath);
    if (!sourceFile) {
      if (this.verbose) {
        console.warn(`[C033] Source file not found in ts-morph project: ${filePath}`);
      }
      return violations;
    }

    // Classify file type based on semantic analysis
    const fileType = this.classifyFileWithSemantics(sourceFile, filePath);
    
    if (fileType === 'service') {
      violations.push(...this.analyzeServiceWithSemantics(sourceFile, filePath));
    } else if (fileType === 'repository') {
      violations.push(...this.analyzeRepositoryWithSemantics(sourceFile, filePath));
    }
    
    return violations;
  }

  /**
   * Classify file type using semantic analysis
   */
  classifyFileWithSemantics(sourceFile, filePath) {
    const fileName = sourceFile.getBaseName().toLowerCase();
    
    // First check if this is just a type definition file - skip these
    const hasOnlyTypes = this.isTypeDefinitionFile(sourceFile);
    if (hasOnlyTypes) {
      return 'unknown';
    }
    
    // Check filename patterns first - be more specific
    if (/service\.ts$|service\.js$/i.test(fileName)) return 'service';
    if (/repository\.ts$|repository\.js$|repo\.ts$|repo\.js$/i.test(fileName)) return 'repository';
    
    // Analyze class names and decorators - only if there are actual classes
    const classes = sourceFile.getClasses();
    if (classes.length === 0) {
      return 'unknown'; // No classes, likely just functions/types
    }
    
    for (const cls of classes) {
      const className = cls.getName()?.toLowerCase() || '';
      
      // Check class names - be more specific
      if (/service$/.test(className)) return 'service';
      if (/repository$|repo$/.test(className)) return 'repository';
      
      // Check decorators
      const decorators = cls.getDecorators();
      for (const decorator of decorators) {
        const decoratorName = decorator.getName().toLowerCase();
        if (decoratorName.includes('service')) return 'service';
        if (decoratorName.includes('repository')) return 'repository';
      }
      
      // Check if class has methods that indicate it's a service/repository
      const methods = cls.getMethods();
      if (methods.length > 0) {
        const hasDbMethods = methods.some(m => 
          this.dbMethods.some(dbMethod => m.getName().toLowerCase().includes(dbMethod))
        );
        const hasBusinessMethods = methods.some(m => 
          this.businessLogicIndicators.some(indicator => m.getName().toLowerCase().includes(indicator))
        );
        
        if (hasDbMethods && !hasBusinessMethods) return 'repository';
        if (hasBusinessMethods && !hasDbMethods) return 'service';
      }
    }
    
    // Check imports for framework patterns - but only as last resort
    const imports = sourceFile.getImportDeclarations();
    let hasOrmImports = false;
    let hasServiceImports = false;
    
    for (const importDecl of imports) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue().toLowerCase();
      
      if (/typeorm|sequelize|mongoose|prisma|knex/.test(moduleSpecifier)) {
        hasOrmImports = true;
      }
      
      if (/service|business|usecase/.test(moduleSpecifier)) {
        hasServiceImports = true;
      }
    }
    
    // Only classify based on imports if we have clear indicators AND actual implementations
    if (hasOrmImports && !hasServiceImports && classes.length > 0) return 'repository';
    if (hasServiceImports && !hasOrmImports && classes.length > 0) return 'service';
    
    return 'unknown';
  }

  /**
   * Check if file contains only type definitions (interfaces, types, enums)
   */
  isTypeDefinitionFile(sourceFile) {
    const interfaces = sourceFile.getInterfaces();
    const typeAliases = sourceFile.getTypeAliases();
    const enums = sourceFile.getEnums();
    const classes = sourceFile.getClasses();
    const functions = sourceFile.getFunctions();
    const variableStatements = sourceFile.getVariableStatements();
    
    // If we have only interfaces, types, and enums, it's a type definition file
    const hasOnlyTypes = (interfaces.length > 0 || typeAliases.length > 0 || enums.length > 0) &&
                         classes.length === 0 && 
                         functions.length === 0 && 
                         variableStatements.length === 0;
    
    return hasOnlyTypes;
  }

  /**
   * Analyze Service files using semantic analysis
   */
  analyzeServiceWithSemantics(sourceFile, filePath) {
    const violations = [];
    const classes = sourceFile.getClasses();
    
    for (const cls of classes) {
      const methods = cls.getMethods();
      
      for (const method of methods) {
        violations.push(...this.analyzeServiceMethod(method, filePath, cls.getName()));
      }
    }
    
    return violations;
  }

  /**
   * Analyze Service method for direct database calls using AST
   */
  analyzeServiceMethod(method, filePath, className) {
    const violations = [];
    const methodName = method.getName();
    
    // Get all call expressions in the method
    const callExpressions = method.getDescendantsOfKind(this.getKind('CallExpression'));
    
    for (const callExpr of callExpressions) {
      const expression = callExpr.getExpression();
      
      // Check for property access patterns (obj.method())
      if (expression.getKind() === this.getKind('PropertyAccessExpression')) {
        const propertyName = expression.getNameNode().getText();
        
        // Exclude queue/job operations first (before checking dbMethods)
        if (this.isQueueOperation(callExpr, propertyName)) {
          continue;
        }
        
        // Check if it's a database method call
        if (this.dbMethods.includes(propertyName)) {
          // Check if it's not going through repository
          if (!this.isCallThroughRepository(callExpr)) {
            const lineNumber = callExpr.getStartLineNumber();
            const columnNumber = callExpr.getStart() - sourceFile.getLineStartPos(lineNumber - 1) + 1;
            
            violations.push({
              ruleId: 'C033',
              severity: 'warning',
              message: `Service should not contain direct database calls`,
              source: 'C033',
              file: filePath,
              line: lineNumber,
              column: columnNumber,
              description: `[REGEX-FALLBACK] Direct database call '${propertyName}()' found in Service method '${methodName}'. Move database access to Repository layer.`,
              suggestion: 'Inject Repository dependency and use repository methods for data access',
              category: 'architecture'
            });
          }
        }
      }
    }
    
    return violations;
  }

  /**
   * Analyze Repository files using semantic analysis
   */
  analyzeRepositoryWithSemantics(sourceFile, filePath) {
    const violations = [];
    const classes = sourceFile.getClasses();
    
    for (const cls of classes) {
      const methods = cls.getMethods();
      
      for (const method of methods) {
        violations.push(...this.analyzeRepositoryMethod(method, filePath, cls.getName()));
      }
    }
    
    return violations;
  }

  /**
   * Analyze Repository method for business logic using AST
   */
  analyzeRepositoryMethod(method, filePath, className) {
    const violations = [];
    const methodName = method.getName();
    
    // Skip basic CRUD methods from strict checking
    if (this.isBasicCrudMethod(methodName)) {
      return violations;
    }
    
    // Check for complex control flow
    const ifStatements = method.getDescendantsOfKind(this.getKind('IfStatement'));
    const forStatements = method.getDescendantsOfKind(this.getKind('ForStatement'));
    const whileStatements = method.getDescendantsOfKind(this.getKind('WhileStatement'));
    const switchStatements = method.getDescendantsOfKind(this.getKind('SwitchStatement'));
    
    // Flag complex conditional logic
    if (ifStatements.length > 2) {
      const firstIf = ifStatements[0];
      const lineNumber = firstIf.getStartLineNumber();
      
      violations.push({
        ruleId: 'C033',
        severity: 'warning',
        message: `Repository should not contain business logic`,
        source: 'C033',
        file: filePath,
        line: lineNumber,
        column: 1,
        description: `Complex conditional logic (${ifStatements.length} if statements) found in Repository method '${methodName}'. Move business logic to Service layer.`,
        suggestion: 'Move business logic to Service class and keep Repository methods simple',
        category: 'architecture'
      });
    }
    
    // Check for business logic in method names and identifiers
    const methodBody = method.getBodyText() || '';
    for (const indicator of this.businessLogicIndicators) {
      if (new RegExp(`\\b${indicator}\\b`, 'i').test(methodBody)) {
        const lineNumber = method.getStartLineNumber();
        
        violations.push({
          ruleId: 'C033',
          severity: 'warning',
          message: `Repository should not contain business logic`,
          source: 'C033',
          file: filePath,
          line: lineNumber,
          column: 1,
          description: `Business logic pattern '${indicator}' found in Repository method '${methodName}'. Move to Service layer.`,
          suggestion: 'Keep Repository focused on data access only',
          category: 'architecture'
        });
        break; // Only report once per method
      }
    }
    
    return violations;
  }

  /**
   * Check if call is made through repository variable
   */
  isCallThroughRepository(callExpr) {
    const expression = callExpr.getExpression();
    
    if (expression.getKind() === this.getKind('PropertyAccessExpression')) {
      const object = expression.getExpression();
      const objectText = object.getText().toLowerCase();
      
      // Check if the object variable name suggests it's a repository
      return /repository|repo|dao|store/.test(objectText);
    }
    
    return false;
  }

  /**
   * Check if method is basic CRUD
   */
  isBasicCrudMethod(methodName) {
    const crudPatterns = [
      /^find/, /^get/, /^save/, /^create/, /^update/, /^delete/, /^remove/,
      /^list/, /^search/, /^count/, /^exists/, /^has/
    ];
    
    return crudPatterns.some(pattern => pattern.test(methodName.toLowerCase()));
  }

  /**
   * Get SyntaxKind with fallback
   */
  getKind(kindName) {
    // Try to get from semantic engine
    if (this.semanticEngine?.SyntaxKind?.[kindName]) {
      return this.semanticEngine.SyntaxKind[kindName];
    }
    
    // Fallback to common TypeScript SyntaxKind values
    const fallbackKinds = {
      'CallExpression': 214,
      'PropertyAccessExpression': 212,
      'IfStatement': 243,
      'ForStatement': 247,
      'WhileStatement': 248,
      'SwitchStatement': 259,
      'Identifier': 79
    };
    
    return fallbackKinds[kindName] || 0;
  }

  /**
   * Basic analysis without ts-morph (fallback)
   */
  async analyzeFileBasic(filePath, options = {}) {
    const fs = require('fs');
    const path = require('path');
    
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const violations = [];
    const lines = content.split('\n');
    
    // More precise file classification - avoid false positives
    const fileName = path.basename(filePath).toLowerCase();
    
    // Check if it's likely just a type definition file
    const looksLikeTypeFile = this.isLikelyTypeDefinitionFile(content, fileName);
    if (looksLikeTypeFile) {
      return []; // Skip type definition files
    }
    
    // Only classify as service/repository if filename or class patterns match precisely
    const isService = /service\.ts$|service\.js$/i.test(fileName) || 
                     /class\s+\w*Service\b/i.test(content) ||
                     /@Service/i.test(content);
                     
    const isRepository = /repository\.ts$|repository\.js$|repo\.ts$|repo\.js$/i.test(fileName) || 
                        /class\s+\w*Repository\b/i.test(content) ||
                        /class\s+\w*Repo\b/i.test(content) ||
                        /@Repository/i.test(content);
    
    if (isService) {
      // Look for direct database calls in Service
      lines.forEach((line, index) => {
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
        
        for (const method of this.dbMethods) {
          const pattern = new RegExp(`\\.${method}\\s*\\(`, 'i');
          if (pattern.test(line) && !/repository|repo/i.test(line)) {
            // Avoid false positives from built-in objects and array methods
            if (/Array\.|Object\.|String\.|Number\.|Date\.|Math\.|JSON\.|console\./i.test(line)) {
              continue;
            }
            
            // Avoid false positives from Node.js built-in APIs
            if (/Buffer\.|crypto\.|createHash\.|\.digest\(|\.alloc\(/i.test(line)) {
              continue;
            }
            
            // Avoid false positives from Lodash utility methods
            if (/chain\(|_\.|lodash\.|\.map\(|\.orderBy\(|\.pick\(|\.value\(|\.filter\(/i.test(line)) {
              continue;
            }
            
            // Avoid false positives from service-to-service calls
            if (/Service\.|\.service\./i.test(line)) {
              continue;
            }
            
            // Avoid false positives from this.method() calls (internal service methods)
            if (/this\./i.test(line) && pattern.test(line)) {
              continue;
            }
            
            // Avoid false positives from command/pattern/interface methods
            if (/command\.|pattern\.|interface\.|regex\.|objPattern\./i.test(line)) {
              continue;
            }
            
            // Avoid false positives from job/queue operations (acceptable in services)
            if (/job\.|queue\.|bull\./i.test(line)) {
              continue;
            }
            
            violations.push({
              ruleId: 'C033',
              severity: 'warning',
              message: `Service should not contain direct database calls`,
              source: 'C033',
              file: filePath,
              line: index + 1,
              column: line.search(pattern) + 1,
              description: `Direct database call '${method}()' found in Service`,
              suggestion: 'Use Repository pattern for data access',
              category: 'architecture'
            });
          }
        }
      });
    }
    
    if (isRepository) {
      // Look for business logic in Repository
      lines.forEach((line, index) => {
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
        
        for (const indicator of this.businessLogicIndicators) {
          const pattern = new RegExp(`\\b${indicator}\\b`, 'i');
          if (pattern.test(line)) {
            violations.push({
              ruleId: 'C033',
              severity: 'warning',
              message: `Repository should not contain business logic`,
              source: 'C033',
              file: filePath,
              line: index + 1,
              column: line.search(pattern) + 1,
              description: `Business logic pattern '${indicator}' found in Repository`,
              suggestion: 'Move business logic to Service layer',
              category: 'architecture'
            });
            break; // Only report once per line
          }
        }
      });
    }
    
    return violations;
  }

  /**
   * Check if content looks like a type definition file (for fallback analysis)
   */
  isLikelyTypeDefinitionFile(content, fileName) {
    // Check file extension patterns that suggest types
    if (/\.types?\.ts$|\.d\.ts$|type\.ts$/i.test(fileName)) {
      return true;
    }
    
    // Count different kinds of declarations
    const interfaceCount = (content.match(/export\s+interface\s+/g) || []).length;
    const typeCount = (content.match(/export\s+type\s+/g) || []).length;
    const enumCount = (content.match(/export\s+enum\s+/g) || []).length;
    const classCount = (content.match(/export\s+class\s+/g) || []).length;
    const functionCount = (content.match(/export\s+(function|const\s+\w+\s*=\s*\()/g) || []).length;
    
    const typeDeclarations = interfaceCount + typeCount + enumCount;
    const codeDeclarations = classCount + functionCount;
    
    // If we have mostly type declarations and few/no code declarations
    return typeDeclarations > 0 && (codeDeclarations === 0 || typeDeclarations > codeDeclarations * 2);
  }

  /**
   * Check if this is a queue/job operation (should be excluded from database detection)
   */
  isQueueOperation(callExpr, methodName) {
    const queueMethods = [
      'remove', 'isFailed', 'isCompleted', 'isActive', 'isWaiting', 'isDelayed',
      'getJob', 'getJobs', 'add', 'process', 'on', 'off',
      'retry', 'moveToCompleted', 'moveToFailed'
    ];
    
    if (!queueMethods.includes(methodName)) {
      return false;
    }
    
    // Check the object being called - look for queue/job patterns
    const expression = callExpr.getExpression();
    if (expression.getKind() === this.getKind('PropertyAccessExpression')) {
      const objectExpr = expression.getExpression();
      const objectText = objectExpr.getText().toLowerCase();
      
      // Check if object looks like queue or job
      const queuePatterns = ['queue', 'job', 'bull'];
      const isQueueObject = queuePatterns.some(pattern => objectText.includes(pattern));
      
      if (this.verbose || queueMethods.includes(methodName)) {
        console.log(`[DEBUG] Queue check: object="${objectText}", method="${methodName}", isQueue=${isQueueObject}`);
      }
      
      return isQueueObject;
    }
    
    return false;
  }
}

module.exports = C033RegexBasedAnalyzer;
