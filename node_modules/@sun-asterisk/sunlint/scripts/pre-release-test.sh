#!/bin/bash

# SunLint v1.0.5 Pre-Release Test Suite
# Comprehensive testing before triggering actual release

set -e

echo "🧪 =========================================="
echo "☀️  SunLint v1.0.5 Pre-Release Test Suite"
echo "🧪 =========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test with validation
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_pattern="$3"
    
    echo -e "${BLUE}🧪 Testing: $test_name${NC}"
    echo -e "${YELLOW}Command: $command${NC}"
    
    if output=$(eval $command 2>&1); then
        if [[ -z "$expected_pattern" ]] || echo "$output" | grep -q "$expected_pattern"; then
            echo -e "${GREEN}✅ PASS${NC}"
            ((TESTS_PASSED++))
        else
            echo -e "${RED}❌ FAIL - Expected pattern not found: $expected_pattern${NC}"
            echo "Output: $output"
            ((TESTS_FAILED++))
        fi
    else
        echo -e "${RED}❌ FAIL - Command failed${NC}"
        echo "Error: $output"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# Test 1: Package.json validation
run_test "Package.json Structure" "node -e 'console.log(JSON.parse(require(\"fs\").readFileSync(\"package.json\")).name)'" "@sun-asterisk/sunlint"

# Test 2: GitHub Package config
run_test "GitHub Package Config" "node -e 'console.log(JSON.parse(require(\"fs\").readFileSync(\"package-github.json\")).name)'" "@sun-asterisk/sunlint"

# Test 3: CLI basic functionality
run_test "CLI Version Check" "node cli.js --version" "1.0.5"

# Test 4: Help output
run_test "CLI Help" "node cli.js --help" "Sun Lint"

# Test 5: Basic rule execution
run_test "Basic Rule Execution" "node cli.js --rule=C006 --input=examples/integration/src --format=summary" "C006"

# Test 6: Multiple rules
run_test "Multiple Rules" "node cli.js --rules=C006,C019 --input=examples/integration/src --format=summary" "violations"

# Test 7: TypeScript engine
run_test "TypeScript Engine" "node cli.js --typescript --rule=C006 --input=examples/integration/src --format=summary" "TypeScript"

# Test 8: Git integration (if in git repo)
if git rev-parse --git-dir > /dev/null 2>&1; then
    run_test "Git Integration Check" "node cli.js --all --changed-files --format=summary || echo 'No changed files'" ""
else
    echo -e "${YELLOW}⚠️  Skipping Git integration test (not in git repo)${NC}"
fi

# Test 9: Configuration file validation
run_test "Config File Validation" "node cli.js --config=examples/integration/.sunlint.json --input=examples/integration/src --format=summary --dry-run" "Dry run"

# Test 10: ESLint integration test
if [ -f "examples/integration/.eslintrc.json" ]; then
    run_test "ESLint Integration" "node cli.js --all --eslint-integration --input=examples/integration/src --format=summary" "integration"
else
    echo -e "${YELLOW}⚠️  Skipping ESLint integration test (no .eslintrc.json)${NC}"
fi

# Test 11: Package structure validation
run_test "Required Files Check" "ls cli.js core/ rules/ config/ examples/ docs/ README.md" "cli.js"

# Test 12: Dependencies check
run_test "Dependencies Installation" "npm ls --depth=0" "sunlint"

# Test 13: Build test (npm pack)
echo -e "${BLUE}🧪 Testing: Package Build${NC}"
if npm pack > /dev/null 2>&1; then
    if ls *.tgz > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS - Package built successfully${NC}"
        ((TESTS_PASSED++))
        # Cleanup
        rm -f *.tgz
    else
        echo -e "${RED}❌ FAIL - No tarball generated${NC}"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${RED}❌ FAIL - npm pack failed${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 14: GitHub Actions workflow validation
echo -e "${BLUE}🧪 Testing: GitHub Actions Workflow${NC}"
if [ -f "../../../.github/workflows/release-sunlint.yml" ]; then
    echo -e "${GREEN}✅ PASS - Release workflow exists${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL - Release workflow missing${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 15: Documentation completeness
echo -e "${BLUE}🧪 Testing: Documentation Completeness${NC}"
required_docs=("README.md" "docs/ESLINT_INTEGRATION.md" "docs/RELEASE_GUIDE.md" "examples/integration/package.json")
docs_missing=0

for doc in "${required_docs[@]}"; do
    if [ ! -f "$doc" ]; then
        echo -e "${RED}❌ Missing: $doc${NC}"
        ((docs_missing++))
    fi
done

if [ $docs_missing -eq 0 ]; then
    echo -e "${GREEN}✅ PASS - All documentation present${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL - $docs_missing documentation files missing${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Summary
echo "🎯 =========================================="
echo "📊 Test Results Summary"
echo "🎯 =========================================="
echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Ready for release! 🚀${NC}"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Run GitHub Actions release workflow"
    echo "2. Verify GitHub Package Registry publication"
    echo "3. Test installation from both sources"
    echo "4. Update documentation with release links"
    echo ""
    echo "🔗 Trigger release workflow:"
    echo "https://github.com/sun-asterisk/engineer-excellence/actions/workflows/release-sunlint.yml"
    
    exit 0
else
    echo -e "${RED}💥 TESTS FAILED! Please fix issues before release.${NC}"
    echo ""
    echo "🔧 Common fixes:"
    echo "- Check package.json configuration"
    echo "- Verify all dependencies are installed"
    echo "- Ensure example files exist"
    echo "- Check file permissions"
    
    exit 1
fi
