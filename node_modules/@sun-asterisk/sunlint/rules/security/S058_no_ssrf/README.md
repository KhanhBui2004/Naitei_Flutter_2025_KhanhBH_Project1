# Rule S058: No SSRF (Server-Side Request Forgery)

## Overview
Rule S058 prevents Server-Side Request Forgery (SSRF) attacks by detecting and flagging HTTP requests that use user-controlled URLs without proper validation.

## What is SSRF?
SSRF allows attackers to make HTTP requests from the server to arbitrary destinations, potentially accessing:
- Internal services (databases, admin panels)
- Cloud metadata endpoints (AWS, GCP, Azure)
- Local files via file:// protocol
- Internal network resources

## Detection Strategy

### 1. HTTP Client Detection
Detects calls to HTTP libraries:
```typescript
// Detected patterns
fetch(url)
axios.get(url)
http.request(url)
httpClient.post(url)
```

### 2. URL Source Tracing
Traces URL variables back to their source:
```typescript
// ❌ User-controlled (DANGEROUS)
const url = req.query.targetUrl;
fetch(url);

// ✅ Hardcoded (SAFE)
const url = "https://api.trusted-service.com";
fetch(url);
```

### 3. Validation Check
Verifies if URL validation exists:
```typescript
// ❌ No validation
const url = req.body.webhookUrl;
fetch(url);

// ✅ With validation
const url = req.body.webhookUrl;
validateUrlAllowList(url);
fetch(url);
```

## Examples

### ❌ Violations

#### 1. User-controlled URL without validation
```typescript
app.post('/webhook', (req, res) => {
  const webhookUrl = req.body.url;
  // VIOLATION: User input directly used in HTTP request
  fetch(webhookUrl);
});
```

#### 2. Dangerous hardcoded URLs
```typescript
// VIOLATION: Internal metadata endpoint
fetch('http://169.254.169.254/latest/meta-data/');

// VIOLATION: Local file access
fetch('file:///etc/passwd');
```

#### 3. Query parameter injection
```typescript
app.get('/proxy', (req, res) => {
  const targetUrl = req.query.url;
  // VIOLATION: No validation of target URL
  axios.get(targetUrl);
});
```

### ✅ Safe Patterns

#### 1. Allow-list validation
```typescript
const ALLOWED_DOMAINS = ['api.trusted.com', 'webhook.company.com'];

function validateUrlAllowList(url) {
  const parsed = new URL(url);
  if (!ALLOWED_DOMAINS.includes(parsed.hostname)) {
    throw new Error('Domain not allowed');
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS allowed');
  }
}

app.post('/webhook', (req, res) => {
  const webhookUrl = req.body.url;
  validateUrlAllowList(webhookUrl); // ✅ Validated
  fetch(webhookUrl);
});
```

#### 2. Hardcoded trusted URLs
```typescript
// ✅ Safe: Hardcoded trusted domain
const API_BASE = 'https://api.trusted-service.com';
fetch(\`\${API_BASE}/users\`);
```

#### 3. Configuration-based URLs
```typescript
// ✅ Safe: From config, not user input
const externalApiUrl = process.env.EXTERNAL_API_URL;
fetch(externalApiUrl);
```

## Configuration

### Blocked Elements
- **Protocols**: `file://`, `ftp://`, `ldap://`, etc.
- **IPs**: `127.0.0.1`, `169.254.169.254`, private ranges
- **Ports**: `22`, `3306`, `6379`, `5432`, etc.

### Detection Patterns
- **HTTP Clients**: `fetch`, `axios`, `http`, `request`, etc.
- **User Input**: `req.body`, `req.query`, `ctx.request`, etc.
- **Validation Functions**: `validateUrl`, `isAllowedUrl`, etc.

## Best Practices

### 1. Use Allow-lists
```typescript
const ALLOWED_HOSTS = [
  'api.company.com',
  'webhook.trusted-partner.com'
];

function isAllowedUrl(url) {
  return ALLOWED_HOSTS.some(host => url.includes(host));
}
```

### 2. Protocol Restriction
```typescript
function validateUrl(url) {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Invalid protocol');
  }
}
```

### 3. Timeout & Redirect Limits
```typescript
const options = {
  timeout: 5000,
  maxRedirects: 0, // Prevent redirect attacks
  headers: { 'User-Agent': 'MyApp/1.0' }
};

fetch(validatedUrl, options);
```

## Testing

Run S058 on your codebase:
```bash
# Test single file
node cli.js --input=src/webhook.ts --rule=S058 --engine=heuristic

# Test entire project
node cli.js --input=src --rule=S058 --engine=heuristic
```

## Related Security Rules
- **S001**: SQL Injection Prevention
- **S002**: XSS Prevention  
- **S057**: Input Validation
- **S059**: Path Traversal Prevention
