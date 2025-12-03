/**
 * SunLint Rule Constants
 * Constants related to rules, their metadata, and analysis
 */

/**
 * Rule severity levels (ordered by importance)
 */
const RULE_SEVERITIES = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  HINT: 'hint'
};

/**
 * Rule execution status
 */
const RULE_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped',
  TIMEOUT: 'timeout'
};

/**
 * Rule types based on analysis approach
 */
const RULE_TYPES = {
  HEURISTIC: 'heuristic',      // Pattern-based analysis
  AST: 'ast',                  // Abstract Syntax Tree analysis
  SEMANTIC: 'semantic',        // Semantic analysis
  AI: 'ai',                    // AI-powered analysis
  HYBRID: 'hybrid'             // Combination of approaches
};

/**
 * Rule scopes - what level the rule operates on
 */
const RULE_SCOPES = {
  FILE: 'file',                // Single file analysis
  PROJECT: 'project',          // Project-wide analysis
  MODULE: 'module',            // Module/package analysis
  FUNCTION: 'function',        // Function-level analysis
  CLASS: 'class',              // Class-level analysis
  EXPRESSION: 'expression'     // Expression-level analysis
};

/**
 * Rule language patterns for quick identification
 */
const RULE_LANGUAGE_PATTERNS = {
  COMMON: /^C\d{3}$/,          // C001, C002, etc.
  JAVASCRIPT: /^J\d{3}$/,      // J001, J002, etc.
  TYPESCRIPT: /^T\d{3}$/,      // T001, T002, etc.
  JAVA: /^JV\d{3}$/,           // JV001, JV002, etc.
  KOTLIN: /^K\d{3}$/,          // K001, K002, etc.
  DART: /^D\d{3}$/,            // D001, D002, etc.
  SWIFT: /^SW\d{3}$/,          // SW001, SW002, etc.
  PYTHON: /^PY\d{3}$/,         // PY001, PY002, etc.
  SECURITY: /^S\d{3}$/,        // S001, S002, etc.
  REACT: /^R\d{3}$/,           // R001, R002, etc.
  CUSTOM: /^CUSTOM_\w+$/       // Custom rules
};

/**
 * Rule execution timeouts by type (in milliseconds)
 */
const RULE_TIMEOUTS = {
  [RULE_TYPES.HEURISTIC]: 5000,    // 5 seconds
  [RULE_TYPES.AST]: 10000,          // 10 seconds
  [RULE_TYPES.SEMANTIC]: 15000,     // 15 seconds
  [RULE_TYPES.AI]: 30000,           // 30 seconds
  [RULE_TYPES.HYBRID]: 20000        // 20 seconds
};

/**
 * Rule confidence levels for AI/heuristic analysis
 */
const CONFIDENCE_LEVELS = {
  VERY_HIGH: 0.9,
  HIGH: 0.8,
  MEDIUM: 0.6,
  LOW: 0.4,
  VERY_LOW: 0.2
};

/**
 * Default rule metadata template
 */
const DEFAULT_RULE_METADATA = {
  severity: RULE_SEVERITIES.WARNING,
  type: RULE_TYPES.HEURISTIC,
  scope: RULE_SCOPES.FILE,
  category: 'quality',
  languages: [],
  description: '',
  examples: {
    good: [],
    bad: []
  },
  tags: [],
  fixable: false,
  confidence: CONFIDENCE_LEVELS.HIGH
};

/**
 * Rule performance metrics template
 */
const RULE_PERFORMANCE_TEMPLATE = {
  executionTime: 0,
  filesAnalyzed: 0,
  violationsFound: 0,
  falsePositives: 0,
  memoryUsage: 0,
  cacheHits: 0
};

/**
 * Get language from rule ID
 * @param {string} ruleId - Rule identifier (e.g., "C001", "J005")
 * @returns {string|null} Language name or null if not found
 */
function getLanguageFromRuleId(ruleId) {
  const patterns = {
    javascript: RULE_LANGUAGE_PATTERNS.JAVASCRIPT,
    typescript: RULE_LANGUAGE_PATTERNS.TYPESCRIPT,
    java: RULE_LANGUAGE_PATTERNS.JAVA,
    kotlin: RULE_LANGUAGE_PATTERNS.KOTLIN,
    dart: RULE_LANGUAGE_PATTERNS.DART,
    swift: RULE_LANGUAGE_PATTERNS.SWIFT,
    python: RULE_LANGUAGE_PATTERNS.PYTHON,
    react: RULE_LANGUAGE_PATTERNS.REACT
  };
  
  for (const [language, pattern] of Object.entries(patterns)) {
    if (pattern.test(ruleId)) {
      return language;
    }
  }
  
  // Check for common rules
  if (RULE_LANGUAGE_PATTERNS.COMMON.test(ruleId)) {
    return 'common';
  }
  
  // Check for security rules
  if (RULE_LANGUAGE_PATTERNS.SECURITY.test(ruleId)) {
    return 'security';
  }
  
  return null;
}

/**
 * Check if rule ID is valid format
 * @param {string} ruleId - Rule identifier
 * @returns {boolean} True if valid format
 */
function isValidRuleId(ruleId) {
  const allPatterns = Object.values(RULE_LANGUAGE_PATTERNS);
  return allPatterns.some(pattern => pattern.test(ruleId));
}

/**
 * Get rule timeout by type
 * @param {string} ruleType - Rule type
 * @returns {number} Timeout in milliseconds
 */
function getRuleTimeout(ruleType) {
  return RULE_TIMEOUTS[ruleType] || RULE_TIMEOUTS[RULE_TYPES.HEURISTIC];
}

/**
 * Get default rule metadata with overrides
 * @param {Object} overrides - Metadata overrides
 * @returns {Object} Merged metadata
 */
function getDefaultRuleMetadata(overrides = {}) {
  return {
    ...DEFAULT_RULE_METADATA,
    ...overrides
  };
}

/**
 * Check if severity level is valid
 * @param {string} severity - Severity level
 * @returns {boolean} True if valid
 */
function isValidSeverity(severity) {
  return Object.values(RULE_SEVERITIES).includes(severity);
}

module.exports = {
  // Rule constants
  RULE_SEVERITIES,
  RULE_STATUS,
  RULE_TYPES,
  RULE_SCOPES,
  RULE_LANGUAGE_PATTERNS,
  RULE_TIMEOUTS,
  CONFIDENCE_LEVELS,
  DEFAULT_RULE_METADATA,
  RULE_PERFORMANCE_TEMPLATE,
  
  // Utility functions
  getLanguageFromRuleId,
  isValidRuleId,
  getRuleTimeout,
  getDefaultRuleMetadata,
  isValidSeverity
};
