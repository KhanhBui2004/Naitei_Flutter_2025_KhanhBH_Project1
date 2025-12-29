import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/tag_model.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/food_model.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/food/tag_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/constant.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late TagService tagService;
  late MockDio mockDio;

  final mockTagJson = {'id': 1, 'name': 'Món Cay', 'image_url': 'url'};
  final mockFoodJson = {
    "id": 10,
    "dish_name": "Mì Cay",
    "description": "Cay xè",
    "dish_type": "Main",
    "serving_size": "1",
    "cooking_time": "15",
    "ingredients": "Mì, Ớt",
    "cooking_method": "Nấu",
    "calories": 300,
    "fat": 5,
    "fiber": 1,
    "sugar": 2,
    "protein": 10,
    "image_link": "url",
    "createdAt": "2023-10-27T10:00:00Z",
    "updatedAt": "2023-10-27T10:00:00Z"
  };

  setUp(() {
    mockDio = MockDio();
    tagService = TagService(dio: mockDio);
    SharedPreferences.setMockInitialValues({'token': 'valid_token'});
  });

  group('TagService - getAllTags', () {
    test('Nên trả về Map chứa danh sách Tag khi API thành công', () async {
      when(() => mockDio.get(any(), queryParameters: any(named: 'queryParameters'), options: any(named: 'options')))
          .thenAnswer((_) async => Response(
                data: {
                  'code': 200,
                  'message': 'Success',
                  'data': [mockTagJson],
                  'pagination': {'totalPages': 3}
                },
                statusCode: 200,
                requestOptions: RequestOptions(path: ApiEndPoint.tag),
              ));

      final result = await tagService.getAllTags();

      expect(result['tags'], isA<List<Tag>>());
      expect(result['tags'].length, 1);
      expect(result['totalPages'], 3);
      expect(result['tags'][0].name, 'Món Cay');
    });

    test('Nên ném Exception nếu parse dữ liệu thất bại (Dữ liệu không đúng định dạng)', () async {
      when(() => mockDio.get(any(), queryParameters: any(named: 'queryParameters'), options: any(named: 'options')))
          .thenAnswer((_) async => Response(
                data: {'data': 'không phải list'}, 
                statusCode: 200,
                requestOptions: RequestOptions(path: ''),
              ));

      expect(() => tagService.getAllTags(), throwsA(isA<Exception>()));
    });
  });

  group('TagService - getTagsByFoodId', () {
    test('Nên parse đúng cấu trúc tag lồng trong item["tag"]', () async {
      when(() => mockDio.get(any(), options: any(named: 'options')))
          .thenAnswer((_) async => Response(
                data: {
                  'code': 200,
                  'data': [
                    {'tag': mockTagJson} 
                  ]
                },
                statusCode: 200,
                requestOptions: RequestOptions(path: ''),
              ));

      final result = await tagService.getTagsByFoodId('10');

      expect(result, isA<List<Tag>>());
      expect(result[0].id, 1);
      expect(result[0].name, 'Món Cay');
    });
  });

  group('TagService - getFoodsByTagId', () {
    test('Nên trả về danh sách Food theo Tag ID', () async {
      when(() => mockDio.get(any(), queryParameters: any(named: 'queryParameters'), options: any(named: 'options')))
          .thenAnswer((_) async => Response(
                data: {
                  'code': 200,
                  'data': [mockFoodJson],
                  'pagination': {'totalPages': 1}
                },
                statusCode: 200,
                requestOptions: RequestOptions(path: ''),
              ));

      final result = await tagService.getFoodsByTagId(tagId: 1);

      expect(result['foods'], isA<List<Food>>());
      expect(result['foods'][0].dishName, 'Mì Cay');
    });

    test('Nên ném DioException khi lỗi network', () async {
      when(() => mockDio.get(any(), queryParameters: any(named: 'queryParameters'), options: any(named: 'options')))
          .thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
        message: 'No Internet',
      ));

      expect(() => tagService.getFoodsByTagId(tagId: 1), throwsA(isA<Exception>()));
    });
  });
}