/**
 * 🚀 Auto Performance Manager for SunLint
 * Automatically detects optimal performance settings based on project characteristics
 * GOAL: Simplify CLI by reducing user choices while maintaining performance
 */

const fs = require('fs');
const path = require('path');

class AutoPerformanceManager {
  constructor() {
    // Smart defaults based on project analysis
    this.performanceProfiles = {
      auto: {
        name: 'Auto-Detect',
        detect: true,
        description: 'Automatically choose best settings based on project size'
      },
      fast: {
        name: 'Fast',
        timeout: 30000,        // 30s
        batchSize: 20,
        maxFiles: 500,
        description: 'Quick analysis for small projects (<100 files)'
      },
      careful: {
        name: 'Careful', 
        timeout: 120000,       // 2 minutes
        batchSize: 10,
        maxFiles: 1500,
        progressiveResults: true,
        description: 'Thorough analysis for large projects (>500 files)'
      }
    };
  }

  /**
   * 🎯 Get optimal performance settings with minimal user input
   * Clarifies the difference between max-files and max-semantic-files:
   * - max-files: Total files to analyze (performance limit)
   * - max-semantic-files: Files to load into TypeScript symbol table (memory limit)
   */
  getOptimalSettings(options, targetFiles = []) {
    const mode = options.performance || 'auto';
    
    if (mode === 'auto') {
      return this.autoDetectSettings(options, targetFiles);
    }
    
    return this.getProfileSettings(mode, options);
  }

  /**
   * 🤖 Auto-detect optimal settings based on project characteristics
   */
  autoDetectSettings(options, targetFiles) {
    const projectAnalysis = this.analyzeProject(options, targetFiles);
    const profile = this.selectOptimalProfile(projectAnalysis);
    
    if (options.verbose) {
      console.log(`🤖 Auto-detected performance profile: ${profile.name}`);
      console.log(`   📊 Project: ${projectAnalysis.fileCount} files, ${projectAnalysis.size} size`);
      console.log(`   ⚡ Settings: ${profile.timeout/1000}s timeout, ${profile.batchSize} rules/batch`);
    }
    
    return {
      ...profile,
      autoDetected: true,
      projectAnalysis
    };
  }

  /**
   * 📊 Analyze project to determine optimal settings
   */
  analyzeProject(options, targetFiles) {
    const fileCount = targetFiles.length;
    const inputPath = options.input || process.cwd();
    
    // Estimate project complexity
    const hasNodeModules = fs.existsSync(path.join(inputPath, 'node_modules'));
    const hasPackageJson = fs.existsSync(path.join(inputPath, 'package.json'));
    const hasTsConfig = fs.existsSync(path.join(inputPath, 'tsconfig.json'));
    const hasGitIgnore = fs.existsSync(path.join(inputPath, '.gitignore'));
    
    // Simple heuristics for project size
    let size = 'small';
    let complexity = 'simple';
    
    if (fileCount > 1000) {
      size = 'enterprise';
      complexity = 'complex';
    } else if (fileCount > 500) {
      size = 'large';
      complexity = hasNodeModules && hasTsConfig ? 'complex' : 'medium';
    } else if (fileCount > 100) {
      size = 'medium';
      complexity = hasTsConfig ? 'medium' : 'simple';
    }
    
    return {
      fileCount,
      size,
      complexity,
      hasNodeModules,
      hasPackageJson,
      hasTsConfig,
      hasGitIgnore,
      inputPath
    };
  }

  /**
   * 🎯 Select optimal profile based on project analysis
   */
  selectOptimalProfile(analysis) {
    if (analysis.fileCount <= 100) {
      return {
        name: 'Auto-Fast',
        timeout: 30000,
        batchSize: 20,
        maxFiles: 200,                    // Analysis limit
        maxSemanticFiles: 100,            // Symbol table limit (smaller for memory)
        description: `Small project (${analysis.fileCount} files) - fast analysis`
      };
    }
    
    if (analysis.fileCount <= 500) {
      return {
        name: 'Auto-Balanced',
        timeout: 60000,
        batchSize: 15,
        maxFiles: 600,                    // Analysis limit
        maxSemanticFiles: 300,            // Symbol table limit
        progressiveResults: true,
        description: `Medium project (${analysis.fileCount} files) - balanced analysis`
      };
    }
    
    if (analysis.fileCount <= 1000) {
      return {
        name: 'Auto-Careful',
        timeout: 120000,
        batchSize: 10,
        maxFiles: 1200,                   // Analysis limit
        maxSemanticFiles: 500,            // Symbol table limit
        progressiveResults: true,
        streamingAnalysis: analysis.complexity === 'complex',
        description: `Large project (${analysis.fileCount} files) - careful analysis`
      };
    }
    
    // Enterprise projects
    return {
      name: 'Auto-Enterprise',
      timeout: 300000,
      batchSize: 5,
      maxFiles: 1500,                     // Analysis limit
      maxSemanticFiles: 300,              // Conservative symbol table limit
      progressiveResults: true,
      streamingAnalysis: true,
      smartSampling: true,
      description: `Enterprise project (${analysis.fileCount} files) - conservative analysis`
    };
  }

  /**
   * ⚙️ Get predefined profile settings
   */
  getProfileSettings(mode, options) {
    const profile = this.performanceProfiles[mode];
    
    if (!profile) {
      console.warn(`⚠️  Unknown performance mode: ${mode}, using auto-detect`);
      return this.autoDetectSettings(options, []);
    }
    
    // Override with user-specified options
    const settings = { ...profile };
    
    if (options.timeout && options.timeout !== '0') {
      settings.timeout = parseInt(options.timeout);
    }
    
    if (options.maxFiles && options.maxFiles !== '1000') {
      settings.maxFiles = parseInt(options.maxFiles);
    }
    
    return settings;
  }

  /**
   * 📋 Get user-friendly performance recommendations
   */
  getPerformanceRecommendations(options, targetFiles) {
    const analysis = this.analyzeProject(options, targetFiles);
    const profile = this.selectOptimalProfile(analysis);
    
    const recommendations = [
      `🎯 Recommended: sunlint --all --input=${options.input || 'src'} --performance=auto`
    ];
    
    if (analysis.fileCount > 500) {
      recommendations.push(`💡 For faster results: sunlint --all --input=${options.input || 'src'} --performance=fast --max-files=300`);
    }
    
    if (analysis.complexity === 'complex') {
      recommendations.push(`⚡ For thorough analysis: sunlint --all --input=${options.input || 'src'} --performance=careful --verbose`);
    }
    
    return {
      analysis,
      profile,
      recommendations
    };
  }

  /**
   * 🎛️ Show simplified CLI usage for common scenarios
   */
  static getSimplifiedUsageExamples() {
    return {
      quickStart: [
        'sunlint --all --input=src',                           // Auto-detect everything
        'sunlint --rules=C019,C041,S027 --input=src',        // Specific rules
        'sunlint --quality --input=src'                       // Quality rules only
      ],
      performance: [
        'sunlint --all --input=src --performance=auto',       // Auto-detect (default)
        'sunlint --all --input=src --performance=fast',       // Quick scan
        'sunlint --all --input=src --performance=careful',    // Thorough analysis
        'sunlint --all --input=src --timeout=60000'           // Custom timeout
      ],
      advanced: [
        'sunlint --all --input=src --verbose',                // See detailed progress
        'sunlint --all --input=src --dry-run',               // Preview analysis
        'sunlint --all --input=src --format=json'            // JSON output
      ]
    };
  }
}

module.exports = AutoPerformanceManager;
