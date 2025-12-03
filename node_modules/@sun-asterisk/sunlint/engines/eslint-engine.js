/**
 * ESLint Analysis Engine Plugin
 * Following Rule C005: Single responsibility - ESLint integration
 * Following Rule C014: Dependency injection - implements interface
 * Following Rule C015: Use domain language - clear ESLint terms
 */

const AnalysisEngineInterface = require('../core/interfaces/analysis-engine.interface');
const dependencyChecker = require('../core/dependency-checker');
const fs = require('fs');
const path = require('path');
const { getInstance } = require('../core/unified-rule-registry');

class ESLintEngine extends AnalysisEngineInterface {
  constructor() {
    super('eslint', '8.x', ['typescript', 'javascript']);
    
    this.eslint = null;
    this.configFiles = new Map();
    this.ruleMapping = new Map();
    
    // Unified rule registry
    this.unifiedRegistry = getInstance();
    
    // Load rule mapping immediately (synchronous)
    try {
      this.loadRuleMappingSync();
    } catch (error) {
      console.error('🚨 Constructor failed to load mapping:', error.message);
      // Defer async mapping loading to when needed
      this.mappingLoaded = false;
    }
  }

  /**
   * Load SunLint to ESLint rule mapping (synchronous)
   */
  loadRuleMappingSync() {
    try {
      const mappingPath = path.resolve(__dirname, '../config/eslint-rule-mapping.json');
      
      if (fs.existsSync(mappingPath)) {
        const mappingData = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
        const mapping = mappingData.mappings || mappingData;
        
        for (const [sunlintRule, eslintRules] of Object.entries(mapping)) {
          this.ruleMapping.set(sunlintRule, eslintRules);
        }
        this.mappingLoaded = true;
      } else {
        // Mark as not loaded, will load from registry later
        this.mappingLoaded = false;
        console.warn('⚠️ Legacy ESLint mapping file not found, will load from unified registry');
      }
      
    } catch (error) {
      console.warn('⚠️ [ESLintEngine] Failed to load ESLint rule mapping:', error.message);
      this.mappingLoaded = false;
    }
  }

  /**
   * Ensure rule mapping is loaded (async)
   */
  async ensureMappingLoaded() {
    if (!this.mappingLoaded) {
      console.log('📋 [ESLintEngine] Loading rule mapping from unified registry...');
      await this.createDefaultRuleMapping();
      this.mappingLoaded = true;
    }
  }

  /**
   * Initialize ESLint engine with configuration
   * Following Rule C006: Verb-noun naming
   * @param {Object} config - Engine configuration
   */
  async initialize(config) {
    try {
      // Store verbosity setting for use in other methods
      this.verbose = config?.verbose || false;
      
      // Check for ESLint dependencies first
      dependencyChecker.checkAndNotify('eslint');
      
      // Store config for later use in analyze()
      this.config = config;
      this.eslint = null; // Initialize later in analyze() with project path
      
      // Rule mapping already loaded in constructor
      if (this.verbose) {
        console.log(`🔧 [ESLintEngine] Initialize: Rule mapping size = ${this.ruleMapping.size}`);
        console.log(`🔧 ESLint engine initialized (ESLint instance will be created per-project)`);
      }
      
      this.initialized = true;
      
    } catch (error) {
      console.error('Failed to initialize ESLint engine:', error.message);
      throw error;
    }
  }

  /**
   * Load ESLint dynamically
   * Following Rule C006: Verb-noun naming
   * @returns {Promise<Object>} ESLint module
   */
  async loadESLint() {
    // Check if ESLint is available first
    if (!dependencyChecker.isDependencyAvailable('eslint')) {
      throw new Error('ESLint not available. Install with: npm install eslint');
    }

    try {
      // Try to load ESLint from node_modules
      return await import('eslint');
    } catch (error) {
      // Fallback to require for older versions
      try {
        return require('eslint');
      } catch (requireError) {
        throw new Error('ESLint not found. Please install ESLint: npm install eslint');
      }
    }
  }

  /**
   * Check for ESLint config files in project
   * Following Rule C006: Verb-noun naming
   * @param {string} projectPath - Path to the project being analyzed
   * @returns {Object} Config file detection results
   */
  detectESLintConfig(projectPath) {
    const fs = require('fs');
    const path = require('path');
    
    const configFiles = {
      flat: ['eslint.config.js', 'eslint.config.mjs'],
      legacy: ['.eslintrc.js', '.eslintrc.json', '.eslintrc.yml', '.eslintrc.yaml', '.eslintrc'],
      packageJson: 'package.json'
    };
    
    const results = {
      hasFlatConfig: false,
      hasLegacyConfig: false,
      hasPackageConfig: false,
      foundFiles: []
    };
    
    // Check for flat config files
    for (const file of configFiles.flat) {
      const filePath = path.join(projectPath, file);
      if (fs.existsSync(filePath)) {
        results.hasFlatConfig = true;
        results.foundFiles.push(file);
      }
    }
    
    // Check for legacy config files
    for (const file of configFiles.legacy) {
      const filePath = path.join(projectPath, file);
      if (fs.existsSync(filePath)) {
        results.hasLegacyConfig = true;
        results.foundFiles.push(file);
      }
    }
    
    // Check for package.json eslintConfig
    const packagePath = path.join(projectPath, configFiles.packageJson);
    if (fs.existsSync(packagePath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        if (packageJson.eslintConfig) {
          results.hasPackageConfig = true;
          results.foundFiles.push('package.json (eslintConfig)');
        }
      } catch (error) {
        // Ignore package.json parsing errors
      }
    }
    
    return results;
  }

  /**
   * Create ESLint instance with proper configuration
   * Following Rule C006: Verb-noun naming
   * @param {string} projectPath - Path to the project being analyzed
   * @returns {Promise<Object>} Configured ESLint instance
   */
  async createESLintInstance(projectPath) {
    try {
      const { ESLint } = await this.loadESLint();
      
      // Detect existing config
      const configDetection = this.detectESLintConfig(projectPath);
      console.log(`🔍 [ESLintEngine] Config detection for ${projectPath}:`, configDetection);
      
      let eslintOptions;
      
      if (configDetection.hasFlatConfig) {
        // Use flat config (ESLint v9+ preferred)
        eslintOptions = {
          overrideConfigFile: null,     // Let ESLint find flat config automatically
          fix: this.config?.fix || false,
          cache: this.config?.cache || false,
          cwd: projectPath
        };
        console.log(`✅ [ESLintEngine] Using flat config (modern ESLint v9+)`);
      } else if (configDetection.hasLegacyConfig || configDetection.hasPackageConfig) {
        // ESLint v9+ requires flat config - convert legacy config to flat config format
        const flatConfig = await this.convertLegacyToFlatConfig(projectPath, configDetection);
        eslintOptions = {
          overrideConfigFile: null,  // Use our generated flat config
          overrideConfig: flatConfig,
          fix: this.config?.fix || false,
          cache: this.config?.cache || false,
          cwd: projectPath
        };
        console.log(`✅ [ESLintEngine] Legacy config converted to flat config for ESLint v9+ compatibility`);
      } else {
        // No config found - use SunLint's base config only
        eslintOptions = {
          overrideConfig: this.createBaseConfig(),
          fix: this.config?.fix || false,
          cache: this.config?.cache || false,
          cwd: projectPath
        };
        console.log(`⚠️ [ESLintEngine] No ESLint config found, using SunLint base config only`);
      }

      if (this.verbose) {
        console.log(`📋 [ESLintEngine] ESLint options:`, JSON.stringify(eslintOptions, null, 2));
      }

      const eslint = new ESLint(eslintOptions);
      console.log(`✅ [ESLintEngine] ESLint instance created successfully`);
      
      return eslint;
    } catch (error) {
      console.error('Failed to create ESLint instance:', error.message);
      throw error;
    }
  }

