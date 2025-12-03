/**
 * Performance Optimization Module for SunLint v1.3.2
 * Comprehensive optimizations to handle large projects efficiently
 */

const fs = require('fs');
const path = require('path');
const { DEFAULT_PERFORMANCE } = require('./constants/defaults');

class PerformanceOptimizer {
  constructor() {
    this.excludePatterns = DEFAULT_PERFORMANCE.HIGH_PERFORMANCE_EXCLUDES;
    this.fileSizeLimits = {
      maxFileSize: DEFAULT_PERFORMANCE.MAX_FILE_SIZE,
      maxTotalFiles: DEFAULT_PERFORMANCE.MAX_TOTAL_FILES
    };
    this.config = {};
    this.initialized = false;
  }

  /**
   * Initialize performance optimizer with configuration
   */
  async initialize(config = {}) {
    this.config = {
      ...DEFAULT_PERFORMANCE,
      ...config
    };
    
    // Override maxTotalFiles if provided in config
    if (config.maxFiles !== undefined) {
      this.fileSizeLimits.maxTotalFiles = config.maxFiles;
    }
    
    this.initialized = true;
  }

  /**
   * Main optimization method called by analysis orchestrator
   */
  async optimizeAnalysis(files, rules, config) {
    const startTime = Date.now();
    
    // Filter files for performance
    const optimizedFiles = this.config.enableFileFiltering !== false 
      ? await this.smartFileFilter(files)
      : files;
    
    // Apply rule batching if enabled
    const optimizedRules = this.config.enableBatching !== false
      ? rules
      : rules;
    
    const performanceMetrics = {
      originalFiles: files.length,
      optimizedFiles: optimizedFiles.length,
      filteredFiles: files.length - optimizedFiles.length,
      originalRules: rules.length,
      optimizedRules: optimizedRules.length,
      ruleBatches: this.calculateBatchCount(rules, config),
      optimizationTime: Date.now() - startTime
    };

    if (config.verbose) {
      console.log(`⚡ Performance optimization: ${performanceMetrics.filteredFiles} files filtered, ${performanceMetrics.ruleBatches} batches`);
    }

    return {
      optimizedFiles,
      optimizedRules,
      performanceMetrics
    };
  }

  /**
   * Calculate number of batches for rules
   */
  calculateBatchCount(rules, config) {
    const batchSize = config.ruleBatchSize || this.config.RULE_BATCH_SIZE;
    return Math.ceil(rules.length / batchSize);
  }

  /**
   * Smart file filtering to exclude performance-heavy directories
   */
  async smartFileFilter(files) {
    const filtered = [];
    let totalSize = 0;
    
    for (const file of files) {
      // Skip if matches exclude patterns
      if (this.shouldExcludeFile(file)) {
        continue;
      }
      
      try {
        const stats = await fs.promises.stat(file);
        
        // Skip large files
        if (stats.size > this.fileSizeLimits.maxFileSize) {
          if (this.config.verbose) {
            console.log(`⚠️ Skipping large file: ${path.basename(file)} (${(stats.size / 1024 / 1024).toFixed(1)}MB)`);
          }
          continue;
        }
        
        // Check total size limit
        if (totalSize + stats.size > this.fileSizeLimits.maxTotalSize) {
          if (this.config.verbose) {
            console.log(`⚠️ Reached total size limit, stopping at ${filtered.length} files`);
          }
          break;
        }
        
        // Check file count limit (skip if unlimited -1)
        if (this.fileSizeLimits.maxTotalFiles > 0 && filtered.length >= this.fileSizeLimits.maxTotalFiles) {
          if (this.config.verbose) {
            console.log(`⚠️ Reached file count limit: ${this.fileSizeLimits.maxTotalFiles} files`);
          }
          break;
        }
        
        filtered.push(file);
        totalSize += stats.size;
        
      } catch (error) {
        // Skip files we can't read
        if (this.config.verbose) {
          console.warn(`⚠️ Cannot read file ${file}: ${error.message}`);
        }
        continue;
      }
    }
    
    if (this.config.verbose) {
      console.log(`📊 Performance filter: ${filtered.length}/${files.length} files (${(totalSize / 1024 / 1024).toFixed(1)}MB)`);
    }
    return filtered;
  }

