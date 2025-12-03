// Pattern-based fallback analyzer for C019
const fs = require('fs');

class C019PatternAnalyzer {
  constructor() {
    this.verbose = false;
    
    // Configuration for pattern matching
    this.config = {
      // Patterns that suggest inappropriate ERROR usage
      inappropriateErrorPatterns: [
        // Business logic rejections
        'validation.*(?:failed|error)', 'invalid.*(?:input|parameter|format)',
        'user.*(?:not.*found|unauthorized|forbidden)', 'permission.*denied',
        'authentication.*(?:failed|invalid)', 'authorization.*failed',
        
        // Client-side errors
        'bad.*request', 'missing.*(?:parameter|field)', 'invalid.*request',
        'malformed.*(?:json|xml|payload)', 'unsupported.*(?:format|type)',
        
        // Recoverable operations
        'retry.*(?:attempt|failed)', 'fallback.*(?:triggered|used)',
        'cache.*(?:miss|expired)', 'rate.*limit.*exceeded',
        
        // Expected business flows
        'user.*not.*found', 'resource.*not.*found', 'item.*not.*available',
        'quota.*exceeded', 'limit.*reached', 'threshold.*exceeded'
      ]
    };
  }

  async initialize(options = {}) {
    this.verbose = options.verbose || false;
  }

  async analyzeFileBasic(filePath, options = {}) {
    const violations = [];
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      if (this.verbose) {
        console.log(`[DEBUG] 🔍 C019: Pattern-based analysis of ${filePath.split('/').pop()}`);
      }
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;
        
        // Simple pattern matching for error logs
        const errorLogMatch = line.match(/(console|logger|log|winston|bunyan)\.error\(/i);
        if (errorLogMatch) {
          // Check for inappropriate patterns in the line
          const hasInappropriatePattern = this.config.inappropriateErrorPatterns.some(pattern =>
            new RegExp(pattern, 'i').test(line)
          );
          
          if (hasInappropriatePattern) {
            violations.push({
              ruleId: 'C019',
              message: 'Log level "error" may be inappropriate for this context. Consider using "warn" or "info".',
              filePath: filePath,
              line: lineNumber,
              column: errorLogMatch.index + 1,
              severity: 'warning',
              category: 'logging',
              confidence: 0.5,
              suggestion: 'Review the error context and use appropriate log level (warn/info for expected errors)'
            });
          }
        }
      }

      if (this.verbose) {
        console.log(`[DEBUG] 🔍 C019: Pattern analysis found ${violations.length} violations`);
      }
    } catch (error) {
      if (this.verbose) {
        console.error(`[DEBUG] ❌ C019: Pattern analysis error: ${error.message}`);
      }
    }
    
    return violations;
  }
}

module.exports = C019PatternAnalyzer;