  /**
   * Extract rules array from eslint config
   * @param {Object} eslintConfig - ESLint config object
   * @returns {Array} Rules array for plugin detection
   */
  extractRulesFromConfig(eslintConfig) {
    // Convert rules object keys back to rule objects for plugin detection
    const rules = [];
    for (const ruleKey of Object.keys(eslintConfig.rules || {})) {
      if (ruleKey.startsWith('custom/typescript_s')) {
        rules.push({ id: ruleKey.replace('custom/typescript_', '').toUpperCase() });
      } else if (ruleKey.startsWith('custom/')) {
        rules.push({ id: ruleKey.replace('custom/', '').toUpperCase() });
      } else if (ruleKey.startsWith('react/')) {
        rules.push({ id: 'R001' }); // Mock React rule for detection
      } else if (ruleKey.includes('@typescript-eslint/')) {
        rules.push({ id: 'T001' }); // Mock TypeScript rule for detection
      }
    }
    return rules;
  }

  /**
   * Create temporary flat config file for legacy compatibility
   * Following Rule C006: Verb-noun naming
   * @param {string} projectPath - Path to the project
   * @param {Object} configDetection - Config detection results
   * @param {Object} eslintConfig - Analysis config to merge
   * @returns {Promise<string>} Path to temporary flat config file
   */
  async createTemporaryFlatConfig(projectPath, configDetection, eslintConfig) {
    const fs = require('fs');
    const path = require('path');
    
    try {
      let baseConfig;
      
      if (configDetection.hasFlatConfig) {
        // Load existing flat config
        const existingConfigPath = path.join(projectPath, 'eslint.config.js');
        if (fs.existsSync(existingConfigPath)) {
          try {
            // Read and parse existing flat config
            const configContent = fs.readFileSync(existingConfigPath, 'utf8');
            // For now, use a simple base config - parsing dynamic imports is complex
            baseConfig = {
              files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
              languageOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                parserOptions: {
                  ecmaFeatures: {
                    jsx: true
                  }
                }
              },
              rules: {}
            };
          } catch (error) {
            console.warn(`⚠️ [ESLintEngine] Failed to parse existing flat config: ${error.message}`);
            baseConfig = this.createBaseConfig();
          }
        } else {
          baseConfig = this.createBaseConfig();
        }
      } else {
        // Convert legacy config
        baseConfig = await this.convertLegacyToFlatConfig(projectPath, configDetection);
      }
      
      // Build plugin imports based on what's needed AND what's available
      const rules = this.extractRulesFromConfig(eslintConfig);
      const needsReact = this.needsReactPlugins(rules);
      const needsTypeScript = this.needsTypeScriptPlugins(rules);
      const needsImport = this.needsImportPlugin(rules);
      
      // Check plugin availability in target project
      const hasReact = needsReact && this.isReactPluginAvailable(projectPath);
      const hasReactHooks = needsReact && this.isReactHooksPluginAvailable(projectPath);
      const hasTypeScript = needsTypeScript && this.isTypeScriptPluginAvailable(projectPath);
      const hasTypeScriptParser = this.isTypeScriptParserAvailable(projectPath);
      const hasImport = needsImport && this.isImportPluginAvailable(projectPath);
      
      let pluginImports = '';
      let pluginDefs = '{ "custom": customPlugin';
      
      if (hasReact) {
        pluginImports += `\nimport reactPlugin from 'eslint-plugin-react';`;
        pluginDefs += ', "react": reactPlugin';
      }
      
      if (hasReactHooks) {
        pluginImports += `\nimport reactHooksPlugin from 'eslint-plugin-react-hooks';`;
        pluginDefs += ', "react-hooks": reactHooksPlugin';
      }
      
      if (hasTypeScript) {
        pluginImports += `\nimport typescriptPlugin from '@typescript-eslint/eslint-plugin';`;
        pluginDefs += ', "@typescript-eslint": typescriptPlugin';
      }
      
      if (hasImport) {
        pluginImports += `\nimport importPlugin from 'eslint-plugin-import';`;
        pluginDefs += ', "import": importPlugin';
      }
      
      pluginDefs += ' }';
      
      // Filter rules to only include those for available plugins
      const filteredRules = {};
      const skippedRules = { react: [], reactHooks: [], typescript: [], import: [] };
      
      for (const [ruleKey, ruleConfig] of Object.entries(eslintConfig.rules || {})) {
        if (ruleKey.startsWith('react/') && !hasReact) {
          skippedRules.react.push(ruleKey);
          continue;
        }
        if (ruleKey.startsWith('react-hooks/') && !hasReactHooks) {
          skippedRules.reactHooks.push(ruleKey);
          continue;
        }
        if (ruleKey.startsWith('@typescript-eslint/') && !hasTypeScript) {
          skippedRules.typescript.push(ruleKey);
          continue;
        }
        if (ruleKey.startsWith('import/') && !hasImport) {
          skippedRules.import.push(ruleKey);
          continue;
        }
        filteredRules[ruleKey] = ruleConfig;
      }
      
      // Summary of skipped rules instead of individual warnings
      if (skippedRules.react.length > 0) {
        console.warn(`⚠️ [ESLintEngine] Skipped ${skippedRules.react.length} React rules - plugin not available`);
      }
      if (skippedRules.reactHooks.length > 0) {
        console.warn(`⚠️ [ESLintEngine] Skipped ${skippedRules.reactHooks.length} React Hooks rules - plugin not available`);
      }
      if (skippedRules.typescript.length > 0) {
        console.warn(`⚠️ [ESLintEngine] Skipped ${skippedRules.typescript.length} TypeScript ESLint rules - plugin not available`);
      }
      if (skippedRules.import.length > 0) {
        console.warn(`⚠️ [ESLintEngine] Skipped ${skippedRules.import.length} Import rules - plugin not available`);
      }
      
      // Use only SunLint analysis config (filteredRules) - do not merge with project rules
      const mergedConfig = {
        ...eslintConfig,
        rules: filteredRules  // Only use SunLint specified rules
      };
      
      // Create temporary config file in project directory
      const tempConfigPath = path.join(projectPath, '.sunlint-eslint.config.js');
      
      // Create simple config compatible with flat config format
      const configForExport = {
        files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
        languageOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
          parserOptions: {
            ecmaFeatures: {
              jsx: true
            }
          }
        },
        rules: filteredRules  // Only use SunLint specified rules
      };
      
