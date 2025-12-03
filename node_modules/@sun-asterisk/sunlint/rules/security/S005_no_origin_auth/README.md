# S005: No Origin Header Authentication

## Tổng quan

Rule S005 phát hiện việc sử dụng Origin header cho authentication hoặc access control. Origin header có thể bị giả mạo (spoofed) và không an toàn để sử dụng làm cơ chế xác thực.

## Mô tả

Origin header trong HTTP request chỉ ra domain nào đã gửi request. Tuy nhiên, header này có thể dễ dàng bị giả mạo bởi attacker và không nên được sử dụng làm cơ chế authentication hoặc authorization.

## Tại sao quan trọng?

- **Bảo mật**: Origin header có thể bị spoofed, dẫn đến bypass authentication
- **Reliability**: Không phải tất cả browser đều gửi Origin header
- **Standards**: Không tuân thủ best practices về web security

## Các pattern được phát hiện

### ❌ Không hợp lệ

```javascript
// 1. Sử dụng Origin header trực tiếp cho authentication
function authenticate(req, res, next) {
    const origin = req.headers.origin;
    if (origin === 'https://trusted.com') {
        req.authenticated = true;
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}

// 2. Middleware sử dụng Origin cho access control
app.use('/api', (req, res, next) => {
    if (req.get('origin') === 'https://admin.example.com') {
        req.isAdmin = true;
    }
    next();
});

// 3. Conditional authentication dựa trên Origin
function checkAccess(req, res) {
    if (req.headers.origin && req.headers.origin.includes('admin')) {
        return res.json({ access: 'granted', token: generateToken() });
    }
    return res.status(403).json({ error: 'Access denied' });
}

// 4. CORS configuration mixed với authentication
app.use(cors({
    origin: function(origin, callback) {
        if (adminOrigins.includes(origin)) {
            callback(null, { credentials: true, authenticated: true });
        } else {
            callback(null, false);
        }
    }
}));
```

### ✅ Hợp lệ

```javascript
// 1. JWT token authentication
function authenticate(req, res, next) {
    const token = req.headers.authorization;
    jwt.verify(token, secret, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid token' });
        req.user = decoded;
        next();
    });
}

// 2. Origin header chỉ để logging
function logRequest(req) {
    console.log('Request from origin:', req.headers.origin);
    logger.info(`Origin: ${req.get('origin')}`);
}

// 3. CORS configuration đúng (không mixing với auth)
app.use(cors({
    origin: ['https://example.com', 'https://app.example.com'],
    credentials: true
}));

// 4. Origin cho CORS preflight handling
function handlePreflight(req, res) {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.end();
}
```

## Các loại vi phạm

| Type | Severity | Mô tả |
|------|----------|--------|
| `origin_header_auth` | error | Trực tiếp sử dụng req.headers.origin cho authentication |
| `origin_header_method` | error | Sử dụng req.get('origin') cho authentication |
| `conditional_origin_auth` | error | Conditional logic dựa trên Origin cho authentication |
| `middleware_origin_auth` | error | Middleware authentication dựa trên Origin |
| `cors_origin_auth` | warning | CORS configuration mixing với authentication |
| `express_origin_auth` | error | Express routes sử dụng Origin cho authentication |

## Cách khắc phục

### 1. Sử dụng JWT Tokens

```javascript
// Thay vì
if (req.headers.origin === 'trusted.com') {
    req.authenticated = true;
}

// Sử dụng
const token = req.headers.authorization?.replace('Bearer ', '');
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded;
```

### 2. Session-based Authentication

```javascript
// Thay vì
if (req.get('origin') === 'admin.com') {
    req.isAdmin = true;
}

// Sử dụng
if (req.session && req.session.user && req.session.user.role === 'admin') {
    req.isAdmin = true;
}
```

### 3. API Key Authentication

```javascript
// Thay vì
const origin = req.headers.origin;
if (trustedOrigins.includes(origin)) {
    next();
}

// Sử dụng
const apiKey = req.headers['x-api-key'];
if (validateApiKey(apiKey)) {
    next();
}
```

### 4. Proper CORS Configuration

```javascript
// Đúng: CORS không làm authentication
app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Authentication riêng biệt
app.use('/api', authenticateToken);
```

## Configuration

Rule có thể được cấu hình trong `config.json`:

```json
{
  "checkAuthContext": true,
  "checkMiddleware": true,
  "checkConditionals": true,
  "checkCORSMixing": true,
  "contextDepth": 3,
  "ignoreComments": true
}
```

## Technology Stack

- **AST Analysis**: Babel parser với TypeScript/JavaScript support
- **Fallback**: Regex patterns cho edge cases
- **Accuracy**: 95% với AST, 85% với regex
- **Languages**: TypeScript, JavaScript

## Testing

Rule được test với:
- Valid code patterns (không có violations)
- Invalid authentication patterns (có violations)
- Edge cases và syntax errors
- Context detection scenarios

## Best Practices

1. **Luôn sử dụng proper authentication mechanisms**:
   - JWT tokens
   - Session-based auth
   - API keys
   - OAuth 2.0

2. **Tách biệt CORS và Authentication**:
   - CORS chỉ để control resource sharing
   - Authentication để verify identity

3. **Origin header chỉ dùng cho**:
   - Logging và monitoring
   - CORS preflight handling
   - Analytics (không sensitive)

4. **Không bao giờ trust Origin header cho security decisions**

## Tài liệu tham khảo

- [OWASP: CORS Origin Header Scrutiny](https://owasp.org/www-community/vulnerabilities/CORS_OriginHeaderScrutiny)
- [MDN: Origin Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Origin)
- [Auth0: JWT Best Practices](https://auth0.com/docs/secure/tokens/json-web-tokens)
- [OWASP: Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
