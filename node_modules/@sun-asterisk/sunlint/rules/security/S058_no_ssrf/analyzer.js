// rules/security/S058_no_ssrf/analyzer.js
const path = require('path');
const fs = require('fs');
const { CommentDetector } = require('../../utils/rule-helpers');

class S058SSRFAnalyzer {
  constructor(semanticEngine = null) {
    this.ruleId = 'S058';
    this.ruleName = 'No SSRF (Server-Side Request Forgery)';
    this.description = 'S058 - Prevent SSRF attacks by validating URLs from user input before making HTTP requests';
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
      this.httpClientPatterns = this.options.httpClientPatterns || [];
      this.userInputSources = this.options.userInputSources || [];
      this.dangerousProtocols = this.options.dangerousProtocols || [];
      this.blockedIPs = this.options.blockedIPs || [];
      this.blockedPorts = this.options.blockedPorts || [];
      this.allowedDomains = this.options.allowedDomains || [];
      this.validationFunctions = this.options.validationFunctions || [];
      this.policy = this.options.policy || {};
      this.thresholds = this.options.thresholds || {};
    } catch (error) {
      console.warn(`[S058] Could not load config: ${error.message}`);
      this.options = {};
      this.httpClientPatterns = [];
      this.userInputSources = [];
      this.dangerousProtocols = [];
      this.blockedIPs = [];
      this.blockedPorts = [];
      this.allowedDomains = [];
      this.validationFunctions = [];
      this.policy = {};
      this.thresholds = {};
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
      console.log(`[DEBUG] 🎯 S058: Analyzing ${files.length} files for SSRF vulnerabilities`);
    }
    
