# S031 - Set Secure flag for Session Cookies

## Rule Description

**S031** ensures that session cookies have the `Secure` flag set to protect them via HTTPS. This prevents cookies from being transmitted over unencrypted connections, reducing the risk of session hijacking and cookie interception.

## Security Impact

- **High**: Session cookies without Secure flag can be intercepted over HTTP
- **Attack Vector**: Man-in-the-middle attacks, network sniffing
- **Compliance**: OWASP Top 10, PCI DSS requirements

## Detection Patterns

### Vulnerable Code Examples

```javascript
// ❌ Express.js - Missing Secure flag
res.cookie("sessionid", sessionValue, {
  httpOnly: true,
  // Missing: secure: true
});

// ❌ Set-Cookie header - No Secure flag
res.setHeader("Set-Cookie", "sessionid=abc123; HttpOnly");

// ❌ Document.cookie - Insecure assignment
document.cookie = "auth=token123; path=/";

// ❌ Session middleware - Missing security
app.use(
  session({
    secret: "secret-key",
    name: "sessionid",
    // Missing: cookie: { secure: true }
  })
);
```

### Secure Code Examples

```javascript
// ✅ Express.js - With Secure flag
res.cookie("sessionid", sessionValue, {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
});

// ✅ Set-Cookie header - With Secure flag
res.setHeader("Set-Cookie", "sessionid=abc123; HttpOnly; Secure");

// ✅ Session middleware - Secure configuration
app.use(
  session({
    secret: "secret-key",
    name: "sessionid",
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: "strict",
    },
  })
);

// ✅ Conditional Secure flag based on environment
res.cookie("sessionid", sessionValue, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
});
```

## Session Cookie Indicators

The rule detects cookies that are likely session-related based on:

- **Cookie Names**: `session`, `sessionid`, `sessid`, `jsessionid`, `phpsessid`
- **Framework Patterns**: `connect.sid`, `asp.net_sessionid`
- **Authentication**: `auth`, `token`, `jwt`, `csrf`

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
    "sessionIndicators": ["session", "sessionid", "auth", "token"],
    "cookieMethods": ["setCookie", "cookie", "setHeader"]
  }
}
```

## Best Practices

1. **Always use Secure flag in production**
2. **Combine with HttpOnly flag** to prevent XSS access
3. **Use SameSite attribute** for CSRF protection
4. **Conditional setting** based on environment:
   ```javascript
   const isProduction = process.env.NODE_ENV === "production";
   res.cookie("session", value, {
     secure: isProduction,
     httpOnly: true,
     sameSite: "strict",
   });
   ```

## Related Rules

- **S032**: HttpOnly flag for cookies
- **S033**: SameSite attribute for CSRF protection
- **S034**: Cookie expiration and domain settings

## References

- [OWASP Session Management](https://owasp.org/www-project-cheat-sheets/cheatsheets/Session_Management_Cheat_Sheet.html)
- [MDN Secure Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies)
- [RFC 6265 - HTTP State Management](https://tools.ietf.org/html/rfc6265)
