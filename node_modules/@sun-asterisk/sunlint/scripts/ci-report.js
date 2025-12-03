#!/usr/bin/env node

/**
 * CI Report Generator - Creates CI/CD optimized reports
 * Usage: node ci-report.js eslint-results.json sunlint-results.json
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class CIReporter {
  constructor() {
    this.isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
    this.isGitHub = process.env.GITHUB_ACTIONS === 'true';
    this.isGitLab = process.env.GITLAB_CI === 'true';
  }

  async generateCIReport(eslintPath, sunlintPath) {
    const ReportMerger = require('./merge-reports.js');
    const merger = new ReportMerger();
    
    const unifiedReport = await merger.mergeReports(eslintPath, sunlintPath);
    
    if (this.isGitHub) {
      this.generateGitHubReport(unifiedReport);
    } else if (this.isGitLab) {
      this.generateGitLabReport(unifiedReport);
    } else {
      this.generateGenericReport(unifiedReport);
    }
    
    return this.determineExitCode(unifiedReport);
  }

  generateGitHubReport(report) {
    console.log('::group::📊 Code Quality Summary');
    console.log(this.formatSummaryForCI(report));
    console.log('::endgroup::');

    // Create annotations for errors
    const errors = report.violations.filter(v => v.severity === 'error').slice(0, 10);
    errors.forEach(violation => {
      console.log(`::error file=${violation.file},line=${violation.line},col=${violation.column},title=${violation.ruleId}::${violation.message}`);
    });

    // Create warnings
    const warnings = report.violations.filter(v => v.severity === 'warning').slice(0, 10);
    warnings.forEach(violation => {
      console.log(`::warning file=${violation.file},line=${violation.line},col=${violation.column},title=${violation.ruleId}::${violation.message}`);
    });

    // Set output variables
    console.log(`::set-output name=total-violations::${report.summary.total.violations}`);
    console.log(`::set-output name=errors::${report.summary.total.errors}`);
    console.log(`::set-output name=warnings::${report.summary.total.warnings}`);
  }

  generateGitLabReport(report) {
    console.log(chalk.blue('📊 GitLab CI Code Quality Report'));
    console.log(this.formatSummaryForCI(report));

    // GitLab Code Quality format
    const gitlabReport = this.convertToGitLabFormat(report);
    fs.writeFileSync('gl-code-quality-report.json', JSON.stringify(gitlabReport, null, 2));
    
    console.log('✅ GitLab Code Quality report: gl-code-quality-report.json');
  }

  generateGenericReport(report) {
    console.log(chalk.blue('📊 CI Code Quality Report'));
    console.log(this.formatSummaryForCI(report));

    // Save JSON for further processing
    fs.writeFileSync('ci-report.json', JSON.stringify(report, null, 2));
  }

  formatSummaryForCI(report) {
    const { summary } = report;
    
    return `
Files analyzed: ${summary.total.files}
Total violations: ${summary.total.violations}
├─ Errors: ${summary.total.errors}
├─ Warnings: ${summary.total.warnings}
└─ Info: ${summary.total.info}

Tool breakdown:
├─ ESLint: ${summary.by_tool.eslint.violations} violations
└─ SunLint: ${summary.by_tool.sunlint.violations} violations

Quality Score: ${this.calculateQualityScore(report)}%
`;
  }

  calculateQualityScore(report) {
    const { total } = report.summary;
    const totalFiles = total.files;
    const violations = total.violations;
    
    if (totalFiles === 0) return 100;
    
    // Quality score formula: base 100, deduct points for violations
    // Errors: -5 points, Warnings: -2 points, Info: -1 point
    const penalty = (total.errors * 5) + (total.warnings * 2) + (total.info * 1);
    const maxPenalty = totalFiles * 10; // Max 10 points per file
    
    const score = Math.max(0, 100 - Math.round((penalty / maxPenalty) * 100));
    return score;
  }

  convertToGitLabFormat(report) {
    return report.violations.map(violation => ({
      description: violation.message,
      check_name: violation.ruleId,
      fingerprint: this.generateFingerprint(violation),
      severity: this.mapSeverityForGitLab(violation.severity),
      location: {
        path: violation.file,
        lines: {
          begin: violation.line
        }
      }
    }));
  }

  generateFingerprint(violation) {
    const crypto = require('crypto');
    const content = `${violation.file}:${violation.line}:${violation.ruleId}`;
    return crypto.createHash('md5').update(content).digest('hex');
  }

  mapSeverityForGitLab(severity) {
    switch (severity) {
      case 'error': return 'major';
      case 'warning': return 'minor';
      case 'info': return 'info';
      default: return 'info';
    }
  }

  determineExitCode(report) {
    const { total } = report.summary;
    
    // Exit with error if there are any errors
    if (total.errors > 0) {
      console.log(chalk.red(`❌ Quality gate failed: ${total.errors} errors found`));
      return 1;
    }
    
    // Warning if too many warnings
    if (total.warnings > 50) {
      console.log(chalk.yellow(`⚠️  Quality gate warning: ${total.warnings} warnings found`));
    }
    
    console.log(chalk.green('✅ Quality gate passed'));
    return 0;
  }
}

// CLI execution
if (require.main === module) {
  const [eslintReport, sunlintReport] = process.argv.slice(2);
  
  if (!eslintReport || !sunlintReport) {
    console.error('Usage: node ci-report.js <eslint-report.json> <sunlint-report.json>');
    process.exit(1);
  }

  const reporter = new CIReporter();
  reporter.generateCIReport(eslintReport, sunlintReport)
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
      console.error(chalk.red('❌ CI report generation failed:'), error.message);
      process.exit(1);
    });
}

module.exports = CIReporter;
