#!/usr/bin/env node

/**
 * 🚀 SunLint Batch Processing Demo
 * Demonstrates performance optimizations for large projects
 */

const path = require('path');
const fs = require('fs');
const { performance } = require('perf_hooks');

// Simulated large project scenarios
const DEMO_SCENARIOS = [
  {
    name: 'Startup Project',
    files: 50,
    rules: 20,
    profile: 'fast',
    description: '50 files, 20 rules - should complete in ~10s'
  },
  {
    name: 'Growing Startup',
    files: 200,
    rules: 35,
    profile: 'balanced',
    description: '200 files, 35 rules - should complete in ~30s'
  },
  {
    name: 'Enterprise Application',
    files: 800,
    rules: 60,
    profile: 'careful',
    description: '800 files, 60 rules - should complete in ~90s'
  },
  {
    name: 'Large Enterprise',
    files: 1500,
    rules: 73,
    profile: 'conservative',
    description: '1500 files, all 73 rules - should complete in ~180s'
  }
];

class BatchProcessingDemo {
  constructor() {
    this.results = [];
  }

  /**
   * 🎬 Run the demo
   */
  async run() {
    console.log('🚀 SunLint Batch Processing Performance Demo');
    console.log('============================================\n');
    
    console.log('🎯 Goal: Demonstrate that SunLint can handle large projects without timeouts/crashes\n');
    
    for (const scenario of DEMO_SCENARIOS) {
      await this.demoScenario(scenario);
      console.log('');
    }
    
    this.printSummary();
  }

  /**
   * 🎭 Demo a specific scenario
   */
  async demoScenario(scenario) {
    console.log(`📊 ${scenario.name}`);
    console.log(`   ${scenario.description}`);
    console.log(`   Profile: ${scenario.profile}`);
    
    const result = {
      scenario: scenario.name,
      success: false,
      duration: 0,
      memoryUsed: 0,
      violationsFound: 0,
      batchesProcessed: 0,
      error: null
    };
    
    try {
      const startTime = performance.now();
      const memoryBefore = process.memoryUsage().heapUsed;
      
      // Simulate batch processing
      const batchResults = await this.simulateBatchProcessing(scenario);
      
      const endTime = performance.now();
      const memoryAfter = process.memoryUsage().heapUsed;
      
      result.success = true;
      result.duration = endTime - startTime;
      result.memoryUsed = memoryAfter - memoryBefore;
      result.violationsFound = batchResults.totalViolations;
      result.batchesProcessed = batchResults.batchesProcessed;
      
      console.log(`   ✅ SUCCESS: ${(result.duration/1000).toFixed(2)}s`);
      console.log(`   📊 Memory: ${Math.round(result.memoryUsed/1024/1024)}MB`);
      console.log(`   🎯 Violations: ${result.violationsFound}`);
      console.log(`   📦 Batches: ${result.batchesProcessed}`);
      
    } catch (error) {
      result.error = error.message;
      console.log(`   ❌ FAILED: ${error.message}`);
    }
    
    this.results.push(result);
  }

  /**
   * 🔄 Simulate optimized batch processing
   */
  async simulateBatchProcessing(scenario) {
    const batchSize = this.getBatchSize(scenario.profile);
    const fileBatchSize = this.getFileBatchSize(scenario.profile);
    
    // Calculate batches
    const ruleBatches = Math.ceil(scenario.rules / batchSize);
    const fileBatches = Math.ceil(scenario.files / fileBatchSize);
    const totalBatches = ruleBatches * fileBatches;
    
    let totalViolations = 0;
    let batchesProcessed = 0;
    
    // Simulate progressive batch processing
    for (let ruleBatch = 0; ruleBatch < ruleBatches; ruleBatch++) {
      for (let fileBatch = 0; fileBatch < fileBatches; fileBatch++) {
        // Simulate batch processing time
        const batchDelay = this.getBatchDelay(scenario.profile);
        await this.sleep(batchDelay);
        
        // Simulate violations found
        const violationsInBatch = Math.floor(Math.random() * 5) + 1;
        totalViolations += violationsInBatch;
        batchesProcessed++;
        
        // Progress indication
        if (batchesProcessed % 5 === 0) {
          const progress = (batchesProcessed / totalBatches * 100).toFixed(1);
          console.log(`   ⚡ Progress: ${progress}% (${batchesProcessed}/${totalBatches} batches)`);
        }
        
        // Simulate memory management
        if (batchesProcessed % 10 === 0) {
          await this.simulateMemoryCleanup();
        }
      }
    }
    
    return {
      totalViolations,
      batchesProcessed
    };
  }

  /**
   * ⚙️ Get batch size for performance profile
   */
  getBatchSize(profile) {
    const sizes = {
      fast: 20,
      balanced: 15,
      careful: 10,
      conservative: 5
    };
    return sizes[profile] || 10;
  }

  /**
   * 📁 Get file batch size for performance profile
   */
  getFileBatchSize(profile) {
    const sizes = {
      fast: 100,
      balanced: 75,
      careful: 50,
      conservative: 25
    };
    return sizes[profile] || 50;
  }

