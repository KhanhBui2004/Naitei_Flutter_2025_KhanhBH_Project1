/**
 * Rule Mapping Service
 * Following Rule C005: Single responsibility - handle rule mapping logic
 * Following Rule C015: Use domain language - clear naming for rule mappings
 */

class RuleMappingService {
  constructor() {
    this.eslintToSunlintMapping = this.createEslintToSunlintMapping();
    this.sunlintToEslintMapping = this.createSunlintToEslintMapping();
  }

  /**
   * Create ESLint to SunLint rule mapping
   * Following Rule C012: Query - pure function
   */
  createEslintToSunlintMapping() {
    return {
      // Custom rules mapping (using actual rule IDs from integrations/eslint/plugin/rules)
      'custom/c002': 'C002',
      'custom/c003': 'C003', 
      'custom/c006': 'C006',
      'custom/c010': 'C010',
      'custom/c013': 'C013',
      'custom/c014': 'C014',
      'custom/c017': 'C017',
      'custom/c018': 'C018',
      'custom/c023': 'C023',
      'custom/c027': 'C027',
      'custom/c029': 'C029',
      'custom/c030': 'C030',
      'custom/c034': 'C034',
      'custom/c035': 'C035',
      'custom/c041': 'C041',
      'custom/c042': 'C042',
      'custom/c043': 'C043',
      'custom/c047': 'C047',
      'custom/c048': 'C048',
      'custom/c076': 'C076',
      'custom/t002': 'T002',
      'custom/t003': 'T003',
      'custom/t004': 'T004',
      'custom/t007': 'T007',
      'custom/t011': 'T011',
      'custom/t019': 'T019',
      'custom/t025': 'T025',
      'custom/t026': 'T026',

      // Additional mappings for semantic rule names
      'custom/no-console-error': 'C019',
      
      // Security rules mapping
      'custom/typescript_s001': 'S001',
      'custom/typescript_s002': 'S002',
      'custom/typescript_s003': 'S003',
      'custom/typescript_s005': 'S005',
      'custom/typescript_s006': 'S006',
      'custom/typescript_s007': 'S007',
      'custom/typescript_s008': 'S008',
      'custom/typescript_s009': 'S009',
      'custom/typescript_s010': 'S010',
      'custom/typescript_s011': 'S011',
      'custom/typescript_s012': 'S012',
      'custom/typescript_s013': 'S013',
      'custom/typescript_s014': 'S014',
      'custom/typescript_s015': 'S015',
      'custom/typescript_s016': 'S016',
      'custom/typescript_s017': 'S017',
      'custom/typescript_s018': 'S018',
      'custom/typescript_s019': 'S019',
      'custom/typescript_s020': 'S020',
      'custom/typescript_s022': 'S022',
      'custom/typescript_s023': 'S023',
      'custom/typescript_s025': 'S025',
      'custom/typescript_s026': 'S026',
      'custom/typescript_s027': 'S027',
      'custom/typescript_s029': 'S029',
      'custom/typescript_s030': 'S030',
      'custom/typescript_s033': 'S033',
      'custom/typescript_s034': 'S034',
      'custom/typescript_s035': 'S035',
      'custom/typescript_s036': 'S036',
      'custom/typescript_s037': 'S037',
      'custom/typescript_s038': 'S038',
      'custom/typescript_s039': 'S039',
      'custom/typescript_s041': 'S041',
      'custom/typescript_s042': 'S042',
      'custom/typescript_s043': 'S043',
      'custom/typescript_s044': 'S044',
      'custom/typescript_s045': 'S045',
      'custom/typescript_s046': 'S046',
      'custom/typescript_s047': 'S047',
      'custom/typescript_s048': 'S048',
      'custom/typescript_s050': 'S050',
      'custom/typescript_s052': 'S052',
      'custom/typescript_s054': 'S054',
      'custom/typescript_s055': 'S055',
      'custom/typescript_s057': 'S057',
      'custom/typescript_s058': 'S058',
      'custom/single-responsibility': 'C005',
      'custom/verb-noun-naming': 'C006',
      'custom/no-direct-new': 'C014',
      'custom/domain-language': 'C015',
      'custom/separate-validation': 'C031',
      'custom/no-constructor-api': 'C032',
      'custom/separate-logic-data': 'C033',
      'custom/no-global-state': 'C034',
      'custom/full-error-logging': 'C035',
      'custom/standard-response': 'C037',
      'custom/no-order-dependency': 'C038',
      'custom/centralized-validation': 'C040',

      // Standard ESLint rules that map to SunLint rules
      'prefer-const': 'C_PREFER_CONST',
      'no-unused-vars': 'C_NO_UNUSED_VARS',
      'no-console': 'C019', // Maps to logging rule
      'no-undef': 'C_NO_UNDEF', // Undefined variables
      'consistent-return': 'C_CONSISTENT_RETURN',
      'no-var': 'C_NO_VAR',
      'eqeqeq': 'C_STRICT_EQUALITY',
      'no-eval': 'S_NO_EVAL',
      'no-implied-eval': 'S_NO_IMPLIED_EVAL',
      'no-new-func': 'S_NO_NEW_FUNC',
      'max-lines-per-function': 'C_MAX_LINES_PER_FUNCTION',
      'complexity': 'C_COMPLEXITY',
      'no-new': 'C_NO_NEW',
      'curly': 'C_CURLY_BRACES',
    };
  }

