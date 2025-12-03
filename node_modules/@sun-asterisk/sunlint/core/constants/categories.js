/**
 * SunLint Category Constants
 * Single source of truth for all category-principle mappings
 * Used by: sunlint-rule-adapter.js, plugin-manager.js, custom rules, etc.
 */

/**
 * Official SunLint Principles (constant values)
 * These should match exactly with principles used in origin-rules
 */
const SUNLINT_PRINCIPLES = {
  CODE_QUALITY: 'CODE_QUALITY',
  DESIGN_PATTERNS: 'DESIGN_PATTERNS',
  INTEGRATION: 'INTEGRATION', 
  MAINTAINABILITY: 'MAINTAINABILITY',
  PERFORMANCE: 'PERFORMANCE',
  RELIABILITY: 'RELIABILITY',
  SECURITY: 'SECURITY',
  TESTABILITY: 'TESTABILITY',
  USABILITY: 'USABILITY'
};

/**
 * Category to Principle Mapping
 * Single source of truth - used across all components
 */
const CATEGORY_PRINCIPLE_MAP = {
  'security': [SUNLINT_PRINCIPLES.SECURITY],
  'quality': [SUNLINT_PRINCIPLES.CODE_QUALITY], 
  'performance': [SUNLINT_PRINCIPLES.PERFORMANCE],
  'maintainability': [SUNLINT_PRINCIPLES.MAINTAINABILITY],
  'testability': [SUNLINT_PRINCIPLES.TESTABILITY],
  'reliability': [SUNLINT_PRINCIPLES.RELIABILITY],
  'design': [SUNLINT_PRINCIPLES.DESIGN_PATTERNS],
  'integration': [SUNLINT_PRINCIPLES.INTEGRATION],
  'usability': [SUNLINT_PRINCIPLES.USABILITY]
};

/**
 * Human-readable category descriptions
 */
const CATEGORY_DESCRIPTIONS = {
  'quality': 'Code quality and best practices',
  'design': 'Design patterns and architectural principles',
  'integration': 'Integration and API design',
  'maintainability': 'Code maintainability and readability', 
  'performance': 'Performance optimization and efficiency',
  'reliability': 'Error handling and code reliability',
  'security': 'Security-related rules to prevent vulnerabilities',
  'testability': 'Testing and test-driven development',
  'usability': 'User experience and interface guidelines'
};

/**
 * Get all valid categories
 * @returns {Array<string>} Array of category names
 */
function getValidCategories() {
  return Object.keys(CATEGORY_PRINCIPLE_MAP);
}

/**
 * Get principles for a category
 * @param {string} category - Category name
 * @returns {Array<string>} Array of principles
 */
function getCategoryPrinciples(category) {
  return CATEGORY_PRINCIPLE_MAP[category?.toLowerCase()] || [];
}

/**
 * Validate if a category is valid
 * @param {string} category - Category to validate
 * @returns {boolean} True if valid
 */
function isValidCategory(category) {
  return getValidCategories().includes(category?.toLowerCase());
}

/**
 * Get category description
 * @param {string} category - Category name
 * @returns {string} Category description
 */
function getCategoryDescription(category) {
  return CATEGORY_DESCRIPTIONS[category?.toLowerCase()] || 'Unknown category';
}

/**
 * Get default category (fallback)
 * @returns {string} Default category name
 */
function getDefaultCategory() {
  return 'quality'; // CODE_QUALITY principle
}

/**
 * Normalize category name (lowercase, validate)
 * @param {string} category - Category to normalize
 * @returns {string} Normalized category or default
 */
function normalizeCategory(category) {
  if (!category) return getDefaultCategory();
  
  const normalized = category.toLowerCase();
  return isValidCategory(normalized) ? normalized : getDefaultCategory();
}

/**
 * Get category for a principle (reverse lookup)
 * @param {string} principle - Principle name  
 * @returns {string|null} Category name or null
 */
function getCategoryForPrinciple(principle) {
  for (const [category, principles] of Object.entries(CATEGORY_PRINCIPLE_MAP)) {
    if (principles.includes(principle)) {
      return category;
    }
  }
  return null;
}

/**
 * Add new category-principle mapping (for future extensibility)
 * @param {string} category - Category name
 * @param {Array<string>} principles - Array of principles
 * @param {string} description - Category description
 */
function addCategoryMapping(category, principles, description) {
  const normalizedCategory = category.toLowerCase();
  CATEGORY_PRINCIPLE_MAP[normalizedCategory] = principles;
  CATEGORY_DESCRIPTIONS[normalizedCategory] = description;
}

/**
 * Get category statistics
 * @returns {Object} Category statistics
 */
function getCategoryStats() {
  const categories = getValidCategories();
  const principleCount = Object.values(CATEGORY_PRINCIPLE_MAP)
    .flat().length;
  
  return {
    totalCategories: categories.length,
    totalPrinciples: principleCount,
    categories: categories,
    mapping: CATEGORY_PRINCIPLE_MAP
  };
}

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
