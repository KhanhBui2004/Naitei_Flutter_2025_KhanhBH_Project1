# S032 Framework Support Enhancement

## Overview

S032 rule "Set HttpOnly attribute for Session Cookies" has been enhanced to support multiple JavaScript/TypeScript frameworks including **NestJS**, **Next.js**, and **Nuxt.js**.

## Supported Frameworks

### 🔹 **NestJS**

- **Patterns Detected:**

  - `@Res() response: Response` decorator usage
  - `response.cookie()` method calls
  - NestJS controller method patterns

- **Session Cookies Identified:**

  - `nest-session`, `nest-auth`
  - Standard session cookies in NestJS context

- **Example Violations:**

```typescript
@Post('login')
async login(@Res() response: Response) {
  response.cookie('sessionid', 'value', {
    secure: true,
    sameSite: 'strict',
    // Missing: httpOnly: true ❌
  });
}
```

### 🔹 **Next.js**

- **Patterns Detected:**

  - `NextResponse.cookies.set()` calls
  - `cookies().set()` from next/headers
  - Traditional `res.cookie()` in API routes
  - NextAuth configuration

- **Session Cookies Identified:**

  - `next-auth.session-token`, `next-auth.csrf-token`
  - `__Host-next-auth.*`, `__Secure-next-auth.*`
  - Standard session cookies in Next.js context

- **Example Violations:**

```typescript
export async function POST(request: NextRequest) {
  const response = NextResponse.next();

  response.cookies.set("sessionid", "value", {
    secure: true,
    sameSite: "strict",
    // Missing: httpOnly: true ❌
  });
}
```

### 🔹 **Nuxt.js**

- **Patterns Detected:**

  - `useCookie()` composable calls
  - `setCookie()` server-side functions
  - `$cookies.set()` patterns
  - H3 cookie handling

- **Session Cookies Identified:**

  - `nuxt-session`, `nuxt-auth`
  - `auth._token`, `auth._refresh_token`
  - Standard session cookies in Nuxt.js context

- **Example Violations:**

```typescript
export function useSessionCookie() {
  const sessionId = useCookie("sessionid", {
    secure: true,
    sameSite: "strict",
    // Missing: httpOnly: true ❌
  });
}
```

## Enhanced Detection Capabilities

### 📊 **Regex Patterns Added:**

```javascript
// NestJS patterns
/@Res\(\)\s*\.cookie\s*\(/gi
/response\s*:\s*Response\)\s*{\s*[^}]*response\.cookie\s*\(/gi

// Next.js patterns
/NextResponse\.next\(\)\.cookies\.set\s*\(/gi
/cookies\(\)\.set\s*\(/gi
/\.cookies\.set\s*\(/gi

// Nuxt.js patterns
/useCookie\s*\(/gi
/\$cookies\.set\s*\(/gi
/setCookie\s*\(/gi
```

### 🎯 **Session Cookie Indicators Expanded:**

```javascript
// Framework-specific session cookies
"nest-session",
  "nest-auth", // NestJS
  "next-auth.session-token",
  "next-auth.csrf-token", // Next.js
  "nuxt-session",
  "nuxt-auth",
  "auth._token", // Nuxt.js
  "access_token",
  "refresh_token",
  "id_token"; // General
```

### 🔍 **Smart Framework Detection:**

- **Import Analysis:** Detects framework from import statements
- **Decorator Recognition:** Identifies NestJS decorators like `@Res()`
- **Method Context:** Recognizes framework-specific method patterns
- **File Patterns:** Analyzes file structure for framework hints

## Test Coverage

### ✅ **Violation Detection:**

- **NestJS:** 17 violations detected in test file
- **Next.js:** 9 violations detected in test file
- **Nuxt.js:** 8 violations detected in test file

### ✅ **Secure Examples:**

- All framework clean examples pass with 0 violations
- Proper `httpOnly: true` configuration recognized

## Implementation Details

### 🔧 **Enhanced Analyzers:**

1. **Regex-Based Analyzer:**

   - Added framework-specific patterns
   - Enhanced session cookie detection
   - Framework-aware violation messages

2. **Symbol-Based Analyzer:**
   - Extended method name detection
   - Framework context recognition
   - AST-based analysis for complex patterns

### 📝 **Configuration Updates:**

```json
{
  "cookieLibraries": [
    "nestjs",
    "@nestjs/common",
    "@nestjs/core",
    "next-auth",
    "nuxt-auth",
    "@nuxt/auth",
    "@nuxtjs/auth"
  ],
  "insecurePatterns": [
    "@Res\\(\\).cookie\\([^)]*\\)(?![^{]*httpOnly)",
    "NextResponse\\.next\\(\\)(?![^{]*httpOnly)",
    "useCookie\\([^)]*\\)(?![^{]*httpOnly)"
  ]
}
```

## Benefits

1. **Comprehensive Coverage:** Supports major modern web frameworks
2. **Smart Detection:** Recognizes framework-specific patterns and conventions
3. **Accurate Analysis:** Reduces false positives through context awareness
4. **Developer Friendly:** Provides framework-specific violation messages
5. **Future Ready:** Extensible architecture for additional frameworks

## Usage Examples

### Run S032 on framework-specific files:

```bash
# Test NestJS violations
sunlint --rule=S032 --input=nestjs_violations.ts

# Test Next.js violations
sunlint --rule=S032 --input=nextjs_violations.ts

# Test Nuxt.js violations
sunlint --rule=S032 --input=nuxtjs_violations.ts

# Test all frameworks
sunlint --rule=S032 --input=framework_projects/
```

This enhancement ensures S032 provides robust session cookie security validation across the modern JavaScript/TypeScript ecosystem! 🚀
