/**
 * Heuristic analyzer for S007 - No Plaintext OTP
 * Purpose: Detect storing or transmitting OTP codes in plaintext
 * Based on OWASP A02:2021 - Cryptographic Failures
 */

class S007Analyzer {
  constructor() {
    this.ruleId = 'S007';
    this.ruleName = 'No Plaintext OTP';
    this.description = 'One-Time Passwords must not be stored in plaintext';
    
    // Keywords that indicate OTP/one-time codes
    this.otpKeywords = [
      'otp', 'totp', 'hotp', 'one.?time', 'onetime', '2fa', 'mfa',
      'authenticator', 'verification.?code', 'auth.?code', 'sms.?code',
      'temp.?code', 'temp.?password', 'pin.?code', 'security.?code',
      'access.?code', 'login.?code', 'token'
    ];
    
    // Keywords that indicate storage operations
    this.storageKeywords = [
      'save', 'store', 'insert', 'update', 'create', 'persist', 'write',
      'set', 'put', 'add', 'database', 'db', 'collection', 'table',
      'cache', 'session', 'localStorage', 'sessionStorage', 'cookie',
      'redis', 'mongo', 'sql', 'query', 'orm'
    ];
    
    // Keywords that indicate transmission operations
    this.transmissionKeywords = [
      'send', 'email', 'sms', 'text', 'message', 'mail', 'push', 'notify',
      'transmit', 'deliver', 'dispatch', 'forward', 'post', 'response',
      'json', 'body', 'payload', 'data', 'return', 'res\.', 'api'
    ];
    
    // Patterns that indicate plaintext OTP usage
    this.plaintextOtpPatterns = [
      // Storage patterns - storing OTP in plaintext
      /(?:save|store|insert|update|create|persist|write|set|put|add).*(?:otp|totp|hotp|one.?time|onetime|2fa|mfa|auth.?code|verification.?code|sms.?code|temp.?code|security.?code|access.?code|login.?code)/i,
      /(?:otp|totp|hotp|one.?time|onetime|2fa|mfa|auth.?code|verification.?code|sms.?code|temp.?code|security.?code|access.?code|login.?code).*(?:save|store|insert|update|create|persist|write|set|put|add)/i,
      
      // Database storage patterns
      /(?:database|db|collection|table|redis|mongo|sql|query|orm).*(?:otp|totp|hotp|one.?time|onetime|2fa|mfa|auth.?code|verification.?code|sms.?code|temp.?code|security.?code|access.?code|login.?code)/i,
      /(?:otp|totp|hotp|one.?time|onetime|2fa|mfa|auth.?code|verification.?code|sms.?code|temp.?code|security.?code|access.?code|login.?code).*(?:database|db|collection|table|redis|mongo|sql|query|orm)/i,
      
      // Transmission patterns - sending OTP in plaintext
      /(?:send|email|sms|text|message|mail|push|notify|transmit|deliver|dispatch|forward|post).*(?:otp|totp|hotp|one.?time|onetime|2fa|mfa|auth.?code|verification.?code|sms.?code|temp.?code|security.?code|access.?code|login.?code)/i,
      /(?:otp|totp|hotp|one.?time|onetime|2fa|mfa|auth.?code|verification.?code|sms.?code|temp.?code|security.?code|access.?code|login.?code).*(?:send|email|sms|text|message|mail|push|notify|transmit|deliver|dispatch|forward|post)/i,
      
      // Response patterns - returning OTP in API responses
      /(?:response|json|body|payload|data|return|res\.).*(?:otp|totp|hotp|one.?time|onetime|2fa|mfa|auth.?code|verification.?code|sms.?code|temp.?code|security.?code|access.?code|login.?code)/i,
      /(?:otp|totp|hotp|one.?time|onetime|2fa|mfa|auth.?code|verification.?code|sms.?code|temp.?code|security.?code|access.?code|login.?code).*(?:response|json|body|payload|data|return|res\.)/i,
      
      // Variable assignments with OTP that are stored/transmitted (not just declared)
      /(?:const|let|var)\s+\w*(?:otp|totp|hotp|one.?time|onetime|2fa|mfa|auth.?code|verification.?code|sms.?code|temp.?code|security.?code|access.?code|login.?code)\w*\s*=\s*['"`][^'"`]+['"`].*(?:save|store|send|transmit|cache|redis|db|database)/i,
      
      // String literals containing OTP
      /['"`].*(?:otp|totp|hotp|one.?time|onetime|2fa|mfa|auth.?code|verification.?code|sms.?code|temp.?code|security.?code|access.?code|login.?code).*['"`]/i,
      
      // Template strings with OTP
      /\$\{.*(?:otp|totp|hotp|one.?time|onetime|2fa|mfa|auth.?code|verification.?code|sms.?code|temp.?code|security.?code|access.?code|login.?code).*\}/i,
      
      // Console/logging with OTP
      /(?:console|log|debug|trace|print).*(?:otp|totp|hotp|one.?time|onetime|2fa|mfa|auth.?code|verification.?code|sms.?code|temp.?code|security.?code|access.?code|login.?code)/i,
      
      // Session/localStorage with OTP
      /(?:session|localStorage|sessionStorage|cookie).*(?:otp|totp|hotp|one.?time|onetime|2fa|mfa|auth.?code|verification.?code|sms.?code|temp.?code|security.?code|access.?code|login.?code)/i,
    ];
    
    // Patterns that should be excluded (safe practices)
    this.safePatterns = [
      // Hashed or encrypted OTP
      /hash|encrypt|cipher|bcrypt|crypto|secure|salt|hmac|sha|md5|pbkdf2/i,
      
      // Environment variables or config (configuration, not storage of actual values)
      /process\.env|config\.|getenv|\.env/i,
      
      // Comments and documentation
      /\/\/|\/\*|\*\/|@param|@return|@example|@description|TODO|FIXME/,
      
      // Type definitions and interfaces
      /interface|type|enum|class\s+\w+\s*\{|abstract\s+class/i,
      
      // Import/export statements
      /import|export|require|module\.exports/i,
      
      // Safe message patterns (no actual OTP values exposed)
      /instructions sent|sent to|check your|please enter|has been sent|successfully sent|we've sent|click the link|enter the code|will expire|verify|authenticate/i,
      
      // Function/method definitions
      /function\s+\w+|async\s+function|\w+\s*\([^)]*\)\s*\{|=>\s*\{/i,
      
      // Safe return statements (status messages, not actual codes)
      /return\s*\{[^}]*(?:success|message|status|sent|verified)[^}]*\}/i,
      
      // Time-based checks or validation (not storage)
      /(?:validate|verify|check|compare|match|expired|timeout|ttl|duration)/i,
      
      // Method names that don't store plaintext
      /(?:generateOtp|createOtp|validateOtp|verifyOtp|checkOtp|expireOtp|deleteOtp|removeOtp)/i,
      
      // Safe operations on OTP (hashing, encrypting, etc.)
      /(?:hash|encrypt|decrypt|cipher|secure|bcrypt|createHash|createHmac).*(?:otp|code|auth)/i,
      /(?:otp|code|auth).*(?:hash|encrypt|decrypt|cipher|secure|bcrypt|Hash|Hmac)/i,
      
      // Secure service calls
      /(?:secure|encrypted|safe).*(?:send|email|sms|service)/i,
      /(?:send|email|sms).*(?:secure|encrypted|safe)/i,
      
      // Token/session creation from OTP (not storing OTP itself)
      /(?:create|generate).*(?:token|session).*(?:from|with)/i,
      /(?:token|session).*(?:create|generate)/i,
      
      // Safe logging patterns
      /log.*(?:success|sent|generated|timestamp|result)/i,
      /console\.(?:log|error|warn|debug).*(?:user|failed|success|validation|error)(?!.*otp.*:)/i,
      /log.*(?:failed|error|validation).*user/i,
      
      // Return only metadata, not OTP
      /return.*(?:timestamp|Date|success|message|sent)/i,
      
      // Safe crypto operations on OTP (hashing, not exposing)
      /\.update\(.*otp.*\+.*\)|\.update\(otp.*\)|createHmac.*\.update/i,
      /crypto\.create(?:Hash|Hmac).*\.update\(/i,
    ];
    
    // Common safe variable names that might contain OTP keywords
    this.safeVariableNames = [
      /^(is|has|can|should|will|enable|disable|show|hide|display|need|require).*(?:otp|code|auth)/i,
      /^.*(?:type|config|setting|option|flag|enabled|disabled|required|valid|invalid|expired)$/i,
      /^(?:otp|code|auth).*(?:type|config|setting|option|flag|enabled|disabled|required|valid|invalid|expired)$/i,
      /^(?:validate|verify|check|generate|create|expire|delete|remove).*(?:otp|code|auth)/i,
    ];
  }

  async analyze(files, language, options = {}) {
    const violations = [];
    
    for (const filePath of files) {
      // Skip test files, build directories, and node_modules
      if (this.shouldSkipFile(filePath)) {
        continue;
      }
      
      try {
        const content = require('fs').readFileSync(filePath, 'utf8');
        const fileViolations = this.analyzeFile(content, filePath, options);
        violations.push(...fileViolations);
      } catch (error) {
        if (options.verbose) {
          console.warn(`⚠️ Failed to analyze ${filePath}: ${error.message}`);
        }
      }
    }
    
    return violations;
  }

  shouldSkipFile(filePath) {
    const skipPatterns = [
      'test/', 'tests/', '__tests__/', '.test.', '.spec.',
      'node_modules/', 'build/', 'dist/', '.next/', 'coverage/',
      'vendor/', 'mocks/', '.mock.'
      // Removed 'fixtures/' to allow testing
    ];
    
    return skipPatterns.some(pattern => filePath.includes(pattern));
  }

  analyzeFile(content, filePath, options = {}) {
    const violations = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();
      
      // Skip comments, imports, and empty lines
      if (this.shouldSkipLine(trimmedLine)) {
        return;
      }
      
      // Check for potential plaintext OTP usage
      const violation = this.checkForPlaintextOtpUsage(line, lineNumber, filePath);
      if (violation) {
        violations.push(violation);
      }
    });
    
    return violations;
  }

