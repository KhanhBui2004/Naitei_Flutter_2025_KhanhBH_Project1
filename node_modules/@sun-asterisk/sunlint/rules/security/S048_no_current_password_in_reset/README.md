# S048 - No Current Password in Reset Process

## Mô tả

Rule này kiểm tra xem các quy trình đặt lại mật khẩu có yêu cầu mật khẩu hiện tại hay không. Việc yêu cầu mật khẩu hiện tại trong quy trình reset mật khẩu vi phạm nguyên tắc bảo mật và làm mất đi mục đích của tính năng "quên mật khẩu".

## Mục tiêu

- Ngăn chặn việc yêu cầu mật khẩu hiện tại trong quy trình reset mật khẩu
- Đảm bảo quy trình reset mật khẩu được thiết kế an toàn và hợp lý
- Tuân thủ OWASP A04:2021 - Insecure Design và CWE-640

## Chi tiết Rule

### Phát hiện lỗi khi:

1. **API endpoints yêu cầu current password trong reset**:
   ```javascript
   app.post('/reset-password', (req, res) => {
     const { currentPassword, newPassword } = req.body; // ❌ Yêu cầu mật khẩu hiện tại
     if (!validateCurrentPassword(currentPassword)) {
       return res.status(400).json({ error: 'Current password incorrect' });
     }
   });
   ```

2. **Form validation yêu cầu current password**:
   ```typescript
   const resetPasswordSchema = {
     currentPassword: { type: String, required: true }, // ❌ Bắt buộc mật khẩu hiện tại
     newPassword: { type: String, required: true }
   };
   ```

3. **Service methods kiểm tra current password trong reset**:
   ```javascript
   async resetPassword(userId, currentPassword, newPassword) {
     const user = await User.findById(userId);
     if (!user.validatePassword(currentPassword)) { // ❌ Validate mật khẩu hiện tại
       throw new Error('Current password is incorrect');
     }
   }
   ```

4. **React components với current password field**:
   ```typescript
   function ResetPasswordForm() {
     return (
       <form>
         <input name="currentPassword" required /> {/* ❌ Trường mật khẩu hiện tại */}
         <input name="newPassword" required />
       </form>
     );
   }
   ```

### Cách khắc phục:

1. **Sử dụng token-based reset**:
   ```javascript
   app.post('/reset-password', (req, res) => {
     const { token, newPassword } = req.body; // ✅ Sử dụng token thay vì current password
     if (!validateResetToken(token)) {
       return res.status(400).json({ error: 'Invalid reset token' });
     }
   });
   ```

2. **Schema với reset token**:
   ```typescript
   const resetPasswordSchema = {
     resetToken: { type: String, required: true }, // ✅ Token reset an toàn
     newPassword: { type: String, required: true }
   };
   ```

3. **Service method an toàn**:
   ```javascript
   async resetPasswordWithToken(resetToken, newPassword) {
     const tokenData = await validateResetToken(resetToken); // ✅ Validate token
     if (!tokenData.valid) {
       throw new Error('Invalid or expired reset token');
     }
   }
   ```

4. **Form với email verification**:
   ```typescript
   function ForgotPasswordForm() {
     return (
       <form>
         <input name="email" type="email" required /> {/* ✅ Chỉ cần email */}
         <button>Send Reset Link</button>
       </form>
     );
   }
   ```

## Tại sao đây là vấn đề bảo mật?

### 1. **Mâu thuẫn logic**
- Nếu người dùng nhớ mật khẩu hiện tại, họ không cần reset
- Yêu cầu mật khẩu hiện tại làm vô hiệu hóa tính năng "quên mật khẩu"

### 2. **Tạo điểm yếu bảo mật**
- Kẻ tấn công có thể lợi dụng để brute force mật khẩu
- Tăng surface attack cho account takeover

### 3. **Trải nghiệm người dùng kém**
- Người dùng quên mật khẩu không thể hoàn thành quy trình reset
- Dẫn đến khóa tài khoản và frustration

## Các trường hợp ngoại lệ

### Trường hợp hợp lệ (không phải lỗi):

1. **Password Change (không phải Reset)**:
   ```javascript
   // ✅ Thay đổi mật khẩu khi đã đăng nhập - hợp lệ
   app.post('/change-password', authenticateUser, (req, res) => {
     const { currentPassword, newPassword } = req.body;
     // Hợp lệ vì đây là thay đổi, không phải reset
   });
   ```

2. **Profile settings**:
   ```javascript
   // ✅ Cập nhật mật khẩu trong settings - hợp lệ
   function ProfileSettings() {
     return (
       <div>
         <h2>Change Password</h2> {/* Đây là change, không phải reset */}
         <input name="currentPassword" />
         <input name="newPassword" />
       </div>
     );
   }
   ```

## Phương pháp detect

Rule này sử dụng **heuristic analysis** với các pattern:

1. **Context Detection**: Phát hiện ngữ cảnh password reset
   - Keywords: `reset`, `forgot`, `recover`, `forgotpassword`
   - Endpoints: `/reset-password`, `/forgot-password`
   - Functions: `resetPassword()`, `forgotPassword()`

2. **Violation Detection**: Tìm yêu cầu current password
   - Field names: `currentPassword`, `oldPassword`, `existingPassword`
   - Validation patterns: `validateCurrentPassword()`, `checkOldPassword()`
   - Schema fields: `currentPassword: { required: true }`

3. **Context Filtering**: Loại bỏ false positives
   - Bỏ qua password change contexts
   - Bỏ qua test files và documentation
   - Bỏ qua comments và type definitions

## Tham khảo

- [OWASP A04:2021 - Insecure Design](https://owasp.org/Top10/A04_2021-Insecure_Design/)
- [CWE-640: Weak Password Recovery Mechanism for Forgotten Password](https://cwe.mitre.org/data/definitions/640.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#forgot-password)
- [NIST SP 800-63B - Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html#sec5)

## Ví dụ

### Violation Examples

```javascript
// ❌ Express.js với current password requirement
app.post('/reset-password', (req, res) => {
  if (!req.body.currentPassword) {
    return res.status(400).json({ error: 'Current password required' });
  }
});

// ❌ NestJS với validation current password
@Post('reset-password')
async resetPassword(@Body() data: { currentPassword: string, newPassword: string }) {
  await this.authService.validateCurrentPassword(data.currentPassword);
}

// ❌ Mongoose schema yêu cầu current password
const resetSchema = new Schema({
  currentPassword: { type: String, required: true }, // Vi phạm
  newPassword: { type: String, required: true }
});

// ❌ React form với current password field
<input 
  name="currentPassword" 
  placeholder="Enter current password" 
  required 
/>
```

### Secure Examples

```javascript
// ✅ Token-based reset
app.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  if (!validateResetToken(token)) {
    return res.status(400).json({ error: 'Invalid reset token' });
  }
});

// ✅ Email-based forgot password
app.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  sendResetEmail(email);
  res.json({ message: 'Reset link sent to email' });
});

// ✅ Secure reset schema
const resetSchema = new Schema({
  resetToken: { type: String, required: true },
  newPassword: { type: String, required: true },
  tokenExpiry: { type: Date, required: true }
});
```
