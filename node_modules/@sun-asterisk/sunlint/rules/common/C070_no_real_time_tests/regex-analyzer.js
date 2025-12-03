const fs = require('fs');
const path = require('path');
const { CommentDetector } = require('../../utils/rule-helpers');

/**
 * C070 - Tests Should Not Depend on Real Time
 * Detects real-time sleeps/timeouts in test files and suggests fake timers
 * 
 * Focus: Improve test reliability by avoiding time-dependent flaky tests
 */
class C070TestRealTimeAnalyzer {
  constructor() {
    this.ruleId = 'C070';
    this.configPath = path.join(__dirname, 'config.json');
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    } catch (error) {
      console.warn(`Failed to load config for ${this.ruleId}:`, error.message);
      return this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      options: {
        timerApis: {
          ts_js: [
            "setTimeout\\s*\\(",
            "setInterval\\s*\\(",
            "\\.sleep\\s*\\(",
            "\\.delay\\s*\\(",
            "\\.wait\\s*\\(",
            "new\\s+Promise.*setTimeout"
          ]
        },
        fakeTimerDetectors: {
          jest_vitest: [
            "jest\\.useFakeTimers\\(\\)",
            "vi\\.useFakeTimers\\(\\)",
            "jest\\.advanceTimersByTime",
            "vi\\.advanceTimersByTime"
          ]
        },
        busyPollingDetectors: {
          ts_js: ["Date\\.now\\(\\)", "new\\s+Date\\(\\)"]
        },
        allowAnnotations: ["@perf", "@benchmark", "@allow-real-time", "// @allow-real-time"]
      }
    };
  }

  /**
   * Check if file is a test file
   */
  isTestFile(filePath) {
    const testPatterns = [
      /\.test\.(js|ts|jsx|tsx)$/,
      /\.spec\.(js|ts|jsx|tsx)$/,
      /__tests__\//,
      /\/tests?\//,
      /test-cases\.(js|ts)$/  // Add pattern for our test cases
    ];
    return testPatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * Check if line has annotation allowing real-time
   */
  hasAllowAnnotation(content, lineIndex) {
    const allowAnnotations = this.config.options.allowAnnotations || [];
    const lines = content.split('\n');
    
    // Check current line and 2 lines above for annotations
    for (let i = Math.max(0, lineIndex - 2); i <= lineIndex; i++) {
      const line = lines[i] || '';
      for (const annotation of allowAnnotations) {
        if (line.includes(annotation)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if fake timers are used in the file
   */
  hasFakeTimers(content) {
    const fakeTimerPatterns = this.config.options.fakeTimerDetectors.jest_vitest || [];
    return fakeTimerPatterns.some(pattern => {
      const regex = new RegExp(pattern, 'g');
      return regex.test(content);
    });
  }

  /**
   * Detect timer API violations
   */
  detectTimerViolations(content, filePath) {
    const violations = [];
    const lines = content.split('\n');
    const timerPatterns = this.config.options.timerApis.ts_js || this.getDefaultConfig().options.timerApis.ts_js;
    const hasFakeTimersInFile = this.hasFakeTimers(content);

    timerPatterns.forEach(pattern => {
      // Convert config patterns (* wildcards) to proper regex
      let regexPattern = pattern;
      if (pattern.includes('(*)')) {
        regexPattern = pattern.replace(/\(\*\)/g, '\\([^)]*\\)');
      }
      if (pattern.includes('*')) {
        regexPattern = pattern.replace(/\*/g, '[^)]*');
      }
      
      const regex = new RegExp(regexPattern, 'g');
      
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        // Skip empty lines
        if (!trimmedLine) {
          return;
        }

        // Skip if entire line is in block comment
        if (CommentDetector.isLineInBlockComment(lines, index)) {
          return;
        }

        // Skip if has allow annotation
        if (this.hasAllowAnnotation(content, index)) {
          return;
        }

        const matches = [...line.matchAll(regex)];
        if (matches.length > 0) {
          matches.forEach(match => {
            const column = match.index + 1;
            
            // Skip if match position is inside a comment
            if (CommentDetector.isPositionInComment(line, match.index)) {
              return;
            }
            
            let suggestion = "Use fake timers instead of real-time delays in tests.";
            let severity = "error";

            // Specific suggestions based on pattern
            if (pattern.includes('setTimeout') || pattern.includes('setInterval')) {
              if (!hasFakeTimersInFile) {
                suggestion = "Use jest.useFakeTimers() and jest.advanceTimersByTime() instead of setTimeout/setInterval.";
              } else {
                suggestion = "You have fake timers setup. Use jest.advanceTimersByTime() to control time instead of real setTimeout.";
              }
            } else if (pattern.includes('sleep') || pattern.includes('delay')) {
              suggestion = "Replace sleep/delay with fake timers or condition-based waiting.";
            } else if (pattern.includes('Promise.*setTimeout')) {
              suggestion = "Replace Promise+setTimeout with fake timers: await jest.advanceTimersByTimeAsync().";
            }

            violations.push({
              file: filePath,
              line: index + 1,
              column: column,
              message: `Avoid real-time ${match[0]} in tests. ${suggestion}`,
              severity: severity,
              ruleId: this.ruleId,
              evidence: line.trim(),
              suggestion: suggestion
            });
          });
        }
      });
    });

    return violations;
  }

  /**
   * Detect busy polling violations (Date.now(), new Date() in loops)
   */
  detectBusyPollingViolations(content, filePath) {
    const violations = [];
    const lines = content.split('\n');
    const pollingPatterns = this.config.options.busyPollingDetectors.ts_js || [];

    pollingPatterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'g');
      
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        // Skip empty lines
        if (!trimmedLine) {
          return;
        }

        // Skip if entire line is in block comment
        if (CommentDetector.isLineInBlockComment(lines, index)) {
          return;
        }

        // Skip if has allow annotation
        if (this.hasAllowAnnotation(content, index)) {
          return;
        }

        // Look for Date.now()/new Date() in potential polling contexts
        const matches = line.match(regex);
        if (matches && this.isLikelyPolling(lines, index)) {
          matches.forEach(match => {
            const column = line.indexOf(match) + 1;
            
            // Skip if match position is inside a comment
            if (CommentDetector.isPositionInComment(line, line.indexOf(match))) {
              return;
            }
            
            violations.push({
              file: filePath,
              line: index + 1,
              column: column,
              message: `Avoid busy polling with ${match} in tests. Use condition-based waiting instead.`,
              severity: "warning",
              ruleId: this.ruleId,
              evidence: line.trim(),
              suggestion: "Use waitFor conditions or fake timers instead of polling Date.now()."
            });
          });
        }
      });
    });

    return violations;
  }

  /**
   * Check if Date.now()/new Date() usage looks like polling
   */
  isLikelyPolling(lines, currentIndex) {
    const currentLine = lines[currentIndex];
    
    // Skip if new Date() has static parameters (test data)
    if (currentLine.includes('new Date(') && /new Date\(\s*\d/.test(currentLine)) {
      return false;
    }
    
    // Look for polling patterns around this line
    const contextRange = 5;
    const start = Math.max(0, currentIndex - contextRange);
    const end = Math.min(lines.length - 1, currentIndex + contextRange);
    
    let hasLoop = false;
    let hasTimeCheck = false;
    
    for (let i = start; i <= end; i++) {
      const line = lines[i].trim().toLowerCase();
      
      // Check for loop patterns
      if (line.includes('while') && (line.includes('date.now') || line.includes('new date'))) {
        hasLoop = true;
      }
      
      // Check for time-based conditions
      if ((line.includes('date.now') || line.includes('new date')) && 
          (line.includes(' - ') || line.includes(' < ') || line.includes(' > ')) &&
          (line.includes('start') || line.includes('time') || line.includes('duration'))) {
        hasTimeCheck = true;
      }
      
      // Check for explicit polling patterns
      if (line.includes('setinterval') && (line.includes('date.now') || line.includes('new date'))) {
        return true;
      }
    }
    
    // Only flag as polling if both loop and time check are present
    return hasLoop && hasTimeCheck;
  }

  /**
   * Detect E2E specific violations
   */
  detectE2EViolations(content, filePath) {
    const violations = [];
    const lines = content.split('\n');
    const e2ePatterns = this.config.options.timerApis.e2e || [];

    e2ePatterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'g');
      
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        if (!trimmedLine) {
          return;
        }

        // Skip if entire line is in block comment
        if (CommentDetector.isLineInBlockComment(lines, index)) {
          return;
        }

        if (this.hasAllowAnnotation(content, index)) {
          return;
        }

        const matches = line.match(regex);
        if (matches) {
          matches.forEach(match => {
            const column = line.indexOf(match) + 1;
            
            // Skip if match position is inside a comment
            if (CommentDetector.isPositionInComment(line, line.indexOf(match))) {
              return;
            }
            
            let suggestion = "Use element-based waiting instead of fixed timeouts.";
            if (match.includes('page.waitForTimeout')) {
              suggestion = "Use page.waitForSelector() or page.waitForFunction() instead of waitForTimeout().";
            } else if (match.includes('cy.wait')) {
              suggestion = "Use cy.get().should() or cy.intercept() instead of cy.wait() with fixed time.";
            }

            violations.push({
              file: filePath,
              line: index + 1,
              column: column,
              message: `Avoid fixed timeout ${match} in E2E tests. ${suggestion}`,
              severity: "warning",
              ruleId: this.ruleId,
              evidence: line.trim(),
              suggestion: suggestion
            });
          });
        }
      });
    });

    return violations;
  }

  /**
   * Main analysis function - Engine interface
   * Expected signature: analyze(files, language, options)
   */
  async analyze(files, language, options = {}) {
    const allViolations = [];

    for (const filePath of files) {
      try {
        // Only analyze test files
        if (!this.isTestFile(filePath)) {
          continue;
        }

        // Read file content
        const content = require('fs').readFileSync(filePath, 'utf8');
        
        // Skip if file has explicit allow annotation
        if (this.hasAllowAnnotation(content)) {
          continue;
        }

        let violations = [];

        // Detect timer API violations
        violations = violations.concat(this.detectTimerViolations(content, filePath));
        
        // Detect busy polling violations
        violations = violations.concat(this.detectBusyPollingViolations(content, filePath));
        
        // Detect E2E violations (if file looks like E2E test)
        if (filePath.includes('e2e') || content.includes('playwright') || content.includes('cypress')) {
          violations = violations.concat(this.detectE2EViolations(content, filePath));
        }

        allViolations.push(...violations);

      } catch (error) {
        console.warn(`C070 analysis error for ${filePath}:`, error.message);
      }
    }

    return allViolations;
  }

  /**
   * Legacy analysis function for single file
   * @deprecated Use analyze(files, language, options) instead
   */
  analyzeSingleFile(content, filePath) {
    // Only analyze test files
    if (!this.isTestFile(filePath)) {
      return [];
    }

    let violations = [];

    try {
      // Detect timer API violations
      violations = violations.concat(this.detectTimerViolations(content, filePath));
      
      // Detect busy polling violations
      violations = violations.concat(this.detectBusyPollingViolations(content, filePath));
      
      // Detect E2E violations (if file looks like E2E test)
      if (filePath.includes('e2e') || content.includes('playwright') || content.includes('cypress')) {
        violations = violations.concat(this.detectE2EViolations(content, filePath));
      }

    } catch (error) {
      console.warn(`C070 analysis error for ${filePath}:`, error.message);
    }

    return violations;
  }
}

module.exports = C070TestRealTimeAnalyzer;
