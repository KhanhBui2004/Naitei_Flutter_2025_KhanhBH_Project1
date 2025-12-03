/**
 * Centralized Severity Constants for SunLint Rules
 * Ensures consistency across all rule implementations
 */

const SEVERITY = {
  OFF: 'off',
  INFO: 'info', 
  WARNING: 'warning',
  ERROR: 'error'
};

// Default severities by rule category
const DEFAULT_SEVERITIES = {
  // Quality rules - generally warnings (can be fixed incrementally)
  QUALITY: SEVERITY.WARNING,
  
  // Security rules - generally errors (must be fixed)
  SECURITY: SEVERITY.ERROR,
  
  // Performance rules - generally warnings
  PERFORMANCE: SEVERITY.WARNING,
  
  // Maintainability rules - generally warnings
  MAINTAINABILITY: SEVERITY.WARNING,
  
  // Best practices - generally warnings
  BEST_PRACTICE: SEVERITY.WARNING,
  
  // Critical security - always errors
  CRITICAL_SECURITY: SEVERITY.ERROR
};

// Specific rule overrides (if needed)
const RULE_SEVERITY_OVERRIDES = {
  // Security rules that should be errors
  'S001': SEVERITY.ERROR,
  'S002': SEVERITY.ERROR,
  'S005': SEVERITY.ERROR,
  'S012': SEVERITY.ERROR, // No hardcoded secrets
  'S013': SEVERITY.ERROR, // Always use TLS
  
  // Quality rules that might be info for gradual adoption
  // 'C007': SEVERITY.INFO, // Comment quality - can be relaxed initially
  
  // Rules that should be strict errors
  'C043': SEVERITY.ERROR // No console.log in production
};

/**
 * Get the appropriate severity for a rule
 * @param {string} ruleId - The rule ID (e.g., 'C010', 'S005')
 * @param {string} category - The rule category (quality, security, etc.)
 * @param {string} [configOverride] - Override from configuration
 * @returns {string} The severity level
 */
function getSeverity(ruleId, category, configOverride = null) {
  // 1. Configuration override has highest priority
  if (configOverride && Object.values(SEVERITY).includes(configOverride)) {
    return configOverride;
  }
  
  // 2. Rule-specific override
  if (RULE_SEVERITY_OVERRIDES[ruleId]) {
    return RULE_SEVERITY_OVERRIDES[ruleId];
  }
  
  // 3. Category default
  const categoryKey = category?.toUpperCase();
  if (DEFAULT_SEVERITIES[categoryKey]) {
    return DEFAULT_SEVERITIES[categoryKey];
  }
  
  // 4. Fall back to warning
  return SEVERITY.WARNING;
}

/**
 * Validate severity value
 * @param {string} severity - Severity to validate
 * @returns {boolean} True if valid
 */
function isValidSeverity(severity) {
  return Object.values(SEVERITY).includes(severity);
}

module.exports = {
  SEVERITY,
  DEFAULT_SEVERITIES,
  RULE_SEVERITY_OVERRIDES,
  getSeverity,
  isValidSeverity
};
