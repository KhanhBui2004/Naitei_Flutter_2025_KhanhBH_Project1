# S025 - Always validate client-side data on the server

## Mô tả

Rule S025 đảm bảo rằng tất cả dữ liệu từ client đều được validate trên server. Client-side validation không đủ để bảo mật vì có thể bị bypass bởi kẻ tấn công. Server-side validation là bắt buộc để đảm bảo tính toàn vẹn dữ liệu và bảo mật.

## OWASP Mapping

- **Category**: A03:2021 – Injection
- **Subcategories**: 
  - A04:2021 – Insecure Design
  - A07:2021 – Identification and Authentication Failures

## Các Pattern được phát hiện

### 1. NestJS Violations

#### ❌ Sử dụng @Body() với 'any' type
```typescript
@Post('/checkout')
checkout(@Body() body: any) {
  // Client có thể inject bất kỳ field nào như isAdmin, discount
  return this.orderService.checkout(body);
}
```

#### ❌ Trust sensitive fields từ client
```typescript
@Post('/orders')
create(@Body() { userId, price, discount, isAdmin }: any) {
  // userId, price, discount, isAdmin KHÔNG nên từ client
  return this.orderService.create(userId, price, discount, isAdmin);
}
```

#### ✅ Cách fix đúng
```typescript
// Cấu hình ValidationPipe global
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true
}));

// Sử dụng DTO với validation
export class CheckoutDto {
  @IsUUID() productId: string;
  @IsInt() @Min(1) @Max(100) quantity: number;
  @IsOptional() @IsIn(['SPRING10','VIP20']) coupon?: string;
}

@Post('/checkout')
@UseGuards(JwtAuthGuard)
checkout(@Body() dto: CheckoutDto, @Req() req) {
  const userId = req.user.sub; // Từ JWT, không phải client
  const discount = this.pricingService.resolveCoupon(dto.coupon, userId);
  return this.orderService.checkout({ userId, ...dto, discount });
}
```

### 2. Express.js Violations

#### ❌ Direct sử dụng req.body không có validation
```typescript
app.post('/checkout', (req, res) => {
  const { userId, price, discount } = req.body;
  // Không có server-side validation
  const order = await orderService.create(userId, price, discount);
});
```

#### ✅ Cách fix đúng
```typescript
app.post('/checkout', [
  body('productId').isUUID(),
  body('quantity').isInt({ min: 1, max: 100 }),
  body('coupon').optional().isIn(['SPRING10', 'VIP20']),
  validateRequest
], async (req, res) => {
  const userId = req.user.id; // Từ auth middleware
  const { productId, quantity, coupon } = req.body; // Đã được validate
  // ...
});
```

### 3. SQL Injection

#### ❌ String concatenation/template literals
```typescript
async findUser(userId: string) {
  const query = `SELECT * FROM users WHERE id = ${userId}`;
  return await this.connection.query(query);
}
```

#### ✅ Parameterized queries
```typescript
async findUser(userId: string) {
  const query = 'SELECT * FROM users WHERE id = ?';
  return await this.connection.query(query, [userId]);
}
```

### 4. File Upload

#### ❌ Không có validation server-side
```typescript
@Post('/avatar')
@UseInterceptors(FileInterceptor('file'))
uploadAvatar(@UploadedFile() file) {
  // Không validate type, size, content
  return this.fileService.save(file);
}
```

#### ✅ Validation đầy đủ
```typescript
@Post('/avatar')
@UseInterceptors(FileInterceptor('file', {
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png'];
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new BadRequestException('Invalid file type'), false);
    }
    cb(null, true);
  }
}))
async uploadAvatar(@UploadedFile() file) {
  // Additional server-side validation
  const isValid = await this.fileService.validateImageContent(file.path);
  if (!isValid) {
    throw new BadRequestException('Invalid image file');
  }
  return this.fileService.processAvatar(file);
}
```

## Sensitive Fields

Rule phát hiện các field nhạy cảm không nên trust từ client:

- `userId`, `user_id`, `id`
- `role`, `roles`, `permissions` 
- `price`, `amount`, `total`, `cost`
- `isAdmin`, `is_admin`, `admin`
- `discount`, `balance`, `credits`
- `isActive`, `is_active`, `enabled`
- `status`, `state`

## Test Command

```bash
node cli.js --input=./examples/rule-test-fixtures/rules/S025_server_side_validation --rule=S025 --engine=heuristic
```

## Framework Support

- ✅ **NestJS**: ValidationPipe, DTO validation, class-validator
- ✅ **Express.js**: express-validator, joi, yup validation middleware  
- ✅ **TypeORM**: Parameterized queries, QueryBuilder
- ✅ **File Upload**: Multer validation, file type checking

## Checklist

- [ ] Sử dụng ValidationPipe global với `whitelist`, `forbidNonWhitelisted`, `transform`
- [ ] Tất cả route có DTO + class-validator, không sử dụng `any`/`Record<string, any>`
- [ ] Không nhận field nhạy cảm từ client (`userId`, `role`, `price`, `isAdmin`)
- [ ] Tính toán giá/discount ở server từ dữ liệu chuẩn, không tin client
- [ ] Query DB luôn tham số hóa; tham số động (sort, column) phải whitelist
- [ ] Upload file: kiểm tra type/size server-side; không render trực tiếp SVG
- [ ] Endpoint thanh toán có idempotency key/nonce/timestamp chống replay
- [ ] Exception filter: log nội bộ chi tiết, trả message tối giản cho client

## Tham khảo

- [OWASP Input Validation](https://owasp.org/www-project-proactive-controls/v3/en/c5-validate-inputs)
- [NestJS Validation](https://docs.nestjs.com/techniques/validation)
- [Express Validator](https://express-validator.github.io/docs/)
