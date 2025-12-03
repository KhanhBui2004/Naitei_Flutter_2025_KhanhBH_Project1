# C035 Analysis Strategy

## Rule Focus: Log Content Quality in Catch Blocks

### Detection Pipeline:

1. **Find Catch Blocks** (Symbol-based)
   - Use AST to detect try-catch structures
   - Extract catch parameter name (e, error, err, etc.)

2. **Locate Log Calls** (Symbol-based)
   - Find all method calls within catch block
   - Use symbol resolution to identify log methods:
     - console.log, console.error, console.warn
     - logger.log, logger.error, logger.warn, logger.info
     - log.error, log.warn, log.info
     - winston, bunyan, pino patterns

3. **Analyze Log Content** (AST + String Analysis)
   - Check log call arguments
   - Detect structured vs string logging
   - Validate required context elements
   - Check for sensitive data exposure

### Violations to Detect:

#### 1. **Missing Context Information**
```javascript
// ❌ Bad - No context
catch(e) {
  logger.error(e.message);
}

// ✅ Good - Has context  
catch(e) {
  logger.error('User creation failed', {
    error: e.message,
    stack: e.stack,
    userId: user.id,
    requestId: req.id
  });
}
```

#### 2. **Non-structured Logging**
```javascript
// ❌ Bad - String concatenation
catch(e) {
  logger.error("Error: " + e.message + " User: " + userId);
}

// ✅ Good - Structured object
catch(e) {
  logger.error('Operation failed', {
    error: e.message,
    userId: userId,
    context: 'user-service'
  });
}
```

#### 3. **Sensitive Data Exposure**
```javascript
// ❌ Bad - Exposes sensitive data
catch(e) {
  logger.error('Login failed', {
    password: user.password,
    token: authToken
  });
}

// ✅ Good - Sensitive data masked
catch(e) {
  logger.error('Login failed', {
    username: user.username,
    password: user.password.substring(0,2) + '***',
    requestId: req.id
  });
}
```

### Required Context Elements:
- Error message/stack trace
- Request/operation identifier (requestId, transactionId)  
- User/entity identifier (userId, entityId)
- Operation context (service name, method name)

### Sensitive Data Patterns to Flag:
- password, passwd, pwd
- token, jwt, auth, secret
- key, apikey, privatekey
- ssn, credit, card, cvv
- email (in some contexts)

### Implementation Priority:
1. **Phase 1**: Basic structure detection (structured vs string)
2. **Phase 2**: Context validation (required fields)
3. **Phase 3**: Sensitive data detection
4. **Phase 4**: Advanced patterns (custom loggers)
