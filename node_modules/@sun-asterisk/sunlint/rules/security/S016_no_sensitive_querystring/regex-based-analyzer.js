/**
 * S016 Regex-based Analyzer - Sensitive Data in URL Query Parameters Detection
 * Purpose: Fallback pattern matching when symbol analysis fails
 */

class S016RegexBasedAnalyzer {
  constructor(semanticEngine = null) {
    this.ruleId = 'S016';
    this.ruleName = 'Sensitive Data in URL Query Parameters (Regex-Based)';
    this.semanticEngine = semanticEngine;
    this.verbose = false;
    
    // URL construction patterns (regex)
    this.urlConstructionPatterns = [
      /new\s+URL\s*\([^)]*\)/gi,
      /new\s+URLSearchParams\s*\([^)]*\)/gi,
      /window\.location\.href\s*=\s*[^;]+/gi,
      /location\.href\s*=\s*[^;]+/gi,
      /location\.search\s*[+]?=\s*[^;]+/gi
    ];
    
    // HTTP client patterns
    this.httpClientPatterns = [
      /fetch\s*\(\s*[`"'][^`"']*[?][^`"']*[`"']/gi,
      /axios\.(get|post|put|delete|patch|request)\s*\([^)]*\)/gi,
      /request\.(get|post)\s*\([^)]*\)/gi,
      /https?\.(?:get|request)\s*\([^)]*\)/gi
    ];
    
    // Query string manipulation patterns
    this.queryStringPatterns = [
      /querystring\.stringify\s*\([^)]*\)/gi,
      /qs\.stringify\s*\([^)]*\)/gi,
      /URLSearchParams\s*\([^)]*\)/gi,
      /\.search\s*[+]?=\s*[^;]+/gi,
      /[?&]\w+=[^&\s]+/g
    ];
    
    // Sensitive data patterns (same as symbol-based)
    this.sensitivePatterns = [
      // Authentication & Authorization
      /\b(?:password|passwd|pwd|pass)\b/gi,
      /\b(?:token|jwt|accesstoken|refreshtoken|bearertoken)\b/gi,
      /\b(?:secret|secretkey|clientsecret|serversecret)\b/gi,
      /\b(?:apikey|api_key|key|privatekey|publickey)\b/gi,
      /\b(?:auth|authorization|authenticate)\b/gi,
      /\b(?:sessionid|session_id|jsessionid)\b/gi,
      /\b(?:csrf|csrftoken|xsrf)\b/gi,
      
      // Financial & Personal
      /\b(?:ssn|social|socialsecurity)\b/gi,
      /\b(?:creditcard|cardnumber|cardnum|ccnumber)\b/gi,
      /\b(?:cvv|cvc|cvd|cid)\b/gi,
      /\b(?:pin|pincode)\b/gi,
      /\b(?:bankaccount|routing|iban)\b/gi,
      
      // Personal Identifiable Information
      /\b(?:email|emailaddress|mail)\b/gi,
      /\b(?:phone|phonenumber|mobile|tel)\b/gi,
      /\b(?:address|homeaddress|zipcode|postal)\b/gi,
      /\b(?:birthdate|birthday|dob)\b/gi,
      /\b(?:license|passport|identity)\b/gi
    ];
    
    // Combined patterns for efficiency
    this.allUrlPatterns = [
      ...this.urlConstructionPatterns,
      ...this.httpClientPatterns,
      ...this.queryStringPatterns
    ];
  }

  async initialize(semanticEngine = null) {
    if (semanticEngine) {
      this.semanticEngine = semanticEngine;
    }
    this.verbose = semanticEngine?.verbose || false;
    
    if (this.verbose) {
      console.log(`🔧 [S016 Regex-Based] Analyzer initialized`);
    }
  }

  async analyzeFileBasic(filePath, options = {}) {
    const fs = require('fs');
    const violations = [];

    if (this.verbose) {
      console.log(`🔧 [S016 Regex] Starting analysis for: ${filePath}`);
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (this.verbose) {
        console.log(`🔧 [S016 Regex] File content length: ${content.length}`);
      }
      
      const lines = content.split('\n');
      
      // Find all URL/query related patterns
      const urlMatches = this.findUrlPatterns(content);
      
      if (this.verbose) {
        console.log(`🔧 [S016 Regex] Found ${urlMatches.length} URL patterns`);
      }

      for (const match of urlMatches) {
        const matchViolations = this.analyzeUrlMatch(match, lines, filePath);
        if (this.verbose && matchViolations.length > 0) {
          console.log(`🔧 [S016 Regex] Match violations: ${matchViolations.length}`);
        }
        violations.push(...matchViolations);
      }

      if (this.verbose) {
        console.log(`🔧 [S016 Regex] Total violations found: ${violations.length}`);
      }
      
      return violations;
    } catch (error) {
      if (this.verbose) {
        console.error(`🔧 [S016 Regex] Error analyzing ${filePath}:`, error);
      }
      return [];
    }
  }

  /**
   * Find URL patterns in content using regex
   */
  findUrlPatterns(content) {
    const matches = [];
    
    for (const pattern of this.allUrlPatterns) {
      pattern.lastIndex = 0; // Reset regex
      let match;
      
      while ((match = pattern.exec(content)) !== null) {
        const fullMatch = match[0];
        
        // Calculate line number
        const beforeMatch = content.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;
        const lineStart = beforeMatch.lastIndexOf('\n') + 1;
        const columnNumber = match.index - lineStart + 1;
        
        matches.push({
          fullMatch,
          lineNumber,
          columnNumber,
          startIndex: match.index,
          pattern: pattern.source
        });
      }
    }
    
    return matches;
  }

  /**
   * Analyze URL match for sensitive data violations
   */
  analyzeUrlMatch(match, lines, filePath) {
    const violations = [];
    const { fullMatch, lineNumber, columnNumber, pattern } = match;
    
    // Check for sensitive data in the matched content
    const sensitiveData = this.findSensitiveDataInMatch(fullMatch);
    
    if (sensitiveData.length > 0) {
      const patternType = this.identifyPatternType(pattern);
      
      violations.push({
        ruleId: this.ruleId,
        severity: 'error',
        message: 'Sensitive data detected in URL query parameters',
        source: this.ruleId,
        file: filePath,
        line: lineNumber,
        column: columnNumber,
        description: `[REGEX-FALLBACK] Sensitive patterns detected: ${sensitiveData.join(', ')}. URLs with sensitive data can be exposed in logs, browser history, and network traces.`,
        suggestion: 'Move sensitive data to request body (POST/PUT) or use secure headers. For authentication, use proper Authorization header.',
        category: 'security',
        patternType: patternType,
        matchedText: fullMatch.length > 100 ? fullMatch.substring(0, 100) + '...' : fullMatch
      });
    }
    
    return violations;
  }

  /**
   * Find sensitive data patterns in matched text
   */
  findSensitiveDataInMatch(matchText) {
    const sensitiveData = [];
    
    for (const pattern of this.sensitivePatterns) {
      pattern.lastIndex = 0; // Reset regex
      const matches = matchText.match(pattern);
      if (matches) {
        sensitiveData.push(...matches.map(m => m.toLowerCase()));
      }
    }
    
    return [...new Set(sensitiveData)]; // Remove duplicates
  }

  /**
   * Identify what type of pattern was matched
   */
  identifyPatternType(patternSource) {
    if (patternSource.includes('URL') || patternSource.includes('location')) {
      return 'url_construction';
    } else if (patternSource.includes('fetch') || patternSource.includes('axios') || patternSource.includes('request')) {
      return 'http_client';
    } else if (patternSource.includes('stringify') || patternSource.includes('search')) {
      return 'query_string';
    }
    return 'unknown';
  }

  async analyze(files, language, options = {}) {
    if (this.verbose) {
      console.log(`🔧 [S016 Regex] analyze() called with ${files.length} files, language: ${language}`);
    }
    
    const violations = [];
    
    for (const filePath of files) {
      try {
        if (this.verbose) {
          console.log(`🔧 [S016 Regex] Processing file: ${filePath}`);
        }
        
        const fileViolations = await this.analyzeFileBasic(filePath, options);
        violations.push(...fileViolations);
        
        if (this.verbose) {
          console.log(`🔧 [S016 Regex] File ${filePath}: Found ${fileViolations.length} violations`);
        }
      } catch (error) {
        if (this.verbose) {
          console.warn(`⚠ [S016 Regex] Analysis failed for ${filePath}:`, error.message);
        }
      }
    }
    
    if (this.verbose) {
      console.log(`🔧 [S016 Regex] Total violations found: ${violations.length}`);
    }
    
    return violations;
  }
}

module.exports = S016RegexBasedAnalyzer;