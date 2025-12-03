const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const os = require('os');
const { minimatch } = require('minimatch');

// Rule C014: Dependency injection instead of direct instantiation
const ConfigSourceLoader = require('./config-source-loader');
const ConfigPresetResolver = require('./config-preset-resolver');
const ConfigMerger = require('./config-merger');
const ConfigValidator = require('./config-validator');
const ConfigOverrideProcessor = require('./config-override-processor');
const SunlintRuleAdapter = require('./adapters/sunlint-rule-adapter');

/**
 * Main configuration manager - orchestrates config loading process
 * Rule C005: Single responsibility - orchestrates other config services
 * Rule C015: Domain language - ConfigManager as main coordinator
 * Rule C014: Uses dependency injection for all services
 * REFACTORED: Now uses SunlintRuleAdapter instead of direct registry access
 */
class ConfigManager {
  constructor() {
    // Rule C014: Dependency injection
    this.sourceLoader = new ConfigSourceLoader();
    this.presetResolver = new ConfigPresetResolver();
    this.merger = new ConfigMerger();
    this.validator = new ConfigValidator();
    this.overrideProcessor = new ConfigOverrideProcessor();
    this.ruleAdapter = SunlintRuleAdapter.getInstance();
    this.initialized = false;
    
    this.defaultConfig = {
      rules: {},
      categories: {},
      
      // Enhanced language-specific configuration
      languages: {
        typescript: {
          include: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
          exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.spec.ts'],
          parser: 'typescript'
        },
        javascript: {
          include: ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
          exclude: ['**/*.min.js', '**/*.bundle.js'],
          parser: 'espree'
        },
        dart: {
          include: ['**/*.dart'],
          exclude: ['**/*.g.dart', '**/*.freezed.dart', '**/*.mocks.dart'],
          parser: 'dart'
        },
        kotlin: {
          include: ['**/*.kt', '**/*.kts'],
          exclude: ['**/build/**', '**/generated/**'],
          parser: 'kotlin'
        }
      },
      
      // Global file patterns (cross-language)
      include: [
        'src/**',
        'lib/**', 
        'app/**',
        'packages/**'
      ],
      
      exclude: [
        'node_modules/**',
        'dist/**',
        'build/**',
        'coverage/**',
        '.git/**',
        '**/*.min.*',
        '**/*.bundle.*',
        '**/generated/**',
        '**/*.generated.*',
        '.next/**',
        '.nuxt/**',
        'vendor/**'
      ],

      // Test file patterns with specific rules
      testPatterns: {
        include: ['**/*.test.*', '**/*.spec.*', '**/test/**', '**/tests/**', '**/__tests__/**'],
        rules: {
          'C006': 'off',  // Function naming less strict in tests
          'C019': 'warn'  // Log level still important in tests
        }
      },

      // Rule-specific overrides for different contexts
      overrides: [
        {
          files: ['**/*.d.ts'],
          rules: {
            'C006': 'off',
            'C007': 'off'
          }
        },
        {
          files: ['**/migrations/**', '**/seeds/**'],
          rules: {
            'C031': 'off'  // Validation separation not needed in migrations
          }
        },
        {
          files: ['**/config/**', '**/*.config.*'],
          rules: {
            'C006': 'warn',  // Config files may have different naming
            'C015': 'off'    // Domain language not strict in config
          }
        }
      ],

      env: {},
      parserOptions: {},
      // ESLint Integration Configuration
      eslintIntegration: {
        enabled: false,
        mergeRules: true,
        preserveUserConfig: true,
        runAfterSunLint: false
      },
      output: {
        format: 'eslint',
        console: true,
        summary: true
      },
      ai: {
        enabled: false,
        fallbackToPattern: true,
        provider: 'openai',
        model: 'gpt-4o-mini'
      },
      performance: {
        maxConcurrentRules: 5,
        timeoutMs: 30000,
        cacheEnabled: true,
        cacheLocation: '.sunlint-cache/'
      },
      reporting: {
        includeContext: true,
        showFixSuggestions: true,
        groupByFile: true,
        sortBy: 'severity',
        showProgress: true,
        exitOnError: false
      }
    };
  }

