/**
 * Heuristic analyzer for S009 - No Insecure Encryption Modes, Padding, or Cryptographic Algorithms
 * Purpose: Detect usage of insecure encryption algorithms, modes, and padding schemes
 * Based on OWASP A02:2021 - Cryptographic Failures
 */

class S009Analyzer {
  constructor() {
    this.ruleId = 'S009';
    this.ruleName = 'No Insecure Encryption Modes, Padding, or Cryptographic Algorithms';
    this.description = 'Do not use insecure encryption modes, padding, or cryptographic algorithms';
    
    // Insecure symmetric encryption algorithms
    this.insecureSymmetricAlgorithms = [
      'des', 'des-cbc', 'des-ecb', 'des-cfb', 'des-ofb',
      '3des', 'des-ede', 'des-ede-cbc', 'des-ede-cfb', 'des-ede-ofb',
      'des-ede3', 'des-ede3-cbc', 'des-ede3-cfb', 'des-ede3-ofb',
      'rc2', 'rc2-cbc', 'rc2-ecb', 'rc2-cfb', 'rc2-ofb',
      'rc4', 'rc4-40', 'rc4-hmac-md5',
      'blowfish', 'bf', 'bf-cbc', 'bf-ecb', 'bf-cfb', 'bf-ofb'
    ];
    
    // Insecure block cipher modes
    this.insecureModes = [
      'ecb', 'electronic-codebook'
    ];
    
    // Insecure padding schemes
    this.insecurePadding = [
      'pkcs1', 'pkcs1_5', 'pkcs1-padding', 'rsa_pkcs1_padding',
      'no-padding', 'nopadding'
    ];
    
    // Insecure hash algorithms
    this.insecureHashAlgorithms = [
      'md2', 'md4', 'md5',
      'sha', 'sha1', 'sha-1',
      'ripemd', 'ripemd128', 'ripemd160'
    ];
    
    // Insecure key derivation functions
    this.insecureKDFs = [
      'pbkdf1', 'simple-hash', 'plain-hash'
    ];
    
    // Common crypto libraries and their patterns
    this.cryptoPatterns = [
      // Node.js crypto module
      /crypto\.createCipher\(['"`]([^'"`]+)['"`]/i,
      /crypto\.createDecipher\(['"`]([^'"`]+)['"`]/i,
      /crypto\.createHash\(['"`]([^'"`]+)['"`]/i,
      /crypto\.createHmac\(['"`]([^'"`]+)['"`]/i,
      /crypto\.pbkdf2\(['"`]([^'"`]+)['"`]/i,
      
      // CryptoJS patterns
      /CryptoJS\.DES\./i,
      /CryptoJS\.TripleDES\./i,
      /CryptoJS\.RC4\./i,
      /CryptoJS\.MD5\(/i,
      /CryptoJS\.SHA1\(/i,
      /CryptoJS\.mode\.ECB/i,
      
      // Java crypto patterns
      /Cipher\.getInstance\(['"`]([^'"`]+)['"`]/i,
      /MessageDigest\.getInstance\(['"`]([^'"`]+)['"`]/i,
      /Mac\.getInstance\(['"`]([^'"`]+)['"`]/i,
      /KeyGenerator\.getInstance\(['"`]([^'"`]+)['"`]/i,
      
      // .NET crypto patterns
      /new\s+(DES|TripleDES|RC2|MD5|SHA1)CryptoServiceProvider/i,
      /\.Create\(['"`](DES|TripleDES|RC2|MD5|SHA1)['"`]\)/i,
      
      // OpenSSL command patterns
      /-des\b|-des3\b|-rc4\b|-md5\b|-sha1\b/i,
      
      // Generic algorithm references
      /'(des|3des|rc4|md5|sha1|ecb)'/i,
      /"(des|3des|rc4|md5|sha1|ecb)"/i,
      /`(des|3des|rc4|md5|sha1|ecb)`/i,
      
      // Configuration patterns
      /algorithm\s*[:=]\s*['"`]([^'"`]+)['"`]/i,
      /cipher\s*[:=]\s*['"`]([^'"`]+)['"`]/i,
      /hash\s*[:=]\s*['"`]([^'"`]+)['"`]/i,
      /encryption\s*[:=]\s*['"`]([^'"`]+)['"`]/i,
    ];
    
    // Safe patterns to avoid false positives
    this.safePatterns = [
      // Comments and documentation
      /\/\/|\/\*|\*\/|@param|@return|@example|@deprecated|TODO|FIXME/i,
      
      // Import/export statements
      /import|export|require|module\.exports/i,
      
      // Type definitions
      /interface|type|enum|class.*\{/i,
      
      // Test files and mock data
      /\.test\.|\.spec\.|mock|stub|fake|dummy/i,
      
      // Safe modern algorithms mentioned in context
      /aes|rsa-oaep|sha256|sha384|sha512|bcrypt|scrypt|argon2|pbkdf2/i,
      
      // Configuration examples or documentation
      /example|sample|demo|deprecated|legacy|old|insecure|weak|avoid|don't use|do not use/i,
      
      // Variable names that might contain keywords but are safe
      /const\s+\w*[Nn]ame|let\s+\w*[Nn]ame|var\s+\w*[Nn]ame/i,
      
      // Safe usage in educational context
      /educational|tutorial|learning|history|comparison/i,
    ];
    
    // Context patterns that increase confidence of violations
    this.violationContexts = [
      // Direct algorithm usage
      /encrypt|decrypt|cipher|hash|digest|sign|verify/i,
      
      // Configuration settings
      /config|setting|option|parameter/i,
      
      // API calls
      /\.create|\.get|\.set|\.use|\.apply/i,
      
      // Assignment patterns
      /=\s*['"`]|:\s*['"`]/,
      
      // Function calls
      /\([^)]*['"`][^'"`]*['"`][^)]*\)/,
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
      'vendor/', 'mocks/', '.mock.', 'docs/', 'documentation/'
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
      
      // Check for insecure cryptographic usage
      const violation = this.checkForInsecureCrypto(line, lineNumber, filePath);
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
      line.includes('module.exports') ||
      line.startsWith('#') // Python/shell comments
    );
  }

  checkForInsecureCrypto(line, lineNumber, filePath) {
    // First check if line contains safe patterns (early exit)
    if (this.containsSafePattern(line)) {
      return null;
    }
    
    // Check each crypto pattern
    for (const pattern of this.cryptoPatterns) {
      const match = pattern.exec(line);
      if (match) {
        const algorithm = match[1] ? match[1].toLowerCase() : '';
        const fullMatch = match[0];
        
        // Check if the algorithm is insecure
        const insecureAlgorithm = this.identifyInsecureAlgorithm(algorithm, fullMatch);
        if (insecureAlgorithm) {
          // Additional context check to reduce false positives
          if (this.hasViolationContext(line)) {
            return {
              ruleId: this.ruleId,
              severity: 'error',
              message: `Insecure cryptographic algorithm detected: ${insecureAlgorithm.algorithm}. ${insecureAlgorithm.reason}`,
              line: lineNumber,
              column: line.indexOf(fullMatch) + 1,
              filePath: filePath,
              type: insecureAlgorithm.type,
              algorithm: insecureAlgorithm.algorithm,
              details: insecureAlgorithm.recommendation
            };
          }
        }
      }
    }
    
    return null;
  }

  containsSafePattern(line) {
    return this.safePatterns.some(pattern => pattern.test(line));
  }

  identifyInsecureAlgorithm(algorithm, fullMatch) {
    const lowerAlgorithm = algorithm.toLowerCase();
    const lowerFullMatch = fullMatch.toLowerCase();
    
    // Check symmetric encryption algorithms
    if (this.insecureSymmetricAlgorithms.some(alg => 
        lowerAlgorithm.includes(alg) || lowerFullMatch.includes(alg))) {
      const matchedAlg = this.insecureSymmetricAlgorithms.find(alg => 
        lowerAlgorithm.includes(alg) || lowerFullMatch.includes(alg));
      
      return {
        algorithm: matchedAlg.toUpperCase(),
        type: 'insecure_symmetric_encryption',
        reason: 'This algorithm is cryptographically weak and vulnerable to attacks.',
        recommendation: 'Use AES-256-GCM or ChaCha20-Poly1305 for symmetric encryption.'
      };
    }
    
    // Check block cipher modes
    if (this.insecureModes.some(mode => 
        lowerAlgorithm.includes(mode) || lowerFullMatch.includes(mode))) {
      return {
        algorithm: 'ECB Mode',
        type: 'insecure_cipher_mode',
        reason: 'ECB mode reveals patterns in plaintext and is not semantically secure.',
        recommendation: 'Use CBC, CTR, or GCM modes with proper initialization vectors.'
      };
    }
    
    // Check hash algorithms
    if (this.insecureHashAlgorithms.some(hash => 
        lowerAlgorithm.includes(hash) || lowerFullMatch.includes(hash))) {
      const matchedHash = this.insecureHashAlgorithms.find(hash => 
        lowerAlgorithm.includes(hash) || lowerFullMatch.includes(hash));
      
      return {
        algorithm: matchedHash.toUpperCase(),
        type: 'insecure_hash_algorithm',
        reason: 'This hash algorithm is vulnerable to collision attacks.',
        recommendation: 'Use SHA-256, SHA-384, or SHA-512 for cryptographic hashing.'
      };
    }
    
    // Check padding schemes
    if (this.insecurePadding.some(padding => 
        lowerAlgorithm.includes(padding) || lowerFullMatch.includes(padding))) {
      return {
        algorithm: 'PKCS#1 v1.5 Padding',
        type: 'insecure_padding_scheme',
        reason: 'PKCS#1 v1.5 padding is vulnerable to padding oracle attacks.',
        recommendation: 'Use OAEP padding for RSA encryption.'
      };
    }
    
    // Check key derivation functions
    if (this.insecureKDFs.some(kdf => 
        lowerAlgorithm.includes(kdf) || lowerFullMatch.includes(kdf))) {
      return {
        algorithm: 'PBKDF1',
        type: 'insecure_key_derivation',
        reason: 'This key derivation function is weak and vulnerable to attacks.',
        recommendation: 'Use PBKDF2 with high iteration count, scrypt, or Argon2.'
      };
    }
    
    return null;
  }

  hasViolationContext(line) {
    return this.violationContexts.some(context => context.test(line));
  }
}

module.exports = S009Analyzer;
