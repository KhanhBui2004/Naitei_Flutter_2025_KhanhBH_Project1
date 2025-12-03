/**
 * SunLint Category Constants - Legacy Proxy
 * @deprecated This file is deprecated. Use core/constants/categories.js instead.
 * Maintained for backward compatibility only.
 */

// Import from the new centralized location
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

module.exports = {
  // Constants
  SUNLINT_PRINCIPLES,
  CATEGORY_PRINCIPLE_MAP,
  CATEGORY_DESCRIPTIONS,
  
  // Utility functions
  getValidCategories,
  getCategoryPrinciples,
  isValidCategory,
  getCategoryDescription,
  getDefaultCategory,
  normalizeCategory,
  getCategoryForPrinciple,
  addCategoryMapping,
  getCategoryStats
};
