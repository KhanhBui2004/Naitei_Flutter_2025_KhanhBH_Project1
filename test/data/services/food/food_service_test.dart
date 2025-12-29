import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/food_model.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/food/food_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/constant.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late FoodService foodService;
  late MockDio mockDio;

  final mockFoodJson = {
    "id": 1,
    "dish_name": "Phở Bò",
    "description": "Ngon",
    "dish_type": "Main",
    "serving_size": "1",
    "cooking_time": "30",
    "ingredients": "Bò, Bánh phở",
    "cooking_method": "Nấu",
    "calories": 400,
    "fat": 10,
    "fiber": 2,
    "sugar": 5,
    "protein": 20,
    "image_link": "url",
    "createdAt": "2023-10-27T10:00:00Z",
    "updatedAt": "2023-10-27T10:00:00Z"
  };

  setUp(() {
    mockDio = MockDio();
    foodService = FoodService(dio: mockDio);
    SharedPreferences.setMockInitialValues({
      "token": "mock_token",
      "userId": 123,
    });
  });

  group('FoodService - getFoods (Danh sách món ăn)', () {
    test('Nên trả về List<Food> khi API thành công (200)', () async {
      when(() => mockDio.get(any(), queryParameters: any(named: 'queryParameters'), options: any(named: 'options')))
          .thenAnswer((_) async => Response(
                data: {
                  'code': 200,
                  'message': 'Success',
                  'data': [mockFoodJson],
                  'pagination': {'totalPages': 2}
                },
                statusCode: 200,
                requestOptions: RequestOptions(path: ApiEndPoint.food),
              ));

      final result = await foodService.getFoods(page: 1, query: 'Phở');

      expect(result['foods'], isA<List<Food>>());
      expect(result['foods'].length, 1);
      expect(result['totalPages'], 2);
      expect(result['foods'][0].dishName, "Phở Bò");
    });
  });

  group('FoodService - getFoodDetail (Chi tiết món ăn)', () {
    test('Nên trả về đối tượng Food khi ID hợp lệ', () async {
      when(() => mockDio.get(any(), options: any(named: 'options')))
          .thenAnswer((_) async => Response(
                data: {'data': mockFoodJson},
                statusCode: 200,
                requestOptions: RequestOptions(path: '${ApiEndPoint.food}/1'),
              ));

      final result = await foodService.getFoodDetail('1');

      expect(result, isA<Food>());
      expect(result.id, 1);
    });

    test('Nên ném Exception khi ID không tồn tại (DioException)', () async {
      when(() => mockDio.get(any(), options: any(named: 'options')))
          .thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
        message: 'Not Found',
        response: Response(statusCode: 404, requestOptions: RequestOptions(path: '')),
      ));

      expect(() => foodService.getFoodDetail('999'), throwsA(isA<Exception>()));
    });
  });

  group('FoodService - postFood (Thêm món mới)', () {
    test('Nên trả về code 200 khi thêm món ăn thành công', () async {
      when(() => mockDio.post(any(), data: any(named: 'data'), options: any(named: 'options')))
          .thenAnswer((_) async => Response(
                data: {'code': 200, 'message': 'Thêm thành công'},
                statusCode: 200,
                requestOptions: RequestOptions(path: ApiEndPoint.food),
              ));

      final result = await foodService.postFood(
        id: 0,
        dishName: "Test",
        description: "Desc",
        dishType: "Type",
        servingSize: "1",
        cookingTime: "10",
        ingredients: "Ingre",
        cookingMethod: "Method",
        calories: 100,
        fat: 1,
        fiber: 1,
        sugar: 1,
        protein: 1,
        imageLink: "link",
      );

      expect(result['code'], 200);
      expect(result['message'], 'Thêm thành công');
    });
  });

  group('FoodService - getMyFood & Favorite', () {
    test('getMyFood nên map đúng dữ liệu của người dùng', () async {
      when(() => mockDio.get(any(), queryParameters: any(named: 'queryParameters'), options: any(named: 'options')))
          .thenAnswer((_) async => Response(
                data: {
                  'code': 200,
                  'data': [mockFoodJson],
                  'pagination': {'totalPages': 1}
                },
                statusCode: 200,
                requestOptions: RequestOptions(path: ApiEndPoint.myfood),
              ));

      final result = await foodService.getMyFood(userId: 123);

      expect(result['data'], isA<List<Food>>());
      expect(result['data'][0].id, 1);
    });
  });
}