#!/usr/bin/env node

/**
 * 🚀 SunLint Performance Testing Suite
 * Test different scenarios to validate optimization strategies
 */

const path = require('path');
const fs = require('fs');
const { performance } = require('perf_hooks');

// Import both engines for comparison
const HeuristicEngine = require('../engines/heuristic-engine');
const OptimizedHeuristicEngine = require('../engines/optimized-heuristic-engine');

/**
 * Performance test scenarios
 */
const TEST_SCENARIOS = {
  small: {
    name: 'Small Project',
    files: 50,
    rules: 10,
    expectedTime: 10000,  // 10s
    description: 'Typical small TypeScript project'
  },
  medium: {
    name: 'Medium Project', 
    files: 200,
    rules: 25,
    expectedTime: 30000,  // 30s
    description: 'Medium-sized application'
  },
  large: {
    name: 'Large Project',
    files: 500,
    rules: 50,
    expectedTime: 60000,  // 60s
    description: 'Large enterprise application'
  },
  enterprise: {
    name: 'Enterprise Project',
    files: 1000,
    rules: 73,
    expectedTime: 120000, // 120s
    description: 'Full enterprise codebase'
  }
};

/**
 * Rule categories for testing
 */
const TEST_RULES = {
  fast: ['C002', 'C003', 'C006', 'C011', 'C016'],           // Regex-based
  medium: ['C019', 'C041', 'S027', 'S019', 'C024'],         // AST-based  
  slow: ['C033', 'C047', 'C076', 'C087', 'C095'],           // Semantic-based
  all: [] // Will be populated from registry
};

class PerformanceTestSuite {
  constructor() {
    this.results = [];
    this.testCount = 0;
    this.passCount = 0;
    this.failCount = 0;
  }

