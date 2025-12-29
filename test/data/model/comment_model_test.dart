import 'package:flutter_test/flutter_test.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/comment_model.dart';

void main() {
  group('Comment Model Test', () {
    // 1. Test chuyển từ JSON sang Object (fromJson)
    test('Nên tạo đối tượng Comment đúng từ JSON đầy đủ', () {
      final json = {
        'id': 1,
        'content': 'Món này ngon quá!',
        'user': {
          'id': 10,
          'username': 'khanhbh',
          'image_link': 'https://link-to-avt.png'
        }
      };

      final result = Comment.fromJson(json);

      expect(result.id, 1);
      expect(result.userId, 10);
      expect(result.username, 'khanhbh');
      expect(result.content, 'Món này ngon quá!');
      expect(result.avtUrl, 'https://link-to-avt.png');
    });

    test('Nên sử dụng giá trị mặc định khi JSON bị thiếu trường (null)', () {
      final json = {
        'id': null,
        'user': null,
        // content thiếu hoàn toàn
      };

      final result = Comment.fromJson(json);

      expect(result.id, 0); // Giá trị mặc định bạn đặt là 0
      expect(result.userId, 0);
      expect(result.username, '');
      expect(result.content, '');
    });

    // 2. Test chuyển từ Object sang JSON (toJson)
    test('Nên trả về Map JSON đúng khi gọi toJson', () {
      final comment = Comment(
        id: 1,
        userId: 10,
        username: 'khanhbh',
        content: 'Ngon!',
        avtUrl: 'url',
      );

      final result = comment.toJson();

      expect(result['id'], 1);
      expect(result['user_id'], 10);
      expect(result['content'], 'Ngon!');
    });
  });
}