  shouldSkipLine(line) {
    // Skip comments, imports, and other non-code lines
    return (
      line.length === 0 ||
      line.startsWith('//') ||
      line.startsWith('/*') ||
      line.startsWith('*') ||
      line.startsWith('import ') ||
      line.startsWith('export ') ||
      line.startsWith('require(') ||
      line.includes('module.exports')
    );
  }

  checkForPlaintextOtpUsage(line, lineNumber, filePath) {
    const lowerLine = line.toLowerCase();
    
    // First check if line contains safe patterns (early exit)
    if (this.containsSafePattern(line)) {
      return null;
    }
    
    // Skip lines that are clearly secure operations
    if (this.isSecureOperation(line)) {
      return null;
    }
    
    // Check for variable assignments with sensitive OTP names
    const sensitiveAssignment = this.checkSensitiveOtpAssignment(line, lineNumber, filePath);
    if (sensitiveAssignment) {
      return sensitiveAssignment;
    }
    
    // Check for direct plaintext OTP patterns
    for (const pattern of this.plaintextOtpPatterns) {
      if (pattern.test(line)) {
        // Additional context check to reduce false positives
        if (this.hasOtpUsageContext(line) && !this.isSecureOperation(line)) {
          return {
            ruleId: this.ruleId,
            severity: 'error',
            message: 'OTP codes should not be stored or transmitted in plaintext. Use encrypted storage or hashed values.',
            line: lineNumber,
            column: this.findPatternColumn(line, pattern),
            filePath: filePath,
            type: 'plaintext_otp_usage',
            details: 'Consider encrypting OTP codes before storage, using secure transmission channels, or storing only hashed/encrypted versions.'
          };
        }
      }
    }
    
    return null;
  }