    for (const filePath of files) {
      if (this.verbose) {
        console.log(`[DEBUG] 🎯 S058: Analyzing ${filePath.split('/').pop()}`);
      }

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileExtension = path.extname(filePath);
        const fileViolations = this.analyzeFile(filePath, content, fileExtension);
        violations.push(...fileViolations);
      } catch (error) {
        console.warn(`[S058] Error analyzing ${filePath}: ${error.message}`);
      }
    }

    if (this.verbose) {
      console.log(`[DEBUG] 🎯 S058: Found ${violations.length} SSRF violations`);
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

  analyzeWithHeuristic(filePath, content, language) {
    const violations = [];
    const lines = content.split('\n');
    
    // Detect HTTP client calls and trace URLs
    const httpCalls = this.detectHttpCalls(content, lines);
    
    for (const call of httpCalls) {
      const urlSource = this.traceUrlSource(call, content, lines);
      
      if (urlSource.isUserControlled) {
        // Check if URL is validated
        const hasValidation = this.checkUrlValidation(call, content, lines);
        
        if (!hasValidation) {
          violations.push({
            ruleId: this.ruleId,
            message: `Potential SSRF vulnerability: HTTP request with user-controlled URL '${call.urlVariable}' without validation`,
            severity: 'error',
            line: call.line,
            column: call.column,
            filePath: filePath,
            details: {
              httpMethod: call.method,
              urlVariable: call.urlVariable,
              userInputSource: urlSource.source,
              suggestion: `Add URL validation using: ${this.validationFunctions[0] || 'validateUrlAllowList'}(${call.urlVariable})`
            }
          });
        }
      }
      
      // Check for hardcoded dangerous URLs
      if (call.isHardcoded) {
        const dangerousUrl = this.checkDangerousUrl(call.url);
        if (dangerousUrl.isDangerous) {
          violations.push({
            ruleId: this.ruleId,
            message: `Dangerous URL detected: ${dangerousUrl.reason}`,
            severity: 'error',
            line: call.line,
            column: call.column,
            filePath: filePath,
            details: {
              url: call.url,
              reason: dangerousUrl.reason,
              suggestion: 'Remove dangerous URL or add to allow-list if legitimate'
            }
          });
        }
      }
    }

    return violations;
  }

  detectHttpCalls(content, lines) {
    const calls = [];
    
    if (this.verbose) {
      console.log(`[DEBUG] 🔍 S058: Detecting HTTP calls in ${lines.length} lines`);
    }
    
    for (const pattern of this.httpClientPatterns) {
      const regex = new RegExp(pattern, 'gi');
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const line = lines[lineNumber - 1];
        const columnPosition = match.index - content.lastIndexOf('\n', match.index - 1) - 1;
        
        // ✅ CHECK: Skip if this code is in comments
        const isInComment = CommentDetector.isLineInBlockComment(lines, lineNumber - 1) ||
                           CommentDetector.isPositionInComment(line, columnPosition);
        
        if (isInComment) {
          if (this.verbose) {
            console.log(`[DEBUG] 🔍 S058: SKIPPING comment at line ${lineNumber}: ${line.trim()}`);
          }
          continue;
        }
        
        if (this.verbose) {
          console.log(`[DEBUG] 🔍 S058: Found HTTP call pattern "${pattern}" at line ${lineNumber}: ${line.trim()}`);
        }
        
        // Extract URL parameter
        const urlMatch = this.extractUrlFromCall(line, match[0]);
        
        if (urlMatch) {
          calls.push({
            method: match[0],
            line: lineNumber,
            column: columnPosition,
            urlVariable: urlMatch.variable,
            url: urlMatch.value,
            isHardcoded: urlMatch.isHardcoded,
            fullCall: line.trim()
          });
          
          if (this.verbose) {
            console.log(`[DEBUG] 🔍 S058: Extracted URL: ${urlMatch.variable} (hardcoded: ${urlMatch.isHardcoded})`);
          }
        }
      }
    }
    
    if (this.verbose) {
      console.log(`[DEBUG] 🔍 S058: Found ${calls.length} HTTP calls total (after comment filtering)`);
    }
    
    return calls;
  }

  extractUrlFromCall(line, methodCall) {
    // Extract URL from HTTP call - simplified regex approach
    const patterns = [
      // fetch(url), axios.get(url)
      /(?:fetch|\.(?:get|post|put|delete|patch|request))\s*\(\s*([^,\)]+)/,
      // More complex patterns can be added
    ];
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const urlParam = match[1].trim();
        
        // Check if it's a string literal
        if (urlParam.startsWith('"') || urlParam.startsWith("'") || urlParam.startsWith('`')) {
          return {
            variable: urlParam,
            value: urlParam.slice(1, -1), // Remove quotes
            isHardcoded: true
          };
        } else {
          return {
            variable: urlParam,
            value: null,
            isHardcoded: false
          };
        }
      }
    }
    
    return null;
  }

  traceUrlSource(call, content, lines) {
    if (call.isHardcoded) {
      return { isUserControlled: false, source: 'hardcoded' };
    }

    // Simple variable tracing
    const variable = this.escapeRegex(call.urlVariable);
    
    // Check if variable comes from user input
    for (const inputPattern of this.userInputSources) {
      // userInputSources patterns are already regex-escaped in config.json
      const escapedPattern = inputPattern;
      
      try {
        // Check direct assignment: const url = req.body.url
        const assignmentRegex = new RegExp(`const\\s+${variable}\\s*=\\s*${escapedPattern}`, 'i');
        if (assignmentRegex.test(content)) {
          return { 
            isUserControlled: true, 
            source: inputPattern 
          };
        }
        
        // Check let assignment: let url = req.query.endpoint  
        const letAssignmentRegex = new RegExp(`let\\s+${variable}\\s*=\\s*${escapedPattern}`, 'i');
        if (letAssignmentRegex.test(content)) {
          return { 
            isUserControlled: true, 
            source: inputPattern 
          };
        }
        
        // Check var assignment: var url = req.params.id
        const varAssignmentRegex = new RegExp(`var\\s+${variable}\\s*=\\s*${escapedPattern}`, 'i');
        if (varAssignmentRegex.test(content)) {
          return { 
            isUserControlled: true, 
            source: inputPattern 
          };
        }
        
        // Check property access: url = req.body.path
        const propertyRegex = new RegExp(`${variable}\\s*=\\s*${escapedPattern}`, 'i');
        if (propertyRegex.test(content)) {
          return { 
            isUserControlled: true, 
            source: inputPattern 
          };
        }
        
        // Also check reverse assignment patterns
        const reverseRegex = new RegExp(`${escapedPattern}.*${variable}`, 'i');
        if (reverseRegex.test(content)) {
          return { 
            isUserControlled: true, 
            source: inputPattern 
          };
        }
      } catch (e) {
        // Skip invalid regex patterns
        if (this.verbose) {
          console.log(`[DEBUG] S058: Skipping invalid regex pattern for ${inputPattern}: ${e.message}`);
        }
        continue;
      }
    }

    return { isUserControlled: false, source: 'unknown' };
  }

  escapeRegex(string) {
    // Escape special regex characters
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  checkUrlValidation(call, content, lines) {
    // Check if URL validation function is called before HTTP request
    const beforeCallContent = content.substring(0, content.indexOf(call.fullCall));
    
    for (const validationFn of this.validationFunctions) {
      try {
        const escapedVariable = this.escapeRegex(call.urlVariable);
        const escapedFunction = this.escapeRegex(validationFn);
        const regex = new RegExp(`${escapedFunction}\\s*\\(.*${escapedVariable}`, 'i');
        if (regex.test(beforeCallContent)) {
          return true;
        }
      } catch (e) {
        // Skip invalid regex patterns
        if (this.verbose) {
          console.log(`[DEBUG] S058: Skipping invalid validation regex for ${validationFn}: ${e.message}`);
        }
        continue;
      }
    }
    
    return false;
  }

  checkDangerousUrl(url) {
    if (!url) return { isDangerous: false };

    // Check dangerous protocols
    for (const protocol of this.dangerousProtocols) {
      if (url.toLowerCase().includes(protocol)) {
        return { 
          isDangerous: true, 
          reason: `Dangerous protocol: ${protocol}` 
        };
      }
    }

    // Check blocked IPs
    for (const ipPattern of this.blockedIPs) {
      const regex = new RegExp(ipPattern, 'i');
      if (regex.test(url)) {
        return { 
          isDangerous: true, 
          reason: `Blocked IP range: ${ipPattern}` 
        };
      }
    }

    // Check blocked ports
    for (const port of this.blockedPorts) {
      const portRegex = new RegExp(`:${port}(?:/|$)`, 'i');
      if (portRegex.test(url)) {
        return { 
          isDangerous: true, 
          reason: `Blocked port: ${port}` 
        };
      }
    }

    return { isDangerous: false };
  }

  analyzeWithAST(filePath, content, language) {
    // Enhanced AST-based analysis for more precise detection
    // This would use the semantic engine for deeper analysis
    return this.analyzeWithHeuristic(filePath, content, language);
  }
}

module.exports = S058SSRFAnalyzer;
