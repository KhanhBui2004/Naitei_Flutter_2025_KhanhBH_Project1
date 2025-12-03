#!/usr/bin/env node

/**
 * SunLint CLI Entry Point
 * Main CLI entry point with modular architecture
 * Following Rule C005: Single responsibility - only handle CLI bootstrapping
 * Following Rule C014: Dependency injection for services
 */

const chalk = require('chalk');
const { createCliProgram } = require('./core/cli-program');
const CliActionHandler = require('./core/cli-action-handler');

// Create CLI program
const program = createCliProgram();

// Set up main action handler
program.action(async (options) => {
  // Always use modern architecture (legacy removed)
  const actionHandler = new CliActionHandler(options);
  await actionHandler.execute();
});

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Sun Lint - Unhandled Rejection:'), promise, chalk.red('reason:'), reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('Sun Lint - Uncaught Exception:'), error);
  process.exit(1);
});

// Parse CLI arguments
program.parse();
