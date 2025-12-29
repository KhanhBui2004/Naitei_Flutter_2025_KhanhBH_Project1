import 'package:flutter_test/flutter_test.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/tag_model.dart'; 

void main() {
  group('Tag Model Test', () {
    test('Nên tạo đối tượng Tag chính xác từ JSON', () {
      final json = {
        'id': 5,
        'name': 'Món Khai Vị',
        'image_url': 'https://example.com/appetizer.png'
      };

      final tag = Tag.fromJson(json);

      expect(tag.id, 5);
      expect(tag.name, 'Món Khai Vị');
      expect(tag.imageUrl, 'https://example.com/appetizer.png');
    });

    test('Nên sử dụng chuỗi trống nếu image_url bị null', () {
      final json = {
        'id': 1,
        'name': 'Món Chay',
        'image_url': null
      };

      final tag = Tag.fromJson(json);

      expect(tag.imageUrl, '');
    });
  });
}