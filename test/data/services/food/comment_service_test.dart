import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/comment_model.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/food/comment_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/constant.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late CommentService commentService;
  late MockDio mockDio;

  setUp(() {
    mockDio = MockDio();
    commentService = CommentService(dio: mockDio);
    SharedPreferences.setMockInitialValues({'token': 'mock_token_123'});
  });

  group('CommentService - postComment', () {
    const tUserId = 1;
    const tFoodId = 101;
    const tContent = 'Món này tuyệt vời!';

    test('Nên trả về code 201 khi post comment thành công', () async {
      when(() => mockDio.post(any(), data: any(named: 'data'), options: any(named: 'options')))
          .thenAnswer((_) async => Response(
                data: {'code': 201, 'message': 'Comment thành công'},
                statusCode: 201,
                requestOptions: RequestOptions(path: ApiEndPoint.comment),
              ));

      final result = await commentService.postComment(tUserId, tFoodId, tContent);

      expect(result['code'], 201);
      expect(result['message'], 'Comment thành công');
      
      final capturedOptions = verify(() => mockDio.post(
        any(),
        data: any(named: 'data'),
        options: captureAny(named: 'options'),
      )).captured.last as Options;
      expect(capturedOptions.headers?['Authorization'], 'Bearer mock_token_123');
    });

    test('Nên ném Exception khi Dio bị lỗi', () async {
      when(() => mockDio.post(any(), data: any(named: 'data'), options: any(named: 'options')))
          .thenThrow(DioException(
        requestOptions: RequestOptions(path: ApiEndPoint.comment),
        message: 'Network error',
      ));

      expect(
        () => commentService.postComment(tUserId, tFoodId, tContent),
        throwsA(isA<Exception>().having((e) => e.toString(), 'message', contains('Lỗi comment'))),
      );
    });
  });

  group('CommentService - getFoodComment', () {
    const tFoodId = 101;

    final tMockCommentJson = {
      'id': 1,
      'content': 'Ngon quá',
      'user': {'id': 1, 'username': 'testuser'}
    };

    test('Nên trả về List<Comment> và totalPages khi API trả về 200', () async {
      when(() => mockDio.get(any(), queryParameters: any(named: 'queryParameters'), options: any(named: 'options')))
          .thenAnswer((_) async => Response(
                data: {
                  'code': 200,
                  'data': [tMockCommentJson],
                  'pagination': {'totalPages': 5}
                },
                statusCode: 200,
                requestOptions: RequestOptions(path: '${ApiEndPoint.comment}/food'),
              ));

      final result = await commentService.getFoodComment(foodId: tFoodId);

      expect(result['comments'], isA<List<Comment>>());
      expect(result['comments'].length, 1);
      expect(result['comments'][0].content, 'Ngon quá');
      expect(result['totalPages'], 5);
    });

    test('Nên trả về list trống nếu code không phải 200 hoặc data null', () async {
      when(() => mockDio.get(any(), queryParameters: any(named: 'queryParameters'), options: any(named: 'options')))
          .thenAnswer((_) async => Response(
                data: {'code': 404, 'data': null},
                statusCode: 404,
                requestOptions: RequestOptions(path: '${ApiEndPoint.comment}/food'),
              ));

      final result = await commentService.getFoodComment(foodId: tFoodId);

      expect(result['comments'], isEmpty);
      expect(result['totalPages'], 1);
    });

    test('Nên ném Exception khi gặp lỗi không xác định (crash logic)', () async {
      when(() => mockDio.get(any(), queryParameters: any(named: 'queryParameters'), options: any(named: 'options')))
          .thenAnswer((_) async => Response(
                data: {'code': 200, 'data': 'not a list'},
                statusCode: 200,
                requestOptions: RequestOptions(path: ''),
              ));

      expect(
        () => commentService.getFoodComment(foodId: tFoodId),
        throwsA(isA<Exception>().having((e) => e.toString(), 'message', contains('Lỗi không xác định'))),
      );
    });
  });
}