import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/food/rating_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/constant.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late RatingService ratingService;
  late MockDio mockDio;

  setUp(() {
    mockDio = MockDio();
    ratingService = RatingService(dio: mockDio);
    SharedPreferences.setMockInitialValues({'token': 'test_token_123'});
  });

  group('RatingService - postRate & patchRate', () {
    const tUserId = 1;
    const tFoodId = 101;
    const tRate = 5;

    test('postRate nên trả về code 200 khi thành công', () async {
      when(() => mockDio.post(any(), data: any(named: 'data'), options: any(named: 'options')))
          .thenAnswer((_) async => Response(
                data: {'code': 200, 'message': 'Rating success'},
                statusCode: 200,
                requestOptions: RequestOptions(path: ApiEndPoint.rating),
              ));

      final result = await ratingService.postRate(tUserId, tFoodId, tRate);

      expect(result['code'], 200);
      expect(result['message'], 'Rating success');
    });

    test('patchRate nên gửi request đúng URL với rateId', () async {
      const tRateId = 55;
      when(() => mockDio.patch(any(), data: any(named: 'data'), options: any(named: 'options')))
          .thenAnswer((_) async => Response(
                data: {'code': 200, 'message': 'Updated'},
                statusCode: 200,
                requestOptions: RequestOptions(path: '${ApiEndPoint.rating}/$tRateId'),
              ));

      final result = await ratingService.patchRate(tUserId, tFoodId, tRate, tRateId);

      expect(result['code'], 200);
      verify(() => mockDio.patch(
            '${ApiEndPoint.rating}/$tRateId',
            data: any(named: 'data'),
            options: any(named: 'options'),
          )).called(1);
    });
  });

  group('RatingService - Lấy thông tin Rating', () {
    const tFoodId = 101;

    test('getAverRating nên parse đúng giá trị double từ server', () async {
      when(() => mockDio.get(any(), queryParameters: any(named: 'queryParameters'), options: any(named: 'options')))
          .thenAnswer((_) async => Response(
                data: {
                  'data': {'averageRating': "4.5"}
                },
                statusCode: 200,
                requestOptions: RequestOptions(path: ''),
              ));

      final result = await ratingService.getAverRating(tFoodId);

      expect(result, 4.5);
    });

    test('getRating nên trả về null nếu server trả về list rỗng', () async {
      when(() => mockDio.get(any(), queryParameters: any(named: 'queryParameters'), options: any(named: 'options')))
          .thenAnswer((_) async => Response(
                data: {'data': []},
                statusCode: 200,
                requestOptions: RequestOptions(path: ''),
              ));

      final result = await ratingService.getRating(1, tFoodId);

      expect(result['rating'], isNull);
      expect(result['rateId'], isNull);
    });

    test('getCountRating nên trả về giá trị int khi thành công', () async {
      when(() => mockDio.get(any(), queryParameters: any(named: 'queryParameters'), options: any(named: 'options')))
          .thenAnswer((_) async => Response(
                data: {'code': 200, 'data': 150},
                statusCode: 200,
                requestOptions: RequestOptions(path: ''),
              ));

      final result = await ratingService.getCountRating(tFoodId);

      expect(result, 150);
    });
  });

  group('RatingService - Exception handling', () {
    test('Nên ném Exception khi DioException xảy ra', () async {
      when(() => mockDio.get(any(), queryParameters: any(named: 'queryParameters'), options: any(named: 'options')))
          .thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
        message: 'No internet',
      ));

      expect(() => ratingService.getCountRating(1), throwsA(isA<Exception>()));
    });
  });
}