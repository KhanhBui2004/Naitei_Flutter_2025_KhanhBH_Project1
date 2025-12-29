import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/network/auth_interceptor.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MockDio extends Mock implements Dio {}
class MockHandler extends Mock implements ErrorInterceptorHandler {}

void main() {
  late AuthInterceptor authInterceptor;
  late MockHandler mockHandler;

  setUp(() {
    authInterceptor = AuthInterceptor();
    mockHandler = MockHandler();
  });

  group('AuthInterceptor Unit Test', () {
    test('Nếu lỗi không phải 401, nên gọi handler.next(err)', () async {
      final err = DioException(
        requestOptions: RequestOptions(path: '/any'),
        response: Response(
          statusCode: 500,
          requestOptions: RequestOptions(path: '/any'),
        ),
      );

      await authInterceptor.onError(err, mockHandler);

      verify(() => mockHandler.next(err)).called(1);
    });

    test('Nếu lỗi 401 nhưng không có refreshToken, nên gọi handler.next(err)', () async {
      SharedPreferences.setMockInitialValues({}); 
      
      final err = DioException(
        requestOptions: RequestOptions(path: '/any'),
        response: Response(
          statusCode: 401,
          requestOptions: RequestOptions(path: '/any'),
        ),
      );

      await authInterceptor.onError(err, mockHandler);

      verify(() => mockHandler.next(err)).called(1);
    });
  });
}