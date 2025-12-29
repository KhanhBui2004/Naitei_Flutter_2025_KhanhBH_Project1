import 'package:flutter_test/flutter_test.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/food_model.dart'; 

void main() {
  group('Food Model Unit Test', () {
    final Map<String, dynamic> mockFoodJson = {
      "id": 1,
      "dish_name": "Phở Bò",
      "description": "Món ăn truyền thống Việt Nam",
      "dish_type": "Món chính",
      "serving_size": "1 bát",
      "cooking_time": 30, 
      "ingredients": "Bánh phở, thịt bò, nước dùng",
      "cooking_method": "Nấu nước dùng",
      "calories": 450,
      "fat": 15,
      "fiber": 2,
      "sugar": 5,
      "protein": 25,
      "image_link": "https://example.com/pho.jpg",
      "createdAt": "2023-10-27T10:00:00Z",
      "updatedAt": "2023-10-27T12:00:00Z",
      "deletedAt": null
    };

    // 1. Kiểm tra Factory fromJson
    test('Nên tạo đối tượng Food chính xác từ JSON', () {
      final food = Food.fromJson(mockFoodJson);

      expect(food.id, 1);
      expect(food.dishName, "Phở Bò");
      expect(food.cookingTime, "30"); 
      expect(food.createdAt, isA<DateTime>());
      expect(food.createdAt.year, 2023);
      expect(food.deletedAt, isNull);
    });

    test('Nên parse đúng trường deletedAt khi có giá trị', () {
      final jsonWithDeleted = Map<String, dynamic>.from(mockFoodJson);
      jsonWithDeleted['deletedAt'] = "2023-11-01T08:00:00Z";

      final food = Food.fromJson(jsonWithDeleted);

      expect(food.deletedAt, isNotNull);
      expect(food.deletedAt?.month, 11);
    });

    test('Nên chuyển đổi đối tượng Food sang Map JSON chính xác', () {
      final food = Food(
        id: 1,
        dishName: "Phở Bò",
        description: "Mô tả",
        dishType: "Món chính",
        servingSize: "1 bát",
        cookingTime: "30",
        ingredients: "Bánh phở",
        cookingMethod: "Luộc",
        calories: 450,
        fat: 15,
        fiber: 2,
        sugar: 5,
        protein: 25,
        imageLink: "https://link.jpg",
        createdAt: DateTime.parse("2023-10-27T10:00:00Z"),
        updatedAt: DateTime.parse("2023-10-27T12:00:00Z"),
      );

      final jsonResult = food.toJson();

      expect(jsonResult['id'], 1);
      expect(jsonResult['dish_name'], "Phở Bò");
      expect(jsonResult['createdAt'], "2023-10-27T10:00:00.000Z");
      expect(jsonResult['deletedAt'], isNull);
    });

    test('Dữ liệu sau khi fromJson và toJson phải đồng nhất', () {
      final foodInitial = Food.fromJson(mockFoodJson);
      final jsonAfter = foodInitial.toJson();
      
      expect(jsonAfter['id'], mockFoodJson['id']);
      expect(jsonAfter['dish_name'], mockFoodJson['dish_name']);
    });
  });
}