// rules/common/C073_validate_required_config_on_startup/analyzer.js
const path = require('path');
const fs = require('fs');
const { CommentDetector } = require('../../utils/rule-helpers');

class C073ConfigValidationAnalyzer {
  constructor(semanticEngine = null) {
    this.ruleId = 'C073';
    this.ruleName = 'Validate Required Configuration on Startup';
    this.description = 'C073 - Validate mandatory configuration at startup and fail fast on invalid/missing values';
    this.semanticEngine = semanticEngine;
    this.verbose = false;
    
    // Load config from config.json
    this.loadConfig();
  }

  loadConfig() {
    try {
      const configPath = path.join(__dirname, 'config.json');
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      this.options = configData.options || {};
      this.configModules = this.options.configModules || {};
      this.envAccessors = this.options.envAccessors || {};
      this.schemaDetectors = this.options.schemaDetectors || {};
      this.failFastSignals = this.options.failFastSignals || {};
      this.dangerousDefaults = this.options.dangerousDefaults || [];
      this.thresholds = this.options.thresholds || {};
      this.policy = this.options.policy || {};
    } catch (error) {
      console.warn(`[C073] Could not load config: ${error.message}`);
      this.options = {};
      this.configModules = {};
      this.envAccessors = {};
      this.schemaDetectors = {};
      this.failFastSignals = {};
      this.dangerousDefaults = [];
      this.thresholds = {};
      this.policy = {};
    }
  }

  async initialize(semanticEngine = null) {
    if (semanticEngine) {
      this.semanticEngine = semanticEngine;
    }
    this.verbose = semanticEngine?.verbose || false;
  }

  // Main analyze method required by heuristic engine
  async analyze(files, language, options = {}) {
    const violations = [];
    
    if (this.verbose) {
      console.log(`[DEBUG] 🎯 C073: Analyzing ${files.length} files for config validation`);
    }
    
    for (const filePath of files) {
      if (this.verbose) {
        console.log(`[DEBUG] 🎯 C073: Analyzing ${filePath.split('/').pop()}`);
      }

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileExtension = path.extname(filePath);
        const fileViolations = this.analyzeFile(filePath, content, fileExtension);
        violations.push(...fileViolations);
      } catch (error) {
        console.warn(`[C073] Error analyzing ${filePath}: ${error.message}`);
      }
    }

    if (this.verbose) {
      console.log(`[DEBUG] 🎯 C073: Found ${violations.length} violations`);
    }