  containsSafePattern(line) {
    return this.safePatterns.some(pattern => pattern.test(line));
  }

  isSecureOperation(line) {
    // Check if the line is performing secure operations on OTP
    const secureOperationPatterns = [
      // Hashing operations
      /(?:bcrypt\.hash|crypto\.createHash|createHmac|hash|encrypt).*(?:otp|code|auth)/i,
      /(?:otp|code|auth).*(?:bcrypt\.hash|crypto\.createHash|createHmac|hash|encrypt)/i,
      
      // Secure service calls
      /(?:secure|encrypted|safe).*(?:send|email|sms|service|Email|SMS|Service)/i,
      
      // Variable containing 'hashed', 'encrypted', 'secure', 'token'
      /(?:hashed|encrypted|secure|token).*(?:otp|code|auth)/i,
      /(?:otp|code|auth).*(?:hash|encrypted|secure|token)/i,
      
      // Method calls that return tokens/hashes
      /(?:create|generate).*(?:token|hash|secure)/i,
      
      // Comparison operations (validation, not storage)
      /(?:compare|verify|validate|check).*(?:otp|code|auth)/i,
      /(?:otp|code|auth).*(?:compare|verify|validate|check)/i,
      
      // Safe logging (no actual OTP values) - improved patterns
      /console\.(?:log|debug|error|warn).*(?:generated|sent|success|timestamp|user|result|validation|failed)(?!.*otp.*:)/i,
      /console\.error.*validation.*failed.*user/i,
      /console\.error.*failed.*user.*:/i,
      
      // Return statements with safe content
      /return.*(?:timestamp|Date\.now|success|message|sent)/i,
      
      // Simple variable declarations without immediate storage/transmission
      /(?:const|let|var)\s+\w*(?:otp|code|auth)\w*\s*=\s*(?:this\.generate|generate|create|[\w.]+\()/i,
      
      // Method calls to secure functions
      /await\s+this\.(?:send|secure|encrypted|safe)/i,
      
      // Variable assignments that are passed to secure functions
      /(?:const|let|var)\s+\w+\s*=.*;\s*$|(?:const|let|var)\s+\w+\s*=.*(?:generate|create)/i,
      
      // Crypto operations like .update() on hash/hmac objects
      /\.update\(.*(?:otp|code|auth).*\+.*\)|\.update\((?:otp|code|auth).*\)/i,
      /createHmac.*\.update|createHash.*\.update/i,
    ];
    
    return secureOperationPatterns.some(pattern => pattern.test(line));
  }

  checkSensitiveOtpAssignment(line, lineNumber, filePath) {
    // Look for variable assignments that combine OTP with storage/transmission
    const assignmentMatch = line.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(.+)/);
    if (!assignmentMatch) {
      return null;
    }
    
    const [, variableName, valueExpr] = assignmentMatch;
    const lowerVarName = variableName.toLowerCase();
    const lowerValueExpr = valueExpr.toLowerCase();
    
    // Skip safe variable names
    if (this.safeVariableNames.some(pattern => pattern.test(lowerVarName))) {
      return null;
    }
    
    // Check if variable name suggests OTP usage
    const hasOtpKeyword = this.otpKeywords.some(keyword => {
      const keywordRegex = new RegExp(keyword, 'i');
      return keywordRegex.test(lowerVarName);
    });
    
    const hasStorageOrTransmissionKeyword = [
      ...this.storageKeywords,
      ...this.transmissionKeywords
    ].some(keyword => {
      const keywordRegex = new RegExp(keyword, 'i');
      return keywordRegex.test(lowerVarName) || keywordRegex.test(lowerValueExpr);
    });
    
    if (hasOtpKeyword && hasStorageOrTransmissionKeyword) {
      // Check if the value looks like it contains actual OTP or sensitive data
      if (this.valueContainsOtp(valueExpr)) {
        return {
          ruleId: this.ruleId,
          severity: 'warning',
          message: `Variable '${variableName}' appears to handle OTP codes for storage/transmission. Ensure OTP codes are encrypted or hashed.`,
          line: lineNumber,
          column: line.indexOf(variableName) + 1,
          filePath: filePath,
          type: 'sensitive_otp_variable',
          variableName: variableName,
          details: 'Consider encrypting OTP codes before storage/transmission or use secure channels.'
        };
      }
    }
    
    return null;
  }

