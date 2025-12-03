# S033 - Set SameSite attribute for Session Cookies

## Overview

Rule S033 enforces the presence of the `SameSite` attribute on session cookies to reduce Cross-Site Request Forgery (CSRF) risk. The SameSite attribute controls whether cookies are sent with cross-site requests, providing protection against CSRF attacks.

## Security Impact

**CSRF Protection**: The SameSite attribute helps prevent CSRF attacks by controlling when cookies are sent:

- `Strict`: Cookies are never sent with cross-site requests
- `Lax`: Cookies are sent with top-level navigation but not with sub-requests
- `None`: Cookies are sent with all cross-site requests (requires Secure flag)

**Recommended Values**: For session cookies, `strict` or `lax` are recommended for optimal security.

## Rule Details

### Detected Patterns

✅ **Secure Examples:**

```typescript
// ✅ GOOD: SameSite with strict value
res.cookie("session", sessionId, {
  secure: true,
  httpOnly: true,
  sameSite: "strict",
});

// ✅ GOOD: SameSite with lax value
res.cookie("auth", token, {
  secure: true,
  httpOnly: true,
  sameSite: "lax",
});

// ✅ GOOD: Set-Cookie header with SameSite
res.setHeader(
  "Set-Cookie",
  "session=abc123; HttpOnly; Secure; SameSite=Strict"
);

// ✅ GOOD: Express session with SameSite
app.use(
  session({
    secret: "secret",
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: "strict",
    },
  })
);
```

❌ **Violation Examples:**

```typescript
// ❌ BAD: Missing SameSite attribute
res.cookie("session", sessionId, {
  secure: true,
  httpOnly: true,
  // Missing: sameSite: "strict"
});

// ❌ BAD: No options object
res.cookie("auth", token);

// ❌ BAD: Set-Cookie header without SameSite
res.setHeader("Set-Cookie", "session=abc123; HttpOnly; Secure");

// ❌ BAD: Express session missing SameSite
app.use(
  session({
    secret: "secret",
    cookie: {
      secure: true,
      httpOnly: true,
      // Missing: sameSite: 'strict'
    },
  })
);

// ❌ BAD: Session middleware without cookie config
app.use(
  session({
    secret: "secret",
    // Missing: cookie configuration with sameSite
  })
);
```

### Supported Cookie Methods

The rule detects SameSite violations in:

- `res.cookie()` - Express cookie method
- `res.setCookie()` - Generic cookie setting
- `res.setHeader("Set-Cookie", ...)` - Raw Set-Cookie headers
- `session()` - Express-session middleware
- Other cookie-related methods: `set`, `append`, `writeHead`

### Session Cookie Detection

The rule identifies session cookies by names containing:

- `session`, `sessionid`, `sessid`
- `jsessionid`, `phpsessid`, `asp.net_sessionid`
- `connect.sid` (Express session default)
- `auth`, `token`, `jwt`
- `csrf`, `refresh`

### SameSite Values

**Acceptable Values:**

- `"strict"` - Strictest protection, cookies never sent cross-site
- `"lax"` - Moderate protection, cookies sent with top-level navigation
- `"none"` - No protection, cookies sent with all requests (requires Secure)

**Recommended Values for Session Cookies:**

- `"strict"` - For maximum security
- `"lax"` - For better UX while maintaining security

## Analysis Approach

### Symbol-based Analysis (Primary)

- Uses TypeScript AST parsing via ts-morph
- Provides semantic understanding of code structure
- Handles complex patterns like object references and spread syntax
- Analyzes method calls, object literals, and configuration references

### Regex-based Analysis (Fallback)

- Pattern-matching approach for various cookie patterns
- Handles Set-Cookie headers and express-session middleware
- Fallback when semantic analysis is unavailable
- Covers edge cases that might be missed by AST analysis

## Implementation Details

### Class-based Configuration Support

```typescript
// ✅ Detects missing SameSite in class properties
class SessionManager {
  private cookieConfig = {
    secure: true,
    httpOnly: true,
    // Missing: sameSite: "strict"
  };

  setSession(res: Response, token: string) {
    res.cookie("session", token, this.cookieConfig); // ❌ Violation
  }
}
```

### Spread Syntax Support

```typescript
// ✅ Detects missing SameSite in spread configurations
res.cookie("auth", token, {
  ...baseCookieConfig, // If baseCookieConfig lacks sameSite
  path: "/api",
  // Still missing sameSite
}); // ❌ Violation
```

### Multiple Cookie Headers

```typescript
// ✅ Detects individual cookies missing SameSite
res.setHeader("Set-Cookie", [
  "auth=token1; Secure; HttpOnly", // ❌ Missing SameSite
  "session=token2; HttpOnly; SameSite=Strict", // ✅ Has SameSite
  "csrf=token3; Secure", // ❌ Missing SameSite
]);
```

## Configuration

The rule supports various configuration options in `config.json`:

- **Session Indicators**: Patterns that identify session cookies
- **Acceptable Values**: Valid SameSite attribute values
- **Cookie Methods**: Methods that accept cookie configurations
- **Analysis Depth**: How deep to analyze nested configurations

## Integration

This rule integrates with:

- **SunLint Engine**: Main analysis framework
- **TypeScript Semantic Engine**: For AST-based analysis
- **ts-morph**: TypeScript compiler API wrapper
- **Heuristic Engine**: Fallback analysis approach

## Performance

- **Analysis Timeout**: 5 seconds per file
- **Memory Optimized**: Uses semantic engine caching
- **Selective Analysis**: Only analyzes session-related cookies
- **Duplicate Detection**: Removes duplicate violations

## Related Rules

- **S031**: Secure flag for session cookies
- **S032**: HttpOnly attribute for session cookies
- **S029**: CSRF protection mechanisms

## Best Practices

1. **Always set SameSite**: Use `strict` or `lax` for session cookies
2. **Combine with other flags**: Use with `secure` and `httpOnly`
3. **Consider UX impact**: `strict` may break some legitimate cross-site flows
4. **Test thoroughly**: Verify application functionality after enabling
5. **Update legacy code**: Retrofit existing cookie implementations

## References

- [MDN SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [OWASP Session Management](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/06-Session_Management_Testing/)
- [RFC 6265bis SameSite](https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis)
