/**
 * Heuristic analyzer for S048 - No Current Password in Reset Process
 * Purpose: Detect requiring current password during password reset process
 * Based on OWASP A04:2021 - Insecure Design
 */

class S048Analyzer {
  constructor() {
    this.ruleId = 'S048';
    this.ruleName = 'No Current Password in Reset Process';
    this.description = 'Do not require current password during password reset process';
    
    // Keywords that indicate password reset functionality
    this.resetKeywords = [
      'reset', 'forgot', 'recover', 'change', 'update', 'modify',
      'resetpassword', 'forgotpassword', 'changepassword', 'updatepassword'
    ];
    
    // Keywords that indicate current password requirement
    this.currentPasswordKeywords = [
      'currentpassword', 'current_password', 'oldpassword', 'old_password',
      'existingpassword', 'existing_password', 'presentpassword', 'present_password',
      'previouspassword', 'previous_password', 'originalpassword', 'original_password'
    ];
    
    // API endpoint patterns for password reset
    this.resetEndpointPatterns = [
      /\/reset[-_]?password/i,
      /\/forgot[-_]?password/i,
      /\/change[-_]?password/i,
      /\/update[-_]?password/i,
      /\/password[-_]?reset/i,
      /\/password[-_]?change/i,
      /\/password[-_]?update/i,
      /\/user\/password/i,
      /\/auth\/reset/i,
      /\/auth\/forgot/i
    ];
    
    // Function/method patterns related to password reset
    this.resetFunctionPatterns = [
      /resetpassword/i,
      /forgotpassword/i,
      /changepassword/i,
      /updatepassword/i,
      /passwordreset/i,
      /passwordchange/i,
      /passwordupdate/i,
      /handlepasswordreset/i,
      /handleforgotpassword/i,
      /processpasswordreset/i
    ];
    
    // Patterns for requiring current password in reset context
    this.violationPatterns = [
      // Validation/requirement patterns
      /(?:required?|validate|check|verify).*(?:current|old|existing|present|previous|original).*password/i,
      /(?:current|old|existing|present|previous|original).*password.*(?:required?|validate|check|verify)/i,
      
      // Form field patterns
      /(?:input|field|param|body|request).*(?:current|old|existing|present|previous|original).*password/i,
      /(?:current|old|existing|present|previous|original).*password.*(?:input|field|param|body|request)/i,
      
      // Comparison patterns
      /(?:compare|match|equal|verify).*(?:current|old|existing|present|previous|original).*password/i,
      /(?:current|old|existing|present|previous|original).*password.*(?:compare|match|equal|verify)/i,
      
      // Database lookup patterns
      /(?:select|find|get|fetch|query).*(?:current|old|existing|present|previous|original).*password/i,
      /(?:current|old|existing|present|previous|original).*password.*(?:select|find|get|fetch|query)/i,
      
      // Error message patterns
      /(?:current|old|existing|present|previous|original).*password.*(?:incorrect|wrong|invalid|mismatch)/i,
      /(?:incorrect|wrong|invalid|mismatch).*(?:current|old|existing|present|previous|original).*password/i,
      
      // Schema/model field patterns
      /currentPassword|current_password|oldPassword|old_password|existingPassword|existing_password/,
      
      // Template/HTML patterns
      /"[^"]*(?:current|old|existing|present|previous|original)[^"]*password[^"]*"/i,
      /'[^']*(?:current|old|existing|present|previous|original)[^']*password[^']*'/i,
      /`[^`]*(?:current|old|existing|present|previous|original)[^`]*password[^`]*`/i
    ];
    
    // Safe patterns that should be excluded
    this.safePatterns = [
      // Comments and documentation
      /\/\/|\/\*|\*\/|@param|@return|@example|@deprecated/,
      
      // Import/export statements
      /import|export|require|module\.exports/i,
      
      // Type definitions
      /interface|type|enum|class.*\{/i,
      
      // Configuration files
      /config|setting|option|constant|env/i,
      
      // Test files patterns
      /test|spec|mock|fixture|stub/i,
      
      // Logging patterns (acceptable for debugging)
      /log|debug|trace|console|logger/i,
      
      // Historical/audit patterns (not current validation)
      /history|audit|backup|archive|previous.*login/i,
      
      // Password change (not reset) - legitimate to require current password
      /changepassword.*current/i,
      /updatepassword.*current/i,
      
      // Safe messages about security
      /for security|security purposes|secure|protection|best practice/i,
      
      // Documentation patterns
      /should not|avoid|don't|never|security risk|vulnerability/i
    ];
    
    // Context keywords that indicate password reset (not change)
    this.resetContextKeywords = [
      'reset', 'forgot', 'forgotten', 'recover', 'recovery', 'token', 'link', 'email',
      'verification', 'verify', 'code', 'otp', 'temporary'
    ];
    
    // Keywords that indicate password change (legitimate to require current password)
    this.changeContextKeywords = [
      'profile', 'settings', 'account', 'preferences', 'dashboard', 'authenticated',
      'logged', 'session'
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
      
      // Check for password reset context
      if (this.isPasswordResetContext(content, line, lineNumber)) {
        // Check for current password requirement violation
        const violation = this.checkForCurrentPasswordRequirement(line, lineNumber, filePath, content);
        if (violation) {
          violations.push(violation);
        }
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

  isPasswordResetContext(content, line, lineNumber) {
    const lowerContent = content.toLowerCase();
    const lowerLine = line.toLowerCase();
    
    // Check if this is in a password reset context
    const hasResetContext = (
      // Check current line for reset keywords
      this.resetKeywords.some(keyword => lowerLine.includes(keyword)) ||
      
      // Check for reset endpoint patterns
      this.resetEndpointPatterns.some(pattern => pattern.test(line)) ||
      
      // Check for reset function patterns
      this.resetFunctionPatterns.some(pattern => pattern.test(line)) ||
      
      // Check surrounding context (within 10 lines)
      this.hasResetContextNearby(content, lineNumber)
    );
    
    // Exclude if it's clearly a password change context (not reset)
    const hasChangeContext = this.changeContextKeywords.some(keyword => 
      lowerContent.includes(keyword) || lowerLine.includes(keyword)
    );
    
    return hasResetContext && !hasChangeContext;
  }

  hasResetContextNearby(content, lineNumber) {
    const lines = content.split('\n');
    const start = Math.max(0, lineNumber - 10);
    const end = Math.min(lines.length, lineNumber + 10);
    
    for (let i = start; i < end; i++) {
      const nearbyLine = lines[i].toLowerCase();
      
      // Check for reset context keywords
      if (this.resetContextKeywords.some(keyword => nearbyLine.includes(keyword))) {
        return true;
      }
      
      // Check for reset endpoints
      if (this.resetEndpointPatterns.some(pattern => pattern.test(lines[i]))) {
        return true;
      }
      
      // Check for reset function names
      if (this.resetFunctionPatterns.some(pattern => pattern.test(lines[i]))) {
        return true;
      }
    }
    
    return false;
  }

  checkForCurrentPasswordRequirement(line, lineNumber, filePath, content) {
    // First check if line contains safe patterns (early exit)
    if (this.containsSafePattern(line)) {
      return null;
    }
    
    // Check for direct violation patterns
    for (const pattern of this.violationPatterns) {
      if (pattern.test(line)) {
        // Additional context validation to reduce false positives
        if (this.isValidViolationContext(line, content, lineNumber)) {
          return {
            ruleId: this.ruleId,
            severity: 'error',
            message: 'Password reset process should not require current password. Use secure token-based reset instead.',
            line: lineNumber,
            column: this.findPatternColumn(line, pattern),
            filePath: filePath,
            type: 'current_password_in_reset',
            details: 'Requiring current password during reset defeats the purpose of password reset and creates security issues. Use email/SMS verification with secure tokens instead.'
          };
        }
      }
    }
    
    // Check for variable/field names that suggest current password requirement
    const currentPasswordField = this.checkCurrentPasswordField(line, lineNumber, filePath);
    if (currentPasswordField) {
      return currentPasswordField;
    }
    
    return null;
  }

  containsSafePattern(line) {
    return this.safePatterns.some(pattern => pattern.test(line));
  }

  isValidViolationContext(line, content, lineNumber) {
    const lowerLine = line.toLowerCase();
    
    // Check if this is actually about password reset (not change)
    const hasResetIndicators = this.resetContextKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
    
    // Check if it's in a validation/requirement context
    const hasRequirementContext = [
      'required', 'validate', 'check', 'verify', 'input', 'field', 'param',
      'body', 'request', 'schema', 'model', 'form'
    ].some(keyword => lowerLine.includes(keyword));
    
    // Check if it's actually requiring/validating current password
    const hasCurrentPasswordRequirement = this.currentPasswordKeywords.some(keyword => 
      lowerLine.includes(keyword)
    );
    
    return hasResetIndicators && hasRequirementContext && hasCurrentPasswordRequirement;
  }

  checkCurrentPasswordField(line, lineNumber, filePath) {
    // Look for variable declarations, object properties, or field definitions
    // that suggest current password fields in reset context
    
    const fieldPatterns = [
      // Variable declarations
      /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=.*(?:current|old|existing).*password/i,
      
      // Object properties
      /['"']?(currentPassword|current_password|oldPassword|old_password|existingPassword|existing_password)['"']?\s*:/,
      
      // Form field names
      /name\s*=\s*['"](current|old|existing)[-_]?password['"]/i,
      
      // Schema/model fields
      /(?:currentPassword|current_password|oldPassword|old_password|existingPassword|existing_password)\s*:\s*(?:String|type|required)/i,
      
      // Validation rules
      /(?:currentPassword|current_password|oldPassword|old_password|existingPassword|existing_password).*(?:required|validate)/i
    ];
    
    for (const pattern of fieldPatterns) {
      const match = line.match(pattern);
      if (match) {
        return {
          ruleId: this.ruleId,
          severity: 'warning',
          message: `Field '${match[1] || match[0]}' suggests requiring current password in reset process. This should be avoided.`,
          line: lineNumber,
          column: line.indexOf(match[0]) + 1,
          filePath: filePath,
          type: 'current_password_field',
          fieldName: match[1] || match[0],
          details: 'Password reset should use token-based verification, not current password validation.'
        };
      }
    }
    
    return null;
  }

  findPatternColumn(line, pattern) {
    const match = pattern.exec(line);
    return match ? match.index + 1 : 1;
  }
}

module.exports = S048Analyzer;
