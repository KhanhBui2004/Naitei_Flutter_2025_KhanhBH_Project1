# S057 - Log with UTC Timestamps

## Overview
Enforce UTC usage in logging and time formatting to ensure consistency across systems and avoid timezone-related issues in log analysis.

## Rule Details

This rule enforces:
- **UTC Timestamps Only**: All logged timestamps must use UTC format
- **ISO 8601/RFC3339 Standard**: Prefer standardized time formats
- **No Local Time**: Prevent usage of local time in logs
- **Framework Configuration**: Ensure logging frameworks are configured for UTC

## ❌ Incorrect Examples

```javascript
// Using local time
console.log('Event at:', new Date().toString());
console.log('Timestamp:', new Date().toLocaleString());

// Non-UTC moment.js
const moment = require('moment');
logger.info(`Event time: ${moment().format()}`);

// Local DateTime patterns
logger.error(`Error at ${DateTime.now()}`);
logger.warn(`Time: ${LocalDateTime.now()}`);

// Framework without UTC config
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  // Missing UTC timezone configuration
});
```

## ✅ Correct Examples

```javascript
// Using UTC ISO format
console.log('Event at:', new Date().toISOString());
logger.info(`Event time: ${new Date().toISOString()}`);

// UTC moment.js
const moment = require('moment');
logger.info(`Event time: ${moment.utc().format()}`);

// UTC DateTime patterns
logger.error(`Error at ${Instant.now()}`);
logger.warn(`Time: ${OffsetDateTime.now(ZoneOffset.UTC)}`);

// Proper framework configuration
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.timezone('UTC'),
    winston.format.json()
  )
});
```

## Configuration Options

### disallowedDatePatterns
Patterns that create timezone-dependent timestamps:
- `new Date().toString()`
- `new Date().toLocaleString()`
- `DateTime.now()`
- `LocalDateTime.now()`
- `moment().format()`

### allowedUtcPatterns
UTC-safe timestamp patterns:
- `toISOString()`
- `Instant.now()`
- `moment.utc()`
- `dayjs.utc()`
- `OffsetDateTime.now(ZoneOffset.UTC)`

### logFrameworks
Supported logging frameworks for configuration checking:
- Winston
- Pino
- Bunyan
- Log4js
- Console methods

## Benefits

1. **Consistent Logs**: All timestamps in the same timezone
2. **Global Compatibility**: Works across multiple regions/servers
3. **Easy Analysis**: No timezone conversion needed for log correlation
4. **Audit Compliance**: Standardized timestamps for security auditing
5. **Debugging**: Simplified troubleshooting across distributed systems

## Security Implications

- **Audit Trail**: Consistent timestamps critical for security incident investigation
- **Compliance**: Many security standards require UTC logging
- **Forensics**: Timezone consistency essential for timeline reconstruction
- **Correlation**: Multi-system log correlation requires synchronized time

## Related Rules

- **C019**: Log Level Usage - Proper log severity levels
- **S056**: Sensitive Data Logging - Avoid logging sensitive information
- **S058**: SSRF Protection - Related to secure logging practices

## Implementation Notes

### NTP Synchronization
While this rule focuses on timestamp format, ensure your systems use NTP for time synchronization:

```bash
# Check NTP status
timedatectl status

# Enable NTP sync
sudo timedatectl set-ntp true
```

### Docker Configuration
For containerized applications:

```dockerfile
# Set timezone to UTC
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
```

### Database Considerations
Ensure database timestamps also use UTC:

```sql
-- PostgreSQL
SET timezone = 'UTC';

-- MySQL
SET time_zone = '+00:00';
```

## False Positives

This rule may flag legitimate use cases in:
- Test files (can be exempted via configuration)
- Display/UI code (where local time is appropriate)
- Time calculation utilities (where local time is intentional)

Configure exemptions in the rule configuration as needed.
