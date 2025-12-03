# C073 - Validate Required Configuration on Startup

## Mục tiêu
Tránh lỗi runtime không rõ nguyên nhân do thiếu hoặc sai cấu hình. Đảm bảo ứng dụng dừng sớm (fail fast) nếu thiếu cấu hình quan trọng.

## Mô tả
Rule này kiểm tra việc validate cấu hình bắt buộc ngay khi ứng dụng khởi động và yêu cầu hệ thống fail fast nếu có vấn đề với cấu hình.

## Các điều kiện kiểm tra

### 1. Schema Validation hoặc Explicit Checks
- Tất cả cấu hình bắt buộc phải được validate bằng schema libraries (zod, joi, yup, etc.) hoặc explicit checks
- Không được truy cập `process.env` mà không có validation

### 2. Fail Fast Behavior
- Khi phát hiện cấu hình thiếu hoặc không hợp lệ, ứng dụng phải dừng ngay lập tức
- Sử dụng `process.exit(1)`, `throw Error`, hoặc tương tự

### 3. Centralized Configuration
- Hạn chế việc truy cập environment variables rải rác trong code
- Tập trung xử lý cấu hình trong các module chuyên dụng

### 4. No Dangerous Defaults
- Không sử dụng default values nguy hiểm như empty string, localhost URLs
- Flag các pattern như `|| ''`, `|| 0`, `|| 'http://localhost'`

### 5. Startup Connectivity Checks
- Với database hoặc external services, cần có connectivity check khi startup
- Test kết nối trước khi application bắt đầu phục vụ requests

## Ví dụ

### ❌ Không đúng
```typescript
// Không có validation, dangerous defaults
const config = {
  apiKey: process.env.API_KEY || 'default-key',
  dbUrl: process.env.DATABASE_URL || '',
  port: process.env.PORT || 3000
};

function startServer() {
  const server = createServer();
  server.listen(config.port); // Có thể fail runtime nếu config sai
}
```

### ✅ Đúng
```typescript
import { z } from 'zod';

const configSchema = z.object({
  API_KEY: z.string().min(1, 'API_KEY is required'),
  DATABASE_URL: z.string().url('DATABASE_URL must be valid URL'),
  PORT: z.string().transform(val => parseInt(val, 10))
});

function validateConfig() {
  try {
    return configSchema.parse(process.env);
  } catch (error) {
    console.error('Configuration validation failed:', error.message);
    process.exit(1); // Fail fast
  }
}

export const config = validateConfig();

async function checkDatabaseConnection() {
  try {
    const connection = await connectToDatabase(config.DATABASE_URL);
    await connection.ping();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1); // Fail fast on connectivity issues
  }
}
```

## Cấu hình

### Schema Validation Libraries
- **TypeScript/JavaScript**: zod, joi, yup, envalid, dotenv-safe, class-validator
- **Java**: @ConfigurationProperties, @Validated, jakarta.validation, hibernate.validator  
- **Go**: envconfig, viper

### Fail Fast Mechanisms
- **TypeScript/JavaScript**: `throw new Error()`, `process.exit(1)`
- **Java**: `throw new RuntimeException()`, `SpringApplication.exit()`, `System.exit(1)`
- **Go**: `log.Fatal()`, `panic()`, `os.Exit(1)`

### Policy Options
- `requireSchemaOrExplicitChecks`: Bắt buộc có validation
- `requireFailFast`: Bắt buộc có fail fast mechanism
- `forbidEnvReadsOutsideConfig`: Hạn chế env access ngoài config modules
- `flagDangerousDefaults`: Cảnh báo về dangerous default values
- `requireStartupConnectivityChecks`: Yêu cầu connectivity check

## Mức độ nghiêm trọng
**Error** - Rule này có thể ngăn chặn các lỗi runtime nghiêm trọng và khó debug.

## Ngôn ngữ hỗ trợ
- TypeScript/JavaScript
- Java  
- Go

## Tham khảo
- [Fail Fast Principle](https://en.wikipedia.org/wiki/Fail-fast)
- [Configuration Validation Best Practices](https://12factor.net/config)
- [Schema Validation Libraries](https://github.com/colinhacks/zod)
