const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * Handles loading configuration from various sources (files, environment, etc.)
 * Rule C005: Single responsibility - chỉ load config từ sources
 * Rule C015: Domain language - ConfigSourceLoader
 */
class ConfigSourceLoader {
  constructor() {
    this.configNames = [
      '.sunlint.json',
      '.sunlint.js', 
      'sunlint.config.json',
      'sunlint.config.js'
    ];
  }

  /**
   * Rule C006: loadGlobalConfiguration - verb-noun naming
   */
  loadGlobalConfiguration(homePath, verbose = false) {
    const globalConfigPath = path.join(homePath, '.sunlint.json');
    if (!fs.existsSync(globalConfigPath)) {
      return null;
    }

    try {
      const globalConfig = JSON.parse(fs.readFileSync(globalConfigPath, 'utf8'));
      if (verbose) {
        console.log(chalk.gray(`🌍 Loaded global config: ${globalConfigPath}`));
      }
      return { config: globalConfig, path: globalConfigPath };
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Failed to load global config: ${error.message}`));
      return null;
    }
  }

  /**
   * Rule C006: findProjectConfiguration - verb-noun naming
   */
  findProjectConfiguration(startDir) {
    let currentDir = path.resolve(startDir);
    const rootDir = path.parse(currentDir).root;

    while (currentDir !== rootDir) {
      // Check for SunLint config files
      for (const configName of this.configNames) {
        const configPath = path.join(currentDir, configName);
        if (fs.existsSync(configPath)) {
          try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            return { path: configPath, config, dir: currentDir };
          } catch (error) {
            console.warn(chalk.yellow(`⚠️  Invalid config file ${configPath}: ${error.message}`));
          }
        }
      }

      // Check package.json for sunlint config
      const packageResult = this.loadPackageJsonConfig(currentDir);
      if (packageResult) {
        return packageResult;
      }

      currentDir = path.dirname(currentDir);
    }

    return null;
  }

  /**
   * Rule C006: loadPackageJsonConfig - verb-noun naming
   * Rule C005: Extracted method for single responsibility
   */
  loadPackageJsonConfig(directory) {
    const packageJsonPath = path.join(directory, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return null;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (packageJson.sunlint) {
        return { path: packageJsonPath, config: packageJson.sunlint, dir: directory };
      }
    } catch (error) {
      // Ignore package.json parse errors
    }

    return null;
  }

  /**
   * Rule C006: loadSpecificConfigFile - verb-noun naming
   */
  loadSpecificConfigFile(configPath, verbose = false) {
    if (!configPath || !fs.existsSync(configPath)) {
      return null;
    }

    try {
      const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (verbose) {
        console.log(chalk.gray(`📄 Loaded config from: ${configPath}`));
      }
      return { config: fileConfig, path: configPath };
    } catch (error) {
      console.error(chalk.red(`❌ Failed to load config from ${configPath}:`), error.message);
      return null;
    }
  }

  /**
   * Rule C006: loadIgnorePatterns - verb-noun naming
   */
  loadIgnorePatterns(projectDir, verbose = false) {
    const ignoreFiles = ['.sunlintignore', '.eslintignore', '.gitignore'];
    const ignorePatterns = [];

    for (const ignoreFile of ignoreFiles) {
      const ignorePath = path.join(projectDir, ignoreFile);
      if (fs.existsSync(ignorePath)) {
        try {
          const ignoreContent = fs.readFileSync(ignorePath, 'utf8');
          const patterns = ignoreContent
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'))
            .filter(line => !ignorePatterns.includes(line));
          
          ignorePatterns.push(...patterns);
          
          if (verbose) {
            console.log(chalk.gray(`📋 Loaded ignore patterns from: ${ignorePath} (${patterns.length} patterns)`));
          }
          
          // Only use the first ignore file found
          break;
        } catch (error) {
          console.warn(chalk.yellow(`⚠️  Failed to load ignore file ${ignorePath}: ${error.message}`));
        }
      }
    }

    return [...new Set(ignorePatterns)]; // Remove duplicates
  }
}

module.exports = ConfigSourceLoader;
