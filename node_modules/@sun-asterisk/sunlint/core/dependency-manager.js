const chalk = require('chalk');
const { execSync } = require('child_process');

/**
 * Handles dependency validation and installation
 * Rule C005: Single responsibility - only dependency management
 * Rule C015: Domain language - DependencyManager
 * Rule C032: No external API calls in constructor
 */
class DependencyManager {
  constructor() {
    this.requiredDependencies = [
      '@typescript-eslint/parser',
      '@typescript-eslint/eslint-plugin',
      'eslint'
    ];
  }

  /**
   * Rule C006: checkDependenciesAvailable - verb-noun naming
   * Rule C012: Query method - checks without side effects
   */
  async checkDependenciesAvailable() {
    const missingDeps = [];
    
    for (const dep of this.requiredDependencies) {
      try {
        require.resolve(dep);
      } catch (error) {
        missingDeps.push(dep);
      }
    }

    return {
      allAvailable: missingDeps.length === 0,
      missing: missingDeps
    };
  }

  /**
   * Rule C006: installMissingDependencies - verb-noun naming
   * Rule C012: Command method - performs installation
   */
  async installMissingDependencies() {
    const { allAvailable, missing } = await this.checkDependenciesAvailable();
    
    if (allAvailable) {
      console.log(chalk.green('✅ All TypeScript dependencies are available'));
      return true;
    }

    console.log(chalk.yellow(`⚠️  Missing dependencies: ${missing.join(', ')}`));
    console.log(chalk.blue('📦 Installing missing dependencies...'));
    
    try {
      const installCommand = `npm install ${missing.join(' ')}`;
      execSync(installCommand, { stdio: 'inherit', cwd: process.cwd() });
      
      console.log(chalk.green('✅ Dependencies installed successfully'));
      return true;
    } catch (error) {
      console.error(chalk.red('❌ Failed to install dependencies:'), error.message);
      console.log(chalk.yellow('💡 Please install manually:'));
      console.log(chalk.gray(`   npm install ${missing.join(' ')}`));
      return false;
    }
  }

  /**
   * Rule C006: validateDependencyVersions - verb-noun naming
   * Rule C012: Query method
   */
  validateDependencyVersions() {
    const versions = {};
    
    for (const dep of this.requiredDependencies) {
      try {
        const packagePath = require.resolve(`${dep}/package.json`);
        const packageInfo = require(packagePath);
        versions[dep] = packageInfo.version;
      } catch (error) {
        versions[dep] = 'not found';
      }
    }

    return versions;
  }

  /**
   * Rule C006: logDependencyStatus - verb-noun naming
   */
  logDependencyStatus() {
    const versions = this.validateDependencyVersions();
    
    console.log(chalk.blue('📦 TypeScript Dependencies:'));
    for (const [dep, version] of Object.entries(versions)) {
      const status = version === 'not found' 
        ? chalk.red('❌ Not found')
        : chalk.green(`✅ v${version}`);
      console.log(`   ${dep}: ${status}`);
    }
  }
}

module.exports = DependencyManager;
