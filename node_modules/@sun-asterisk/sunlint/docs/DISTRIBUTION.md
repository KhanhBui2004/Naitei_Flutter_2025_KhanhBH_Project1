# 🚀 SunLint Distribution & Installation Guide

## 🎯 **Problem:** 
- Cần `cd extensions/sunlint` mỗi lần chạy
- Muốn cài đặt dễ dàng nhưng giữ tính bảo mật (private)
- Sử dụng từ bất kỳ directory nào

## ✅ **Solutions Ranking:**

### **🥇 Option 1: NPM Private Package (RECOMMENDED)**

#### **Setup (Company Admin - một lần):**
```bash
# 1. Setup package.json for global install
cd extensions/sunlint
npm pack  # Tạo @sun-sunlint-1.0.0.tgz

# 2. Store trong internal file server hoặc private npm registry
# Hoặc upload lên GitHub Packages (private)
```

#### **Installation (Dev - một lần):**
```bash
# Cách 1: Từ file
npm install -g /path/to/@sun-sunlint-1.0.0.tgz

# Cách 2: Từ private GitHub (yêu cầu GitHub token)
npm install -g git+https://github.com/your-company/sunlint.git

# Cách 3: Từ GitHub Packages (private npm registry)
npm login --registry=https://npm.pkg.github.com
npm install -g @your-company/sunlint --registry=https://npm.pkg.github.com
```

#### **Usage (Dev - hàng ngày):**
```bash
# Từ bất kỳ directory nào
sunlint --typescript --input src --all
sunlint --typescript --input src --rule C006
sunlint --typescript --input src --quality --format json
```

---

### **🥈 Option 2: Shell Script/Alias (SIMPLE)**

#### **Setup (Dev - một lần):**
```bash
# Tạo global command
sudo cat > /usr/local/bin/sunlint << 'EOF'
#!/bin/bash
SUNLINT_DIR="/Users/bach.ngoc.hoai/Docs/ee/coding-quality/extensions/sunlint"
cd "$SUNLINT_DIR" && node cli.js "$@"
EOF

sudo chmod +x /usr/local/bin/sunlint
```

#### **Usage (Dev - hàng ngày):**
```bash
# Từ bất kỳ directory nào
sunlint --typescript --input src --all
```

---

### **🥉 Option 3: Project-Level NPM Scripts**

#### **Setup (Per Project):**
```json
// package.json của mỗi project
{
  "scripts": {
    "lint": "node /path/to/sunlint/cli.js --typescript --input src --all",
    "lint:ci": "node /path/to/sunlint/cli.js --typescript --input src --all --format json",
    "lint:single": "node /path/to/sunlint/cli.js --typescript --input",
    "lint:quality": "node /path/to/sunlint/cli.js --typescript --input src --quality"
  }
}
```

#### **Usage:**
```bash
npm run lint
npm run lint:ci
npm run lint:single -- src/specific-file.ts
```

---

## 🏢 **Enterprise Recommendations:**

### **For CI/CD (Production):**
```yaml
# GitHub Actions
- name: Install SunLint
  run: npm install -g /shared/tools/@sun-sunlint-1.0.0.tgz
  
- name: Run Code Quality Check
  run: sunlint --typescript --input src --all --format json
```

### **For Development (Local):**
```bash
# One-time setup script cho dev team
#!/bin/bash
echo "Installing SunLint..."
npm install -g /shared/tools/@sun-sunlint-1.0.0.tgz
echo "SunLint installed! Usage: sunlint --help"
```

### **For VS Code Integration (Future):**
```json
// .vscode/settings.json
{
  "sunlint.executablePath": "sunlint",
  "sunlint.autoRun": "onSave",
  "sunlint.format": "eslint"
}
```

---

## 🎯 **Immediate Action Plan:**

### **Phase 1: Quick Fix (This Week)**
Implement **Option 2 (Shell Script)**:
1. Tạo shell script cho dev team
2. Add vào onboarding documentation
3. Test trên CI environment

### **Phase 2: Professional (Next Sprint)**  
Implement **Option 1 (NPM Package)**:
1. Setup private npm registry hoặc GitHub Packages
2. Create installation documentation
3. Migrate existing projects

### **Phase 3: IDE Integration (Future)**
1. VS Code extension
2. IntelliJ plugin  
3. Auto-formatting on save

---

## ✅ **Benefits Matrix:**

| Solution | Setup Effort | Usage Simplicity | CI/CD Ready | Maintenance |
|----------|--------------|------------------|-------------|-------------|
| NPM Package | High | Excellent | Excellent | Low |
| Shell Script | Low | Good | Good | Medium |
| NPM Scripts | Medium | Good | Excellent | High |

**Recommendation: Start with Shell Script (quick), then migrate to NPM Package (professional).**
