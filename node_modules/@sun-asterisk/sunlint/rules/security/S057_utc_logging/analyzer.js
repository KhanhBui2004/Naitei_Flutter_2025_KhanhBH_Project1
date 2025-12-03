const fs = require('fs');
const path = require('path');

class S057UtcLoggingAnalyzer {
  constructor(ruleId = 'S057', verbose = false) {
    this.ruleId = ruleId;
    this.verbose = verbose;
    this.loadConfig();
  }

  loadConfig() {
    try {
      const configPath = path.join(__dirname, 'config.json');
      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configContent);
      
      this.disallowedDatePatterns = config.options.disallowedDatePatterns || [];
      this.allowedUtcPatterns = config.options.allowedUtcPatterns || [];
      this.logFrameworks = config.options.logFrameworks || [];
      this.logStatements = config.options.logStatements || [];
      this.configChecks = config.options.configChecks || [];
      this.policy = config.options.policy || {};
      this.thresholds = config.options.thresholds || {};
      this.exemptions = config.options.exemptions || {};
      
      if (this.verbose) {
        console.log(`[DEBUG] S057: Loaded config with ${this.disallowedDatePatterns.length} disallowed patterns, ${this.allowedUtcPatterns.length} allowed patterns`);
      }
    } catch (error) {
      console.warn(`[S057] Failed to load config: ${error.message}`);
      this.disallowedDatePatterns = [];
      this.allowedUtcPatterns = [];
      this.logFrameworks = [];
      this.logStatements = [];
      this.configChecks = [];
      this.policy = {};
      this.thresholds = {};
      this.exemptions = {};
    }
  }

  analyze(files, options = {}) {
    this.verbose = options.verbose || false;
    const violations = [];

    if (!Array.isArray(files)) {
      files = [files];
    }
    
    for (const filePath of files) {
      if (this.verbose) {
        console.log(`[DEBUG] 🎯 S057: Analyzing ${filePath.split('/').pop()}`);
      }

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileExtension = path.extname(filePath);
        const fileViolations = this.analyzeFile(filePath, content, fileExtension);
        violations.push(...fileViolations);
      } catch (error) {
        console.warn(`[S057] Error analyzing ${filePath}: ${error.message}`);
      }
    }

    if (this.verbose) {
      console.log(`[DEBUG] 🎯 S057: Found ${violations.length} UTC logging violations`);
    }

    return violations;
  }

  analyzeFile(filePath, content, fileExtension) {
    const language = this.detectLanguage(fileExtension);
    if (!language) {
      return [];
    }

    // Check if file is exempted (test files)
    if (this.isExemptedFile(filePath)) {
      if (this.verbose) {
        console.log(`[DEBUG] 🔍 S057: Skipping exempted file: ${filePath.split('/').pop()}`);
      }
      return [];
    }

    return this.analyzeWithHeuristic(filePath, content, language);
  }

  detectLanguage(fileExtension) {
    const extensions = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.mjs': 'javascript'
    };
    return extensions[fileExtension] || null;
  }

  isExemptedFile(filePath) {
    if (!this.exemptions.allowedPatterns) return false;
    
    for (const pattern of this.exemptions.allowedPatterns) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(filePath)) {
        return true;
      }
    }
    return false;
  }

  analyzeWithHeuristic(filePath, content, language) {
    const violations = [];
    const lines = content.split('\n');
    
    // Find logging statements with date/time usage
    const logWithTimeStatements = this.detectLogWithTimeStatements(content, lines);
    
    if (this.verbose) {
      console.log(`[DEBUG] 🔍 S057: Found ${logWithTimeStatements.length} log statements with time usage`);
    }

    for (const logStatement of logWithTimeStatements) {
      // Check if using disallowed date patterns
      const disallowedPattern = this.checkDisallowedDatePattern(logStatement);
      if (disallowedPattern) {
        violations.push({
          ruleId: this.ruleId,
          message: `Non-UTC timestamp in log: '${disallowedPattern.pattern}' should use UTC format like toISOString()`,
          severity: 'warning',
          line: logStatement.line,
          column: logStatement.column,
          filePath: filePath,
          details: {
            violationType: 'non_utc_timestamp',
            detectedPattern: disallowedPattern.pattern,
            suggestion: this.getSuggestion(disallowedPattern.pattern),
            logStatement: logStatement.fullStatement
          }
        });
      }

      // Check if NOT using allowed UTC patterns when dealing with time
      const hasTimeReference = this.hasTimeReference(logStatement.fullStatement);
      const hasAllowedUtcPattern = this.hasAllowedUtcPattern(logStatement.fullStatement);
      
      if (hasTimeReference && !hasAllowedUtcPattern && !disallowedPattern) {
        violations.push({
          ruleId: this.ruleId,
          message: `Log statement with time should use UTC format (toISOString(), moment.utc(), etc.)`,
          severity: 'warning',
          line: logStatement.line,
          column: logStatement.column,
          filePath: filePath,
          details: {
            violationType: 'missing_utc_format',
            suggestion: 'Use new Date().toISOString() or moment.utc().format() for consistent UTC timestamps',
            logStatement: logStatement.fullStatement
          }
        });
      }
    }

    // Check logging framework configuration
    const configViolations = this.checkLoggingConfig(filePath, content, lines);
    violations.push(...configViolations);

    return violations;
  }

  detectLogWithTimeStatements(content, lines) {
    const statements = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;
      
      // Skip comments
      if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
        continue;
      }

      // Check for log statements
      for (const logPattern of this.logStatements) {
        const regex = new RegExp(logPattern, 'gi');
        let match;
        
        while ((match = regex.exec(line)) !== null) {
          const columnPosition = match.index + 1;
          
          // Check if this log statement contains time-related code
          if (this.containsTimeReference(line)) {
            statements.push({
              line: lineNumber,
              column: columnPosition,
              fullStatement: line,
              logPattern: logPattern
            });
          }
        }
      }
    }

    if (this.verbose) {
      console.log(`[DEBUG] 🔍 S057: Found ${statements.length} log statements with time references`);
    }

    return statements;
  }

  containsTimeReference(statement) {
    const timeKeywords = [
      'new Date',
      'Date\\.',
      'moment',
      'dayjs',
      'DateTime',
      'LocalDateTime',
      'Instant',
      'ZonedDateTime',
      'Calendar',
      'timestamp',
      'time',
      'date'
    ];
    
    for (const keyword of timeKeywords) {
      const regex = new RegExp(keyword, 'i');
      if (regex.test(statement)) {
        return true;
      }
    }
    
    return false;
  }

  checkDisallowedDatePattern(logStatement) {
    for (const pattern of this.disallowedDatePatterns) {
      const regex = new RegExp(pattern, 'gi');
      const match = regex.exec(logStatement.fullStatement);
      if (match) {
        return {
          pattern: match[0],
          regexPattern: pattern
        };
      }
    }
    return null;
  }

  hasTimeReference(statement) {
    // More specific time reference check - must be actual time creation/formatting
    const timeCreationPatterns = [
      'new Date\\(',
      'Date\\.',
      'moment\\(',
      'dayjs\\(',
      'DateTime\\.',
      'LocalDateTime\\.',
      'Instant\\.',
      'ZonedDateTime\\.',
      'Calendar\\.',
      '\\.getTime\\(',
      '\\.valueOf\\(',
      '\\.toISOString\\(',
      '\\.toString\\(',
      '\\.toLocale'
    ];
    
    for (const pattern of timeCreationPatterns) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(statement)) {
        return true;
      }
    }
    
    return false;
  }

  hasAllowedUtcPattern(statement) {
    for (const pattern of this.allowedUtcPatterns) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(statement)) {
        return true;
      }
    }
    
    // Additional safe patterns not in config
    const additionalSafePatterns = [
      'winston\\.format\\.timezone\\(["\']UTC["\']\\)',
      'timezone\\(["\']UTC["\']\\)',
      'Date\\.now\\(\\)',
      'epoch',
      'unix'
    ];
    
    for (const pattern of additionalSafePatterns) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(statement)) {
        return true;
      }
    }
    
    return false;
  }

  checkLoggingConfig(filePath, content, lines) {
    const violations = [];
    
    // Check for winston/pino/bunyan configuration
    const configPatterns = [
      'winston\\.createLogger',
      'new winston\\.Logger',
      'pino\\(',
      'bunyan\\.createLogger'
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;
      
      for (const configPattern of configPatterns) {
        const regex = new RegExp(configPattern, 'i');
        if (regex.test(line)) {
          // Check if UTC configuration is present
          const hasUtcConfig = this.checkUtcConfigAdvanced(content, i, lines, line);
          if (!hasUtcConfig) {
            violations.push({
              ruleId: this.ruleId,
              message: `Logging framework configuration should specify UTC timezone`,
              severity: 'warning',
              line: lineNumber,
              column: 1,
              filePath: filePath,
              details: {
                violationType: 'missing_utc_config',
                configType: configPattern,
                suggestion: 'Add timezone: "UTC" or similar UTC configuration to logger setup'
              }
            });
          }
        }
      }
    }

    return violations;
  }

  checkUtcConfig(content, startLine, lines) {
    // Look for UTC configuration in the next 15 lines and previous 5 lines
    const searchStartLine = Math.max(0, startLine - 5);
    const endLine = Math.min(startLine + 15, lines.length);
    
    for (let i = searchStartLine; i < endLine; i++) {
      const line = lines[i];
      
      for (const configCheck of this.configChecks) {
        const regex = new RegExp(configCheck, 'i');
        if (regex.test(line)) {
          return true;
        }
      }
      
      // Additional UTC indicators
      const utcIndicators = [
        /['"]Z['"]/, // 'Z' or "Z" timezone indicator
        /\+00:00/, // +00:00 timezone offset
        /\.isoTime/, // pino.stdTimeFunctions.isoTime
        /stdTimeFunctions\.isoTime/, // pino standard ISO time functions
        /formatters.*timestamp.*isoTime/i // pino timestamp formatter
      ];
      
      for (const indicator of utcIndicators) {
        if (indicator.test(line)) {
          return true;
        }
      }
    }
    
    return false;
  }

  checkUtcConfigAdvanced(content, startLine, lines, currentLine) {
    // First, use the basic check
    if (this.checkUtcConfig(content, startLine, lines)) {
      return true;
    }

    // Advanced: Check if pino() is called with a config variable
    const pinoCallMatch = currentLine.match(/pino\(\s*(\w+)\s*\)/);
    if (pinoCallMatch) {
      const configVarName = pinoCallMatch[1];
      
      // Look for the config variable definition in the entire file
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if this line defines the config variable or calls a function that creates it
        if (line.includes(`${configVarName} =`) || line.includes(`const ${configVarName}`) || 
            line.includes(`let ${configVarName}`) || line.includes(`var ${configVarName}`)) {
          
          // Check the function call that creates the config
          const functionCallMatch = line.match(/=\s*(\w+)\s*\(/);
          if (functionCallMatch) {
            const functionName = functionCallMatch[1];
            
            // Look for the function definition and check for UTC config in it
            for (let j = 0; j < lines.length; j++) {
              const funcLine = lines[j];
              if (funcLine.includes(`const ${functionName}`) || funcLine.includes(`function ${functionName}`)) {
                // Check next 50 lines for UTC configuration
                for (let k = j; k < Math.min(j + 50, lines.length); k++) {
                  const checkLine = lines[k];
                  
                  // Check for pino stdTimeFunctions.isoTime
                  if (/timestamp.*pino\.stdTimeFunctions\.isoTime|stdTimeFunctions\.isoTime/.test(checkLine)) {
                    return true;
                  }
                  
                  // Check for other UTC indicators
                  for (const configCheck of this.configChecks) {
                    const regex = new RegExp(configCheck, 'i');
                    if (regex.test(checkLine)) {
                      return true;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    
    return false;
  }

  getSuggestion(disallowedPattern) {
    const suggestions = {
      'new Date().toString()': 'new Date().toISOString()',
      'new Date().toLocaleString()': 'new Date().toISOString()',
      'new Date().toLocaleDateString()': 'new Date().toISOString().split("T")[0]',
      'new Date().toLocaleTimeString()': 'new Date().toISOString().split("T")[1]',
      'moment().format()': 'moment.utc().format()',
      'moment()': 'moment.utc()',
      'dayjs().format()': 'dayjs.utc().format()',
      'DateTime.now()': 'Instant.now()',
      'LocalDateTime.now()': 'OffsetDateTime.now(ZoneOffset.UTC)',
      '.getTime()': '.toISOString()',
      '.valueOf()': '.toISOString()'
    };
    
    return suggestions[disallowedPattern] || 'Use UTC equivalent like toISOString()';
  }
}

module.exports = S057UtcLoggingAnalyzer;
