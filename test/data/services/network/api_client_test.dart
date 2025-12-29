import 'package:flutter_test/flutter_test.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/network/api_client.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/network/auth_interceptor.dart';

void main() {
  group('ApiClient Unit Test', () {
    test('Nên cấu hình BaseOptions chính xác', () {
      final dio = ApiClient.dio;

      expect(dio.options.baseUrl, 'https://pbl6-vietnomi-be.onrender.com');

      expect(dio.options.connectTimeout, const Duration(seconds: 15));
      expect(dio.options.receiveTimeout, const Duration(seconds: 15));
    });

    test('Nên bao gồm AuthInterceptor trong danh sách interceptors', () {
      final dio = ApiClient.dio;

      final hasAuthInterceptor = dio.interceptors.any(
        (interceptor) => interceptor is AuthInterceptor,
      );

      expect(hasAuthInterceptor, isTrue, reason: 'ApiClient phải có AuthInterceptor');
    });

    test('ApiClient.dio nên là một Singleton instance (nhất quán)', () {
      final dio1 = ApiClient.dio;
      final dio2 = ApiClient.dio;

      expect(identical(dio1, dio2), isTrue);
    });
  });
}