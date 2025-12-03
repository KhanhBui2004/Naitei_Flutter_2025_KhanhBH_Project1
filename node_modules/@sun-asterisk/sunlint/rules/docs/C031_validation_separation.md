# Rule C031 - Validation Logic Separation

## Description
Logic kiểm tra dữ liệu (validate) phải nằm riêng biệt khỏi business logic.

## Rationale
Tách biệt validation logic giúp:
- Code dễ đọc và maintain
- Validation có thể reuse
- Testing dễ dàng hơn
- Tuân thủ Single Responsibility Principle

## Examples

### ❌ Bad - Validation mixed with business logic
```javascript
function processOrder(order) {
    // Validation mixed with business logic
    if (!order.customerId) {
        throw new Error('Customer ID is required');
    }
    if (!order.items || order.items.length === 0) {
        throw new Error('Order must have items');
    }
    if (order.total < 0) {
        throw new Error('Total cannot be negative');
    }
    
    // Business logic
    const discount = calculateDiscount(order);
    const tax = calculateTax(order);
    return processPayment(order, discount, tax);
}
```

### ✅ Good - Separate validation
```javascript
function validateOrder(order) {
    if (!order.customerId) {
        throw new Error('Customer ID is required');
    }
    if (!order.items || order.items.length === 0) {
        throw new Error('Order must have items');
    }
    if (order.total < 0) {
        throw new Error('Total cannot be negative');
    }
}

function processOrder(order) {
    validateOrder(order);
    
    // Pure business logic
    const discount = calculateDiscount(order);
    const tax = calculateTax(order);
    return processPayment(order, discount, tax);
}
```

## Configuration
```json
{
    "C031": {
        "enabled": true,
        "severity": "warning",
        "options": {
            "maxValidationStatementsInFunction": 3,
            "requireSeparateValidationFunction": true
        }
    }
}
```
