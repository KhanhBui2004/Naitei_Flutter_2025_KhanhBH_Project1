import 'package:flutter_test/flutter_test.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/user_model.dart'; 

void main() {
  group('User Model Unit Test', () {
    final mockUserJson = {
      'accessToken': 'access_token_123',
      'refreshToken': 'refresh_token_456',
      'id': 'user_id_001',
      'username': 'khanhbh',
      'email': 'khanh@example.com',
      'firstName': 'Khanh',
      'lastName': 'Bui',
      'role': 'user',
      'image': 'https://example.com/avatar.jpg'
    };

    test('Nên tạo đối tượng User chính xác từ JSON đầy đủ', () {
      final user = User.fromJson(mockUserJson);

      expect(user.accessToken, 'access_token_123');
      expect(user.refreshToken, 'refresh_token_456');
      expect(user.id, 'user_id_001');
      expect(user.username, 'khanhbh');
      expect(user.email, 'khanh@example.com');
      expect(user.firstName, 'Khanh');
      expect(user.lastName, 'Bui');
      expect(user.role, 'user');
      expect(user.image, 'https://example.com/avatar.jpg');
    });

    test('Nên sử dụng chuỗi trống (default) khi các trường trong JSON bị null', () {
      final jsonWithNulls = {
        'id': '001',
        'username': 'testuser',
        'accessToken': null,
      };

      final user = User.fromJson(jsonWithNulls);

      expect(user.id, '001');
      expect(user.username, 'testuser');
      expect(user.accessToken, '');
      expect(user.email, '');
      expect(user.image, '');
    });

    test('Nên chuyển đổi đối tượng User sang Map JSON chính xác', () {
      final user = User(
        accessToken: 'abc',
        refreshToken: 'def',
        id: '1',
        username: 'user1',
        email: 'user@test.com',
        firstName: 'First',
        lastName: 'Last',
        role: 'admin',
        image: 'img_url',
      );

      final jsonResult = user.toJson();

      expect(jsonResult['accessToken'], 'abc');
      expect(jsonResult['id'], '1');
      expect(jsonResult['role'], 'admin');
      expect(jsonResult['image'], 'img_url');
    });

    test('Dữ liệu không thay đổi sau khi đi qua luồng fromJson -> toJson', () {
      final firstUser = User.fromJson(mockUserJson);
      final jsonOutput = firstUser.toJson();
      
      expect(jsonOutput['accessToken'], mockUserJson['accessToken']);
      expect(jsonOutput['username'], mockUserJson['username']);
      expect(jsonOutput['email'], mockUserJson['email']);
    });
  });
}