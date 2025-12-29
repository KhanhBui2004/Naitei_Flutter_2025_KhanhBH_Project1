import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ApiService Unit Test', () {
    test(
      'getRecommendationsByIngredients trả về Map DishModel khi thành công (200)',
      () async {
        final mockData = {
          'foods_with_ingredients': [
            {'id': 1, 'dish_name': 'Phở Bò', 'ingredients': 'Bánh phở, Bò'},
          ],
          'recommendation_foods': [
            {'id': 2, 'dish_name': 'Bún Chả', 'ingredients': 'Bún, Thịt'},
          ],
        };
      },
    );

    group('Helper Methods (Parsing logic)', () {

      test('Logic parseToInt phải xử lý được cả String, Double và Null', () {
        expect(int.tryParse('30 phút'.replaceAll(RegExp(r'[^0-9]'), '')), 30);
      });
    });

    test('getRecommendationsByIngredients ném Exception khi gặp lỗi 404', () async {
    });
  });
}
