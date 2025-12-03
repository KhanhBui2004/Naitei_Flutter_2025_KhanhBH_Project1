/**
 * Hybrid analyzer for S015 - Insecure TLS Certificate Detection
 * Uses AST analysis with regex fallback for comprehensive coverage
 */

const S015ASTAnalyzer = require('./ast-analyzer');

class S015Analyzer {
  constructor() {
    this.ruleId = 'S015';
    this.ruleName = 'Insecure TLS Certificate';
    this.description = 'Prevent usage of insecure TLS certificate configurations';
    this.astAnalyzer = new S015ASTAnalyzer();
  }

  async analyze(files, language, options = {}) {
    const violations = [];
    
    if (options.verbose) {
      console.log(`🔍 Running S015 analysis on ${files.length} files...`);
    }

    // Use AST analysis as primary method
    const astViolations = await this.astAnalyzer.analyze(files, language, options);
    violations.push(...astViolations);

    // Add regex-based patterns for edge cases AST might miss
    for (const filePath of files) {
      try {
        const content = require('fs').readFileSync(filePath, 'utf8');
        const regexViolations = this.analyzeWithRegexPatterns(content, filePath, options);
        
        // Filter out duplicates (same line, same type)
        const filteredRegexViolations = regexViolations.filter(regexViolation => 
          !astViolations.some(astViolation => 
            astViolation.line === regexViolation.line && 
            astViolation.filePath === regexViolation.filePath
          )
        );
        
        violations.push(...filteredRegexViolations);
      } catch (error) {
        if (options.verbose) {
          console.warn(`⚠️ S015 regex analysis failed for ${filePath}: ${error.message}`);
        }
      }
    }

    if (options.verbose && violations.length > 0) {
      console.log(`📊 S015 found ${violations.length} violations`);
    }

    return violations;
  }

  analyzeWithRegexPatterns(content, filePath, options = {}) {
    const violations = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Pattern 1: Direct rejectUnauthorized: false
      if (/rejectUnauthorized\s*:\s*false/i.test(line)) {
        violations.push({
          ruleId: this.ruleId,
          severity: 'error',
          message: 'Untrusted/self-signed/expired certificate accepted. Only use trusted certificates in production.',
          line: lineNumber,
          column: line.search(/rejectUnauthorized/i) + 1,
          filePath: filePath,
          type: 'reject_unauthorized_false'
        });
      }

      // Pattern 2: process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
      if (/NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]0['"]/.test(line)) {
        violations.push({
          ruleId: this.ruleId,
          severity: 'error',
          message: 'TLS certificate rejection disabled globally. This affects all HTTPS requests.',
          line: lineNumber,
          column: line.search(/NODE_TLS_REJECT_UNAUTHORIZED/) + 1,
          filePath: filePath,
          type: 'global_tls_disable'
        });
      }

      // Pattern 3: Insecure TLS versions in configuration
      const tlsVersionPattern = /secureProtocol\s*:\s*['"](?:SSLv2|SSLv3|TLSv1_method|TLSv1)['"]|minVersion\s*:\s*['"](?:TLSv1|TLSv1\.0|TLSv1\.1|SSLv3)['"]|maxVersion\s*:\s*['"](?:TLSv1|TLSv1\.0|TLSv1\.1)['"]|version\s*:\s*['"](?:TLSv1|TLSv1\.0|TLSv1\.1|SSLv3)['"]/i;
      if (tlsVersionPattern.test(line)) {
        violations.push({
          ruleId: this.ruleId,
          severity: 'error',
          message: 'Insecure TLS/SSL version detected. Use TLS 1.2 or TLS 1.3 only.',
          line: lineNumber,
          column: line.search(tlsVersionPattern) + 1,
          filePath: filePath,
          type: 'insecure_tls_version'
        });
      }

      // Pattern 4: Weak cipher suites
      const weakCipherPattern = /ciphers\s*:\s*['"][^'"]*(?:NULL|RC4|DES|MD5|EXPORT)[^'"]*['"]|cipher\s*:\s*['"][^'"]*(?:NULL|RC4|DES|MD5|EXPORT)[^'"]*['"]/i;
      if (weakCipherPattern.test(line)) {
        violations.push({
          ruleId: this.ruleId,
          severity: 'warning',
          message: 'Weak cipher detected in TLS configuration. Use strong ciphers only.',
          line: lineNumber,
          column: line.search(weakCipherPattern) + 1,
          filePath: filePath,
          type: 'weak_cipher'
        });
      }

      // Pattern 5: Disabled certificate verification in various contexts
      const certVerificationPattern = /checkServerIdentity\s*:\s*(?:false|null)|verify\s*:\s*false|strictSSL\s*:\s*false|secureOptions\s*:\s*0/i;
      if (certVerificationPattern.test(line)) {
        violations.push({
          ruleId: this.ruleId,
          severity: 'warning',
          message: 'Certificate verification disabled. This may allow man-in-the-middle attacks.',
          line: lineNumber,
          column: line.search(certVerificationPattern) + 1,
          filePath: filePath,
          type: 'cert_verification_disabled'
        });
      }

      // Pattern 6: Axios/HTTP client insecure configuration
      const httpClientInsecurePattern = /(?:axios|request|fetch|http)\.(?:create|defaults|get|post|put|delete)\s*\([^)]*rejectUnauthorized\s*:\s*false|(?:axios|request)\.defaults\.httpsAgent.*rejectUnauthorized\s*:\s*false/i;
      if (httpClientInsecurePattern.test(line)) {
        violations.push({
          ruleId: this.ruleId,
          severity: 'error',
          message: 'HTTP client configured to ignore certificate errors. This is insecure.',
          line: lineNumber,
          column: line.search(httpClientInsecurePattern) + 1,
          filePath: filePath,
          type: 'http_client_insecure'
        });
      }
    });

    return violations;
  }
}

module.exports = S015Analyzer;
