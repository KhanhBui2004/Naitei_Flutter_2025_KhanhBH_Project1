/**
 * SunLint Engine Constants
 * Constants related to analysis engines and their configurations
 */

/**
 * Supported analysis engines
 */
const SUPPORTED_ENGINES = {
  HEURISTIC: 'heuristic',
  ESLINT: 'eslint',
  OPENAI: 'openai',
  TREE_SITTER: 'tree-sitter',
  UNIVERSAL_AST: 'universal-ast'
};

/**
 * Engine capabilities and supported languages
 */
const ENGINE_CAPABILITIES = {
  [SUPPORTED_ENGINES.HEURISTIC]: {
    languages: ['javascript', 'typescript', 'java', 'kotlin', 'dart', 'swift', 'python'],
    features: ['pattern-matching', 'regex-analysis', 'text-based'],
    priority: 1
  },
  
  [SUPPORTED_ENGINES.ESLINT]: {
    languages: ['javascript', 'typescript'],
    features: ['ast-analysis', 'rule-plugins', 'fixable'],
    priority: 2
  },
  
  [SUPPORTED_ENGINES.OPENAI]: {
    languages: ['javascript', 'typescript', 'java', 'kotlin', 'dart', 'swift', 'python'],
    features: ['ai-analysis', 'context-aware', 'natural-language'],
    priority: 3
  },
  
  [SUPPORTED_ENGINES.TREE_SITTER]: {
    languages: ['javascript', 'typescript', 'java', 'kotlin', 'python', 'go', 'rust'],
    features: ['ast-parsing', 'syntax-tree', 'language-agnostic'],
    priority: 2
  },
  
  [SUPPORTED_ENGINES.UNIVERSAL_AST]: {
    languages: ['javascript', 'typescript', 'java', 'kotlin', 'dart', 'swift'],
    features: ['universal-ast', 'cross-language', 'normalized-tree'],
    priority: 2
  }
};

/**
 * Engine execution modes
 */
const ENGINE_MODES = {
  SEQUENTIAL: 'sequential',    // Run engines one by one
  PARALLEL: 'parallel',        // Run engines in parallel
  HYBRID: 'hybrid',           // Smart combination
  FALLBACK: 'fallback'        // Use fallback engine on failure
};

/**
 * Engine performance configurations
 */
const ENGINE_PERFORMANCE = {
  [SUPPORTED_ENGINES.HEURISTIC]: {
    maxConcurrentFiles: 50,
    averageTimePerFile: 100,  // milliseconds
    memoryUsage: 'low'
  },
  
  [SUPPORTED_ENGINES.ESLINT]: {
    maxConcurrentFiles: 20,
    averageTimePerFile: 500,  // milliseconds
    memoryUsage: 'medium'
  },
  
  [SUPPORTED_ENGINES.OPENAI]: {
    maxConcurrentFiles: 5,
    averageTimePerFile: 2000, // milliseconds
    memoryUsage: 'low',
    rateLimited: true
  },
  
  [SUPPORTED_ENGINES.TREE_SITTER]: {
    maxConcurrentFiles: 30,
    averageTimePerFile: 300,  // milliseconds
    memoryUsage: 'medium'
  },
  
  [SUPPORTED_ENGINES.UNIVERSAL_AST]: {
    maxConcurrentFiles: 25,
    averageTimePerFile: 400,  // milliseconds
    memoryUsage: 'medium'
  }
};

/**
 * Default engine selection strategy
 */
const DEFAULT_ENGINE_STRATEGY = {
  mode: ENGINE_MODES.HYBRID,
  primaryEngine: SUPPORTED_ENGINES.HEURISTIC,
  fallbackEngine: SUPPORTED_ENGINES.HEURISTIC,
  enableParallel: false,
  maxEngines: 2
};

/**
 * Get supported languages for an engine
 * @param {string} engineName - Name of the engine
 * @returns {Array<string>} Supported languages
 */
function getEngineLanguages(engineName) {
  const engine = ENGINE_CAPABILITIES[engineName];
  return engine ? engine.languages : [];
}

/**
 * Get engines that support a specific language
 * @param {string} language - Programming language
 * @returns {Array<string>} Engine names that support the language
 */
function getEnginesForLanguage(language) {
  const supportedEngines = [];
  
  for (const [engineName, capabilities] of Object.entries(ENGINE_CAPABILITIES)) {
    if (capabilities.languages.includes(language)) {
      supportedEngines.push({
        name: engineName,
        priority: capabilities.priority,
        features: capabilities.features
      });
    }
  }
  
  // Sort by priority (lower number = higher priority)
  return supportedEngines.sort((a, b) => a.priority - b.priority);
}

/**
 * Get recommended engine for a language
 * @param {string} language - Programming language
 * @returns {string} Recommended engine name
 */
function getRecommendedEngine(language) {
  const engines = getEnginesForLanguage(language);
  return engines.length > 0 ? engines[0].name : SUPPORTED_ENGINES.HEURISTIC;
}

/**
 * Check if engine supports a language
 * @param {string} engineName - Engine name
 * @param {string} language - Programming language
 * @returns {boolean} True if supported
 */
function isLanguageSupported(engineName, language) {
  const languages = getEngineLanguages(engineName);
  return languages.includes(language);
}

/**
 * Get engine performance configuration
 * @param {string} engineName - Engine name
 * @returns {Object} Performance configuration
 */
function getEnginePerformance(engineName) {
  return ENGINE_PERFORMANCE[engineName] || ENGINE_PERFORMANCE[SUPPORTED_ENGINES.HEURISTIC];
}

module.exports = {
  // Engine constants
  SUPPORTED_ENGINES,
  ENGINE_CAPABILITIES,
  ENGINE_MODES,
  ENGINE_PERFORMANCE,
  DEFAULT_ENGINE_STRATEGY,
  
  // Utility functions
  getEngineLanguages,
  getEnginesForLanguage,
  getRecommendedEngine,
  isLanguageSupported,
  getEnginePerformance
};
