# 🚀 SunLint CI/CD Integration Guide

## 📋 **Tổng quan các chức năng CLI**

### ✅ **Phạm vi kiểm tra**
- ✅ Kiểm tra 1 file: `node cli.js --all --input=file.js`
- ✅ Kiểm tra 1 folder: `node cli.js --all --input=src`  
- ✅ Kiểm tra toàn project: `node cli.js --all --input=.`
- ✅ Kiểm tra changed files: `node cli.js --all --changed-files`
- ✅ Kiểm tra staged files: `node cli.js --all --staged-files`

### ✅ **Lựa chọn rules**
- ✅ 1 rule: `node cli.js --rule=C019 --input=src`
- ✅ Nhiều rules: `node cli.js --rules=C019,C006 --input=src`
- ✅ Tất cả rules: `node cli.js --all --input=src`
- ✅ Theo category: `node cli.js --quality --input=src`

### ✅ **Phương pháp phân tích**
- ✅ Pattern-based (free): `node cli.js --all --input=src --no-ai`
- ✅ AI-powered (cost): `node cli.js --all --input=src --ai`

### ✅ **CI/CD Features**
- ✅ Git integration: `--changed-files`, `--staged-files`, `--diff-base`
- ✅ Baseline comparison: `--baseline`, `--save-baseline`
- ✅ New violations only: `--fail-on-new-violations`
- ✅ Multiple output formats: `--format=json|eslint|github|summary`

## 🎯 **CI/CD Strategies**

### **Strategy 1: Full Coverage (Traditional)**
```bash
# Advantages: Complete analysis, no missed issues
# Disadvantages: Slow, expensive, noisy for large projects

# Usage:
node cli.js --all --input=. --format=json --output=report.json
```

### **Strategy 2: Incremental (Recommended)**
```bash
# PR Check: Only changed files
node cli.js --all --changed-files --diff-base=origin/main --fail-on-new-violations

# Main Branch: Full scan + baseline
node cli.js --all --input=. --save-baseline=baseline.json --format=json
```

### **Strategy 3: Risk-Based**
```bash
# High-risk areas only
node cli.js --security --input=src/auth,src/payment --format=summary

# Critical rules only
node cli.js --rules=C019,S001,S003 --changed-files --format=github
```

## 📊 **Performance Comparison**

| Scope | Files | Time | Use Case |
|-------|-------|------|----------|
| Single file | 1 | ~1-3s | IDE integration, pre-commit |
| Changed files (PR) | 5-20 | ~10-30s | PR checks, fast feedback |
| Module/folder | 50-200 | ~1-2min | Feature development |
| Full project | 500+ | ~3-10min | Nightly builds, releases |

## 🔄 **Workflow Examples**

### **GitHub Actions - Complete Setup**

```yaml
name: SunLint Quality Gates
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'

jobs:
  # Job 1: PR Quality Check (fast)
  pr-check:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
      with:
        fetch-depth: 0
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ env.NODE_VERSION }}
    
    - name: Install SunLint
      run: |
        cd coding-quality/extensions/sunlint
        npm install
    
    - name: Download Baseline
      uses: actions/download-artifact@v3
      with:
        name: sunlint-baseline
        path: coding-quality/extensions/sunlint/
      continue-on-error: true
    
    - name: Run SunLint on Changed Files
      run: |
        cd coding-quality/extensions/sunlint
        node cli.js --all --changed-files \
        --diff-base=origin/${{ github.base_ref }} \
        --baseline=baseline.json \
        --fail-on-new-violations \
        --format=github \
        --no-ai
    
    - name: Comment PR
      if: failure()
      uses: actions/github-script@v6
      with:
        script: |
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: '❌ SunLint found code quality issues. Please check the Actions log for details.'
          })

  # Job 2: Full Scan + Baseline (comprehensive)  
  full-scan:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ env.NODE_VERSION }}
    
    - name: Install SunLint
      run: |
        cd coding-quality/extensions/sunlint
        npm install
    
    - name: Run Full SunLint Scan
      run: |
        cd coding-quality/extensions/sunlint
        node cli.js --all --input=. \
        --save-baseline=baseline.json \
        --format=json \
        --output=sunlint-report.json \
        --no-ai
    
    - name: Upload Baseline
      uses: actions/upload-artifact@v3
      with:
        name: sunlint-baseline
        path: coding-quality/extensions/sunlint/baseline.json
        retention-days: 30
    
    - name: Upload Report
      uses: actions/upload-artifact@v3
      with:
        name: sunlint-report
        path: coding-quality/extensions/sunlint/sunlint-report.json
```

