# S055 - Content-Type Validation in REST Services

## Mô tả

Rule này kiểm tra xem các dịch vụ REST có xác thực Content-Type header của request đầu vào hay không. Việc thiếu xác thực Content-Type có thể dẫn đến các lỗ hổng bảo mật khi kẻ tấn công gửi dữ liệu độc hại với định dạng không mong muốn.

## Mục tiêu

- Đảm bảo các REST endpoint xác thực Content-Type trước khi xử lý request body
- Ngăn chặn các cuộc tấn công thông qua dữ liệu có định dạng không mong muốn
- Tuân thủ OWASP ASVS 13.2.5 về xác thực đầu vào

## Chi tiết Rule

### Phát hiện lỗi khi:

1. **Express.js handlers** sử dụng `req.body` mà không kiểm tra Content-Type:
   ```javascript
   app.post('/api/users', (req, res) => {
     const user = req.body; // ❌ Không kiểm tra Content-Type
     // ...
   });
   ```

2. **NestJS controllers** sử dụng `@Body()` mà không có validation:
   ```typescript
   @Post()
   create(@Body() data: any) { // ❌ Không kiểm tra Content-Type
     return this.service.create(data);
   }
   ```

3. **Generic handlers** xử lý request body mà không xác thực:
   ```javascript
   function handlePost(req, res) {
     processData(req.body); // ❌ Không kiểm tra Content-Type
   }
   ```

### Cách khắc phục:

1. **Sử dụng req.is() method**:
   ```javascript
   app.post('/api/users', (req, res) => {
     if (!req.is('application/json')) {
       return res.status(415).send('Unsupported Media Type');
     }
     const user = req.body; // ✅ An toàn
   });
   ```

2. **Kiểm tra header trực tiếp**:
   ```javascript
   app.put('/api/data', (req, res) => {
     if (req.headers['content-type'] !== 'application/json') {
       return res.status(415).json({ error: 'Invalid Content-Type' });
     }
     processData(req.body); // ✅ An toàn
   });
   ```

3. **Sử dụng middleware**:
   ```javascript
   app.use(express.json({ type: 'application/json' }));
   // hoặc
   app.use((req, res, next) => {
     if (req.method !== 'GET' && !req.is('application/json')) {
       return res.status(415).send('Unsupported Media Type');
     }
     next();
   });
   ```

4. **NestJS với decorators**:
   ```typescript
   @Post()
   @Header('Content-Type', 'application/json')
   create(@Body() data: CreateDto) {
     return this.service.create(data);
   }
   ```

## Các trường hợp được bỏ qua

Rule sẽ **KHÔNG** báo lỗi trong các trường hợp:

1. **Có global middleware xử lý Content-Type**:
   ```javascript
   app.use(express.json()); // Đã xử lý Content-Type validation
   ```

2. **Test files**: Files có chứa `test`, `spec`, `__tests__`

3. **Configuration files**: Files trong thư mục `config`, `configs`

4. **Comments và documentation**

5. **Import/export statements**

## Mức độ nghiêm trọng

- **Severity**: Error
- **Impact**: Medium - Data injection, parsing errors, security bypass
- **Likelihood**: Medium

## Tham khảo

- **OWASP ASVS 13.2.5**: Input Validation
- **CWE-20**: Improper Input Validation
- **Express.js Documentation**: [req.is()](https://expressjs.com/en/4x/api.html#req.is)
- **NestJS Documentation**: [Validation](https://docs.nestjs.com/techniques/validation)

## Ví dụ chi tiết

### Express.js

**Lỗi:**
```javascript
const express = require('express');
const app = express();

app.post('/api/users', (req, res) => {
  const userData = req.body; // ❌ Thiếu Content-Type validation
  // Xử lý userData...
});
```

**Sửa:**
```javascript
const express = require('express');
const app = express();

app.post('/api/users', (req, res) => {
  if (!req.is('application/json')) {
    return res.status(415).json({ error: 'Content-Type must be application/json' });
  }
  const userData = req.body; // ✅ An toàn
  // Xử lý userData...
});
```

### NestJS

**Lỗi:**
```typescript
@Controller('users')
export class UsersController {
  @Post()
  create(@Body() createUserDto: any) { // ❌ Thiếu Content-Type validation
    return this.usersService.create(createUserDto);
  }
}
```

**Sửa:**
```typescript
@Controller('users')
export class UsersController {
  @Post()
  @Header('Content-Type', 'application/json')
  create(@Body() createUserDto: CreateUserDto) { // ✅ An toàn với DTO validation
    return this.usersService.create(createUserDto);
  }
}
```

## Cấu hình

Rule này hỗ trợ các ngôn ngữ:
- TypeScript
- JavaScript

Và tương thích với các framework:
- Express.js
- NestJS
- Generic Node.js applications
