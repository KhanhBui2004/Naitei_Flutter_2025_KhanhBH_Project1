/**
 * Dependency Checker
 * Checks for optional peer dependencies and provides helpful messages
 */

class DependencyChecker {
  constructor() {
    this.checkedDependencies = new Set();
  }

  /**
   * Check if a dependency is available
   */
  isDependencyAvailable(packageName) {
    try {
      require.resolve(packageName);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check for ESLint engine dependencies
   */
  checkESLintDependencies() {
    const dependencies = {
      'eslint': { required: false, description: 'ESLint engine support' },
      '@typescript-eslint/eslint-plugin': { required: false, description: 'TypeScript ESLint rules' },
      '@typescript-eslint/parser': { required: false, description: 'TypeScript ESLint parsing' },
      'typescript': { required: false, description: 'TypeScript compiler' }
    };

    const missing = [];
    const available = [];

    for (const [pkg, info] of Object.entries(dependencies)) {
      if (this.isDependencyAvailable(pkg)) {
        available.push(pkg);
      } else {
        missing.push({ pkg, ...info });
      }
    }

    return { available, missing };
  }

  /**
   * Check for AST parsing dependencies
   */
  checkASTDependencies() {
    const dependencies = {
      '@babel/parser': { required: false, description: 'JavaScript AST parsing' },
      'espree': { required: false, description: 'ECMAScript AST parsing' }
    };

    const missing = [];
    const available = [];

    for (const [pkg, info] of Object.entries(dependencies)) {
      if (this.isDependencyAvailable(pkg)) {
        available.push(pkg);
      } else {
        missing.push({ pkg, ...info });
      }
    }

    return { available, missing };
  }

  /**
   * Show installation instructions for missing dependencies
   */
  showInstallationInstructions(missing, context = 'general') {
    if (missing.length === 0) return;

    console.log('\n📦 Optional dependencies not found:');
    
    for (const { pkg, description } of missing) {
      console.log(`   • ${pkg} - ${description}`);
    }

    const packages = missing.map(m => m.pkg).join(' ');
    
    if (context === 'eslint') {
      console.log('\n💡 To enable ESLint engine features, install:');
      console.log(`   npm install ${packages}`);
      console.log('\n   Or add to your project dependencies if you already have them.');
    } else if (context === 'ast') {
      console.log('\n💡 To enable AST analysis features, install:');
      console.log(`   npm install ${packages}`);
    } else {
      console.log('\n💡 To enable full functionality, install:');
      console.log(`   npm install ${packages}`);
    }

    console.log('\n   SunLint will continue using heuristic analysis.\n');
  }

  /**
   * Check and notify about missing dependencies (only once per session)
   */
  checkAndNotify(type = 'all') {
    const key = `checked_${type}`;
    if (this.checkedDependencies.has(key)) return;
    
    this.checkedDependencies.add(key);

    if (type === 'eslint' || type === 'all') {
      const { missing } = this.checkESLintDependencies();
      if (missing.length > 0) {
        this.showInstallationInstructions(missing, 'eslint');
      }
    }

    if (type === 'ast' || type === 'all') {
      const { missing } = this.checkASTDependencies();
      if (missing.length > 0) {
        this.showInstallationInstructions(missing, 'ast');
      }
    }
  }
}

module.exports = new DependencyChecker();