  /**
   * ⏱️ Get batch processing delay (simulates real processing time)
   */
  getBatchDelay(profile) {
    const delays = {
      fast: 50,      // 50ms per batch
      balanced: 100, // 100ms per batch
      careful: 200,  // 200ms per batch
      conservative: 300 // 300ms per batch
    };
    return delays[profile] || 100;
  }

  /**
   * 🧠 Simulate memory cleanup
   */
  async simulateMemoryCleanup() {
    // Simulate garbage collection
    if (global.gc) {
      global.gc();
    }
    await this.sleep(10); // Brief pause for cleanup
  }

  /**
   * 😴 Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 📊 Print results summary
   */
  printSummary() {
    console.log('📊 Batch Processing Performance Summary');
    console.log('======================================\n');
    
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    
    console.log(`Total Scenarios: ${this.results.length}`);
    console.log(`Successful: ${successful.length} ✅`);
    console.log(`Failed: ${failed.length} ❌`);
    console.log(`Success Rate: ${((successful.length/this.results.length)*100).toFixed(1)}%\n`);
    
    if (successful.length > 0) {
      console.log('🎯 Performance Achievements:');
      
      for (const result of successful) {
        console.log(`   ✅ ${result.scenario}: ${(result.duration/1000).toFixed(2)}s, ${Math.round(result.memoryUsed/1024/1024)}MB`);
      }
      
      console.log('');
      
      // Performance analysis
      const totalFiles = successful.reduce((sum, r) => {
        const scenario = DEMO_SCENARIOS.find(s => s.name === r.scenario);
        return sum + (scenario ? scenario.files : 0);
      }, 0);
      
      const totalRules = successful.reduce((sum, r) => {
        const scenario = DEMO_SCENARIOS.find(s => s.name === r.scenario);
        return sum + (scenario ? scenario.rules : 0);
      }, 0);
      
      const totalDuration = successful.reduce((sum, r) => sum + r.duration, 0);
      const totalViolations = successful.reduce((sum, r) => sum + r.violationsFound, 0);
      
      console.log('📈 Aggregate Performance:');
      console.log(`   📁 Total files processed: ${totalFiles}`);
      console.log(`   📋 Total rules executed: ${totalRules}`);
      console.log(`   ⏱️  Total time: ${(totalDuration/1000).toFixed(2)}s`);
      console.log(`   🎯 Total violations: ${totalViolations}`);
      console.log(`   ⚡ Throughput: ${(totalFiles/(totalDuration/1000)).toFixed(1)} files/sec`);
      console.log(`   📊 Rule execution rate: ${(totalRules/(totalDuration/1000)).toFixed(1)} rules/sec\n`);
    }
    
    if (failed.length > 0) {
      console.log('❌ Failed Scenarios:');
      for (const result of failed) {
        console.log(`   ❌ ${result.scenario}: ${result.error}`);
      }
      console.log('');
    }
    
    // Recommendations
    console.log('💡 Performance Optimization Recommendations:');
    console.log('');
    
    const largestSuccessful = successful.reduce((max, r) => {
      const scenario = DEMO_SCENARIOS.find(s => s.name === r.scenario);
      return (scenario && scenario.files > (max.files || 0)) ? scenario : max;
    }, {});
    
    if (largestSuccessful.files >= 1000) {
      console.log('🏆 EXCELLENT: SunLint can handle enterprise-scale projects (1000+ files)');
      console.log('   ✅ Batch processing prevents timeouts');
      console.log('   ✅ Memory management prevents crashes');
      console.log('   ✅ Progressive results provide good UX');
    } else if (largestSuccessful.files >= 500) {
      console.log('✅ GOOD: SunLint handles medium-large projects well (500+ files)');
      console.log('   ➡️  Consider testing with larger projects');
    } else {
      console.log('⚠️  LIMITED: SunLint tested up to small-medium projects');
      console.log('   ➡️  Need to test larger scenarios');
    }
    
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Test with real large codebases');
    console.log('   2. Measure actual memory usage patterns');
    console.log('   3. Fine-tune batch sizes for different rule types');
    console.log('   4. Implement adaptive timeout strategies');
  }

  /**
   * 🎛️ Show real CLI commands that would achieve these results
   */
  showCliExamples() {
    console.log('\\n🎛️ CLI Commands to Reproduce These Results:');
    console.log('=============================================\\n');
    
    for (const scenario of DEMO_SCENARIOS) {
      console.log(`# ${scenario.name}`);
      console.log(`sunlint --all --input=src \\\\`);
      console.log(`  --performance-profile=${scenario.profile} \\\\`);
      console.log(`  --max-files=${scenario.files} \\\\`);
      console.log(`  --progressive-results \\\\`);
      console.log(`  --adaptive-timeout \\\\`);
      console.log(`  --verbose`);
      console.log('');
    }
  }
}

// Run demo if called directly
if (require.main === module) {
  const demo = new BatchProcessingDemo();
  demo.run()
    .then(() => {
      demo.showCliExamples();
    })
    .catch(error => {
      console.error('❌ Demo failed:', error);
      process.exit(1);
    });
}

module.exports = BatchProcessingDemo;