  /**
   * Rule C006: loadConfiguration - verb-noun naming
   * Rule C005: Single responsibility - orchestrates config loading
   * Rule C012: Command method - loads and returns config
   * REFACTORED: Now initializes rule adapter
   */
  async loadConfiguration(configPath, cliOptions = {}) {
    // Initialize rule adapter
    if (!this.initialized) {
      await this.ruleAdapter.initialize();
      this.initialized = true;
    }
    
    // 1. Start with built-in defaults
    let config = { ...this.defaultConfig };

    // 2. Environment variables
    config = this.merger.applyEnvironmentVariables(config);

    // 3. Global config (~/.sunlint.json)
    const globalConfig = this.sourceLoader.loadGlobalConfiguration(os.homedir(), cliOptions.verbose);
    if (globalConfig) {
      config = this.merger.mergeConfigurations(config, globalConfig.config);
    }

    // 4. Auto-discover project config if not explicitly provided
    let resolvedConfigPath = configPath;
    if (!configPath) {
      // Only auto-discover if no config path was provided
      const discoveredConfig = this.findConfigFile(cliOptions.input || process.cwd());
      if (discoveredConfig) {
        resolvedConfigPath = discoveredConfig;
        if (cliOptions.verbose) {
          console.log(chalk.gray(`🔍 Auto-discovered config: ${discoveredConfig}`));
        }
      }
    } else {
      // Use the explicitly provided config path
      if (cliOptions.verbose) {
        console.log(chalk.gray(`📄 Using explicit config: ${configPath}`));
      }
    }

    // 5. Load project config (explicit or discovered)
    let projectConfig = null;
    if (resolvedConfigPath && fs.existsSync(resolvedConfigPath)) {
      if (resolvedConfigPath.endsWith('package.json')) {
        // Load from package.json sunlint field
        const pkg = JSON.parse(fs.readFileSync(resolvedConfigPath, 'utf8'));
        if (pkg.sunlint) {
          projectConfig = { 
            config: pkg.sunlint, 
            path: resolvedConfigPath,
            dir: path.dirname(resolvedConfigPath)
          };
        }
      } else {
        // Load from dedicated config file
        projectConfig = this.sourceLoader.loadSpecificConfigFile(resolvedConfigPath, cliOptions.verbose);
      }
      
      if (projectConfig) {
        config = this.merger.mergeConfigurations(config, projectConfig.config);
        if (cliOptions.verbose) {
          console.log(chalk.gray(`📄 Loaded project config: ${projectConfig.path}`));
        }
      }
    }

    // 6. Load ignore patterns (.sunlintignore) and merge into exclude
    const ignorePatterns = this.sourceLoader.loadIgnorePatterns(
      projectConfig?.dir || process.cwd(), 
      cliOptions.verbose
    );
    if (ignorePatterns.length > 0) {
      config.exclude = [...new Set([...(config.exclude || []), ...ignorePatterns])];
    }
    
    // 7. Process any deprecated ignorePatterns in config
    config = this.merger.processIgnorePatterns(config);

    // 8. Apply CLI overrides (highest priority)
    config = this.merger.applyCLIOverrides(config, cliOptions);

    // 9. Resolve extends
    config = await this.resolveExtends(config);

    // 10. Validate config
    this.validator.validateConfiguration(config);

    // 11. Add metadata for enhanced file targeting
    const analysisScope = this.determineAnalysisScope(cliOptions.input);
    config._metadata = {
      analysisScope: analysisScope,
      shouldBypassProjectDiscovery: this.shouldBypassProjectDiscovery(analysisScope, cliOptions),
      targetInput: cliOptions.input,
      hasCliRules: this.hasRuleConfigInCLI(cliOptions)
    };

    if (cliOptions.verbose) {
      console.log(chalk.gray(`📋 Enhanced Config: Scope=${analysisScope}, Bypass=${config._metadata.shouldBypassProjectDiscovery}`));
    }

    return config;
  }

  mergeConfigs(base, override) {
    const merged = { ...base };

    for (const [key, value] of Object.entries(override)) {
      if (key === 'rules' && typeof value === 'object') {
        merged.rules = { ...merged.rules, ...value };
      } else if (key === 'categories' && typeof value === 'object') {
        merged.categories = { ...merged.categories, ...value };
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        merged[key] = { ...merged[key], ...value };
      } else {
        merged[key] = value;
      }
    }

    return merged;
  }

