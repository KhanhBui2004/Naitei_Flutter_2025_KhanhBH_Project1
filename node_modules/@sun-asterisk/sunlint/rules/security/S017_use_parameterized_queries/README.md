# S017 - Always use parameterized queries

## Rule Description

Always use parameterized queries instead of string concatenation to build SQL queries. This prevents SQL injection attacks by separating SQL logic from data.

## Risk Level

**HIGH** - SQL injection is one of the most critical security vulnerabilities

## Rule Details

This rule detects potentially vulnerable SQL query construction patterns:

### ❌ Violations (Dangerous Patterns)

```javascript
// String concatenation with user input
const query = "SELECT * FROM users WHERE id = " + userId;
db.query(query);

// Template literals with interpolation
const sql = `SELECT * FROM products WHERE name = '${productName}'`;
connection.execute(sql);

// Direct variable insertion
const deleteQuery = "DELETE FROM orders WHERE status = '" + status + "'";
mysql.query(deleteQuery);

// Complex concatenation
const updateSql =
  "UPDATE users SET name = '" +
  name +
  "', email = '" +
  email +
  "' WHERE id = " +
  id;
```

### ✅ Correct Usage (Safe Patterns)

```javascript
// Using parameterized queries with placeholders
const query = "SELECT * FROM users WHERE id = ?";
db.query(query, [userId]);

// Using named parameters
const sql = "SELECT * FROM products WHERE name = $1";
client.query(sql, [productName]);

// Using prepared statements
const stmt = db.prepare("DELETE FROM orders WHERE status = ?");
stmt.run(status);

// ORM usage (usually safe)
const user = await User.findOne({ where: { id: userId } });

// Using parameter objects
const updateSql = "UPDATE users SET name = ?, email = ? WHERE id = ?";
db.query(updateSql, [name, email, id]);
```

## Detected Libraries

- **Database drivers**: mysql, mysql2, pg, sqlite3, mssql, oracle
- **ORMs**: sequelize, typeorm, prisma, mongoose
- **Query builders**: knex, objection

## Security Impact

- **SQL Injection attacks**: Malicious SQL code execution
- **Data breach**: Unauthorized access to sensitive data
- **Data manipulation**: Unauthorized data modification/deletion
- **Authentication bypass**: Circumventing login mechanisms
- **Privilege escalation**: Gaining admin access

## Best Practices

1. **Always use parameterized queries** with placeholders (?, $1, etc.)
2. **Use prepared statements** when available
3. **Validate and sanitize** all user inputs
4. **Use ORMs** that handle parameterization automatically
5. **Apply principle of least privilege** for database accounts
6. **Regular security audits** of SQL query patterns

## Examples by Library

### MySQL/MySQL2

```javascript
// ❌ Vulnerable
const query = `SELECT * FROM users WHERE email = '${email}'`;
connection.query(query);

// ✅ Safe
const query = "SELECT * FROM users WHERE email = ?";
connection.query(query, [email]);
```

### PostgreSQL (pg)

```javascript
// ❌ Vulnerable
const text = `SELECT * FROM users WHERE id = ${id}`;
client.query(text);

// ✅ Safe
const text = "SELECT * FROM users WHERE id = $1";
client.query(text, [id]);
```

### SQLite

```javascript
// ❌ Vulnerable
const sql = "INSERT INTO logs (message) VALUES ('" + message + "')";
db.run(sql);

// ✅ Safe
const sql = "INSERT INTO logs (message) VALUES (?)";
db.run(sql, [message]);
```

## References

- [OWASP SQL Injection Prevention](https://owasp.org/www-community/attacks/SQL_Injection)
- [CWE-89: SQL Injection](https://cwe.mitre.org/data/definitions/89.html)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
