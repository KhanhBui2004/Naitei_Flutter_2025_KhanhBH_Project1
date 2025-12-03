/**
 * SunLint Categories - Legacy Module
 * @deprecated This module is deprecated. Use core/constants/categories.js instead.
 * Maintained for backward compatibility only.
 */

// Import from the new centralized constants
const {
  SUNLINT_PRINCIPLES,
  CATEGORY_PRINCIPLE_MAP,
  CATEGORY_DESCRIPTIONS,
  getValidCategories,
  getCategoryPrinciples,
  isValidCategory,
  getCategoryDescription,
  getDefaultCategory,
  normalizeCategory,
  getCategoryForPrinciple,
  addCategoryMapping,
  getCategoryStats
} = require('./constants/categories');

// Legacy constants for backward compatibility
const SUNLINT_CATEGORIES = {
  CODE_QUALITY: 'quality',
  DESIGN_PATTERNS: 'design', 
  INTEGRATION: 'integration',
  MAINTAINABILITY: 'maintainability',
  PERFORMANCE: 'performance',
  RELIABILITY: 'reliability',
  SECURITY: 'security',
  TESTABILITY: 'testability',
  USABILITY: 'usability'
};

module.exports = {
  // Legacy exports (for backward compatibility)
  SUNLINT_CATEGORIES,
  CATEGORY_DESCRIPTIONS,
  CATEGORY_PRINCIPLE_MAP,
  
  // Function exports (now from centralized source)
  isValidCategory,
  getValidCategories,
  getCategoryDescription,
  getCategoryPrinciples,
  
  // New exports from centralized system
  SUNLINT_PRINCIPLES,
  getDefaultCategory,
  normalizeCategory
};