  applyCLIOverrides(config, options) {
    const overrides = { ...config };

    // Languages override
    if (options.languages) {
      overrides.languages = options.languages.split(',').map(l => l.trim());
    }

    // Output format override
    if (options.format) {
      overrides.output = { ...overrides.output, format: options.format };
    }

    // AI override
    if (options.ai === true) {
      overrides.ai = { ...overrides.ai, enabled: true };
    }
    if (options.ai === false) {
      overrides.ai = { ...overrides.ai, enabled: false };
    }

    // Performance overrides
    if (options.maxConcurrent) {
      overrides.performance = { 
        ...overrides.performance, 
        maxConcurrentRules: parseInt(options.maxConcurrent) 
      };
    }

    if (options.timeout) {
      overrides.performance = { 
        ...overrides.performance, 
        timeoutMs: parseInt(options.timeout) 
      };
    }

    // Cache override
    if (options.cache === false) {
      overrides.performance = { 
        ...overrides.performance, 
        cacheEnabled: false 
      };
    }

    return overrides;
  }

  /**
   * Rule C006: resolveExtends - verb-noun naming
   * Rule C005: Single responsibility - only handles extends resolution
   */
  async resolveExtends(config) {
    if (!config.extends) {
      return config;
    }

    const extends_ = Array.isArray(config.extends) ? config.extends : [config.extends];
    let resolvedConfig = { ...config };

    for (const extendPath of extends_) {
      try {
        // Check if it's a preset
        if (extendPath.startsWith('@sun/sunlint/')) {
          const presetConfig = await this.presetResolver.loadPresetConfiguration(extendPath);
          resolvedConfig = this.merger.mergeConfigurations(presetConfig, resolvedConfig);
        } else {
          const extendedConfig = await this.loadExtendedConfig(extendPath);
          resolvedConfig = this.merger.mergeConfigurations(extendedConfig, resolvedConfig);
        }
      } catch (error) {
        console.error(chalk.yellow(`⚠️  Failed to extend config '${extendPath}':`), error.message);
      }
    }

    // Remove extends to avoid circular references
    delete resolvedConfig.extends;

    return resolvedConfig;
  }

