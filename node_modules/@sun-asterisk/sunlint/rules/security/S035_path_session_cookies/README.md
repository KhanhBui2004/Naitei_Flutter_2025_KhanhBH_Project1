# S035 - Set Path attribute for Session Cookies

## Overview

This rule enforces the use of the `Path` attribute for session cookies to limit their access scope and reduce the attack surface.

## Description

The `Path` attribute restricts where cookies can be sent by specifying the URL path for which the cookie is valid. This security measure helps prevent:

- **Unintended cookie exposure** to different parts of the application
- **Cross-path cookie attacks** where malicious code in one path accesses cookies from another
- **Privilege escalation** through cookie access from less secure paths

## Rule Details

**Rule ID**: S035  
**Category**: Security  
**Severity**: Warning  
**Type**: Hybrid Analysis (Symbol-based + Regex-based)

## Examples

### ❌ Violations

```typescript
// Express.js - Missing Path attribute
res.cookie("sessionid", sessionId, {
  secure: true,
  httpOnly: true,
  sameSite: "strict",
  // Missing: path attribute
});

// NestJS - Authentication cookie without Path attribute
@Post('login')
login(@Res() response: Response) {
  response.cookie('auth_token', value, {
    secure: true,
    httpOnly: true,
    // Missing: path attribute
  });
}

// Next.js - Session cookie missing Path attribute
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('sessionid', token, {
    secure: true,
    httpOnly: true,
    // Missing: path attribute
  });
  return response;
}

// NextAuth.js - Session token without Path attribute
export default NextAuth({
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        secure: true,
        httpOnly: true,
        // Missing: path attribute
      }
    }
  }
});

// Using root path (not recommended)
res.cookie("auth", authToken, {
  secure: true,
  httpOnly: true,
  path: "/", // Too broad - exposes cookie to entire domain
  sameSite: "strict",
});
```

### ✅ Correct Usage

```typescript
// Express.js - Specific path for admin area
res.cookie("admin_session", sessionId, {
  secure: true,
  httpOnly: true,
  path: "/admin",
  sameSite: "strict",
});

// NestJS - API-specific cookie with path
@Post('login')
login(@Res() response: Response) {
  response.cookie('auth_token', value, {
    secure: true,
    httpOnly: true,
    path: '/api',
    sameSite: 'strict',
  });
}

// Next.js - Session cookie with specific path
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('sessionid', token, {
    secure: true,
    httpOnly: true,
    path: '/app',
    sameSite: 'strict',
  });
  return response;
}

// NextAuth.js - Session token with path
export default NextAuth({
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        secure: true,
        httpOnly: true,
        path: '/auth',
        sameSite: 'lax',
      }
    }
  }
});
```

## Configuration

### Detected Patterns

This rule detects session cookies without Path attribute in multiple frameworks:

### Express.js

- `res.cookie()` calls with session cookie names without Path attribute
- `res.setHeader()` with `Set-Cookie` headers missing Path attribute
- Session middleware configuration without Path attribute
- Array of Set-Cookie headers with session cookies missing Path attribute

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

- Session token configuration without Path attribute
- CSRF token configuration missing Path attribute
- Cookie configuration in NextAuth providers

**Session Cookie Names:**

- `session`, `sessionid`, `session_id`
- `sid`, `connect.sid`
- `auth`, `auth_token`, `authentication`
- `jwt`, `token`, `csrf`, `csrf_token`, `xsrf`
- `user`, `userid`, `user_id`, `login`
- `sessionToken`, `csrfToken` (NextAuth specific)
- `next-auth.session-token`, `next-auth.csrf-token`

**Cookie Methods:**

- Express.js: `res.cookie()`, `res.setHeader()`, session middleware
- NestJS: `@Res()` response methods, `@Cookies()` decorators
- Next.js: `response.cookies.set()`, `cookies().set()`
- NextAuth.js: sessionToken/csrfToken configuration

### Recommended Path Values

**Specific Paths** (Recommended):

- `/app` - Application-specific
- `/admin` - Administrative areas
- `/api` - API endpoints
- `/auth` - Authentication flows
- `/user` - User-specific areas

**Root Path** (`/`):

- Acceptable but triggers warning
- Should be avoided for security

## Security Benefits

1. **Scope Limitation**: Restricts cookie access to specific application areas
2. **Attack Surface Reduction**: Prevents cookie exposure to unintended paths
3. **Privilege Separation**: Isolates cookies between different functional areas
4. **Defense in Depth**: Adds another layer of security control

## Analysis Approach

### Symbol-based Analysis (Primary)

- Uses TypeScript AST for semantic analysis
- Detects cookie configurations in object literals
- Analyzes session middleware setups
- Provides precise line/column positions

### Regex-based Analysis (Fallback)

- Pattern-based detection for complex cases
- Handles Set-Cookie headers and arrays
- Covers edge cases missed by AST analysis
- Maintains line number accuracy

## Best Practices

1. **Use specific paths** instead of root path `/`
2. **Match paths to functionality** (e.g., `/admin` for admin cookies)
3. **Avoid overly broad paths** that expose cookies unnecessarily
4. **Consider path hierarchy** for nested application structures
5. **Document path conventions** in your application

## Testing

Run the rule on test fixtures:

```bash
# Test violations (Express.js)
node cli.js --rule=S035 --input=examples/rule-test-fixtures/rules/S035_path_session_cookies/violations --engine=heuristic

# Test clean examples
node cli.js --rule=S035 --input=examples/rule-test-fixtures/rules/S035_path_session_cookies/clean --engine=heuristic

# Framework-specific testing
# Test with ESLint engine (fast)
node cli.js --rule=S035 --input=path/to/your/files

# Test with heuristic engine (comprehensive)
node cli.js --rule=S035 --input=path/to/your/files --engine=heuristic
```

## Framework Compatibility

- **Node.js**: All versions
- **Frameworks**: Express.js, NestJS, Next.js, NextAuth.js
- **Languages**: JavaScript, TypeScript
- **Analysis Engines**: ESLint (fast), Heuristic (comprehensive)

## Related Rules

- **S032**: Set Secure flag for Session Cookies
- **S033**: Set SameSite attribute for Session Cookies
- **S034**: Use \_\_Host- prefix for Session Cookies

Together, these rules provide comprehensive session cookie security.
