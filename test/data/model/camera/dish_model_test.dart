import 'package:flutter_test/flutter_test.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/camera/dish_model.dart';

void main() {
  group('DishModel Unit Test', () {
    
    group('fromJson', () {
      test('Nên parse đúng từ JSON đầy đủ các trường hợp kiểu dữ liệu khó', () {
        final json = {
          'id': 101, 
          'dish_name': 'Bún Chả',
          'ingredients': 'Thịt lợn, Bún, Nước mắm',
          'cooking_time': '45',
          'score': 4.5,
          'calories': 500,
        };

        final dish = DishModel.fromJson(json);

        expect(dish.id, '101');
        expect(dish.name, 'Bún Chả');
        expect(dish.cookingTime, 45);
        expect(dish.score, 4.5);
      });

      test('Nên xử lý an toàn khi các trường optional bị null', () {
        final json = {
          'id': '1',
          'name': 'Món ăn test',
          'ingredients': '',
        };

        final dish = DishModel.fromJson(json);

        expect(dish.cookingTime, isNull);
        expect(dish.score, isNull);
        expect(dish.imageUrl, isNull);
      });
    });

    group('ingredientsList', () {
      test('Nên tách chuỗi string thành list và xóa khoảng trắng thừa', () {
        const dish = DishModel(
          id: '1',
          name: 'Test',
          ingredients: ' Hành , Tỏi, Ớt ',
        );

        expect(dish.ingredientsList, ['Hành', 'Tỏi', 'Ớt']);
      });

      test('Nên trả về list trống nếu chuỗi ingredients trống', () {
        const dish = DishModel(id: '1', name: 'Test', ingredients: '');
        expect(dish.ingredientsList, isEmpty);
      });
    });

    group('canBeMadeWith', () {
      test('Nên trả về true nếu đầy đủ nguyên liệu (không phân biệt hoa thường)', () {
        const dish = DishModel(
          id: '1',
          name: 'Trứng chiên',
          ingredients: 'Trứng, Hành',
        );
        
        final available = ['trứng', 'HÀNH', 'Dầu ăn'];
        
        expect(dish.canBeMadeWith(available), isTrue);
      });

      test('Nên trả về false nếu thiếu một nguyên liệu bất kỳ', () {
        const dish = DishModel(
          id: '1',
          name: 'Trứng chiên',
          ingredients: 'Trứng, Hành',
        );
        
        final available = ['trứng', 'Muối'];
        
        expect(dish.canBeMadeWith(available), isFalse);
      });
    });

    group('getMatchPercentage', () {
      test('Nên tính đúng phần trăm nguyên liệu có sẵn', () {
        const dish = DishModel(
          id: '1',
          name: 'Canh',
          ingredients: 'Thịt, Rau, Muối, Tiêu', 
        );
        
        final available = ['Thịt', 'Rau']; 
        
        expect(dish.getMatchPercentage(available), 50.0);
      });

      test('Nên trả về 0.0 nếu không có nguyên liệu nào khớp', () {
        const dish = DishModel(id: '1', name: 'Test', ingredients: 'A, B');
        expect(dish.getMatchPercentage(['C', 'D']), 0.0);
      });
    });

    test('Hai đối tượng DishModel cùng ID và Name nên được coi là bằng nhau', () {
      final dish1 = DishModel(id: '1', name: 'Phở', ingredients: 'Bò');
      final dish2 = DishModel(id: '1', name: 'Phở', ingredients: 'Gà');

      expect(dish1 == dish2, isTrue);
      expect(dish1.hashCode == dish2.hashCode, isTrue);
    });
  });
}