  /**
   * Rule C006: loadExtendedConfig - verb-noun naming
   * REFACTORED: Now loads presets directly instead of through registry
   */
  async loadExtendedConfig(extendPath) {
    if (extendPath.startsWith('@sun/sunlint/')) {
      // Load preset directly from preset file
      const presetName = extendPath.replace('@sun/sunlint/', '');
      const presetPath = path.join(__dirname, '../config/presets', `${presetName}.json`);
      if (fs.existsSync(presetPath)) {
        return JSON.parse(fs.readFileSync(presetPath, 'utf8'));
      } else {
        throw new Error(`Preset not found: ${extendPath}`);
      }
    } else {
      // Load from file path
      const configPath = path.resolve(extendPath);
      if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } else {
        throw new Error(`Config file not found: ${configPath}`);
      }
    }
  }

  /**
   * Rule C006: applyFileOverrides - verb-noun naming
   * Rule C014: Delegate to override processor
   */
  applyFileOverrides(config, filePath) {
    return this.overrideProcessor.applyFileOverrides(config, filePath);
  }

  /**
   * Rule C006: getEffectiveRuleConfiguration - verb-noun naming
   * Rule C014: Delegate to validator
   * REFACTORED: Now uses rule adapter for rule validation
   */
  getEffectiveRuleConfiguration(ruleId, config) {
    // Validate rule exists via adapter
    const rule = this.ruleAdapter.getRuleById(ruleId);
    if (!rule) {
      console.warn(`⚠️  Rule ${ruleId} not found in registry`);
      return null;
    }
    
    return this.validator.getEffectiveRuleConfiguration(ruleId, config, { rules: { [ruleId]: rule } });
  }

  /**
   * Rule C006: normalizeRuleValue - verb-noun naming
   * Rule C014: Delegate to validator
   */
  normalizeRuleValue(value) {
    return this.validator.normalizeRuleValue(value);
  }

  /**
   * Find configuration file using discovery hierarchy
   * Following Rule C005: Single responsibility - only handle config discovery
   * @param {string} startPath - Starting directory for config search
   * @returns {string|null} Path to config file or null if not found
   */
  findConfigFile(startPath = process.cwd()) {
    const configNames = [
      '.sunlint.json',
      '.sunlint.js', 
      'sunlint.config.js',
      'sunlint.config.json'
    ];
    
    let currentPath = path.resolve(startPath);
    
    // Traverse up directory tree
    while (currentPath !== path.dirname(currentPath)) {
      for (const configName of configNames) {
        const configPath = path.join(currentPath, configName);
        if (fs.existsSync(configPath)) {
          return configPath;
        }
      }
      currentPath = path.dirname(currentPath);
    }
    
    // Check for package.json with sunlint field
    const packageConfigPath = this.findPackageConfig(startPath);
    if (packageConfigPath) {
      return packageConfigPath;
    }
    
    return null;
  }

  /**
   * Find package.json with sunlint configuration
   * @param {string} startPath - Starting directory
   * @returns {string|null} Path to package.json or null
   */
  findPackageConfig(startPath = process.cwd()) {
    let currentPath = path.resolve(startPath);
    
    while (currentPath !== path.dirname(currentPath)) {
      const packagePath = path.join(currentPath, 'package.json');
      if (fs.existsSync(packagePath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
          if (pkg.sunlint) {
            return packagePath;
          }
        } catch (error) {
          // Continue searching if package.json is invalid
        }
      }
      currentPath = path.dirname(currentPath);
    }
    
    return null;
  }

  /**
   * Find project root directory (where package.json exists)
   * @param {string} startPath - Starting directory
   * @returns {string} Project root path or startPath if not found
   */
  findProjectRoot(startPath = process.cwd()) {
    let currentPath = path.resolve(startPath);
    
    while (currentPath !== path.dirname(currentPath)) {
      const packagePath = path.join(currentPath, 'package.json');
      if (fs.existsSync(packagePath)) {
        return currentPath;
      }
      currentPath = path.dirname(currentPath);
    }
    
    return startPath;
  }

  // Legacy method names for backward compatibility
  // Rule C006: Maintaining existing API while delegating to new services
  async loadConfig(configPath, cliOptions) {
    return this.loadConfiguration(configPath, cliOptions);
  }

  mergeConfigs(base, override) {
    return this.merger.mergeConfigurations(base, override);
  }

  applyCLIOverrides(config, options) {
    return this.merger.applyCLIOverrides(config, options);
  }

  applyOverrides(config, filePath) {
    return this.overrideProcessor.applyFileOverrides(config, filePath);
  }

  validateConfig(config) {
    return this.validator.validateConfiguration(config);
  }

  /**
   * ENHANCED CONFIG STRATEGY METHODS
   * ================================
   */

  /**
   * Determine if CLI has rule configuration
   */
  hasRuleConfigInCLI(cliOptions) {
    return !!(
      cliOptions.rule ||
      cliOptions.rules ||
      cliOptions.all ||
      cliOptions.quality ||
      cliOptions.security ||
      cliOptions.category
    );
  }

  /**
   * Determine analysis scope based on input
   */
  determineAnalysisScope(inputPath) {
    if (!inputPath) return 'project';
    
    const resolvedPath = path.resolve(inputPath);
    
    if (!fs.existsSync(resolvedPath)) {
      return 'project'; // Fallback for non-existent paths
    }
    
    const stat = fs.statSync(resolvedPath);
    
    if (stat.isFile()) {
      return 'file';
    } else if (stat.isDirectory()) {
      // More specific logic for directory scope
      const currentDir = process.cwd();
      
      // If input is current directory, it's project scope
      if (path.resolve(inputPath) === currentDir) {
        return 'project';
      }
      
      // If input is a project root (has project markers), it's project scope
      if (this.isProjectRoot(resolvedPath)) {
        return 'project';
      }
      
      // Otherwise it's folder scope
      return 'folder';
    }
    
    return 'project';
  }

  /**
   * Check if directory is a project root
   */
  isProjectRoot(dirPath) {
    const projectMarkers = [
      'package.json',
      'pubspec.yaml',
      'build.gradle',
      'build.gradle.kts',
      'pom.xml',
      'Cargo.toml',
      'go.mod',
      '.git',
      'tsconfig.json',
      'angular.json',
      'next.config.js',
      'nuxt.config.js'
    ];
    
    return projectMarkers.some(marker => 
      fs.existsSync(path.join(dirPath, marker))
    );
  }

  /**
   * Determine if project discovery should be bypassed for performance
   */
  shouldBypassProjectDiscovery(analysisScope, cliOptions) {
    // Single file input - always bypass
    if (analysisScope === 'file') {
      return true;
    }
    
    // Folder scope (not project root) and has CLI rules - target folder only
    if (analysisScope === 'folder' && this.hasRuleConfigInCLI(cliOptions)) {
      return true;
    }
    
    return false; // Use project-wide discovery
  }
}

module.exports = ConfigManager;
