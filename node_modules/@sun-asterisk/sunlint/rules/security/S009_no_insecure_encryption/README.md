# S009 - No Insecure Encryption Modes, Padding, or Cryptographic Algorithms

## Overview

This rule detects the usage of insecure cryptographic algorithms, cipher modes, and padding schemes that are vulnerable to various attacks and should not be used in production code.

## Rule Details

**Rule ID**: S009  
**Category**: Security  
**Severity**: Error  
**Engine**: Heuristic  
**OWASP**: A02:2021 - Cryptographic Failures  
**CWE**: CWE-327 - Use of a Broken or Risky Cryptographic Algorithm  

## Detected Vulnerabilities

### Insecure Symmetric Encryption Algorithms
- **DES** (Data Encryption Standard) - 56-bit key, easily broken
- **3DES/TripleDES** - Deprecated, vulnerable to Sweet32 attack
- **RC2** - Weak key schedule, vulnerable to related-key attacks  
- **RC4** - Stream cipher with biases, deprecated
- **Blowfish** - Small block size, vulnerable to birthday attacks

### Insecure Cipher Modes
- **ECB** (Electronic Codebook) - Reveals patterns in plaintext
- **No encryption mode specified** - May default to insecure modes

### Insecure Hash Algorithms
- **MD2, MD4, MD5** - Vulnerable to collision attacks
- **SHA1** - Deprecated, collision attacks demonstrated
- **RIPEMD-128/160** - Weaker alternatives to SHA family

### Insecure Padding Schemes
- **PKCS#1 v1.5** - Vulnerable to padding oracle attacks
- **No padding** - Can lead to information leakage

### Insecure Key Derivation Functions
- **PBKDF1** - Limited output length, weak
- **Simple hash-based KDFs** - Vulnerable to dictionary attacks

## Examples

### ❌ Violations

```typescript
// Node.js crypto module violations
const cipher = crypto.createCipher('des', key);
const hash = crypto.createHash('md5');
const decipher = crypto.createDecipher('rc4', key);

// CryptoJS violations  
const encrypted = CryptoJS.DES.encrypt(data, key);
const hash = CryptoJS.MD5(data);
const encrypted = CryptoJS.mode.ECB;

// Java violations
Cipher cipher = Cipher.getInstance("DES/ECB/PKCS5Padding");
MessageDigest md = MessageDigest.getInstance("MD5");

// .NET violations
var des = new DESCryptoServiceProvider();
var md5 = MD5.Create();

// Configuration violations
const config = {
  algorithm: 'des',
  hash: 'md5',
  cipher: 'rc4'
};
```

### ✅ Secure Alternatives

```typescript
// Secure Node.js crypto usage
const cipher = crypto.createCipher('aes-256-gcm', key);
const hash = crypto.createHash('sha256');
const decipher = crypto.createDecipher('aes-256-cbc', key);

// Secure CryptoJS usage
const encrypted = CryptoJS.AES.encrypt(data, key);
const hash = CryptoJS.SHA256(data);
const encrypted = CryptoJS.mode.GCM;

// Secure Java usage
Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
MessageDigest md = MessageDigest.getInstance("SHA-256");

// Secure .NET usage
var aes = new AesCryptoServiceProvider();
var sha256 = SHA256.Create();

// Secure configuration
const config = {
  algorithm: 'aes-256-gcm',
  hash: 'sha256',
  cipher: 'aes-256-cbc'
};
```

## Supported Languages

- **JavaScript/TypeScript** - Node.js crypto, CryptoJS
- **Java** - javax.crypto, java.security
- **C#/.NET** - System.Security.Cryptography
- **Python** - cryptography, hashlib
- **Go** - crypto packages
- **Configuration files** - JSON, YAML, XML

## Detection Patterns

The rule uses heuristic analysis to detect:

1. **Direct API calls** with insecure algorithms
2. **Configuration settings** specifying weak crypto
3. **String literals** containing algorithm names
4. **Variable assignments** with insecure values
5. **Method chaining** with crypto operations

## False Positive Prevention

The rule excludes:

- **Comments and documentation**
- **Import/export statements**
- **Test files and mock data**
- **Educational/example code**
- **Variable names** (not actual usage)
- **Safe algorithm mentions** in secure contexts

## Remediation

### For Symmetric Encryption
- Use **AES-256** with secure modes (GCM, CBC)
- Ensure proper **initialization vectors** (IVs)
- Use **authenticated encryption** when possible

### For Hashing
- Use **SHA-256** or stronger (SHA-384, SHA-512)
- For passwords, use **bcrypt**, **scrypt**, or **Argon2**
- Avoid hashing for integrity without HMAC

### For Asymmetric Encryption
- Use **RSA-2048** or stronger, or **ECC P-256+**
- Use **OAEP padding** for RSA encryption
- Use **PSS padding** for RSA signatures

### For Key Derivation
- Use **PBKDF2** with high iteration counts (100,000+)
- Consider **scrypt** or **Argon2** for better security
- Use proper **salt** values

## References

- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [NIST Cryptographic Standards](https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines)
- [RFC 8018 - PKCS #5: Password-Based Cryptography Specification](https://tools.ietf.org/html/rfc8018)