### **GitLab CI - Complete Setup**

```yaml
stages:
  - quality-check
  - quality-baseline

variables:
  SUNLINT_PATH: "coding-quality/extensions/sunlint"

# Fast PR check
sunlint:pr:
  stage: quality-check
  image: node:18
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
  before_script:
    - cd $SUNLINT_PATH
    - npm install
  script:
    - |
      if [ -f baseline.json ]; then
        echo "Using existing baseline"
        node cli.js --all --changed-files \
        --diff-base=origin/$CI_MERGE_REQUEST_TARGET_BRANCH_NAME \
        --baseline=baseline.json \
        --fail-on-new-violations \
        --format=summary \
        --no-ai
      else
        echo "No baseline found, running on changed files only"
        node cli.js --all --changed-files \
        --diff-base=origin/$CI_MERGE_REQUEST_TARGET_BRANCH_NAME \
        --format=summary \
        --no-ai
      fi
  artifacts:
    reports:
      junit: $SUNLINT_PATH/sunlint-report.xml
    when: always
    expire_in: 1 week

# Full scan for main branch
sunlint:baseline:
  stage: quality-baseline
  image: node:18
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
  before_script:
    - cd $SUNLINT_PATH
    - npm install
  script:
    - |
      node cli.js --all --input=. \
      --save-baseline=baseline.json \
      --format=json \
      --output=sunlint-report.json \
      --no-ai
  artifacts:
    paths:
      - $SUNLINT_PATH/baseline.json
      - $SUNLINT_PATH/sunlint-report.json
    expire_in: 1 month
```

## 🎲 **Pre-commit Hook**

```bash
#!/bin/sh
# .git/hooks/pre-commit

cd coding-quality/extensions/sunlint

echo "🔍 Running SunLint on staged files..."
node cli.js --all --staged-files --format=summary --no-ai

if [ $? -ne 0 ]; then
  echo "❌ SunLint found issues. Commit aborted."
  echo "💡 Fix the issues or use 'git commit --no-verify' to bypass."
  exit 1
fi

echo "✅ SunLint passed!"
```

## 📈 **Monitoring & Metrics**

### **Track Quality Trends**
```bash
# Generate trend report
node cli.js --all --input=. --format=json --output=reports/$(date +%Y-%m-%d).json

# Compare with previous scan
node cli.js --all --input=. --baseline=reports/baseline.json --format=trend
```

### **Quality Gates**
```bash
# Fail if more than 10 new violations
node cli.js --all --changed-files --max-new-violations=10

# Fail on any security issues
node cli.js --security --changed-files --severity=error

# Allow warnings but fail on errors
node cli.js --all --changed-files --severity=error
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **"No changed files detected"**
   ```bash
   # Check git status
   git status
   git diff --name-only origin/main
   
   # Force include specific files
   node cli.js --all --input=src/specific-file.ts
   ```

2. **"Baseline not found"**
   ```bash
   # Create initial baseline
   node cli.js --all --input=. --save-baseline=baseline.json --no-ai
   ```

3. **"Too many violations"**
   ```bash
   # Focus on high-priority rules first
   node cli.js --rules=C019,S001 --changed-files
   
   # Use severity filtering
   node cli.js --all --changed-files --severity=error
   ```

## 🎯 **Best Practices Summary**

1. **Start Small**: Begin with changed files only
2. **Incremental Adoption**: Add rules gradually  
3. **Use Baselines**: For large existing projects
4. **Monitor Performance**: Track CI execution time
5. **Focus on New Code**: Don't overwhelm with legacy issues
6. **Automate Everything**: Pre-commit + PR checks + nightly scans
7. **Cost Optimization**: Use `--no-ai` for CI to avoid API costs
