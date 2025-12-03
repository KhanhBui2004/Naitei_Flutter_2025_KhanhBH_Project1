# SunLint Performance Optimization Guide

## Overview

SunLint v1.3.2 introduces advanced performance optimizations to handle large-scale analysis efficiently, preventing timeouts and memory issues when analyzing projects with thousands of files or extensive rule sets.

## Key Performance Features

### 🚀 Adaptive File Filtering
- **Smart Exclusion Patterns**: Automatically excludes performance-heavy directories (`node_modules`, `.next`, `dist`, etc.)
- **File Size Limits**: Skips files larger than 2MB by default
- **Total File Limiting**: Processes maximum 1000 files per analysis run

### ⚡ Batch Processing
- **Rule Batching**: Processes rules in batches of 10 to prevent memory overflow
- **File Batching**: Analyzes files in chunks of 50 for better memory management
- **Adaptive Concurrency**: Runs maximum 3 batches simultaneously

### 🧠 Memory Management
- **Heap Monitoring**: Tracks memory usage and triggers garbage collection at 256MB
- **Memory Limits**: Enforces 512MB heap size limit
- **Smart Cleanup**: Automatically cleans up resources between batches

### ⏱️ Adaptive Timeouts
- **Dynamic Calculation**: Base timeout of 30s + 100ms per file + 1s per rule
- **Maximum Cap**: Never exceeds 2 minutes per batch
- **Context-Aware**: Adjusts timeouts based on project size and complexity

### 🔄 Error Recovery
- **Retry Logic**: Automatically retries failed batches up to 2 times
- **Batch Splitting**: Reduces batch size on failure and retries
- **Graceful Degradation**: Continues with other batches if one fails

## Configuration Options

### CLI Flags

```bash
# Enable high-performance mode (recommended for large projects)
sunlint --performance-mode /path/to/project

# Adjust batch sizes
sunlint --rule-batch-size=5 --file-batch-size=25 /path/to/project

# Increase timeouts for very large projects
sunlint --timeout=120000 /path/to/project

# Disable certain optimizations
sunlint --no-file-filtering --no-batching /path/to/project
```

### Configuration File

Create `.sunlint.json` with performance settings:

```json
{
  "performance": {
    "enableFileFiltering": true,
    "maxFileSize": 2097152,
    "maxTotalFiles": 1000,
    "enableBatching": true,
    "ruleBatchSize": 10,
    "fileBatchSize": 50,
    "maxConcurrentBatches": 3,
    "enableMemoryMonitoring": true,
    "maxHeapSizeMB": 512,
    "baseTimeoutMs": 30000,
    "maxTimeoutMs": 120000,
    "enableErrorRecovery": true,
    "maxRetries": 2
  },
  "excludePatterns": [
    "**/node_modules/**",
    "**/.next/**",
    "**/dist/**",
    "**/build/**",
    "**/.git/**",
    "**/coverage/**"
  ]
}
```

## Performance Scenarios

### Large Node.js Projects

```bash
# Analyze a React/Next.js project efficiently
sunlint --rules="C001,C005,C019,C029" --exclude="node_modules,.next,dist" ./src

# Use preset for common patterns
sunlint --preset=nodejs-large ./
```

### Monorepo Analysis

```bash
# Analyze specific packages only
sunlint --include="packages/*/src/**" --exclude="**/node_modules/**" ./

# Parallel analysis of different packages
sunlint --rule-batch-size=5 --max-concurrent-batches=2 ./packages
```

### CI/CD Integration

```bash
# Fast analysis for PR checks (essential rules only)
sunlint --preset=essential --performance-mode --timeout=60000 ./

# Full analysis for nightly builds
sunlint --all --performance-mode --timeout=300000 ./
```

## Performance Monitoring

### Built-in Metrics

SunLint automatically reports performance metrics:

```bash
sunlint --verbose ./large-project

# Output includes:
# 📦 Filtered 150 files for performance
# 🔄 Using 3 rule batches
# ⚡ Batch 1/3: 10 rules in 15s
# 💾 Memory usage: 245MB heap
# 📊 Throughput: 12.5 files/second
```

### Performance Testing

Run the included performance test suite:

```bash
npm run test:performance
```

This tests:
- Small projects (5-10 files)
- Medium projects (20-50 files)
- Large project simulation
- Stress testing with many rules

## Troubleshooting Performance Issues

### Common Issues and Solutions

#### Timeouts
```bash
# Symptoms: "Engine heuristic timed out after 30000ms"
# Solution: Increase timeouts or enable performance mode
sunlint --timeout=60000 --performance-mode ./
```

