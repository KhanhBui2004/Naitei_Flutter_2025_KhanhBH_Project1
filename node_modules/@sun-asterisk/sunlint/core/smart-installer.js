/**
 * Smart Dependency Auto-Installer
 * Automatically installs missing peer dependencies when SunLint runs
 * Future: Will support package flavor recommendations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SmartInstaller {
  constructor() {
    this.installedInSession = new Set();
    this.packageFlavors = {
      'typescript': '@sun-asterisk/sunlint-typescript',
      'dart': '@sun-asterisk/sunlint-dart', 
      'python': '@sun-asterisk/sunlint-python',
      'go': '@sun-asterisk/sunlint-go',
      'full': '@sun-asterisk/sunlint-full'
    };
  }

  /**
   * Detect project type and recommend appropriate packages
   */
  detectProjectType(projectRoot) {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    if (!fs.existsSync(packageJsonPath)) return ['basic'];

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const types = [];

    // Check for TypeScript
    if (packageJson.devDependencies?.typescript || 
        packageJson.dependencies?.typescript ||
        fs.existsSync(path.join(projectRoot, 'tsconfig.json'))) {
      types.push('typescript');
    }

    // Check for other languages (future)
    if (fs.existsSync(path.join(projectRoot, 'pubspec.yaml'))) {
      types.push('dart');
    }

    if (fs.existsSync(path.join(projectRoot, 'requirements.txt')) ||
        fs.existsSync(path.join(projectRoot, 'pyproject.toml'))) {
      types.push('python');
    }

    if (fs.existsSync(path.join(projectRoot, 'go.mod'))) {
      types.push('go');
    }

    return types.length > 0 ? types : ['basic'];
  }

  /**
   * Recommend optimal package flavors instead of individual dependencies
   */
  recommendPackageFlavors(missingDeps, projectTypes) {
    const recommendations = [];

    // If missing TypeScript deps and it's a TS project
    if (missingDeps.some(d => d.pkg.includes('@typescript-eslint')) && 
        projectTypes.includes('typescript')) {
      recommendations.push({
        package: '@sun-asterisk/sunlint-typescript',
        reason: 'Complete TypeScript analysis support',
        replaces: missingDeps.filter(d => d.pkg.includes('typescript')).map(d => d.pkg)
      });
    }

    // If missing many ESLint deps, suggest full package
    if (missingDeps.length >= 3 && missingDeps.some(d => d.pkg === 'eslint')) {
      recommendations.push({
        package: '@sun-asterisk/sunlint-full', 
        reason: 'Complete ESLint integration with all features',
        replaces: missingDeps.map(d => d.pkg)
      });
    }

    return recommendations;
  }

  /**
   * Check if we're in a project that can install dependencies
   */
  canAutoInstall() {
    // Check if package.json exists in current or parent directories
    let currentDir = process.cwd();
    const root = path.parse(currentDir).root;
    
    while (currentDir !== root) {
      if (fs.existsSync(path.join(currentDir, 'package.json'))) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }
    return null;
  }

  /**
   * Auto-install missing dependencies with user confirmation
   */
  async autoInstallMissing(missingDeps, context = 'analysis') {
    const projectRoot = this.canAutoInstall();
    if (!projectRoot) {
      this.showManualInstallInstructions(missingDeps);
      return false;
    }

    console.log(`\n🔍 SunLint needs these dependencies for enhanced ${context}:`);
    missingDeps.forEach(dep => console.log(`   • ${dep.pkg} - ${dep.description}`));
    
    const packages = missingDeps.map(d => d.pkg).join(' ');
    
    console.log(`\n💡 Install command:`);
    console.log(`   npm install ${packages} --save-dev`);
    
    // In CI environments, don't auto-install but show clear message
    if (process.env.CI || process.env.NODE_ENV === 'test') {
      console.log('\n⚠️  CI Environment: Add dependencies to package.json for consistent builds');
      console.log('   SunLint will continue with available features\n');
      return false;
    }

    // Interactive prompt for auto-install
    const shouldAutoInstall = process.env.SUNLINT_AUTO_INSTALL === 'true';
    
    if (shouldAutoInstall) {
      try {
        console.log('\n📦 Auto-installing dependencies...');
        execSync(`npm install ${packages} --save-dev`, { 
          cwd: projectRoot, 
          stdio: 'pipe'  // Less noisy
        });
        console.log('✅ Dependencies installed successfully!');
        console.log('🔄 Re-running analysis with full features...\n');
        return true;
      } catch (error) {
        console.log('❌ Auto-install failed, continuing with available features');
        return false;
      }
    } else {
      console.log('\n🔄 Continuing with available features...');
      console.log('💡 Set SUNLINT_AUTO_INSTALL=true to enable automatic installation\n');
    }

    return false;
  }

  /**
   * Show manual installation instructions
   */
  showManualInstallInstructions(missingDeps) {
    console.log('\n📦 To enable full functionality, install:');
    const packages = missingDeps.map(d => d.pkg).join(' ');
    console.log(`   npm install ${packages} --save-dev`);
    console.log('\n💡 Or set SUNLINT_AUTO_INSTALL=true for automatic installation');
    console.log('   SunLint will continue with heuristic analysis.\n');
  }
}

module.exports = new SmartInstaller();