    return violations;
  }

  analyzeFile(filePath, content, fileExtension) {
    const violations = [];
    const detectedLanguage = this.detectLanguage(fileExtension);
    
    if (!detectedLanguage) {
      return violations;
    }

    // Use semantic engine (AST) if available, fallback to heuristic
    if (this.semanticEngine && typeof this.semanticEngine.parseCode === 'function') {
      return this.analyzeWithAST(filePath, content, detectedLanguage);
    } else {
      return this.analyzeWithHeuristic(filePath, content, detectedLanguage);
    }
  }

  analyzeWithAST(filePath, content, language) {
    const violations = [];
    
    try {
      // Parse AST using semantic engine
      const ast = this.semanticEngine.parseCode(content, language);
      if (!ast) {
        // Fallback to heuristic if AST parsing fails
        return this.analyzeWithHeuristic(filePath, content, language);
      }

      // Advanced AST-based analysis
      const analysis = this.performStaticAnalysis(ast, filePath, content, language);
      
      // 1. Check for validate-at-startup patterns (pass signals)
      this.checkValidateAtStartupPatterns(analysis, violations, filePath, language);
      
      // 2. Detect scattered config reads (violations)
      this.checkScatteredConfigReads(analysis, violations, filePath, language);
      
      // 3. Dangerous defaults detection
      this.checkDangerousDefaults(analysis, violations, filePath, language);
      
      // 4. Late connection issues
      this.checkLateConnections(analysis, violations, filePath, language);
      
      // 5. Config propagation issues
      this.checkConfigPropagation(analysis, violations, filePath, language);

    } catch (error) {
      console.warn(`[C073] AST analysis failed for ${filePath}: ${error.message}`);
      // Fallback to heuristic
      return this.analyzeWithHeuristic(filePath, content, language);
    }

    return violations;
  }

  analyzeWithHeuristic(filePath, content, language) {
    const violations = [];
    const analysis = this.analyzeConfigurationHandling(content, language, filePath);
    const isConfigFile = this.isConfigOrStartupFile(filePath, language);
    
    // Existing heuristic logic (as fallback)
    if (isConfigFile && this.policy.requireSchemaOrExplicitChecks) {
      this.checkSchemaValidation(content, language, analysis, violations, filePath);
    }

    if (isConfigFile && this.policy.requireFailFast) {
      this.checkFailFastBehavior(content, language, analysis, violations, filePath);
    }

    if (this.policy.forbidEnvReadsOutsideConfig) {
      this.checkEnvAccessPattern(content, language, analysis, violations, filePath);
    }

    if (isConfigFile && this.policy.flagDangerousDefaults) {
      this.checkDangerousDefaults(content, analysis, violations, filePath);
    }

    if (isConfigFile && this.policy.requireStartupConnectivityChecks) {
      this.checkStartupConnectivityChecks(content, language, analysis, violations, filePath);
    }

    return violations;
  }

  detectLanguage(fileExtension) {
    const ext = fileExtension.toLowerCase();
    if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) return 'typescript';
    if (['.java'].includes(ext)) return 'java';
    if (['.go'].includes(ext)) return 'go';
    return null;
  }

  isConfigOrStartupFile(filePath, language) {
    const configPatterns = this.configModules[language] || [];
    return configPatterns.some(pattern => {
      const globPattern = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
      const regex = new RegExp(globPattern.replace(/\//g, '\\/'));
      return regex.test(filePath);
    });
  }

  analyzeConfigurationHandling(content, language, filePath) {
    const analysis = {
      envAccess: [],
      schemaValidation: [],
      failFastMechanisms: [],
      dangerousPatterns: [],
      connectivityChecks: []
    };

    // Filter out comment lines to avoid false positives
    const lines = content.split('\n');
    const filteredLines = CommentDetector.filterCommentLines(lines);
    const contentWithoutComments = filteredLines
      .filter(item => !item.isComment)
      .map(item => item.line)
      .join('\n');

    // Find environment variable access
    const envPatterns = this.envAccessors[language] || [];
    envPatterns.forEach(pattern => {
      const regex = this.createRegexFromPattern(pattern);
      const matches = contentWithoutComments.match(regex) || [];
      analysis.envAccess.push(...matches.map(match => ({
        pattern,
        match,
        line: this.getLineNumber(content, match) // Use original content for line numbers
      })));
    });

    // Find schema validation usage
    const schemaPatterns = this.schemaDetectors[language] || [];
    schemaPatterns.forEach(schema => {
      if (contentWithoutComments.includes(schema)) {
        analysis.schemaValidation.push({
          schema,
          line: this.getLineNumber(content, schema)
        });
      }
    });

    // Find fail-fast mechanisms
    const failFastPatterns = this.failFastSignals[language] || [];
    failFastPatterns.forEach(pattern => {
      const regex = this.createRegexFromPattern(pattern);
      const matches = contentWithoutComments.match(regex) || [];
      analysis.failFastMechanisms.push(...matches.map(match => ({
        pattern,
        match,
        line: this.getLineNumber(content, match)
      })));
    });

    // Find dangerous default patterns
    this.dangerousDefaults.forEach(pattern => {
      if (contentWithoutComments.includes(pattern)) {
        analysis.dangerousPatterns.push({
          pattern,
          line: this.getLineNumber(content, pattern)
        });
      }
    });

    return analysis;
  }

  checkSchemaValidation(content, language, analysis, violations, filePath) {
    const hasEnvAccess = analysis.envAccess.length > 0;
    const hasSchemaValidation = analysis.schemaValidation.length > 0;
    const hasExplicitValidation = this.hasExplicitValidation(content, language);

    if (hasEnvAccess && !hasSchemaValidation && !hasExplicitValidation) {
      violations.push({
        ruleId: 'C073',
        severity: 'error',
        message: 'Configuration values are accessed without schema validation or explicit checks. Use validation libraries like zod, joi, or implement explicit validation.',
        line: analysis.envAccess[0].line,
        column: 1,
        filePath: filePath,
        suggestions: this.getSchemaValidationSuggestions(language)
      });
    }
  }

  checkFailFastBehavior(content, language, analysis, violations, filePath) {
    const hasEnvAccess = analysis.envAccess.length > 0;
    const hasFailFast = analysis.failFastMechanisms.length > 0;

    if (hasEnvAccess && !hasFailFast) {
      violations.push({
        ruleId: 'C073',
        severity: 'error',
        message: 'Configuration access found but no fail-fast mechanism detected. Application should exit early if required configuration is missing.',
        line: analysis.envAccess[0].line,
        column: 1,
        filePath: filePath,
        suggestions: this.getFailFastSuggestions(language)
      });
    }
  }

  checkEnvAccessPattern(content, language, analysis, violations, filePath) {
    if (!this.isConfigOrStartupFile(filePath, language)) {
      const envAccessCount = analysis.envAccess.length;
      const maxAllowed = this.thresholds.maxEnvReadsOutsideConfig || 3;

      if (envAccessCount > maxAllowed) {
        violations.push({
          ruleId: 'C073',
          severity: 'warning',
          message: `Too many environment variable accesses (${envAccessCount}) outside configuration modules. Consider centralizing configuration.`,
          line: analysis.envAccess[0].line,
          column: 1,
          filePath: filePath,
          suggestions: ['Move environment variable access to dedicated configuration modules']
        });
      }
    }
  }

  checkDangerousDefaults(content, analysis, violations, filePath) {
    // Only check dangerous defaults in config/startup files
    if (!this.isConfigOrStartupFile(filePath, this.detectLanguage(path.extname(filePath)))) {
      return;
    }
    
    analysis.dangerousPatterns.forEach(pattern => {
      violations.push({
        ruleId: 'C073',
        severity: 'warning',
        message: `Dangerous default value detected: "${pattern.pattern}". This may mask missing configuration.`,
        line: pattern.line,
        column: 1,
        filePath: filePath,
        suggestions: [
          'Remove default value and fail fast if configuration is missing',
          'Use explicit validation to ensure required values are present'
        ]
      });
    });
  }

  checkStartupConnectivityChecks(content, language, analysis, violations, filePath) {
    const hasConnectionConfig = this.hasConnectionConfiguration(content, language);
    const hasConnectivityCheck = this.hasConnectivityCheck(content, language);

    // Only check this in config/startup files AND if there's connection config
    if (this.isConfigOrStartupFile(filePath, language) && hasConnectionConfig && !hasConnectivityCheck) {
      violations.push({
        ruleId: 'C073',
        severity: 'warning',
        message: 'Database or external service configuration found but no startup connectivity check detected.',
        line: 1,
        column: 1,
        filePath: filePath,
        suggestions: [
          'Add database connection validation at startup',
          'Implement health checks for external dependencies',
          'Test API endpoints during application initialization'
        ]
      });
    }
  }

  checkFailFastBehavior(content, language, analysis, violations, filePath) {
    const hasEnvAccess = analysis.envAccess.length > 0;
    const hasFailFast = analysis.failFastMechanisms.length > 0;

    if (hasEnvAccess && !hasFailFast) {
      violations.push({
        ruleId: 'C073',
        severity: 'error',
        message: 'Configuration access found but no fail-fast mechanism detected. Application should exit early if required configuration is missing.',
        line: analysis.envAccess[0].line,
        column: 1,
        suggestions: this.getFailFastSuggestions(language)
      });
    }
  }

  checkEnvAccessPattern(content, language, analysis, violations, filePath) {
    if (!this.isConfigOrStartupFile(filePath, language)) {
      const envAccessCount = analysis.envAccess.length;
      const maxAllowed = this.thresholds.maxEnvReadsOutsideConfig || 3;

      if (envAccessCount > maxAllowed) {
        violations.push({
          ruleId: 'C073',
          severity: 'warning',
          message: `Too many environment variable accesses (${envAccessCount}) outside configuration modules. Consider centralizing configuration.`,
          line: analysis.envAccess[0].line,
          column: 1,
          suggestions: ['Move environment variable access to dedicated configuration modules']
        });
      }
    }
  }

  checkDangerousDefaults(content, analysis, violations, filePath) {
    // Only check dangerous defaults in config/startup files
    if (!this.isConfigOrStartupFile(filePath, this.detectLanguage(filePath.split('.').pop()))) {
      return;
    }
    
    analysis.dangerousPatterns.forEach(pattern => {
      violations.push({
        ruleId: 'C073',
        severity: 'warning',
        message: `Dangerous default value detected: "${pattern.pattern}". This may mask missing configuration.`,
        line: pattern.line,
        column: 1,
        suggestions: [
          'Remove default value and fail fast if configuration is missing',
          'Use explicit validation to ensure required values are present'
        ]
      });
    });
  }

  checkStartupConnectivityChecks(content, language, analysis, violations, filePath) {
    const hasConnectionConfig = this.hasConnectionConfiguration(content, language);
    const hasConnectivityCheck = this.hasConnectivityCheck(content, language);

    // Only check this in config/startup files AND if there's connection config
    if (this.isConfigOrStartupFile(filePath, language) && hasConnectionConfig && !hasConnectivityCheck) {
      violations.push({
        ruleId: 'C073',
        severity: 'warning',
        message: 'Database or external service configuration found but no startup connectivity check detected.',
        line: 1,
        column: 1,
        suggestions: [
          'Add database connection validation at startup',
          'Implement health checks for external dependencies',
          'Test API endpoints during application initialization'
        ]
      });
    }
  }

  hasExplicitValidation(content, language) {
    const lines = content.split('\n');
    const filteredLines = CommentDetector.filterCommentLines(lines);
    const contentWithoutComments = filteredLines
      .filter(item => !item.isComment)
      .map(item => item.line)
      .join('\n');
    
    const validationPatterns = {
      typescript: [
        /if\s*\(\s*!.*process\.env\./,
        /assert\s*\(/,
        /require\s*\(/,
        /\.required\s*\(/,
        /throw.*Error.*config/i
      ],
      java: [
        /if\s*\(\s*.*isEmpty\s*\(\)/,
        /Assert\./,
        /Objects\.requireNonNull/,
        /throw.*Exception.*config/i
      ],
      go: [
        /if.*==\s*""/,
        /if.*==\s*nil/,
        /log\.Fatal/,
        /panic\(/
      ]
    };

    const patterns = validationPatterns[language] || [];
    return patterns.some(pattern => pattern.test(contentWithoutComments));
  }

  hasConnectionConfiguration(content, language) {
    const lines = content.split('\n');
    const filteredLines = CommentDetector.filterCommentLines(lines);
    const contentWithoutComments = filteredLines
      .filter(item => !item.isComment)
      .map(item => item.line)
      .join('\n');
    
    const connectionPatterns = [
      /process\.env\..*DATABASE/i,
      /process\.env\..*DB_/i,
      /process\.env\..*REDIS/i,
      /process\.env\..*API.*ENDPOINT/i,
      /process\.env\..*SERVICE.*URL/i,
      /database.*url/i,
      /db.*host/i,
      /redis.*url/i,
      /api.*endpoint/i,
      /service.*url/i,
      /connection.*string/i
    ];

    return connectionPatterns.some(pattern => pattern.test(contentWithoutComments));
  }

  hasConnectivityCheck(content, language) {
    const lines = content.split('\n');
    const filteredLines = CommentDetector.filterCommentLines(lines);
    const contentWithoutComments = filteredLines
      .filter(item => !item.isComment)
      .map(item => item.line)
      .join('\n');
    
    const checkPatterns = {
      typescript: [
        /\.connect\s*\(/,
        /\.ping\s*\(/,
        /healthcheck/i,
        /\.test\s*\(/
      ],
      java: [
        /\.getConnection\s*\(/,
        /\.ping\s*\(/,
        /health.*check/i,
        /\.testConnection/
      ],
      go: [
        /\.Ping\s*\(/,
        /\.Connect\s*\(/,
        /health.*check/i
      ]
    };

    const patterns = checkPatterns[language] || [];
    return patterns.some(pattern => pattern.test(contentWithoutComments));
  }

  getSchemaValidationSuggestions(language) {
    const suggestions = {
      typescript: [
        'Use zod: const config = z.object({API_KEY: z.string()}).parse(process.env)',
        'Use joi: const {error, value} = schema.validate(process.env)',
        'Use envalid: const env = cleanEnv(process.env, {API_KEY: str()})'
      ],
      java: [
        'Use @ConfigurationProperties with @Validated',
        'Use @Value with validation annotations',
        'Implement custom configuration validator'
      ],
      go: [
        'Use envconfig: err := envconfig.Process("app", &config)',
        'Use viper with validation',
        'Implement custom configuration validation'
      ]
    };

    return suggestions[language] || ['Implement configuration validation'];
  }

  getFailFastSuggestions(language) {
    const suggestions = {
      typescript: [
        'Use process.exit(1) after logging error',
        'Throw Error in configuration validation',
        'Use panic-like behavior for missing config'
      ],
      java: [
        'Use System.exit(1) or SpringApplication.exit()',
        'Throw RuntimeException for invalid config',
        'Use @PostConstruct validation'
      ],
      go: [
        'Use log.Fatal() for configuration errors',
        'Use panic() for critical config missing',
        'Use os.Exit(1) after logging'
      ]
    };

    return suggestions[language] || ['Implement fail-fast behavior'];
  }

  createRegexFromPattern(pattern) {
    // Handle specific env access patterns
    if (pattern === 'process.env.*') {
      return /process\.env\.[A-Z_][A-Z0-9_]*/g;
    }
    
    // Convert glob-like patterns to regex
    const escaped = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
    
    return new RegExp(escaped, 'g');
  }

  getLineNumber(content, searchString) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchString)) {
        return i + 1;
      }
    }
    return 1;
  }

  // Test method for unit testing
  analyzeContent(content, filePath, fileExtension, options = {}) {
    // Override options if provided
    if (options && Object.keys(options).length > 0) {
      this.configModules = options.configModules || this.configModules;
      this.envAccessors = options.envAccessors || this.envAccessors;
      this.schemaDetectors = options.schemaDetectors || this.schemaDetectors;
      this.failFastSignals = options.failFastSignals || this.failFastSignals;
      this.dangerousDefaults = options.dangerousDefaults || this.dangerousDefaults;
      this.thresholds = options.thresholds || this.thresholds;
      this.policy = options.policy || this.policy;
    }

    return this.analyzeFile(filePath, content, fileExtension);
  }

  // Advanced AST-based static analysis
  performStaticAnalysis(ast, filePath, content, language) {
    const C073SymbolBasedAnalyzer = require('./symbol-based-analyzer');
    const symbolAnalyzer = new C073SymbolBasedAnalyzer({
      configModules: this.configModules,
      envAccessors: this.envAccessors,
      schemaDetectors: this.schemaDetectors,
      failFastSignals: this.failFastSignals,
      policy: this.policy
    });

    return symbolAnalyzer.analyze(ast, filePath, content);
  }

  // 1. Check for validate-at-startup patterns (pass signals)
  checkValidateAtStartupPatterns(analysis, violations, filePath, language) {
    const isConfigFile = this.isConfigOrStartupFile(filePath, language);
    if (!isConfigFile) return;

    const hasSchemaValidation = analysis.schemaValidation && analysis.schemaValidation.length > 0;
    const hasFailFast = analysis.failFastMechanisms && analysis.failFastMechanisms.length > 0;

    if (!hasSchemaValidation && this.policy.requireSchemaOrExplicitChecks) {
      violations.push({
        ruleId: 'C073',
        severity: 'error',
        message: 'No schema validation detected in configuration module. Use validation libraries or explicit checks.',
        line: 1,
        column: 1,
        suggestions: this.getSchemaValidationSuggestions(language)
      });
    }

    if (!hasFailFast && this.policy.requireFailFast) {
      violations.push({
        ruleId: 'C073',
        severity: 'error', 
        message: 'No fail-fast mechanism detected. Application should exit early on invalid configuration.',
        line: 1,
        column: 1,
        suggestions: this.getFailFastSuggestions(language)
      });
    }
  }

  // 2. Detect scattered config reads (violations)
  checkScatteredConfigReads(analysis, violations, filePath, language) {
    const isConfigFile = this.isConfigOrStartupFile(filePath, language);
    if (isConfigFile) return; // Skip config files

    if (analysis.envAccess && analysis.envAccess.length > 0) {
      const maxAllowed = this.thresholds.maxEnvReadsOutsideConfig || 3;
      
      if (analysis.envAccess.length > maxAllowed) {
        violations.push({
          ruleId: 'C073',
          severity: 'warning',
          message: `Scattered environment variable access (${analysis.envAccess.length} reads) outside configuration modules. Consider centralizing configuration.`,
          line: analysis.envAccess[0].line || 1,
          column: 1,
          suggestions: ['Move environment variable access to dedicated configuration modules', 'Use dependency injection for configuration']
        });
      }
    }
  }

  // 3. Enhanced dangerous defaults detection
  checkDangerousDefaults(analysis, violations, filePath, language) {
    if (analysis.dangerousDefaults && analysis.dangerousDefaults.length > 0) {
      analysis.dangerousDefaults.forEach(dangerous => {
        violations.push({
          ruleId: 'C073',
          severity: 'warning',
          message: `Dangerous default value detected: "${dangerous.pattern}". This can mask configuration errors.`,
          line: dangerous.line || 1,
          column: 1,
          suggestions: [
            'Remove default values for critical configuration',
            'Use explicit validation instead of fallback values',
            'Fail fast when required configuration is missing'
          ]
        });
      });
    }
  }

  // 4. Check late connection issues
  checkLateConnections(analysis, violations, filePath, language) {
    const isConfigFile = this.isConfigOrStartupFile(filePath, language);
    if (!isConfigFile) return;

    // Check if there are database/API configurations but no startup connectivity checks
    const hasExternalConfig = analysis.envAccess && analysis.envAccess.some(env => 
      /DATABASE|DB_|API_|REDIS|MONGO|POSTGRES|MYSQL/i.test(env.variable || env.match)
    );

    const hasConnectivityCheck = analysis.connectivityChecks && analysis.connectivityChecks.length > 0;

    if (hasExternalConfig && !hasConnectivityCheck && this.policy.requireStartupConnectivityChecks) {
      violations.push({
        ruleId: 'C073',
        severity: 'warning',
        message: 'External service configuration found but no startup connectivity check detected.',
        line: 1,
        column: 1,
        suggestions: [
          'Add database connection validation at startup',
          'Implement health checks for external dependencies',
          'Test API endpoints during application initialization'
        ]
      });
    }
  }

  // 5. Check config propagation issues
  checkConfigPropagation(analysis, violations, filePath, language) {
    // This would require cross-file analysis - for now, use heuristics
    const isServiceFile = /service|controller|repository|handler/i.test(filePath);
    
    if (isServiceFile && analysis.envAccess && analysis.envAccess.length > 0) {
      violations.push({
        ruleId: 'C073',
        severity: 'info',
        message: 'Service layer accessing environment variables directly. Consider using dependency injection for configuration.',
        line: analysis.envAccess[0].line || 1,
        column: 1,
        suggestions: [
          'Inject configuration object instead of reading environment variables',
          'Use configuration service or dependency injection container'
        ]
      });
    }
  }

  getSchemaValidationSuggestions(language) {
    const suggestions = {
      typescript: [
        'Use zod: const config = z.object({API_KEY: z.string()}).parse(process.env)',
        'Use joi: const {error, value} = schema.validate(process.env)', 
        'Use envalid: const env = cleanEnv(process.env, {API_KEY: str()})'
      ],
      java: [
        'Use @ConfigurationProperties with @Validated',
        'Use @Value with validation annotations',
        'Use Jakarta Bean Validation'
      ],
      go: [
        'Use envconfig with struct validation',
        'Use viper with validation hooks'
      ]
    };
    return suggestions[language] || ['Implement configuration validation'];
  }

  getFailFastSuggestions(language) {
    const suggestions = {
      typescript: [
        'Use process.exit(1) after logging error',
        'Throw Error in configuration validation',
        'Use panic-like behavior for missing config'
      ],
      java: [
        'Use @PostConstruct validation with RuntimeException',
        'Use SpringApplication.exit() for critical config errors'
      ],
      go: [
        'Use log.Fatal() for missing configuration',
        'Use panic() for critical startup errors'
      ]
    };
    return suggestions[language] || ['Implement fail-fast behavior'];
  }
}

module.exports = C073ConfigValidationAnalyzer;
