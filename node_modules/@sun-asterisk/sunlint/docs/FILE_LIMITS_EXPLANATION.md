# 🎯 SunLint File Limits - Clear Explanation

## 📋 **Two Different File Limits Explained**

### **🤔 User Question: "Có cần đến `--max-files` không khi đã có `--max-semantic-files`?"**

**Answer: YES - chúng phục vụ mục đích khác nhau!**

---

## 🔍 **Detailed Explanation**

### **1. `--max-files` - Analysis Limit**
- **Purpose**: Giới hạn tổng số files sẽ được analyze
- **Scope**: Toàn bộ quá trình analysis (regex, AST, semantic)
- **Impact**: Performance của toàn bộ SunLint engine
- **Memory**: Ảnh hưởng đến tổng memory usage

```bash
# Chỉ analyze 500 files đầu tiên (bỏ qua files còn lại)
sunlint --all --input=src --max-files=500
```

### **2. `--max-semantic-files` - Symbol Table Limit**  
- **Purpose**: Giới hạn files load vào TypeScript symbol table (ts-morph)
- **Scope**: Chỉ semantic analysis (rules cần type information)
- **Impact**: Memory của symbol table specifically
- **Memory**: Ảnh hưởng đến heap memory cho AST parsing

```bash
# Load tối đa 200 files vào symbol table (cho semantic rules)
sunlint --all --input=src --max-semantic-files=200
```

---

## 📊 **Use Cases & Examples**

### **Scenario 1: Large Project with TypeScript**
```bash
# Project: 2000 files, nhiều TypeScript files

# ❌ Problem: Memory explosion khi load tất cả vào symbol table
sunlint --all --input=src  

# ✅ Solution: Limit both analysis và symbol table
sunlint --all --input=src --max-files=1000 --max-semantic-files=300
```

### **Scenario 2: CI/CD Performance**
```bash
# CI environment với limited memory

# ✅ Conservative: Analyze ít files, symbol table còn ít hơn
sunlint --all --input=src --max-files=800 --max-semantic-files=200

# ✅ Aggressive: Analyze nhiều, nhưng symbol table limited
sunlint --all --input=src --max-files=1500 --max-semantic-files=100
```

### **Scenario 3: Pure JavaScript Project**
```bash
# Project chủ yếu JavaScript (ít semantic analysis)

# ✅ Analyze nhiều files, symbol table không quan trọng
sunlint --all --input=src --max-files=2000 --max-semantic-files=50
```

---

## 🧠 **Memory Impact Analysis**

### **Symbol Table Memory Usage**
| **Files in Symbol Table** | **Memory Usage** | **Use Case** |
|---------------------------|------------------|--------------|
| 50 files | ~100MB | JavaScript projects |
| 200 files | ~400MB | Medium TypeScript |
| 500 files | ~1GB | Large TypeScript |
| 1000+ files | ~2GB+ | Enterprise (risky) |

### **Analysis Memory Usage**
| **Files Analyzed** | **Base Memory** | **With Symbol Table** |
|-------------------|-----------------|----------------------|
| 500 files | ~50MB | +Symbol Table Memory |
| 1000 files | ~100MB | +Symbol Table Memory |
| 2000 files | ~200MB | +Symbol Table Memory |

---

## ⚙️ **Auto-Detection Logic**

### **SunLint v4.0 Auto-Settings**
```javascript
// Auto-detected based on project size
Project Size: 500 files (Medium TypeScript)
├── maxFiles: 600          // Analysis limit
├── maxSemanticFiles: 300  // Symbol table limit (smaller!)
├── timeout: 60s
└── batchSize: 15 rules
```

### **Why Symbol Table Limit is Smaller?**
- **Memory intensive**: Each file in symbol table uses ~2MB+ RAM
- **Not all rules need it**: Many rules work with regex/AST only
- **Smart selection**: SunLint prioritizes important TypeScript files

---

## 📋 **Recommended Configurations**

### **Small Projects (< 200 files)**
```bash
# Auto-detection works perfectly
sunlint --all --input=src
# Auto-sets: maxFiles=200, maxSemanticFiles=100
```

### **Medium Projects (200-800 files)**
```bash
# Balanced performance
sunlint --all --input=src --performance=auto
# Auto-sets: maxFiles=600, maxSemanticFiles=300
```

### **Large Projects (800-1500 files)**
```bash
# Careful analysis
sunlint --all --input=src --performance=careful
# Auto-sets: maxFiles=1200, maxSemanticFiles=500
```

### **Enterprise Projects (1500+ files)**
```bash
# Conservative approach
sunlint --all --input=src --performance=careful --max-semantic-files=200
# Manual override for symbol table limit
```

---

## 🎛️ **CLI Usage Patterns**

### **Most Common (90% of users)**
```bash
# ✅ Just use auto-detection
sunlint --all --input=src
```

### **Performance Tuning (for large projects)**
```bash
# ✅ Tune both limits for optimal performance
sunlint --all --input=src --max-files=1000 --max-semantic-files=300
```

### **Memory-Constrained Environments**
```bash
# ✅ Conservative limits for CI/Docker
sunlint --all --input=src --max-files=500 --max-semantic-files=100
```

### **TypeScript-Heavy Projects**  
```bash
# ✅ More symbol table allocation
sunlint --all --input=src --max-files=800 --max-semantic-files=600
```

---

## 💡 **Key Insights**

### **✅ Both Options Are Needed**
- **`--max-files`**: Controls overall performance & memory
- **`--max-semantic-files`**: Controls TypeScript-specific memory  
- **Different purposes**: Not redundant, complementary

### **✅ Smart Defaults**
- **Auto-detection** chooses appropriate limits
- **Symbol table limit** always ≤ analysis limit
- **Conservative approach** for symbol table (memory-intensive)

### **✅ User Experience**
- **90% cases**: Auto-detection handles both limits
- **10% cases**: Manual tuning for specific needs
- **Clear separation**: Analysis vs TypeScript-specific limits

---

**🎯 Bottom Line: Cả hai options đều cần thiết và phục vụ mục đích khác nhau. Auto-detection giúp user không cần phải hiểu chi tiết, nhưng advanced users có thể fine-tune từng limit riêng biệt.**

*📊 Analysis Performance • 🧠 Symbol Table Memory • ⚖️ Balanced Approach*
