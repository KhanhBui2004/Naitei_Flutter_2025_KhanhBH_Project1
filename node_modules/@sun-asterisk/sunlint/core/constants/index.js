/**
 * SunLint Constants - Barrel Export
 * Centralized access point for all constants
 */

// Re-export all constants from sub-modules
const categories = require('./categories');
const defaults = require('./defaults');
const engines = require('./engines');
const rules = require('./rules');

module.exports = {
  // Categories & Principles
  ...categories,
  
  // Default values & configurations
  ...defaults,
  
  // Engine-related constants
  ...engines,
  
  // Rule-related constants
  ...rules,
  
  // Grouped exports for specific use cases
  categories,
  defaults,
  engines,
  rules
};