  /**
   * 🧪 Run complete performance test suite
   */
  async runTests() {
    console.log('🚀 SunLint Performance Test Suite');
    console.log('=====================================\n');
    
    try {
      // Initialize test data
      await this.initializeTestData();
      
      // Test each scenario
      for (const [scenarioKey, scenario] of Object.entries(TEST_SCENARIOS)) {
        console.log(`📊 Testing: ${scenario.name}`);
        console.log(`   Files: ${scenario.files}, Rules: ${scenario.rules}`);
        console.log(`   Expected: <${scenario.expectedTime/1000}s\n`);
        
        await this.testScenario(scenarioKey, scenario);
        console.log('---\n');
      }
      
      // Performance comparison tests
      await this.runComparisonTests();
      
      // Memory stress tests
      await this.runMemoryTests();
      
      // Timeout tests
      await this.runTimeoutTests();
      
      // Summary
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * 🏗️ Initialize test data
   */
  async initializeTestData() {
    console.log('🏗️  Initializing test data...');
    
    // Load available rules
    try {
      const registryPath = path.resolve(__dirname, '../config/rules/enhanced-rules-registry.json');
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      TEST_RULES.all = Object.keys(registry.rules);
      
      console.log(`   ✅ Loaded ${TEST_RULES.all.length} rules from registry`);
    } catch (error) {
      console.warn('   ⚠️  Could not load rule registry, using default rules');
      TEST_RULES.all = [...TEST_RULES.fast, ...TEST_RULES.medium, ...TEST_RULES.slow];
    }
    
    // Generate test files
    await this.generateTestFiles();
    
    console.log('   ✅ Test data initialized\\n');
  }

  /**
   * 📁 Generate test TypeScript files for analysis
   */
  async generateTestFiles() {
    const testDir = path.resolve(__dirname, '../test-performance');
    
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Generate sample TypeScript files
    const maxFiles = Math.max(...Object.values(TEST_SCENARIOS).map(s => s.files));
    
    for (let i = 1; i <= maxFiles; i++) {
      const fileName = `test-file-${i.toString().padStart(4, '0')}.ts`;
      const filePath = path.join(testDir, fileName);
      
      const content = this.generateTestFileContent(i);
      fs.writeFileSync(filePath, content);
    }
    
    console.log(`   ✅ Generated ${maxFiles} test files`);
  }

  /**
   * 📝 Generate realistic TypeScript content with violations
   */
  generateTestFileContent(fileIndex) {
    const templates = [
      // Template with console.log violations (C002)
      `
// Test file ${fileIndex}
export class TestClass${fileIndex} {
  constructor(private config: Config) {
    console.log('Debugging info'); // C002 violation
  }
  
  async processData(data: any[]): Promise<void> {
    try {
      console.log('Processing:', data.length); // C002 violation
      await this.validate(data);
    } catch (error) {
      console.error('Failed:', error); // Should not trigger C002
    }
  }
  
  private validate(data: any[]): void {
    if (!data) {
      throw new Error('Data required');
    }
  }
}
`,
      // Template with error handling violations
      `
// Test file ${fileIndex}
export async function handleRequest${fileIndex}(req: Request): Promise<Response> {
  const result = await fetch('/api/data'); // Missing error handling
  const data = result.json(); // Missing await and error handling
  
  return {
    status: 200,
    data: data
  };
}

export function syncOperation${fileIndex}(input: string): string {
  try {
    return input.toUpperCase();
  } catch (e) {
    // Empty catch block - violation
  }
}
`,
      // Template with complex violations
      `
// Test file ${fileIndex}
import { Logger } from './logger';

export class Service${fileIndex} {
  private logger = new Logger();
  
  public async complexMethod(params: any): Promise<any> {
    console.log('Method called'); // C002 violation
    
    try {
      const result = await this.processInternal(params);
      console.log('Result:', result); // C002 violation
      return result;
    } catch (error) {
      console.log('Error occurred:', error); // C002 violation
      throw error; // Good: re-throws error
    }
  }
  
  private async processInternal(params: any): Promise<any> {
    // Simulate complex processing
    await new Promise(resolve => setTimeout(resolve, 1));
    return { processed: true, params };
  }
}
`
    ];
    
    return templates[fileIndex % templates.length];
  }

  /**
   * 🧪 Test a specific scenario
   */
  async testScenario(scenarioKey, scenario) {
    const testFiles = this.getTestFiles(scenario.files);
    const testRules = this.getTestRules(scenario.rules);
    
    // Test original engine
    const originalResult = await this.testEngine(
      'Original',
      HeuristicEngine,
      testFiles,
      testRules,
      scenario
    );
    
    // Test optimized engine
    const optimizedResult = await this.testEngine(
      'Optimized',
      OptimizedHeuristicEngine,
      testFiles,
      testRules,
      scenario
    );
    
    // Compare results
    this.compareResults(scenarioKey, originalResult, optimizedResult, scenario);
  }

  /**
   * 🏃‍♂️ Test specific engine
   */
  async testEngine(engineName, EngineClass, files, rules, scenario) {
    const result = {
      name: engineName,
      duration: 0,
      memoryUsed: 0,
      violationsFound: 0,
      filesAnalyzed: 0,
      rulesAnalyzed: 0,
      success: false,
      error: null
    };
    
    try {
      const engine = new EngineClass();
      
      // Initialize engine
      const initStart = performance.now();
      await engine.initialize({
        verbose: false,
        projectPath: path.resolve(__dirname, '../test-performance'),
        targetFiles: files,
        performance: {
          maxFiles: files.length + 100,
          timeout: scenario.expectedTime * 2, // Double expected time
          adaptiveTimeout: true
        }
      });
      const initDuration = performance.now() - initStart;
      
      // Monitor memory before analysis
      const memoryBefore = process.memoryUsage().heapUsed;
      
      // Run analysis
      const analysisStart = performance.now();
      const analysisResult = await engine.analyze(files, rules, { verbose: false });
      const analysisDuration = performance.now() - analysisStart;
      
      // Calculate metrics
      result.duration = initDuration + analysisDuration;
      result.memoryUsed = process.memoryUsage().heapUsed - memoryBefore;
      result.violationsFound = analysisResult.results.reduce((sum, r) => sum + r.violations.length, 0);
      result.filesAnalyzed = analysisResult.filesAnalyzed || files.length;
      result.rulesAnalyzed = analysisResult.metadata?.rulesAnalyzed?.length || rules.length;
      result.success = true;
      
      console.log(`   ${engineName}: ${(result.duration/1000).toFixed(2)}s, ${Math.round(result.memoryUsed/1024/1024)}MB, ${result.violationsFound} violations`);
      
    } catch (error) {
      result.error = error.message;
      result.success = false;
      console.log(`   ${engineName}: ❌ FAILED - ${error.message}`);
    }
    
    return result;
  }

  /**
   * 📊 Compare engine results
   */
  compareResults(scenarioKey, original, optimized, scenario) {
    this.testCount++;
    
    const comparison = {
      scenario: scenarioKey,
      original,
      optimized,
      improvement: {},
      passed: false
    };
    
    if (original.success && optimized.success) {
      // Calculate improvements
      comparison.improvement = {
        speedup: original.duration / optimized.duration,
        memoryReduction: (original.memoryUsed - optimized.memoryUsed) / original.memoryUsed,
        violationsDiff: Math.abs(original.violationsFound - optimized.violationsFound)
      };
      
      // Check if optimization targets are met
      const speedImproved = comparison.improvement.speedup >= 1.1; // 10% faster
      const memoryImproved = comparison.improvement.memoryReduction >= 0.1; // 10% less memory
      const withinTimeout = optimized.duration <= scenario.expectedTime;
      const accuracyMaintained = comparison.improvement.violationsDiff <= original.violationsFound * 0.05; // 5% difference
      
      comparison.passed = speedImproved && memoryImproved && withinTimeout && accuracyMaintained;
      
      if (comparison.passed) {
        this.passCount++;
        console.log(`   ✅ PASS: ${comparison.improvement.speedup.toFixed(2)}x faster, ${(comparison.improvement.memoryReduction*100).toFixed(1)}% less memory`);
      } else {
        this.failCount++;
        console.log(`   ❌ FAIL: Performance targets not met`);
        if (!speedImproved) console.log(`      Speed: ${comparison.improvement.speedup.toFixed(2)}x (need ≥1.1x)`);
        if (!memoryImproved) console.log(`      Memory: ${(comparison.improvement.memoryReduction*100).toFixed(1)}% (need ≥10%)`);
        if (!withinTimeout) console.log(`      Timeout: ${(optimized.duration/1000).toFixed(2)}s (need ≤${scenario.expectedTime/1000}s)`);
        if (!accuracyMaintained) console.log(`      Accuracy: ${comparison.improvement.violationsDiff} violations diff (need ≤${Math.round(original.violationsFound * 0.05)})`);
      }
    } else {
      this.failCount++;
      comparison.passed = false;
      console.log(`   ❌ FAIL: Engine failure`);
    }
    
    this.results.push(comparison);
  }

  /**
   * 🥊 Run comparison tests
   */
  async runComparisonTests() {
    console.log('🥊 Engine Comparison Tests');
    console.log('==========================\n');
    
    // Test with different rule types
    for (const [ruleType, rules] of Object.entries(TEST_RULES)) {
      if (ruleType === 'all' || rules.length === 0) continue;
      
      console.log(`Testing ${ruleType} rules (${rules.length} rules):`);
      
      const testFiles = this.getTestFiles(100);
      const original = await this.testEngine('Original', HeuristicEngine, testFiles, rules, { expectedTime: 30000 });
      const optimized = await this.testEngine('Optimized', OptimizedHeuristicEngine, testFiles, rules, { expectedTime: 30000 });
      
      if (original.success && optimized.success) {
        const speedup = original.duration / optimized.duration;
        console.log(`   Speedup: ${speedup.toFixed(2)}x`);
      }
      
      console.log('');
    }
  }

  /**
   * 🧠 Run memory stress tests
   */
  async runMemoryTests() {
    console.log('🧠 Memory Stress Tests');
    console.log('======================\n');
    
    const largeFiles = this.getTestFiles(1000);
    const allRules = this.getTestRules(73);
    
    console.log('Testing memory with 1000 files + 73 rules:');
    
    try {
      const optimized = await this.testEngine(
        'Optimized', 
        OptimizedHeuristicEngine, 
        largeFiles, 
        allRules,
        { expectedTime: 300000 }
      );
      
      if (optimized.success) {
        const memoryMB = Math.round(optimized.memoryUsed / 1024 / 1024);
        console.log(`   ✅ Memory usage: ${memoryMB}MB (target: <2048MB)`);
        if (memoryMB < 2048) {
          console.log('   ✅ Memory target achieved');
        } else {
          console.log('   ⚠️  Memory usage high but functional');
        }
      }
    } catch (error) {
      console.log(`   ❌ Memory test failed: ${error.message}`);
    }
    
    console.log('');
  }

  /**
   * ⏰ Run timeout tests
   */
  async runTimeoutTests() {
    console.log('⏰ Timeout Stress Tests');
    console.log('=======================\n');
    
    const timeoutScenarios = [
      { files: 500, rules: 30, timeout: 30000, name: 'Short timeout' },
      { files: 1000, rules: 50, timeout: 60000, name: 'Medium timeout' },
      { files: 1500, rules: 73, timeout: 120000, name: 'Long timeout' }
    ];
    
    for (const scenario of timeoutScenarios) {
      console.log(`${scenario.name}: ${scenario.files} files, ${scenario.rules} rules, ${scenario.timeout/1000}s timeout`);
      
      const testFiles = this.getTestFiles(scenario.files);
      const testRules = this.getTestRules(scenario.rules);
      
      try {
        const result = await this.testEngine(
          'Optimized',
          OptimizedHeuristicEngine,
          testFiles,
          testRules,
          { expectedTime: scenario.timeout }
        );
        
        if (result.success) {
          console.log(`   ✅ Completed within timeout: ${(result.duration/1000).toFixed(2)}s`);
        } else {
          console.log(`   ❌ Failed: ${result.error}`);
        }
      } catch (error) {
        console.log(`   ❌ Timeout test failed: ${error.message}`);
      }
      
      console.log('');
    }
  }

  /**
   * 📁 Get test files for scenario
   */
  getTestFiles(count) {
    const testDir = path.resolve(__dirname, '../test-performance');
    const allFiles = fs.readdirSync(testDir)
      .filter(file => file.endsWith('.ts'))
      .map(file => path.join(testDir, file))
      .slice(0, count);
    
    return allFiles;
  }

  /**
   * 📋 Get test rules for scenario
   */
  getTestRules(count) {
    const selectedRules = TEST_RULES.all.slice(0, count);
    return selectedRules.map(id => ({ id }));
  }

  /**
   * 📊 Print test summary
   */
  printSummary() {
    console.log('📊 Performance Test Summary');
    console.log('============================\n');
    
    console.log(`Total Tests: ${this.testCount}`);
    console.log(`Passed: ${this.passCount} ✅`);
    console.log(`Failed: ${this.failCount} ❌`);
    console.log(`Success Rate: ${((this.passCount/this.testCount)*100).toFixed(1)}%\n`);
    
    // Detailed results
    for (const result of this.results) {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.scenario}: ${result.improvement.speedup?.toFixed(2)}x speedup`);
    }
    
    console.log('\\n🎯 Performance Optimization Validation:');
    
    if (this.passCount >= this.testCount * 0.8) {
      console.log('✅ Performance optimization successful! 80%+ tests passed.');
    } else if (this.passCount >= this.testCount * 0.6) {
      console.log('⚠️  Performance optimization partially successful. 60%+ tests passed.');
    } else {
      console.log('❌ Performance optimization needs more work. <60% tests passed.');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const testSuite = new PerformanceTestSuite();
  testSuite.runTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = PerformanceTestSuite;
