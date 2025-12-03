# 🎯 Quick Reference: File Limits

## **TL;DR: When to Use Each Option**

### **🤖 Most Users (90%)**
```bash
# ✅ Just use auto-detection - no manual limits needed
sunlint --all --input=src
```

### **⚡ Performance Tuning (10%)**
```bash
# ✅ Both limits for different purposes
sunlint --all --input=src --max-files=1000 --max-semantic-files=300
```

---

## **Quick Decision Matrix**

| **Situation** | **Use `--max-files`** | **Use `--max-semantic-files`** |
|---------------|----------------------|---------------------------------|
| 🐌 **Slow analysis** | ✅ YES - Limit total work | ❌ Not needed |
| 💾 **Memory issues** | ✅ YES - Reduce base memory | ✅ YES - Reduce symbol table |
| 🔍 **TypeScript heavy** | ❌ Not main issue | ✅ YES - Limit ts-morph memory |
| 🚀 **CI/CD timeout** | ✅ YES - Faster completion | ✅ YES - Less parsing |

---

## **📊 Memory Impact**

### **Analysis Files (`--max-files`)**
- **50MB** → 1000 files
- **100MB** → 2000 files  
- **Impact**: Base memory + file reading

### **Symbol Table Files (`--max-semantic-files`)**  
- **200MB** → 100 TypeScript files
- **1GB** → 500 TypeScript files
- **Impact**: AST parsing + type information

---

## **🎛️ Common Patterns**

```bash
# 🏢 Enterprise (safe defaults)
--max-files=800 --max-semantic-files=200

# 🚀 CI/CD (fast & reliable)  
--max-files=500 --max-semantic-files=100

# 🔍 TypeScript focus (more symbol table)
--max-files=600 --max-semantic-files=400

# 📦 JavaScript mainly (less symbol table)
--max-files=1500 --max-semantic-files=50
```

---

**💡 Key Insight: Symbol table limit should typically be smaller than analysis limit due to higher memory usage per file.**

*See [FILE_LIMITS_EXPLANATION.md](./FILE_LIMITS_EXPLANATION.md) for detailed explanation.*
