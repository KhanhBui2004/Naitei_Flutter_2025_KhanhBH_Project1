# S006 - No Plaintext Recovery/Activation Codes

## Overview
Quy tắc này phát hiện việc gửi mã khôi phục (recovery codes), mã kích hoạt (activation codes), hoặc mã xác thực (verification codes) dưới dạng plaintext, có thể dẫn đến các lỗ hổng bảo mật nghiêm trọng.

## OWASP Classification
- **Category**: A02:2021 - Cryptographic Failures
- **CWE**: CWE-319 - Cleartext Transmission of Sensitive Information
- **Severity**: Error
- **Impact**: High (Account takeover, unauthorized access)

## Vấn đề
Khi gửi các mã nhạy cảm như recovery codes, activation codes, hoặc OTP codes dưới dạng plaintext:

1. **Nguy cơ bị chặn bắt**: Mã có thể bị đánh cắp qua các kênh không an toàn
2. **Account takeover**: Kẻ tấn công có thể sử dụng mã để chiếm quyền điều khiển tài khoản
3. **Lưu trữ không an toàn**: Mã có thể bị lưu trong logs hoặc cache
4. **Man-in-the-middle attacks**: Mã có thể bị chặn bắt trong quá trình truyền tải

## Các trường hợp vi phạm

### 1. Gửi mã qua email không mã hóa
```javascript
// ❌ Vi phạm - gửi activation code dạng plaintext
const activationCode = generateCode();
await sendEmail(user.email, \`Your activation code is: \${activationCode}\`);

// ❌ Vi phạm - trả về recovery code trong API response
app.post('/forgot-password', (req, res) => {
  const recoveryCode = generateRecoveryCode();
  res.json({ 
    message: 'Password reset initiated',
    recoveryCode: recoveryCode  // Nguy hiểm!
  });
});
```

### 2. Lưu mã trong logs
```javascript
// ❌ Vi phạm - log OTP code
const otpCode = generateOTP();
console.log(\`Generated OTP for user \${userId}: \${otpCode}\`);
logger.info(\`Sending verification code: \${verificationCode}\`);
```

### 3. Hiển thị mã trong response body
```javascript
// ❌ Vi phạm - trả về mã trong response
const resetCode = await generateResetCode(userId);
return {
  success: true,
  resetCode: resetCode,
  message: 'Check your email'
};
```

## Giải pháp an toàn

### 1. Mã hóa mã trước khi gửi
```javascript
// ✅ An toàn - hash mã trước khi lưu trữ
const activationCode = generateCode();
const hashedCode = await bcrypt.hash(activationCode, 10);
await saveToDatabase({ userId, hashedCode });

// Chỉ gửi mã qua kênh an toàn
await sendSecureEmail(user.email, activationCode);
```

### 2. Sử dụng token thay vì mã trực tiếp
```javascript
// ✅ An toàn - sử dụng secure token
const resetToken = jwt.sign({ userId, purpose: 'reset' }, SECRET_KEY, { expiresIn: '15m' });
const resetLink = \`https://app.com/reset?token=\${resetToken}\`;
await sendEmail(user.email, \`Click here to reset: \${resetLink}\`);
```

### 3. Chỉ thông báo thành công, không trả về mã
```javascript
// ✅ An toàn - không expose mã
app.post('/send-otp', async (req, res) => {
  const otp = generateOTP();
  await sendSMSOTP(user.phone, otp);
  
  res.json({ 
    success: true,
    message: 'OTP sent to your phone'
    // Không trả về OTP
  });
});
```

### 4. Logging an toàn
```javascript
// ✅ An toàn - log mà không expose mã
const verificationCode = generateCode();
logger.info(\`Verification code sent to user \${userId}\`);
// Không log mã thực tế
```

## Phương pháp phát hiện

Rule này sử dụng heuristic analysis để phát hiện:

1. **Pattern matching**: Tìm kiếm các từ khóa như `recovery`, `activation`, `reset`, `otp`, `verification` kết hợp với `send`, `email`, `response`
2. **Variable analysis**: Phân tích tên biến có chứa từ khóa nhạy cảm
3. **Context analysis**: Kiểm tra ngữ cảnh truyền tải (HTTP response, email, SMS)
4. **String literal analysis**: Phát hiện mã được hardcode trong chuỗi

## Cấu hình

```json
{
  "S006": {
    "enabled": true,
    "severity": "error",
    "excludePatterns": [
      "test/**",
      "**/*.test.js",
      "**/*.spec.js"
    ]
  }
}
```

## Best Practices

1. **Luôn mã hóa**: Mã hóa tất cả mã nhạy cảm trước khi truyền tải
2. **Sử dụng HTTPS**: Đảm bảo tất cả API endpoints sử dụng HTTPS
3. **Time-limited tokens**: Sử dụng tokens có thời hạn thay vì mã tĩnh
4. **Secure channels**: Sử dụng các kênh truyền tải an toàn (encrypted email, secure SMS)
5. **No logging**: Không bao giờ log mã nhạy cảm
6. **Hash storage**: Luôn hash mã trước khi lưu vào database

## Tài liệu tham khảo

- [OWASP A02:2021 - Cryptographic Failures](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
- [CWE-319: Cleartext Transmission of Sensitive Information](https://cwe.mitre.org/data/definitions/319.html)
- [NIST Guidelines for Password Recovery](https://pages.nist.gov/800-63-3/sp800-63b.html)
