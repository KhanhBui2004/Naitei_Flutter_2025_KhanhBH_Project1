# S007: No Plaintext OTP

## Mô tả

Rule này phát hiện việc lưu trữ hoặc truyền tải OTP (One-Time Password) codes dưới dạng plaintext. Theo OWASP A02:2021 - Cryptographic Failures, việc lưu trữ OTP không được mã hóa có thể dẫn đến các cuộc tấn công chiếm quyền tài khoản.

## Vấn đề bảo mật

- **CWE-256**: Unprotected Storage of Credentials
- **OWASP A02:2021**: Cryptographic Failures
- **Impact**: Cao - Chiếm quyền tài khoản, truy cập trái phép vào các tài khoản được bảo vệ bằng 2FA
- **Likelihood**: Trung bình

## Các trường hợp vi phạm

### 1. Lưu trữ OTP plaintext trong database

❌ **Vi phạm:**
```javascript
const otpCode = '123456';
await db.users.update({ userId }, { otpCode });

// Hoặc
const query = `INSERT INTO users (otp) VALUES ('${otp}')`;
```

✅ **Đúng cách:**
```javascript
const hashedOtp = await bcrypt.hash(otpCode, 10);
await db.users.update({ userId }, { otpCode: hashedOtp });

// Hoặc
const salt = crypto.randomBytes(16).toString('hex');
const hashedOtp = crypto.createHash('sha256').update(otp + salt).digest('hex');
const query = `INSERT INTO users (otp_hash, salt) VALUES ('${hashedOtp}', '${salt}')`;
```

### 2. Trả về OTP trong API response

❌ **Vi phạm:**
```javascript
res.json({ 
  success: true, 
  otp: user.otpCode,
  verificationCode: generatedOtp
});
```

✅ **Đúng cách:**
```javascript
res.json({ 
  success: true, 
  message: 'OTP sent to registered phone number',
  otpSent: true
});
```

### 3. Lưu trữ OTP trong localStorage/sessionStorage

❌ **Vi phạm:**
```javascript
localStorage.setItem('otp', otpCode);
sessionStorage.otpCode = generatedOtp;
```

✅ **Đúng cách:**
```javascript
const encryptedOtp = encrypt(otpCode);
localStorage.setItem('otp', encryptedOtp);

// Hoặc tốt hơn: không lưu OTP trong browser storage
// Chỉ lưu token đã mã hóa hoặc session identifier
```

### 4. Ghi log OTP codes

❌ **Vi phạm:**
```javascript
console.log('User OTP:', otpCode);
logger.info(`Generated OTP: ${otp} for user ${userId}`);
```

✅ **Đúng cách:**
```javascript
console.log('OTP sent successfully to user');
logger.info(`OTP generated and sent to user ${userId}`);
```

### 5. Gửi OTP qua email/SMS không mã hóa

❌ **Vi phạm:**
```javascript
await sendSMS(`Your OTP is: ${otpCode}`);
await sendEmail('OTP Verification', `Your code: ${otp}`);
```

✅ **Đúng cách:**
```javascript
await sendEncryptedSMS(otpCode); // Sử dụng kênh mã hóa
await sendSecureEmail('OTP Verification', { otp: encryptedOtp });
```

## Cách khắc phục

### 1. Mã hóa OTP trước khi lưu trữ

```javascript
// Sử dụng bcrypt
const hashedOtp = await bcrypt.hash(otpCode, 10);

// Sử dụng crypto với salt
const salt = crypto.randomBytes(16).toString('hex');
const hashedOtp = crypto.createHash('sha256').update(otp + salt).digest('hex');

// Sử dụng HMAC
const hmac = crypto.createHmac('sha256', secretKey);
hmac.update(otp);
const hashedOtp = hmac.digest('hex');
```

### 2. Sử dụng token thay vì OTP plaintext

```javascript
// Tạo encrypted token thay vì lưu OTP trực tiếp
const otpToken = jwt.sign(
  { userId, otp: hashedOtp, exp: Date.now() + 300000 }, // 5 phút
  process.env.JWT_SECRET
);

// Lưu token thay vì OTP
await db.otpTokens.create({ userId, token: otpToken });
```

### 3. Xác thực OTP an toàn

```javascript
// Thay vì so sánh plaintext
async function verifyOtp(userId, inputOtp) {
  const user = await db.users.findOne({ userId });
  
  // So sánh với hash
  const isValid = await bcrypt.compare(inputOtp, user.otpHash);
  
  if (isValid) {
    // Xóa OTP sau khi sử dụng
    await db.users.update({ userId }, { otpHash: null });
  }
  
  return isValid;
}
```

### 4. Sử dụng thư viện OTP chuyên dụng

```javascript
const speakeasy = require('speakeasy');

// Tạo TOTP (Time-based OTP)
const secret = speakeasy.generateSecret({
  name: 'Your App',
  length: 20
});

// Xác thực TOTP
const verified = speakeasy.totp.verify({
  secret: user.secret,
  encoding: 'base32',
  token: userInputToken,
  window: 2
});
```

## Cấu hình rule

```json
{
  "S007": {
    "checkStorage": true,
    "checkTransmission": true,
    "checkLogging": true,
    "checkResponses": true,
    "checkLocalStorage": true,
    "strictMode": false
  }
}
```

## Các rule liên quan

- **S006**: No Plaintext Recovery/Activation Codes
- **S012**: No Hardcoded Secrets  
- **S027**: No Hardcoded Secrets Advanced

## Tài liệu tham khảo

- [OWASP Top 10 2021 - A02 Cryptographic Failures](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
- [CWE-256: Unprotected Storage of Credentials](https://cwe.mitre.org/data/definitions/256.html)
- [NIST SP 800-63B Authentication Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
