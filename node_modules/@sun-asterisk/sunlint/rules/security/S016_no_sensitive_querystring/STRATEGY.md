# S016 Analysis Strategy

## Rule Focus: Prevent Sensitive Data in URL Query Parameters

### Detection Pipeline:

1. **Find URL Construction Patterns** (Symbol-based)
   - Use AST to detect URL construction: `new URL()`, `new URLSearchParams()`
   - Identify HTTP client calls: `fetch()`, `axios.*()`, `request.*()`
   - Find location manipulations: `window.location.href`, `location.search`

2. **Locate Query Parameter Usage** (Symbol-based)
   - Find property access patterns: `params.password`, `query.token`
   - Detect query string manipulations: `querystring.stringify()`, `qs.stringify()`
   - Identify URL building with template literals and concatenation

3. **Analyze Parameter Content** (AST + Pattern Analysis)
   - Check parameter names against sensitive patterns
   - Validate URL construction arguments
   - Detect object properties in URLSearchParams constructor
   - Check for sensitive data in query string values

### Violations to Detect:

#### 1. **Sensitive Data in URL Constructor**
```javascript
// ❌ Bad - Password in URL
const url = new URL(`https://api.com/login?password=${userPassword}`);

// ❌ Bad - Token in URLSearchParams
const params = new URLSearchParams({
  token: authToken,
  apiKey: process.env.API_KEY
});

// ✅ Good - Use request body or headers
const response = await fetch('https://api.com/login', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ credentials })
});
```

#### 2. **Sensitive Data in HTTP Client URLs**
```javascript
// ❌ Bad - Credentials in query string
fetch(`https://api.com/users?password=${pwd}&ssn=${userSSN}`);

// ❌ Bad - Sensitive data in axios
axios.get('/api/profile', {
  params: {
    email: user.email,
    creditCard: user.cardNumber
  }
});

// ✅ Good - Use POST with body or secure headers
axios.post('/api/profile', {
  email: user.email,
  // Move sensitive data to encrypted request body
}, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

#### 3. **Location/Window Object Manipulations**
```javascript
// ❌ Bad - Sensitive data in location
window.location.href = `/dashboard?token=${jwt}&password=${pwd}`;

// ❌ Bad - Search parameter manipulation
location.search += `&apiKey=${apiKey}&secret=${clientSecret}`;

// ✅ Good - Use sessionStorage or secure alternatives
sessionStorage.setItem('token', jwt);
window.location.href = '/dashboard';
```

#### 4. **Query String Building**
```javascript
// ❌ Bad - Sensitive data in query string
const params = querystring.stringify({
  username: user.name,
  password: user.password,
  creditCard: user.card
});

// ✅ Good - Separate public and sensitive data
const params = querystring.stringify({
  username: user.name,
  // Move sensitive data to secure request body
});
```

### Sensitive Data Patterns to Detect:

#### Authentication & Authorization:
- `password`, `passwd`, `pwd`, `pass`
- `token`, `jwt`, `accesstoken`, `refreshtoken`, `bearertoken`
- `secret`, `secretkey`, `clientsecret`, `serversecret`
- `apikey`, `api_key`, `key`, `privatekey`, `publickey`
- `auth`, `authorization`, `authenticate`
- `sessionid`, `session_id`, `jsessionid`
- `csrf`, `csrftoken`, `xsrf`

#### Financial & Personal:
- `ssn`, `social`, `socialsecurity`
- `creditcard`, `cardnumber`, `cardnum`, `ccnumber`
- `cvv`, `cvc`, `cvd`, `cid`
- `pin`, `pincode`
- `bankaccount`, `routing`, `iban`

#### Personal Identifiable Information:
- `email`, `emailaddress`, `mail`
- `phone`, `phonenumber`, `mobile`, `tel`
- `address`, `homeaddress`, `zipcode`, `postal`
- `birthdate`, `birthday`, `dob`
- `license`, `passport`, `identity`

### URL Construction Methods to Monitor:
- `new URL()`
- `new URLSearchParams()`
- `fetch()` with query parameters
- `axios.*()` methods with params
- `request.*()` methods
- `window.location.href` assignments
- `location.search` manipulations
- `querystring.stringify()` / `qs.stringify()`

### Security Risks:
1. **Server Logs**: URLs with query parameters are logged by web servers
2. **Browser History**: URLs are stored in browser history
3. **Referrer Headers**: URLs can leak via referrer headers to third parties
4. **Network Traces**: URLs visible in network monitoring tools
5. **Proxy Logs**: Corporate/ISP proxies log full URLs
6. **Cache Issues**: URLs may be cached by CDNs or proxy servers

### Recommended Alternatives:
1. **Request Body**: Use POST/PUT with JSON body for sensitive data
2. **Secure Headers**: Use Authorization header for tokens
3. **Session Storage**: Store sensitive data in secure browser storage
4. **Encrypted Payloads**: Encrypt sensitive data before transmission
5. **Server-Side Sessions**: Use session IDs instead of actual sensitive data

### Implementation Priority:
1. **Phase 1**: Basic URL construction detection (new URL, fetch)
2. **Phase 2**: HTTP client library detection (axios, request)
3. **Phase 3**: Query string manipulation detection
4. **Phase 4**: Advanced patterns (template literals, dynamic construction)