  /**
   * Create SunLint to ESLint rule mapping
   * Following Rule C012: Query - pure function
   */
  createSunlintToEslintMapping() {
    const mapping = {};
    
    // Reverse the ESLint to SunLint mapping
    for (const [eslintRule, sunlintRule] of Object.entries(this.eslintToSunlintMapping)) {
      if (!mapping[sunlintRule]) {
        mapping[sunlintRule] = [];
      }
      mapping[sunlintRule].push(eslintRule);
    }

    // Add additional direct mappings
    mapping['C005'] = ['custom/single-responsibility']; // C005 doesn't have direct ESLint rule, fallback to basic
    mapping['C006'] = ['custom/c006']; // Verb-noun naming
    mapping['C014'] = ['custom/c014']; // Dependency injection
    mapping['C015'] = ['custom/domain-language']; // Domain language - no direct ESLint rule
    mapping['C019'] = ['custom/c043', 'no-console']; // Console/logging
    mapping['C031'] = ['custom/separate-validation']; // Validation - no direct ESLint rule
    mapping['C032'] = ['custom/no-constructor-api']; // Constructor API - no direct ESLint rule
    mapping['C033'] = ['custom/separate-logic-data']; // Logic separation - no direct ESLint rule
    mapping['C034'] = ['custom/c034']; // Implicit return
    mapping['C035'] = ['custom/c035']; // Empty catch
    mapping['C037'] = ['custom/standard-response']; // Standard response - no direct ESLint rule
    mapping['C038'] = ['custom/no-order-dependency']; // Order dependency - no direct ESLint rule
    mapping['C040'] = ['custom/centralized-validation']; // Centralized validation - no direct ESLint rule

    // Additional mappings for available custom rules
    mapping['C002'] = ['custom/c002']; // Duplicate code
    mapping['C003'] = ['custom/c003']; // Vague abbreviations
    mapping['C010'] = ['custom/c010']; // Block nesting
    mapping['C013'] = ['custom/c013']; // Dead code
    mapping['C017'] = ['custom/c017']; // Constructor logic
    mapping['C018'] = ['custom/c018']; // Generic throw
    mapping['C023'] = ['custom/c023']; // Duplicate variable name
    mapping['C027'] = ['custom/c027']; // Function nesting
    mapping['C029'] = ['custom/c029']; // Catch block logging
    mapping['C030'] = ['custom/c030']; // Custom error classes
    mapping['C041'] = ['custom/c041']; // Config inline
    mapping['C042'] = ['custom/c042']; // Boolean naming
    mapping['C043'] = ['custom/c043']; // Console/print
    mapping['C047'] = ['custom/c047']; // Duplicate retry logic
    mapping['C048'] = ['custom/c048']; // Var declaration
    mapping['C076'] = ['custom/c076']; // One assert per test

    // Security rules mapping
    mapping['S001'] = ['custom/typescript_s001']; // Fail securely
    mapping['S002'] = ['custom/typescript_s002']; // IDOR check
    mapping['S005'] = ['custom/typescript_s005']; // No Origin header auth
    mapping['S006'] = ['custom/typescript_s006']; // Activation recovery secret
    mapping['S007'] = ['custom/typescript_s007']; // No plaintext OTP
    mapping['S008'] = ['custom/typescript_s008']; // Crypto agility
    mapping['S009'] = ['custom/typescript_s009']; // No insecure crypto
    mapping['S010'] = ['custom/typescript_s010']; // No insecure random
    mapping['S011'] = ['custom/typescript_s011']; // No insecure UUID
    mapping['S012'] = ['custom/typescript_s012']; // No hardcoded secrets
    mapping['S013'] = ['custom/typescript_s013']; // Verify TLS connection
    mapping['S014'] = ['custom/typescript_s014']; // Insecure TLS version
    mapping['S015'] = ['custom/typescript_s015']; // Insecure TLS certificate
    mapping['S016'] = ['custom/typescript_s016']; // Sensitive query parameter
    mapping['S017'] = ['custom/typescript_s017']; // No SQL injection
    mapping['S018'] = ['custom/typescript_s018']; // Positive input validation
    mapping['S019'] = ['custom/typescript_s019']; // No raw user input in email
    mapping['S020'] = ['custom/typescript_s020']; // No eval dynamic execution
    mapping['S022'] = ['custom/typescript_s022']; // Output encoding required
    mapping['S023'] = ['custom/typescript_s023']; // No JSON injection
    mapping['S025'] = ['custom/typescript_s025']; // Server side input validation
    mapping['S026'] = ['custom/typescript_s026']; // JSON schema validation
    mapping['S027'] = ['custom/typescript_s027']; // No hardcoded secrets advanced
    mapping['S029'] = ['custom/typescript_s029']; // Require CSRF protection
    mapping['S030'] = ['custom/typescript_s030']; // No directory browsing
    mapping['S033'] = ['custom/typescript_s033']; // Require SameSite cookie
    mapping['S034'] = ['custom/typescript_s034']; // Require Host cookie prefix
    mapping['S035'] = ['custom/typescript_s035']; // Cookie specific path
    mapping['S036'] = ['custom/typescript_s036']; // No unsafe file include
    mapping['S037'] = ['custom/typescript_s037']; // Require anti cache headers
    mapping['S038'] = ['custom/typescript_s038']; // No version disclosure
    mapping['S039'] = ['custom/typescript_s039']; // No session token in URL
    mapping['S041'] = ['custom/typescript_s041']; // Require session invalidate on logout
    mapping['S042'] = ['custom/typescript_s042']; // Require periodic reauthentication
    mapping['S043'] = ['custom/typescript_s043']; // Terminate sessions on password change
    mapping['S044'] = ['custom/typescript_s044']; // Require full session for sensitive ops
    mapping['S045'] = ['custom/typescript_s045']; // Anti automation controls
    mapping['S046'] = ['custom/typescript_s046']; // Secure notification on auth change
    mapping['S048'] = ['custom/typescript_s048']; // Password credential recovery
    mapping['S050'] = ['custom/typescript_s050']; // Session token weak hash
    mapping['S052'] = ['custom/typescript_s052']; // Secure random authentication code
    mapping['S054'] = ['custom/typescript_s054']; // Verification default account
    mapping['S057'] = ['custom/typescript_s057']; // UTC logging
    mapping['S058'] = ['custom/typescript_s058']; // No SSRF

    return mapping;
  }