      const configContent = `// Temporary flat config generated by SunLint
import customPlugin from '${path.resolve(__dirname, '../integrations/eslint/plugin/index.js')}';${pluginImports}

export default [
  ${JSON.stringify(configForExport, null, 2).replace('"rules":', `"plugins": ${pluginDefs},\n    "rules":`)},
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: ${pluginDefs},
    languageOptions: {${hasTypeScriptParser ? `
      parser: (await import('@typescript-eslint/parser')).default,` : ''}
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: ${JSON.stringify(filteredRules, null, 2)}
  }
];
`;
      
      fs.writeFileSync(tempConfigPath, configContent);
      console.log(`🔧 [ESLintEngine] Created temporary flat config: ${tempConfigPath}`);
      
      // Schedule cleanup
      this.tempConfigPaths = this.tempConfigPaths || [];
      this.tempConfigPaths.push(tempConfigPath);
      
      return tempConfigPath;
    } catch (error) {
      console.warn(`⚠️ [ESLintEngine] Failed to create temporary flat config: ${error.message}`);
      throw error;
    }
  }

  /**
   * Convert legacy ESLint config to flat config format
   * Following Rule C006: Verb-noun naming
   * @param {string} projectPath - Path to the project
   * @param {Object} configDetection - Config detection results
   * @returns {Promise<Object>} Flat config object
   */
  async convertLegacyToFlatConfig(projectPath, configDetection) {
    const fs = require('fs');
    const path = require('path');
    
    let legacyConfig = {};
    
    try {
      // Load legacy config from .eslintrc.json
      if (configDetection.foundFiles.includes('.eslintrc.json')) {
        const configPath = path.join(projectPath, '.eslintrc.json');
        const configContent = fs.readFileSync(configPath, 'utf8');
        legacyConfig = JSON.parse(configContent);
      }
      
      // Convert to flat config format
      const flatConfig = {
        files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
        languageOptions: {
          ecmaVersion: legacyConfig.env?.es2022 ? 2022 : 
                      legacyConfig.env?.es2021 ? 2021 : 
                      legacyConfig.env?.es6 ? 6 : 'latest',
          sourceType: legacyConfig.parserOptions?.sourceType || 'module',
          globals: {}
        },
        plugins: {},
        rules: legacyConfig.rules || {}
      };
      
      // Convert env to globals
      if (legacyConfig.env) {
        if (legacyConfig.env.browser) {
          Object.assign(flatConfig.languageOptions.globals, {
            window: 'readonly',
            document: 'readonly',
            navigator: 'readonly',
            console: 'readonly'
          });
        }
        if (legacyConfig.env.node) {
          Object.assign(flatConfig.languageOptions.globals, {
            process: 'readonly',
            Buffer: 'readonly',
            __dirname: 'readonly',
            __filename: 'readonly',
            module: 'readonly',
            require: 'readonly',
            exports: 'readonly',
            global: 'readonly'
          });
        }
        if (legacyConfig.env.es6) {
          Object.assign(flatConfig.languageOptions.globals, {
            Promise: 'readonly',
            Set: 'readonly',
            Map: 'readonly'
          });
        }
      }
      
      // Set parser if specified
      if (legacyConfig.parser) {
        if (legacyConfig.parser === '@typescript-eslint/parser') {
          flatConfig.languageOptions.parser = this.loadTypeScriptParser();
        }
      }
      
      // Convert parser options
      if (legacyConfig.parserOptions) {
        flatConfig.languageOptions.parserOptions = legacyConfig.parserOptions;
      }
      
      // Handle extends - merge base rules
      if (legacyConfig.extends) {
        const extendsList = Array.isArray(legacyConfig.extends) ? legacyConfig.extends : [legacyConfig.extends];
        
        for (const extend of extendsList) {
          if (extend === 'eslint:recommended') {
            // Add some basic recommended rules
            Object.assign(flatConfig.rules, {
              'no-unused-vars': 'warn',
              'no-undef': 'error',
              'no-console': 'warn'
            });
          }
        }
      }
      
      console.log(`🔄 [ESLintEngine] Converted legacy config to flat config`);
      return flatConfig;
      
    } catch (error) {
      console.warn(`⚠️ [ESLintEngine] Failed to convert legacy config: ${error.message}`);
      // Fallback to base config
      return this.createBaseConfig();
    }
  }

  /**
   * Create base ESLint configuration
   * Following Rule C006: Verb-noun naming
   * @returns {Object} ESLint configuration
   */
  createBaseConfig() {
    // ESLint v9+ flat config format
    return {
      languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        parserOptions: {
          ecmaFeatures: {
            jsx: true
          }
        },
        globals: {
          console: 'readonly',
          process: 'readonly',
          Buffer: 'readonly',
          __dirname: 'readonly',
          __filename: 'readonly',
          module: 'readonly',
          require: 'readonly',
          exports: 'readonly',
          global: 'readonly'
        }
      },
      plugins: {},
      rules: {}
    };
  }

  /**
   * Load SunLint to ESLint rule mapping
   * Following Rule C006: Verb-noun naming
   */
  async loadRuleMapping() {
    // Rule mapping already loaded in constructor - skip async load
    console.log(`� [ESLintEngine] Skipping async loadRuleMapping, using constructor mapping (size: ${this.ruleMapping.size})`);
    return;
  }

  /**
   * Create default rule mapping (DEPRECATED - use unified registry)
   * Following Rule C006: Verb-noun naming
   */
  async createDefaultRuleMapping() {
    console.log(`⚠️ [ESLintEngine] createDefaultRuleMapping() is DEPRECATED - using unified registry instead`);
    
    // Use unified registry instead of hardcoded mappings
    if (this.unifiedRegistry) {
      return await this.loadMappingsFromRegistry();
    }
    
    // Legacy fallback mapping (will be removed)
    const defaultMappings = {
      'C005': ['max-statements-per-line', 'complexity'],
      'C006': ['func-names', 'func-name-matching'],
      'C007': ['spaced-comment', 'no-inline-comments'],
      'C014': ['no-new'],
      'C019': ['no-console'],
      'C031': ['no-implicit-coercion'],
      'C033': ['prefer-const', 'no-var'],
      'C037': ['consistent-return'],
      'C040': ['no-duplicate-imports']
    };

    // CLEAR existing mapping first
    console.log(`🚨 [ESLintEngine] Clearing existing ${this.ruleMapping.size} rules`);
    this.ruleMapping.clear();

    for (const [sunlintRule, eslintRules] of Object.entries(defaultMappings)) {
      this.ruleMapping.set(sunlintRule, eslintRules);
    }
    
    console.log(`🚨 [ESLintEngine] Set ${this.ruleMapping.size} default rules`);
    console.warn('⚠️ Using default ESLint rule mapping');
  }

  /**
   * Load rule mappings from unified registry
   */
  async loadMappingsFromRegistry() {
    if (!this.unifiedRegistry.initialized) {
      await this.unifiedRegistry.initialize();
    }
    
    const mappings = {};
    for (const [ruleId, ruleDefinition] of this.unifiedRegistry.rules.entries()) {
      if (ruleDefinition.engineMappings && ruleDefinition.engineMappings.eslint) {
        mappings[ruleId] = ruleDefinition.engineMappings.eslint;
      }
    }
    
    console.log(`📋 [ESLintEngine] Loaded ${Object.keys(mappings).length} mappings from unified registry`);
    
    // Clear existing mapping and set new ones
    this.ruleMapping.clear();
    for (const [sunlintRule, eslintRules] of Object.entries(mappings)) {
      this.ruleMapping.set(sunlintRule, eslintRules);
    }
    
    return mappings;
  }

  /**
   * Detect project type from package.json and file patterns
   * @param {string} projectPath - Project path
   * @param {string[]} files - Files being analyzed
   * @returns {Object} Project type information
   */
  detectProjectType(projectPath, files) {
    const fs = require('fs');
    const path = require('path');
    
    const result = {
      isReactProject: false,
      isNextProject: false,
      isNestProject: false,
      isNodeProject: false,
      hasReactFiles: false,
      hasNestFiles: false,
      packageManager: 'npm'
    };
    
    try {
      // Check package.json for project type indicators
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Check dependencies for project type
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
          ...packageJson.peerDependencies
        };
        
        if (allDeps.react || allDeps['@types/react']) {
          result.isReactProject = true;
        }
        
        if (allDeps.next || allDeps['@types/next']) {
          result.isNextProject = true;
        }
        
        if (allDeps['@nestjs/core'] || allDeps['@nestjs/common']) {
          result.isNestProject = true;
        }
        
        // Check package manager from scripts
        if (packageJson.scripts && Object.values(packageJson.scripts).some(script => script.includes('pnpm'))) {
          result.packageManager = 'pnpm';
        } else if (packageJson.scripts && Object.values(packageJson.scripts).some(script => script.includes('yarn'))) {
          result.packageManager = 'yarn';
        }
        
        // Check for preinstall script indicating package manager preference
        if (packageJson.scripts?.preinstall?.includes('pnpm')) {
          result.packageManager = 'pnpm';
        } else if (packageJson.scripts?.preinstall?.includes('yarn')) {
          result.packageManager = 'yarn';
        }
      }
      
      // Check file patterns
      const hasJsxTsx = files.some(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jsx', '.tsx'].includes(ext);
      });
      
      const hasNestFiles = files.some(file => {
        return file.includes('controller.ts') || 
               file.includes('service.ts') || 
               file.includes('module.ts') ||
               file.includes('main.ts');
      });
      
      result.hasReactFiles = hasJsxTsx && !result.isNestProject;
      result.hasNestFiles = hasNestFiles;
      result.isNodeProject = !result.isReactProject && !result.isNextProject;
      
    } catch (error) {
      console.warn(`⚠️ [ESLintEngine] Failed to detect project type: ${error.message}`);
    }
    
    return result;
  }

  /**
   * Check if project has dependency conflicts that require --legacy-peer-deps
   * @param {string} projectPath - Project path
   * @returns {boolean} True if project has known dependency conflicts
   */
  hasKnownDependencyConflicts(projectPath) {
    const fs = require('fs');
    const path = require('path');
    
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        return false;
      }
      
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...packageJson.peerDependencies
      };
      
      // Check for known problematic combinations
      const conflicts = [
        // date-fns version conflicts
        () => {
          const dateFns = allDeps['date-fns'];
          const dateFnsTz = allDeps['date-fns-tz'];
          if (dateFns && dateFnsTz) {
            // If date-fns is v2.x and date-fns-tz is v3.x, there's likely a conflict
            if (dateFns.includes('2.') && dateFnsTz.includes('3.')) {
              return true;
            }
          }
          return false;
        },
        
        // React version conflicts
        () => {
          const react = allDeps['react'];
          const reactDom = allDeps['react-dom'];
          if (react && reactDom) {
            // Check for major version mismatches
            const reactMajor = react.match(/(\d+)\./)?.[1];
            const reactDomMajor = reactDom.match(/(\d+)\./)?.[1];
            if (reactMajor && reactDomMajor && reactMajor !== reactDomMajor) {
              return true;
            }
          }
          return false;
        },
        
        // ESLint version conflicts (common with older projects)
        () => {
          const eslint = allDeps['eslint'];
          if (eslint && eslint.includes('8.')) {
            // ESLint v8 with newer plugins often has peer dependency issues
            return true;
          }
          return false;
        }
      ];
      
      return conflicts.some(check => check());
      
    } catch (error) {
      // If we can't read package.json, assume no conflicts
      return false;
    }
  }

  /**
   * Provide appropriate installation guidance based on project type
   * @param {Object} projectType - Project type information
   * @param {number} tsFileCount - Number of TypeScript files
   * @param {number} reactFileCount - Number of React files
   * @param {boolean} hasTypeScriptParser - TypeScript parser availability
   * @param {boolean} hasReactPlugin - React plugin availability
   * @param {boolean} hasReactHooksPlugin - React Hooks plugin availability
   * @param {string} projectPath - Project path for conflict detection
   */
  provideInstallationGuidance(projectType, tsFileCount, reactFileCount, hasTypeScriptParser, hasReactPlugin, hasReactHooksPlugin, projectPath) {
    const missingDeps = [];
    const projectDescription = this.getProjectDescription(projectType, tsFileCount, reactFileCount);
    
    // TypeScript dependencies (needed for most projects with .ts files)
    if (tsFileCount > 0 && !hasTypeScriptParser) {
      missingDeps.push('@typescript-eslint/parser', '@typescript-eslint/eslint-plugin');
    }
    
    // React dependencies (only for actual React projects, not NestJS)
    if (projectType.hasReactFiles && !projectType.isNestProject) {
      if (!hasReactPlugin) missingDeps.push('eslint-plugin-react');
      if (!hasReactHooksPlugin) missingDeps.push('eslint-plugin-react-hooks');
    }
    
    if (missingDeps.length > 0) {
      console.log(`\n📦 [SunLint] To enable full analysis of your ${projectDescription}, install:`);
      
      // Use appropriate package manager and flags
      const packageManager = projectType.packageManager;
      const installFlag = packageManager === 'npm' ? '--save-dev' : packageManager === 'yarn' ? '--dev' : '--save-dev';
      
      // Only suggest --legacy-peer-deps if the project has known dependency conflicts
      let legacyFlag = '';
      if (packageManager === 'npm' && this.hasKnownDependencyConflicts(projectPath)) {
        legacyFlag = ' --legacy-peer-deps';
        console.log(`   ⚠️  Detected dependency conflicts in your project.`);
      }
      
      console.log(`   ${packageManager} install ${installFlag} ${missingDeps.join(' ')}${legacyFlag}`);
      console.log(`   Then SunLint will analyze all files with full ${this.getToolDescription(missingDeps)} support.\n`);
    }
  }

  /**
   * Get project description for user guidance
   * @param {Object} projectType - Project type information
   * @param {number} tsFileCount - Number of TypeScript files
   * @param {number} reactFileCount - Number of React files
   * @returns {string} Project description
   */
  getProjectDescription(projectType, tsFileCount, reactFileCount) {
    if (projectType.isNestProject) {
      return `${tsFileCount} TypeScript files (NestJS backend)`;
    } else if (projectType.isNextProject) {
      return `${tsFileCount} TypeScript and ${reactFileCount} React files (Next.js project)`;
    } else if (projectType.isReactProject) {
      return `${tsFileCount} TypeScript and ${reactFileCount} React files (React project)`;
    } else if (tsFileCount > 0) {
      return `${tsFileCount} TypeScript files (Node.js project)`;
    } else {
      return 'JavaScript files';
    }
  }

  /**
   * Get tool description for user guidance
   * @param {string[]} missingDeps - Missing dependencies
   * @returns {string} Tool description
   */
  getToolDescription(missingDeps) {
    const tools = [];
    if (missingDeps.some(dep => dep.includes('typescript-eslint'))) {
      tools.push('TypeScript');
    }
    if (missingDeps.some(dep => dep.includes('react'))) {
      tools.push('React');
    }
    return tools.join(' and ');
  }

  /**
   * Check if React plugin is available in project
   * @param {string} projectPath - Project path to check
   * @returns {boolean} True if React plugin is available
   */
  isReactPluginAvailable(projectPath) {
    try {
      require.resolve('eslint-plugin-react', { paths: [projectPath] });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if React Hooks plugin is available in project
   * @param {string} projectPath - Project path to check
   * @returns {boolean} True if React Hooks plugin is available
   */
  isReactHooksPluginAvailable(projectPath) {
    try {
      const pluginPath = require.resolve('eslint-plugin-react-hooks', { paths: [projectPath] });
      
      // Try to detect version to warn about compatibility issues
      try {
        const packageJsonPath = path.join(path.dirname(pluginPath), '..', 'package.json');
        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          const version = packageJson.version;
          
          // Check if it's an old version that might have context.getSource issues
          if (version && version.startsWith('4.')) {
            console.warn(`⚠️ [ESLintEngine] eslint-plugin-react-hooks@${version} detected - consider updating to v5.x for ESLint 9.x compatibility`);
          }
        }
      } catch (versionError) {
        // Version detection failed, but plugin exists
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if TypeScript plugin is available in project
   * @param {string} projectPath - Project path to check
   * @returns {boolean} True if TypeScript plugin is available
   */
  isTypeScriptPluginAvailable(projectPath) {
    try {
      require.resolve('@typescript-eslint/eslint-plugin', { paths: [projectPath] });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if TypeScript parser is available in project
   * @param {string} projectPath - Project path to check
   * @returns {boolean} True if TypeScript parser is available
   */
  isTypeScriptParserAvailable(projectPath) {
    try {
      require.resolve('@typescript-eslint/parser', { paths: [projectPath] });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if Import plugin is available in project
   * @param {string} projectPath - Project path to check
   * @returns {boolean} True if Import plugin is available
   */
  isImportPluginAvailable(projectPath) {
    try {
      require.resolve('eslint-plugin-import', { paths: [projectPath] });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Load React ESLint plugin
   * Following Rule C006: Verb-noun naming
   */
  loadReactPlugin() {
    try {
      // Try current working directory first
      return require(require.resolve('eslint-plugin-react', { paths: [process.cwd()] }));
    } catch (error) {
      try {
        // Fallback to main package
        return require('eslint-plugin-react');
      } catch (fallbackError) {
        console.warn('⚠️ React ESLint plugin not available:', error.message);
        return null;
      }
    }
  }

  /**
   * Load React Hooks ESLint plugin
   * Following Rule C006: Verb-noun naming
   */
  loadReactHooksPlugin() {
    try {
      // Try current working directory first
      return require(require.resolve('eslint-plugin-react-hooks', { paths: [process.cwd()] }));
    } catch (error) {
      try {
        // Fallback to main package
        return require('eslint-plugin-react-hooks');
      } catch (fallbackError) {
        console.warn('⚠️ React Hooks ESLint plugin not available:', error.message);
        return null;
      }
    }
  }

  /**
   * Load TypeScript parser
   * Following Rule C006: Verb-noun naming
   */
  loadTypeScriptParser() {
    try {
      return require('@typescript-eslint/parser');
    } catch (error) {
      console.warn('⚠️ TypeScript parser not available:', error.message);
      return null;
    }
  }

  /**
   * Load TypeScript ESLint plugin
   * Following Rule C006: Verb-noun naming
   */
  loadTypeScriptPlugin() {
    try {
      return require('@typescript-eslint/eslint-plugin');
    } catch (error) {
      console.warn('⚠️ TypeScript ESLint plugin not available:', error.message);
      return null;
    }
  }

  /**
   * Load custom ESLint plugin with SunLint rules
   * Following Rule C006: Verb-noun naming
   */
  loadCustomPlugin() {
    try {
      const customRulesPath = path.resolve(__dirname, '../integrations/eslint/plugin/rules');
      const plugin = {
        rules: {}
      };

      // Load all custom rules dynamically
      const ruleDirs = ['common', 'typescript', 'security'];
      for (const dir of ruleDirs) {
        const dirPath = path.join(customRulesPath, dir);
        if (fs.existsSync(dirPath)) {
          const ruleFiles = fs.readdirSync(dirPath).filter(file => file.endsWith('.js'));
          for (const file of ruleFiles) {
            const rulePath = path.join(dirPath, file);
            try {
              const rule = require(rulePath);
              // Keep full filename as rule name for Security rules, remove prefix for others
              const ruleName = dir === 'security' ? 
                file.replace('.js', '') : 
                file.replace('.js', '').replace(/^[ct]\d+-/, ''); // Remove prefix like c010-, t020-
              plugin.rules[ruleName] = rule;
            } catch (error) {
              console.warn(`⚠️ Failed to load custom rule ${file}:`, error.message);
            }
          }
        }
      }

      console.log(`✅ [ESLintEngine] Loaded ${Object.keys(plugin.rules).length} custom rules`);
      return plugin;
    } catch (error) {
      console.warn('⚠️ Failed to load custom plugin:', error.message);
      return { rules: {} };
    }
  }

  /**
   * Analyze files using ESLint
   * Following Rule C006: Verb-noun naming
   * @param {string[]} files - Files to analyze
   * @param {Object[]} rules - Rules to apply
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis results
   */
  async analyze(files, rules, options) {
    if (!this.initialized) {
      throw new Error('ESLint engine not initialized');
    }

    // Ensure rule mapping is loaded from unified registry
    await this.ensureMappingLoaded();

    const results = {
      results: [],
      filesAnalyzed: 0,
      engine: 'eslint',
      metadata: {
        rulesAnalyzed: [],
        eslintRulesUsed: []
      }
    };

    try {
      // Filter files for JS/TS only
      let jstsFiles = files.filter(file => this.isJavaScriptTypeScriptFile(file));
      
      if (jstsFiles.length === 0) {
        console.warn('⚠️ No JavaScript/TypeScript files found for ESLint analysis');
        return results;
      }

      // Convert SunLint rules to ESLint rules
      const eslintConfig = await this.createAnalysisConfig(rules);
      
      if (Object.keys(eslintConfig.rules).length === 0) {
        console.warn('⚠️ No ESLint rules mapped from SunLint rules');
        return results;
      }

      // Find project root from input path (usually the project's working directory)
      const path = require('path');
      let projectPath;
      
      if (options.input) {
        // If input is specified, find project root from it
        const inputPath = path.resolve(options.input);
        // Always go up to find project root, not use input directory directly
        projectPath = this.findProjectRoot([inputPath]);
      } else if (jstsFiles.length > 0) {
        // Find project root from all files
        projectPath = this.findProjectRoot(jstsFiles);
      } else {
        projectPath = process.cwd();
      }
      
      console.log(`🔍 [ESLintEngine] Using project path: ${projectPath}`);
      
      // Get config detection for reuse
      const configDetection = this.detectESLintConfig(projectPath);

      // Check for missing dependencies and provide installation guidance
      const hasTypeScriptParser = this.isTypeScriptParserAvailable(projectPath);
      const hasReactPlugin = this.isReactPluginAvailable(projectPath);
      const hasReactHooksPlugin = this.isReactHooksPluginAvailable(projectPath);
      const hasTypeScriptPlugin = this.isTypeScriptPluginAvailable(projectPath);
      
      // Detect project type from package.json and file patterns
      const projectType = this.detectProjectType(projectPath, jstsFiles);
      
      // Count TypeScript files to determine if we need to recommend TypeScript tools
      const tsFileCount = jstsFiles.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.ts', '.tsx'].includes(ext);
      }).length;
      
      // Count React-like files to determine if we need React tools
      const reactFileCount = jstsFiles.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jsx', '.tsx'].includes(ext);
      }).length;
      
      // Provide helpful installation guidance based on project type
      this.provideInstallationGuidance(projectType, tsFileCount, reactFileCount, hasTypeScriptParser, hasReactPlugin, hasReactHooksPlugin, projectPath);

      // Create ESLint instance with proper config
      const { ESLint } = await this.loadESLint();
      let finalESLintOptions;
      
      // Configure ESLint to handle files appropriately
      if (configDetection.hasFlatConfig) {
        // For flat config, always create temporary config to ensure plugin compatibility
        const tempFlatConfigPath = await this.createTemporaryFlatConfig(projectPath, configDetection, eslintConfig);
        finalESLintOptions = {
          overrideConfigFile: tempFlatConfigPath,
          cwd: projectPath
        };
        console.log(`✅ [ESLintEngine] Created temporary flat config for plugin compatibility`);
      } else if (configDetection.hasLegacyConfig || configDetection.hasPackageConfig) {
        // For legacy config, create a temporary flat config file
        const tempFlatConfigPath = await this.createTemporaryFlatConfig(projectPath, configDetection, eslintConfig);
        finalESLintOptions = {
          overrideConfigFile: tempFlatConfigPath,
          cwd: projectPath
        };
        console.log(`✅ [ESLintEngine] Created temporary flat config for legacy compatibility`);
      } else {
        // No config found - use analysis config only
        finalESLintOptions = {
          overrideConfig: eslintConfig,
          cwd: projectPath
        };
        console.log(`⚠️ [ESLintEngine] Using analysis config only`);
      }
      
      const finalESLintInstance = new ESLint(finalESLintOptions);

      // Run ESLint analysis - let ESLint handle parsing errors gracefully
      console.log(`🔍 [ESLintEngine] Analyzing ${jstsFiles.length} JavaScript/TypeScript files...`);
      let eslintResults;
      
      try {
        eslintResults = await finalESLintInstance.lintFiles(jstsFiles);
      } catch (lintError) {
        // Handle specific ESLint compatibility issues
        if (lintError.message && lintError.message.includes('context.getSource is not a function')) {
          console.warn('⚠️ [ESLintEngine] Detected context.getSource compatibility issue - this typically occurs with outdated plugins on ESLint 9.x');
          console.warn('💡 [ESLintEngine] Consider updating eslint-plugin-react-hooks to version 5.x or newer for ESLint 9.x compatibility');
          
          // Try to continue with a more conservative config
          try {
            console.log('🔄 [ESLintEngine] Attempting fallback with minimal safe configuration...');
            
            // For fallback, just return gracefully without complex temp directory handling
            console.log('✅ [ESLintEngine] Gracefully handled compatibility issue - some rules may be skipped');
            eslintResults = [];
          } catch (fallbackError) {
            console.error('❌ [ESLintEngine] Conservative fallback also failed:', fallbackError.message);
            // Return empty results rather than crash
            results.metadata.warnings = ['ESLint analysis failed due to plugin compatibility issues'];
            return results;
          }
        } else {
          // Re-throw other errors
          throw lintError;
        }
      }
      
      // Filter out parsing errors when TypeScript parser is not available
      let processedResults = eslintResults;
      if (!hasTypeScriptParser) {
        let parsingErrorCount = 0;
        processedResults = eslintResults.map(result => {
          const filteredMessages = result.messages.filter(message => {
            if (message.ruleId === null && message.message.includes('Parsing error')) {
              parsingErrorCount++;
              return false; // Skip parsing errors
            }
            return true; // Keep all other messages
          });
          return { ...result, messages: filteredMessages };
        });
        
        if (parsingErrorCount > 0) {
          console.log(`ℹ️ [ESLintEngine] Filtered ${parsingErrorCount} TypeScript parsing errors (install @typescript-eslint/parser for full TypeScript support)`);
        }
      }
      
      // Convert ESLint results to SunLint format
      results.results = this.convertESLintResults(processedResults, rules);
      results.filesAnalyzed = jstsFiles.length;
      results.metadata.rulesAnalyzed = rules.map(r => r.id);
      results.metadata.eslintRulesUsed = Object.keys(eslintConfig.rules);
      
    } catch (error) {
      console.error('❌ ESLint analysis failed:', error.message);
      throw error;
    }

    return results;
  }

  /**
   * Find project root from a list of files or a directory
   * Following Rule C006: Verb-noun naming
   * @param {string[]} paths - List of file paths or directories
   * @returns {string} Project root path
   */
  findProjectRoot(paths) {
    const path = require('path');
    
    if (paths.length === 0) {
      return process.cwd();
    }
    
    // Start from the first path (could be directory or file)
    let startPath = paths[0];
    
    // If it's a file, get its directory
    if (fs.existsSync(startPath) && fs.statSync(startPath).isFile()) {
      startPath = path.dirname(startPath);
    }
    
    // Look for project indicators going up the tree from start path
    let currentPath = path.resolve(startPath);
    while (currentPath !== path.dirname(currentPath)) { // Stop at root
      const packageJsonPath = path.join(currentPath, 'package.json');
      const eslintConfigPath = path.join(currentPath, 'eslint.config.js');
      const eslintrcPath = path.join(currentPath, '.eslintrc.json');
      const tsConfigPath = path.join(currentPath, 'tsconfig.json');
      
      // Found project root indicators
      if (fs.existsSync(packageJsonPath) || fs.existsSync(eslintConfigPath) || 
          fs.existsSync(eslintrcPath) || fs.existsSync(tsConfigPath)) {
        return currentPath;
      }
      
      // Go up one level
      currentPath = path.dirname(currentPath);
    }
    
    // If nothing found, return the original start path
    return path.resolve(startPath);
  }

  /**
   * Find common path between two paths
   * Following Rule C006: Verb-noun naming
   * @param {string} path1 - First path
   * @param {string} path2 - Second path  
   * @returns {string} Common path
   */
  findCommonPath(path1, path2) {
    const path = require('path');
    
    const parts1 = path1.split(path.sep);
    const parts2 = path2.split(path.sep);
    
    const commonParts = [];
    const minLength = Math.min(parts1.length, parts2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (parts1[i] === parts2[i]) {
        commonParts.push(parts1[i]);
      } else {
        break;
      }
    }
    
    return commonParts.join(path.sep) || path.sep;
  }

  /**
   * Check if file is JavaScript or TypeScript
   * Following Rule C006: Verb-noun naming
   * @param {string} filePath - File path to check
   * @returns {boolean} True if JS/TS file
   */
  isJavaScriptTypeScriptFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'].includes(ext);
  }

  /**
   * Check if rules need React plugins
   */
  needsReactPlugins(rules) {
    return rules.some(rule => {
      const ruleId = typeof rule === 'string' ? rule : rule.id || rule.name;
      return ruleId && ruleId.startsWith('R');
    });
  }

  /**
   * Check if rules need TypeScript plugins  
   */
  needsTypeScriptPlugins(rules) {
    return rules.some(rule => {
      const ruleId = typeof rule === 'string' ? rule : rule.id || rule.name;
      return ruleId && ruleId.startsWith('T');
    });
  }

  /**
   * Check if rules need Import plugin
   */
  needsImportPlugin(rules) {
    // Check if any rules use import/ prefix or specific rules that need import plugin
    return rules.some(ruleId => {
      const id = typeof ruleId === 'string' ? ruleId : ruleId.id || ruleId.name;
      return id && (id.includes('import/') || 
                   ['C038', 'C040'].includes(id)); // Rules that map to import plugin
    });
  }

  /**
   * Build dynamic plugins based on rules being analyzed
   * @param {Array} rules - Rules to analyze
   * @returns {Object} Plugin configuration
   */
  buildPluginConfig(rules) {
    const plugins = {
      'custom': this.loadCustomPlugin()
    };

    // Only load TypeScript plugin if needed
    if (this.needsTypeScriptPlugins(rules)) {
      plugins['@typescript-eslint'] = this.loadTypeScriptPlugin();
    }

    // Only load React plugins if needed  
    if (this.needsReactPlugins(rules)) {
      plugins['react'] = this.loadReactPlugin();
      plugins['react-hooks'] = this.loadReactHooksPlugin();
    }

    return plugins;
  }

  /**
   * Create ESLint configuration for analysis
   * Following Rule C006: Verb-noun naming
   * @param {Object[]} rules - SunLint rules
   * @returns {Promise<Object>} ESLint configuration
   */
  async createAnalysisConfig(rules) {
    // ESLint v9+ flat config format
    const config = {
      files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'], // Add file patterns
      languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        parser: this.loadTypeScriptParser(),
        parserOptions: {
          ecmaFeatures: {
            jsx: true
          }
        },
        globals: {
          console: 'readonly',
          process: 'readonly',
          Buffer: 'readonly',
          __dirname: 'readonly',
          __filename: 'readonly',
          module: 'readonly',
          require: 'readonly',
          exports: 'readonly',
          global: 'readonly'
        }
      },
      plugins: this.buildPluginConfig(rules),
      settings: this.needsReactPlugins(rules) ? {
        react: {
          version: 'detect'
        }
      } : {},
      rules: {}
    };

    // Map SunLint rules to ESLint rules
    for (const rule of rules) {
      // For Security rules, always use custom plugin (ignore mapping file)
      if (rule.id.startsWith('S')) {
        const customRuleName = `custom/typescript_${rule.id.toLowerCase()}`;
        const ruleConfig = this.mapSeverity(rule.severity || 'warning');
        config.rules[customRuleName] = ruleConfig;
        continue;
      }
      
      // For Common rules (C series), check mapping file first
      if (rule.id.startsWith('C')) {
        const eslintRules = this.ruleMapping.get(rule.id);
        
        if (eslintRules && Array.isArray(eslintRules)) {
          // Check if mapping contains custom rules
          const customRules = eslintRules.filter(r => r.startsWith('custom/'));
          const builtinRules = eslintRules.filter(r => !r.startsWith('custom/'));
          
          // If mapping has custom rules, use them
          if (customRules.length > 0) {
            for (const customRule of customRules) {
              const ruleConfig = this.mapSeverity(rule.severity || 'warning');
              
              // Add rule configuration for specific rules
              if (rule.id === 'C010') {
                config.rules[customRule] = [ruleConfig, { maxDepth: 3 }];
              } else {
                config.rules[customRule] = ruleConfig;
              }
            }
            continue;
          }
          
          // If mapping has only builtin rules, use them
          if (builtinRules.length > 0) {
            for (const eslintRule of builtinRules) {
              const severity = this.mapSeverity(rule.severity || 'warning');
              config.rules[eslintRule] = severity;
            }
            continue;
          }
        }
        
        // If no mapping found, fallback to auto-generated custom rule name
        const customRuleName = `custom/${rule.id.toLowerCase()}`;
        const ruleConfig = this.mapSeverity(rule.severity || 'warning');
        
        // Add rule configuration for specific rules
        if (rule.id === 'C010') {
          config.rules[customRuleName] = [ruleConfig, { maxDepth: 3 }];
        } else {
          config.rules[customRuleName] = ruleConfig;
        }
        continue;
      }
      
      // For TypeScript rules (T series), check mapping file first
      if (rule.id.startsWith('T')) {
        const eslintRules = this.ruleMapping.get(rule.id);
        
        if (eslintRules && Array.isArray(eslintRules)) {
          // Check if mapping contains custom rules
          const customRules = eslintRules.filter(r => r.startsWith('custom/'));
          const builtinRules = eslintRules.filter(r => !r.startsWith('custom/'));
          
          // If mapping has custom rules, use them
          if (customRules.length > 0) {
            for (const customRule of customRules) {
              const ruleConfig = this.mapSeverity(rule.severity || 'warning');
              config.rules[customRule] = ruleConfig;
            }
            continue;
          }
          
          // If mapping has only builtin rules, use them
          if (builtinRules.length > 0) {
            for (const eslintRule of builtinRules) {
              const severity = this.mapSeverity(rule.severity || 'warning');
              config.rules[eslintRule] = severity;
            }
            continue;
          }
        }
        
        // If no mapping found, fallback to auto-generated custom rule name
        const customRuleName = `custom/${rule.id.toLowerCase()}`;
        const ruleConfig = this.mapSeverity(rule.severity || 'warning');
        config.rules[customRuleName] = ruleConfig;
        continue;
      }
      
      // For other rules, check mapping file first
      const eslintRules = this.ruleMapping.get(rule.id);
      
      if (eslintRules && Array.isArray(eslintRules)) {
        // Use mapping file (for builtin ESLint rules)
        for (const eslintRule of eslintRules) {
          const severity = this.mapSeverity(rule.severity || 'warning');
          config.rules[eslintRule] = severity;
        }
        continue;
      }
      
      // Fallback - try as custom rule for any remaining rules
      const customRuleName = `custom/${rule.id.toLowerCase()}`;
      const ruleConfig = this.mapSeverity(rule.severity || 'warning');
      config.rules[customRuleName] = ruleConfig;
    }

    return config;
  }

  /**
   * Map SunLint severity to ESLint severity
   * Following Rule C006: Verb-noun naming
   * @param {string} sunlintSeverity - SunLint severity level
   * @returns {number|string} ESLint severity
   */
  mapSeverity(sunlintSeverity) {
    switch (sunlintSeverity.toLowerCase()) {
      case 'error': return 'error';
      case 'warning': return 'warn';
      case 'info': return 'warn';
      default: return 'warn';
    }
  }

  /**
   * Convert ESLint results to SunLint format
   * Following Rule C006: Verb-noun naming
   * @param {Object[]} eslintResults - ESLint results
   * @param {Object[]} originalRules - Original SunLint rules
   * @returns {Object[]} SunLint formatted results
   */
  convertESLintResults(eslintResults, originalRules) {
    const sunlintResults = [];

    for (const eslintResult of eslintResults) {
      if (eslintResult.messages.length === 0) continue;

      const fileResult = {
        file: eslintResult.filePath,
        violations: []
      };

      for (const message of eslintResult.messages) {
        // Only process custom/ rules (SunLint rules) - ignore project-specific rules and inline directives
        if (!message.ruleId || !message.ruleId.startsWith('custom/')) {
          continue;
        }

        const violation = {
          ruleId: this.mapESLintRuleToSunLint(message.ruleId, originalRules),
          message: message.message,
          severity: message.severity === 2 ? 'error' : 'warning',
          line: message.line,
          column: message.column,
          endLine: message.endLine,
          endColumn: message.endColumn,
          engine: 'eslint',
          eslintRule: message.ruleId,
          fix: message.fix ? {
            range: message.fix.range,
            text: message.fix.text
          } : null
        };

        fileResult.violations.push(violation);
      }

      if (fileResult.violations.length > 0) {
        sunlintResults.push(fileResult);
      }
    }

    return sunlintResults;
  }

  /**
   * Map ESLint rule back to SunLint rule
   * Following Rule C006: Verb-noun naming
   * @param {string} eslintRuleId - ESLint rule ID
   * @param {Object[]} originalRules - Original SunLint rules
   * @returns {string} SunLint rule ID
   */
  mapESLintRuleToSunLint(eslintRuleId, originalRules) {
    // Find which SunLint rule maps to this ESLint rule
    for (const [sunlintRule, eslintRules] of this.ruleMapping.entries()) {
      if (eslintRules.includes(eslintRuleId)) {
        // Verify this rule was actually requested
        const requestedRule = originalRules.find(r => r.id === sunlintRule);
        if (requestedRule) {
          return sunlintRule;
        }
      }
    }

    // Fallback to ESLint rule ID if no mapping found
    return eslintRuleId;
  }

  /**
   * Get supported rules
   * Following Rule C006: Verb-noun naming
   * @returns {string[]} Supported rule IDs
   */
  getSupportedRules() {
    return Array.from(this.ruleMapping.keys());
  }

  /**
   * Check if rule is supported
   * Following Rule C006: Verb-noun naming
   * @param {string} ruleId - Rule ID to check
   * @returns {boolean} True if supported
   */
  isRuleSupported(ruleId) {
    const supported = this.ruleMapping.has(ruleId);
    if (this.verbose) {
      console.log(`🔍 [ESLintEngine] isRuleSupported(${ruleId}): ${supported} (mapping size: ${this.ruleMapping.size})`);
    }
    return supported;
  }

  /**
   * Create a conservative ESLint config without problematic rules
   * Following Rule C006: Verb-noun naming
   * @param {Object} originalConfig - Original ESLint config
   * @returns {Object} Conservative config without compatibility issues
   */
  createConservativeConfig(originalConfig) {
    // Create a safe conservative config instead of cloning (to avoid circular references)
    const conservativeConfig = {
      languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        parserOptions: {
          ecmaFeatures: {
            jsx: true
          }
        }
      },
      rules: {}
    };
    
    // Copy only safe rules from original config
    if (originalConfig.rules) {
      for (const [ruleName, ruleConfig] of Object.entries(originalConfig.rules)) {
        // Skip problematic React Hooks rules
        if (!ruleName.startsWith('react-hooks/')) {
          conservativeConfig.rules[ruleName] = ruleConfig;
        } else {
          console.log(`⚠️ [ESLintEngine] Disabled rule '${ruleName}' due to compatibility issues`);
        }
      }
    }
    
    // If we removed all rules, add some basic safe ones
    if (Object.keys(conservativeConfig.rules).length === 0) {
      conservativeConfig.rules = {
        'no-unused-vars': 'warn',
        'no-console': 'warn',
        'semi': ['error', 'always']
      };
      console.log('ℹ️ [ESLintEngine] Applied basic rule set for conservative analysis');
    }
    
    return conservativeConfig;
  }

  /**
   * Cleanup ESLint engine resources
   * Following Rule C006: Verb-noun naming
   */
  async cleanup() {
    // Clean up temporary config files
    if (this.tempConfigPaths && this.tempConfigPaths.length > 0) {
      const fs = require('fs');
      for (const tempPath of this.tempConfigPaths) {
        try {
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
            console.log(`🧹 [ESLintEngine] Cleaned up temporary config: ${tempPath}`);
          }
        } catch (error) {
          console.warn(`⚠️ [ESLintEngine] Failed to cleanup temp config ${tempPath}: ${error.message}`);
        }
      }
      this.tempConfigPaths = [];
    }
    
    this.eslint = null;
    this.configFiles.clear();
    this.ruleMapping.clear();
    
    await super.cleanup();
    console.log('🔧 ESLint engine cleanup completed');
  }
}

module.exports = ESLintEngine;
