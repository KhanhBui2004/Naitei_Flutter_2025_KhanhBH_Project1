const chalk = require('chalk');
const { table } = require('table');
const path = require('path');

class ReportGenerator {
  constructor(config, options) {
    this.config = config;
    this.options = options;
  }

  async generateReport(results, metadata) {
    const report = {
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        tool: '☀️ Sun Lint',
        company: 'Sun*',
        format: this.options?.format || 'eslint'
      },
      raw: results,
      formatted: '',
      summary: ''
    };

    // Generate formatted output based on format
    switch (this.options?.format) {
      case 'eslint':
        report.formatted = this.generateESLintFormat(results);
        break;
      case 'json':
        report.formatted = JSON.stringify(results, null, 2);
        break;
      case 'summary':
        report.formatted = this.generateSummaryFormat(results);
        break;
      case 'table':
        report.formatted = this.generateTableFormat(results);
        break;
      default:
        report.formatted = this.generateESLintFormat(results);
    }

    // Generate summary
    report.summary = this.generateSummary(results, metadata);

    return report;
  }

  generateESLintFormat(results) {
    const violations = this.flattenViolations(results);
    
    if (violations.length === 0) {
      return chalk.green('✨ No coding standard violations found!');
    }

    const groupedByFile = this.groupViolationsByFile(violations);
    let output = '';

    for (const [file, fileViolations] of Object.entries(groupedByFile)) {
      const relativePath = path.relative(process.cwd(), file);
      output += `\n${chalk.underline(relativePath)}\n`;

      fileViolations.forEach(violation => {
        const severityColor = this.getSeverityColor(violation.severity);
        const line = violation.line || 1;
        const column = violation.column || 1;
        
        output += `  ${line}:${column}  `;
        output += `${severityColor(this.getSeveritySymbol(violation.severity))} `;
        output += `${violation.message}  `;
        output += `${chalk.gray(violation.ruleId)}\n`;
      });
    }

    // Add summary line
    const errorCount = violations.filter(v => v.severity === 'error').length;
    const warningCount = violations.filter(v => v.severity === 'warning').length;
    const infoCount = violations.filter(v => v.severity === 'info').length;

    output += '\n';
    output += chalk.red(`✖ ${violations.length} problems `);
    output += `(${errorCount} errors, ${warningCount} warnings, ${infoCount} infos)\n`;

    return output;
  }

  generateSummaryFormat(results) {
    const violations = this.flattenViolations(results);
    let output = '';

    // Header
    output += chalk.blue.bold('🔍 Coding Standards Analysis Report\n');
    output += chalk.gray('═'.repeat(50)) + '\n\n';

    // Overview
    output += chalk.white.bold('📊 Overview:\n');
    output += `  Files analyzed: ${results.filesAnalyzed || 0}\n`;
    output += `  Rules executed: ${results.rulesRun || 0}\n`;
    output += `  Total violations: ${violations.length}\n\n`;

    // Violations by severity
    const bySeverity = results.violationsBySeverity || {};
    output += chalk.white.bold('🚨 Violations by Severity:\n');
    output += `  ${chalk.red('Errors')}: ${bySeverity.error || 0}\n`;
    output += `  ${chalk.yellow('Warnings')}: ${bySeverity.warning || 0}\n`;
    output += `  ${chalk.blue('Info')}: ${bySeverity.info || 0}\n\n`;

    // Top violated rules
    if (results.violationsByRule && Object.keys(results.violationsByRule).length > 0) {
      output += chalk.white.bold('📏 Most Violated Rules:\n');
      const sortedRules = Object.entries(results.violationsByRule)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      
      sortedRules.forEach(([ruleId, count]) => {
        output += `  ${ruleId}: ${count} violations\n`;
      });
      output += '\n';
    }

    // Top problematic files
    if (results.violationsByFile && Object.keys(results.violationsByFile).length > 0) {
      output += chalk.white.bold('📁 Most Problematic Files:\n');
      const sortedFiles = Object.entries(results.violationsByFile)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      
      sortedFiles.forEach(([file, count]) => {
        const relativePath = path.relative(process.cwd(), file);
        output += `  ${relativePath}: ${count} violations\n`;
      });
      output += '\n';
    }

    // Recent violations (first 10)
    if (violations.length > 0) {
      output += chalk.white.bold('🔍 Recent Violations:\n');
      violations.slice(0, 10).forEach(violation => {
        const relativePath = path.relative(process.cwd(), violation.file || '');
        const severityColor = this.getSeverityColor(violation.severity);
        output += `  ${severityColor(violation.severity.toUpperCase())}: ${violation.message}\n`;
        output += `    ${chalk.gray(`at ${relativePath}:${violation.line || 1}:${violation.column || 1} (${violation.ruleId})`)}\n`;
      });
    }

    return output;
  }

  generateTableFormat(results) {
    const violations = this.flattenViolations(results);
    
    if (violations.length === 0) {
      return chalk.green('✨ No coding standard violations found!');
    }

    // Check if this is an integrated analysis with source information
    const hasSourceInfo = violations.some(v => v.source);
    
    const tableData = hasSourceInfo 
      ? [['File', 'Line', 'Severity', 'Source', 'Rule', 'Message']]
      : [['File', 'Line', 'Severity', 'Rule', 'Message']];

    violations.forEach(violation => {
      const relativePath = path.relative(process.cwd(), violation.file || '');
      const row = [
        relativePath,
        (violation.line || 1).toString(),
        violation.severity,
      ];
      
      if (hasSourceInfo) {
        // Add source information with color coding
        const sourceDisplay = violation.source === 'sunlint' 
          ? chalk.yellow('SunLint') 
          : chalk.cyan('ESLint');
        row.push(sourceDisplay);
      }
      
      row.push(
        violation.ruleId || 'unknown',
        violation.message.substring(0, 50) + (violation.message.length > 50 ? '...' : '')
      );
      
      // Add conflict info if available
      if (violation.additionalInfo) {
        row[row.length - 1] += chalk.gray(` (ESLint: ${violation.additionalInfo.eslintRule})`);
      }
      
      tableData.push(row);
    });

    const config = {
      border: {
        topBody: '─',
        topJoin: '┬',
        topLeft: '┌',
        topRight: '┐',
        bottomBody: '─',
        bottomJoin: '┴',
        bottomLeft: '└',
        bottomRight: '┘',
        bodyLeft: '│',
        bodyRight: '│',
        bodyJoin: '│',
        joinBody: '─',
        joinLeft: '├',
        joinRight: '┤',
        joinJoin: '┼'
      }
    };

    return table(tableData, config);
  }

  generateSummary(results, metadata) {
    const violations = this.flattenViolations(results);
    const errorCount = violations.filter(v => v.severity === 'error').length;
    const warningCount = violations.filter(v => v.severity === 'warning').length;
    const infoCount = violations.filter(v => v.severity === 'info').length;

    let summary = '';
    summary += `Analysis completed in ${metadata.duration}ms\n`;
    summary += `Files: ${results.filesAnalyzed || 0} | Rules: ${metadata.rulesRun} | Total: ${violations.length}\n`;
    
    if (errorCount > 0) {
      summary += chalk.red(`Errors: ${errorCount} `);
    }
    if (warningCount > 0) {
      summary += chalk.yellow(`Warnings: ${warningCount} `);
    }
    if (infoCount > 0) {
      summary += chalk.blue(`Info: ${infoCount} `);
    }

    return summary.trim();
  }

  flattenViolations(results) {
    const violations = [];
    
    if (results.results) {
      results.results.forEach(result => {
        // Handle SunLint format (violations array)
        if (result.violations) {
          result.violations.forEach(violation => {
            violations.push({
              ...violation,
              ruleId: violation.ruleId || result.ruleId,
              severity: violation.severity || result.severity || 'warning'
            });
          });
        }
        
        // Handle ESLint format (messages array)
        if (result.messages) {
          result.messages.forEach(message => {
            violations.push({
              file: result.filePath || message.file,
              ruleId: message.ruleId,
              severity: message.severity === 2 ? 'error' : 'warning',
              message: message.message,
              line: message.line,
              column: message.column,
              source: message.source || 'eslint'
            });
          });
        }
      });
    }

    return violations;
  }

  groupViolationsByFile(violations) {
    const grouped = {};
    
    violations.forEach(violation => {
      const file = violation.file || violation.filePath || 'unknown';
      if (!grouped[file]) {
        grouped[file] = [];
      }
      grouped[file].push(violation);
    });

    // Sort violations within each file by line number
    Object.keys(grouped).forEach(file => {
      grouped[file].sort((a, b) => (a.line || 1) - (b.line || 1));
    });

    return grouped;
  }

  getSeverityColor(severity) {
    switch (severity) {
      case 'error':
        return chalk.red;
      case 'warning':
        return chalk.yellow;
      case 'info':
        return chalk.blue;
      default:
        return chalk.gray;
    }
  }

  getSeveritySymbol(severity) {
    switch (severity) {
      case 'error':
        return '✖';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '•';
    }
  }
}

module.exports = ReportGenerator;