  /**
   * Get ESLint rules for SunLint rule ID
   * Following Rule C006: Verb-noun naming
   */
  getEslintRulesForSunLintRule(sunlintRuleId) {
    return this.sunlintToEslintMapping[sunlintRuleId] || [];
  }

  /**
   * Get SunLint rule for ESLint rule ID
   * Following Rule C006: Verb-noun naming
   */
  getSunLintRuleForEslintRule(eslintRuleId) {
    return this.eslintToSunlintMapping[eslintRuleId] || eslintRuleId;
  }

  /**
   * Get all supported SunLint rules
   * Following Rule C006: Verb-noun naming
   */
  getSupportedSunLintRules() {
    return Object.keys(this.sunlintToEslintMapping);
  }

  /**
   * Get all supported ESLint rules
   * Following Rule C006: Verb-noun naming
   */
  getSupportedEslintRules() {
    return Object.keys(this.eslintToSunlintMapping);
  }

  /**
   * Check if SunLint rule is supported by ESLint
   * Following Rule C006: Verb-noun naming
   */
  isSunLintRuleSupportedByEslint(sunlintRuleId) {
    return this.sunlintToEslintMapping.hasOwnProperty(sunlintRuleId);
  }

  /**
   * Get rule description for SunLint rule
   * Following Rule C015: Use domain language
   */
  getSunLintRuleDescription(sunlintRuleId) {
    const descriptions = {
      'C005': 'Each function should do only one thing',
      'C006': 'Function names should be verb-noun',
      'C014': 'Use Dependency Injection instead of direct new',
      'C015': 'Use domain language in class/function names',
      'C019': 'Do not use error level logging for non-critical errors',
      'C031': 'Data validation logic should be separate',
      'C032': 'No external API calls in constructor or static block',
      'C033': 'Separate processing logic and data query in service layer',
      'C034': 'Limit direct access to global state in domain logic',
      'C035': 'When handling errors, log full relevant information',
      'C037': 'API handlers should return standard response objects',
      'C038': 'Avoid logic dependent on file/module loading order',
      'C040': 'Do not scatter validation logic across multiple classes',
    };
    
    return descriptions[sunlintRuleId] || 'No description available';
  }

  /**
   * Get rule category for SunLint rule
   * Following Rule C015: Use domain language
   */
  getSunLintRuleCategory(sunlintRuleId) {
    const categories = {
      'C005': 'quality',
      'C006': 'naming',
      'C014': 'architecture',
      'C015': 'naming',
      'C019': 'logging',
      'C031': 'validation',
      'C032': 'architecture',
      'C033': 'architecture',
      'C034': 'architecture',
      'C035': 'logging',
      'C037': 'api',
      'C038': 'architecture',
      'C040': 'validation',
    };
    
    return categories[sunlintRuleId] || 'other';
  }
}

module.exports = RuleMappingService;
