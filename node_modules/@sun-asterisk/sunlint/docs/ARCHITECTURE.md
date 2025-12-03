# SunLint Modular Architecture

## Phase 1: TypeScript Focus với Kiến trúc Modular

### Cấu trúc mới:

```
cli.js                    # CLI entry point (simplified)
core/
├── cli-program.js        # CLI options definition (Rule C005)
├── cli-action-handler.js # Main execution flow (Rule C005)
├── rule-selection-service.js # Rule selection logic (Rule C005)
├── analysis-orchestrator.js  # Analysis coordination (Rule C005)
├── output-service.js     # Output formatting (Rule C005)
├── eslint-engine-service.js   # ESLint integration (future)
└── sunlint-engine-service.js  # Native SunLint engine
```

### Nguyên tắc thiết kế:

1. **Rule C005**: Mỗi class/file chỉ làm một việc
2. **Rule C014**: Dependency injection thay vì new trực tiếp
3. **Rule C012**: Tách rõ Command và Query
4. **Modular**: Dễ mở rộng cho Phase 2

### Luồng hoạt động:

1. `cli.js` → `CliActionHandler`
2. `CliActionHandler` → Load config, validate input
3. `RuleSelectionService` → Select rules based on options
4. `AnalysisOrchestrator` → Run analysis (SunLint or ESLint)
5. `OutputService` → Format and display results

### Các tính năng hiện tại:

- ✅ Modular CLI với dependency injection
- ✅ Rule selection (single, multiple, all, category)
- ✅ Dry run mode
- ✅ TypeScript-specific options (chuẩn bị cho Phase 1)
- ✅ Graceful fallback khi không tìm thấy dependencies
- ✅ Clean error handling và logging

### Phase 1 roadmap:

1. **✅ Done**: Modular CLI architecture
2. **✅ Done**: ESLint integration cho TypeScript
3. **Next**: TypeScript custom rules thông qua ESLint
4. **✅ Done**: Hybrid engine (ESLint + SunLint)

### Phase 2 roadmap:

1. Native SunLint engine cho tất cả ngôn ngữ
2. Mở rộng Dart, Kotlin rules
3. AI-powered analysis
4. VS Code extension integration

### Usage Examples:

```bash
# Basic usage
sunlint --rule=C006 --input=src

# Category-based
sunlint --quality --input=src

# TypeScript-specific (Phase 1)
sunlint --typescript --input=src
sunlint --typescript-engine=eslint --input=src

# Dry run
sunlint --dry-run --all --input=src
```

### Dependencies:

- Minimal core dependencies
- ESLint integration sẽ được thêm trong Phase 1
- Graceful fallback khi dependencies không có sẵn