  hasOtpUsageContext(line) {
    const otpUsageIndicators = [
      // Storage operations
      /(?:save|store|insert|update|create|persist|write|set|put|add|database|db|collection|table|redis|mongo|sql|query|orm)/i,
      
      // Transmission operations
      /(?:send|email|sms|text|message|mail|push|notify|transmit|deliver|dispatch|forward|post)/i,
      
      // Response operations
      /res\.(?:send|json|status|end)|response\.(?:send|json|status|end)|return.*(?:json|response|status)/i,
      
      // Session/localStorage
      /(?:session|localStorage|sessionStorage|cookie|cache)/i,
      
      // Logging (often a violation when OTP is logged)
      /(?:console|log|debug|trace|print)/i,
      
      // String operations that might expose OTP
      /\+.*['"`]|['"`].*\+|\$\{.*\}/,
    ];
    
    return otpUsageIndicators.some(indicator => indicator.test(line));
  }

  valueContainsOtp(valueExpr) {
    // Check if the value expression contains actual OTP patterns or user data
    const otpValuePatterns = [
      // Template strings with variables
      /\$\{[^}]+\}/,
      
      // String concatenation
      /\+\s*[a-zA-Z_$]/,
      
      // Function calls that might return OTP
      /\w+\([^)]*\)/,
      
      // Property access that might be OTP
      /\w+\.\w+/,
      
      // Array/object access
      /\[.*\]/,
      
      // Direct string literals that look like OTP codes (4-8 digits/chars)
      /['"`][a-zA-Z0-9]{4,8}['"`]/,
      
      // Patterns that suggest OTP generation or user input
      /(?:generate|random|user|input|request|body|params)/i,
    ];
    
    return otpValuePatterns.some(pattern => pattern.test(valueExpr));
  }

  findPatternColumn(line, pattern) {
    const match = pattern.exec(line);
    return match ? match.index + 1 : 1;
  }
}

module.exports = S007Analyzer;