#### Memory Errors
```bash
# Symptoms: "Maximum call stack size exceeded"
# Solution: Reduce batch sizes and enable memory monitoring
sunlint --rule-batch-size=5 --file-batch-size=25 ./
```

#### Slow Analysis
```bash
# Symptoms: Analysis takes >5 minutes
# Solution: Use file filtering and exclude large directories
sunlint --exclude="node_modules,dist,build,.git" --max-files=500 ./
```

### Debugging Performance

Enable detailed performance logging:

```bash
# Enable debug mode for performance analysis
DEBUG=sunlint:performance sunlint --verbose ./

# Profile memory usage
NODE_OPTIONS="--max-old-space-size=1024" sunlint --performance-mode ./
```

## Best Practices

### Project Setup
1. **Use .gitignore patterns**: Exclude the same directories you ignore in git
2. **Targeted analysis**: Focus on source directories (`src/`, `lib/`) rather than entire project
3. **Rule selection**: Use specific rules instead of `--all` for faster analysis

### CI/CD Integration
1. **Staged approach**: Run essential rules on PRs, full analysis on merges
2. **Parallel execution**: Use different jobs for different rule categories
3. **Caching**: Cache analysis results for unchanged files

### Development Workflow
1. **Pre-commit hooks**: Run minimal rule set locally
2. **IDE integration**: Use SunLint ESLint integration for real-time feedback
3. **Regular full scans**: Schedule comprehensive analysis weekly

## Performance Benchmarks

### Typical Performance (SunLint v1.3.2)

| Project Size | Rules | Files | Time | Memory | Throughput |
|--------------|-------|-------|------|---------|------------|
| Small (10 files) | 5 rules | 10 | 2-5s | 50MB | 3-5 files/s |
| Medium (50 files) | 10 rules | 50 | 8-15s | 120MB | 4-6 files/s |
| Large (200 files) | 20 rules | 200 | 30-60s | 300MB | 4-7 files/s |
| Very Large (1000 files) | 30 rules | 1000 | 2-4min | 500MB | 5-8 files/s |

### Comparison with v1.2.0

- **50% faster** analysis on large projects
- **70% less memory** usage with batching
- **90% fewer timeouts** with adaptive timeouts
- **100% more reliable** with error recovery

## Advanced Configuration

### Custom Performance Profiles

Create custom profiles for different scenarios:

```json
{
  "profiles": {
    "ci-fast": {
      "rules": ["C001", "C005", "C019"],
      "performance": {
        "ruleBatchSize": 3,
        "maxTimeoutMs": 60000,
        "maxTotalFiles": 200
      }
    },
    "security-deep": {
      "categories": ["security"],
      "performance": {
        "ruleBatchSize": 5,
        "maxTimeoutMs": 180000,
        "enableMemoryMonitoring": true
      }
    }
  }
}
```

### Integration with Build Tools

#### Webpack Plugin Integration
```javascript
// webpack.config.js
const SunLintPlugin = require('@sun-asterisk/sunlint/webpack-plugin');

module.exports = {
  plugins: [
    new SunLintPlugin({
      performanceMode: true,
      rules: ['C001', 'C005', 'C019'],
      exclude: ['node_modules', 'dist']
    })
  ]
};
```

#### ESLint Integration
```javascript
// .eslintrc.js
module.exports = {
  plugins: ['@sun-asterisk/sunlint'],
  rules: {
    '@sun-asterisk/sunlint/performance-mode': 'warn'
  },
  settings: {
    sunlint: {
      performanceMode: true,
      maxFiles: 500
    }
  }
};
```

## Future Optimizations

### Roadmap (v1.4.0+)
- **Incremental Analysis**: Only analyze changed files
- **Distributed Processing**: Multi-core rule execution
- **Smart Caching**: Cache AST parsing results
- **WebAssembly Rules**: Native speed rule execution
- **Streaming Analysis**: Process files as they're read

### Contributing to Performance

Help improve SunLint performance:
1. **Report benchmarks**: Share your project analysis times
2. **Profile bottlenecks**: Use Node.js profiler to identify slow operations
3. **Suggest optimizations**: Submit performance improvement PRs
4. **Test edge cases**: Report performance issues with unusual project structures

## Support

For performance-related issues:
1. **Enable verbose logging**: `--verbose` flag provides detailed timing
2. **Run performance test**: `npm run test:performance`
3. **Check system resources**: Monitor CPU and memory during analysis
4. **Report issues**: Include project size, rule count, and system specs

---

*SunLint Performance Optimization Guide - Version 1.3.2*  
*Updated: December 2024*