  shouldExcludeFile(filePath) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    return this.excludePatterns.some(pattern => {
      const regex = this.globToRegex(pattern);
      const match = regex.test(normalizedPath);
      return match;
    });
  }

  globToRegex(glob) {
    // Simple but effective glob to regex conversion
    let regex = glob
      .replace(/\./g, '\\.')                   // Escape dots
      .replace(/\*\*/g, '___DOUBLE_STAR___')   // Temp placeholder
      .replace(/\*/g, '[^/]*')                 // Single * matches within path segment
      .replace(/___DOUBLE_STAR___/g, '.*')     // ** matches across path segments
      .replace(/\?/g, '[^/]');                 // ? matches single character
    
    // Ensure pattern matches anywhere in the path
    if (!regex.startsWith('.*')) {
      regex = '.*' + regex;
    }
    if (!regex.endsWith('.*')) {
      regex = regex + '.*';
    }
    
    return new RegExp(regex, 'i');
  }

  /**
   * Adaptive timeout based on file count and rules
   */
  calculateAdaptiveTimeout(fileCount, ruleCount, baseTimeout = 30000) {
    const perFileMs = this.config.TIMEOUT_PER_FILE_MS || 100;
    const perRuleMs = this.config.TIMEOUT_PER_RULE_MS || 1000;
    const maxTimeout = this.config.MAX_TIMEOUT_MS || 120000;
    
    const adaptiveTimeout = Math.min(
      baseTimeout + (fileCount * perFileMs) + (ruleCount * perRuleMs),
      maxTimeout
    );
    
    if (this.config.verbose) {
      console.log(`⏱️ Adaptive timeout: ${(adaptiveTimeout / 1000).toFixed(1)}s for ${fileCount} files, ${ruleCount} rules`);
    }
    return adaptiveTimeout;
  }

  /**
   * Memory-aware rule batching
   */
  createRuleBatches(rules, config = {}) {
    const fileCount = config.fileCount || 100;
    const batchSize = config.ruleBatchSize || (fileCount > 100 ? 5 : 10);
    const batches = [];
    
    for (let i = 0; i < rules.length; i += batchSize) {
      batches.push(rules.slice(i, i + batchSize));
    }
    
    if (this.config.verbose) {
      console.log(`📦 Created ${batches.length} rule batches (${batchSize} rules each)`);
    }
    return batches;
  }

  /**
   * Enhanced error recovery with context
   */
  handleAnalysisError(error, context = {}) {
    const errorInfo = {
      message: error.message,
      shouldRetry: false,
      retryWithReducedBatch: false,
      context
    };

    // Determine if error is recoverable
    if (error.message.includes('timeout') || 
        error.message.includes('timed out') ||
        error.message.includes('Maximum call stack size exceeded')) {
      errorInfo.shouldRetry = true;
      errorInfo.retryWithReducedBatch = true;
    }

    if (error.message.includes('ENOMEM') || 
        error.message.includes('memory')) {
      errorInfo.shouldRetry = true;
      errorInfo.retryWithReducedBatch = true;
    }

    return errorInfo;
  }

  /**
   * Execute operation with error recovery
   */
  async executeWithRecovery(operation, context = {}) {
    const maxRetries = this.config.MAX_RETRIES || 2;
    const retryDelay = this.config.RETRY_DELAY_MS || 1000;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt > maxRetries) {
          throw error; // Final attempt failed
        }
        
        const errorInfo = this.handleAnalysisError(error, context);
        
        if (!errorInfo.shouldRetry) {
          throw error; // Not recoverable
        }
        
        if (this.config.verbose) {
          console.warn(`⚠️ Attempt ${attempt} failed, retrying in ${retryDelay}ms...`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    // Perform any necessary cleanup
    this.initialized = false;
    this.config = {};
  }
}

module.exports = PerformanceOptimizer;
