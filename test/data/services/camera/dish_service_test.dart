import 'package:flutter_test/flutter_test.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/camera/dish_service.dart'; 

void main() {
  group('DishService Unit Test', () {
    
    group('convertIngredientToVietnamese', () {
      test('Nên chuyển đổi đúng từ tiếng Anh sang tiếng Việt (viết thường)', () {
        expect(DishService.convertIngredientToVietnamese('beef'), 'thịt bò');
        expect(DishService.convertIngredientToVietnamese('tomato'), 'cà chua');
      });

      test('Nên xử lý được chuỗi có khoảng trắng hoặc viết hoa', () {
        expect(DishService.convertIngredientToVietnamese('  PORK  '), 'thịt heo');
        expect(DishService.convertIngredientToVietnamese('Chicken'), 'thịt gà');
      });

      test('Nên trả về chính chuỗi đó nếu không tìm thấy trong map', () {
        expect(DishService.convertIngredientToVietnamese('salt'), 'salt');
      });
    });

    group('convertIngredientsToVietnamese (List)', () {
      test('Nên chuyển đổi danh sách nhiều nguyên liệu chính xác', () {
        final englishList = ['beef', 'tomato', 'onion'];
        final expectedList = ['thịt bò', 'cà chua', 'hành tây'];
        
        expect(DishService.convertIngredientsToVietnamese(englishList), expectedList);
      });

      test('Nên trả về list trống nếu đầu vào là list trống', () {
        expect(DishService.convertIngredientsToVietnamese([]), isEmpty);
      });
    });

    group('normalizeIngredientName', () {
      test('Nên ưu tiên map sang tiếng Việt nếu có trong _ingredientMap', () {
        expect(DishService.normalizeIngredientName('garlic'), 'tỏi');
      });

      test('Nên map từ đối tượng YOLO sang tên nguyên liệu chuẩn (English mapping)', () {
        expect(DishService.normalizeIngredientName('cow'), 'beef');
        expect(DishService.normalizeIngredientName('bird'), 'chicken');
      });

      test('Nên trả về chuỗi rỗng cho các đối tượng không phải thực phẩm', () {
        expect(DishService.normalizeIngredientName('car'), '');
        expect(DishService.normalizeIngredientName('bicycle'), '');
      });

      test('Nên giữ nguyên giá trị nếu không khớp với bất kỳ map nào', () {
        expect(DishService.normalizeIngredientName('unknown_item'), 'unknown_item');
      });

      test('Nên xử lý chuẩn hóa viết hoa và khoảng trắng trước khi mapping', () {
        expect(DishService.normalizeIngredientName('  APPLE  '), 'apple');
      });
    });
  });
}