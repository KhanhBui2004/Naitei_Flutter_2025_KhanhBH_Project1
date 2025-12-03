# S034: Use \_\_Host- prefix for Session Cookies

## Overview

This rule enforces the use of `__Host-` prefix for session cookies to prevent subdomain sharing attacks. The `__Host-` prefix is a security feature that ensures cookies are only sent to the exact domain that set them.

## Rule Details

**Rule ID**: S034  
**Category**: Security  
**Severity**: Warning  
**Confidence**: High

## Description

The `__Host-` prefix is a cookie security feature that:

- Prevents subdomain cookie sharing
- Requires the cookie to be secure (HTTPS only)
- Requires path to be `/` (root path)
- Prohibits the Domain attribute
- Ensures cookies are only sent to the exact domain that set them

## Examples

### ❌ Violations

```javascript
// Express.js - Missing __Host- prefix for session cookie
res.cookie("sessionid", token, {
  secure: true,
  httpOnly: true,
});

// NestJS - Authentication cookie without __Host- prefix
@Post('login')
login(@Res() response: Response) {
  response.cookie('auth_token', value, {
    secure: true,
    path: '/',
  });
}

// Next.js - Session cookie missing __Host- prefix
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('sessionid', token, {
    secure: true,
    httpOnly: true,
  });
  return response;
}

// NextAuth.js - Session token without __Host- prefix
export default NextAuth({
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        secure: true,
        httpOnly: true,
      }
    }
  }
});
```

### ✅ Correct Usage

```javascript
// Express.js - Proper __Host- prefix for session cookie
res.cookie("__Host-sessionid", token, {
  secure: true,
  httpOnly: true,
  path: "/",
});

// NestJS - Authentication cookie with __Host- prefix
@Post('login')
login(@Res() response: Response) {
  response.cookie('__Host-auth_token', value, {
    secure: true,
    httpOnly: true,
    path: '/',
  });
}

// Next.js - Session cookie with __Host- prefix
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('__Host-sessionid', token, {
    secure: true,
    httpOnly: true,
    path: '/',
  });
  return response;
}

// NextAuth.js - Session token with __Host- prefix
export default NextAuth({
  cookies: {
    sessionToken: {
      name: '__Host-next-auth.session-token',
      options: {
        secure: true,
        httpOnly: true,
        path: '/',
      }
    }
  }
});
```

## \_\_Host- Prefix Requirements

When using the `__Host-` prefix, the following requirements must be met:

1. **Secure**: Cookie must have the `Secure` attribute (HTTPS only)
2. **Path**: Must be set to `/` (root path)
3. **Domain**: Must NOT have a Domain attribute
4. **Exact Domain**: Cookie will only be sent to the exact domain that set it

## Detected Patterns

This rule detects session cookies without `__Host-` prefix in multiple frameworks:

### Express.js

- `res.cookie()` calls with session cookie names without `__Host-` prefix
- `res.setHeader()` with `Set-Cookie` headers missing `__Host-` prefix
- Session middleware configuration with cookie names missing `__Host-` prefix
- Array of Set-Cookie headers with session cookies missing `__Host-` prefix

### NestJS

- `@Res()` decorator response cookie methods
- `@Cookies()` decorator usage with session cookies
- Response object cookie setting methods
- NestJS session middleware configuration

### Next.js

- `response.cookies.set()` method calls
- `cookies().set()` from next/headers
- NextAuth.js session and CSRF token configuration
- API route response cookie setting

### NextAuth.js

- Session token configuration without `__Host-` prefix
- CSRF token configuration missing `__Host-` prefix
- Cookie configuration in NextAuth providers

## Session Cookie Detection

The rule identifies session cookies based on common naming patterns:

- `session`, `sessionid`, `session_id`
- `sid`, `connect.sid`
- `auth`, `auth_token`, `authentication`
- `jwt`, `token`
- `csrf`, `csrf_token`, `xsrf`
- `login`, `user`, `userid`, `user_id`
- `sessionToken`, `csrfToken` (NextAuth specific)

## Configuration

The rule uses regex-based analysis for comprehensive framework support:

- **Regex-based**: Pattern matching for framework-specific cookie patterns
- **Framework Support**: Express.js, NestJS, Next.js, NextAuth.js

## Security Impact

**Without \_\_Host- prefix:**

- Subdomain cookie sharing vulnerabilities
- Session fixation attacks from subdomains
- Cross-subdomain session hijacking

**With \_\_Host- prefix:**

- Cookies isolated to exact domain
- Prevention of subdomain attacks
- Enhanced session security

## Compatibility

- **Node.js**: All versions
- **Frameworks**: Express.js, NestJS, Next.js, NextAuth.js
- **Browsers**: Modern browsers supporting \_\_Host- prefix
- **Languages**: JavaScript, TypeScript

## References

- [MDN: \_\_Host- prefix](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#__Host-)
- [RFC Draft: Cookie Prefixes](https://tools.ietf.org/html/draft-ietf-httpbis-cookie-prefixes-00)
- [OWASP: Secure Cookie Attribute](https://owasp.org/www-community/controls/SecureCookieAttribute)

## Related Rules

- **S031**: Set Secure attribute for Session Cookies
- **S032**: Set HttpOnly attribute for Session Cookies
- **S033**: Set SameSite attribute for Session Cookies
