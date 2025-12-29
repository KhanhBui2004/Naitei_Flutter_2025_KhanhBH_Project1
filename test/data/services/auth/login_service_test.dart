import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/user_model.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/auth/login_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/constant.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late LoginService loginService;
  late MockDio mockDio;

  setUp(() {
    mockDio = MockDio();
    loginService = LoginService(dio: mockDio);
  });

  group('LoginService Unit Test', () {
    const String tUsername = 'testuser';
    const String tPassword = 'password123';

    final tSuccessResponse = {
      'code': 200,
      'message': 'Login Success',
      'data': {
        'token': 'access_token_abc',
        'refreshToken': 'refresh_token_xyz',
        'id': 1,
        'username': 'testuser',
        'email': 'test@gmail.com',
        'first_name': 'Khanh',
        'last_name': 'Bui',
        'avatar_url': 'https://image.com/avatar.png',
        'role': 'user',
      },
    };

    test(
      'Nên trả về User model và lưu vào SharedPreferences khi đăng nhập thành công',
      () async {
        SharedPreferences.setMockInitialValues({});
        final prefs = await SharedPreferences.getInstance();

        when(() => mockDio.post(any(), data: any(named: 'data'))).thenAnswer(
          (_) async => Response(
            data: tSuccessResponse,
            statusCode: 200,
            requestOptions: RequestOptions(path: ApiEndPoint.login),
          ),
        );

        final result = await loginService.login(tUsername, tPassword);

        expect(result['code'], 200);
        expect(result['data'], isA<User>());

        expect(prefs.getString('token'), 'access_token_abc');
        expect(prefs.getInt('userId'), 1);
        expect(prefs.getString('username'), 'testuser');
      },
    );

    test('Nên ném ra Exception khi Dio trả về lỗi (401, 500...)', () async {
      when(() => mockDio.post(any(), data: any(named: 'data'))).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: ApiEndPoint.login),
          response: Response(
            requestOptions: RequestOptions(path: ApiEndPoint.login),
            statusCode: 401,
          ),
          type: DioExceptionType.badResponse,
        ),
      );

      expect(
        () => loginService.login(tUsername, tPassword),
        throwsA(isA<Exception>()),
      );
    });
  });
}
