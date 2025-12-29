import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/auth/register_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/constant.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late RegisterService registerService;
  late MockDio mockDio;

  setUp(() {
    mockDio = MockDio();
    registerService = RegisterService(dio: mockDio);
  });

  group('RegisterService Unit Test', () {
    const tFirstName = 'Khanh';
    const tLastName = 'Bui';
    const tUsername = 'khanhbh';
    const tPassword = 'password123';
    const tEmail = 'test@gmail.com';

    test(
      'Nên trả về code và message khi đăng ký thành công (201 Created)',
      () async {
        final mockResponse = {
          'code': 201,
          'message': 'Đăng ký tài khoản thành công',
        };

        when(() => mockDio.post(any(), data: any(named: 'data'))).thenAnswer(
          (_) async => Response(
            data: mockResponse,
            statusCode: 201,
            requestOptions: RequestOptions(path: ApiEndPoint.register),
          ),
        );

        final result = await registerService.register(
          tFirstName,
          tLastName,
          tUsername,
          tPassword,
          tEmail,
        );
        expect(result['code'], 201);
        expect(result['message'], 'Đăng ký tài khoản thành công');

        verify(
          () => mockDio.post(ApiEndPoint.register, data: any(named: 'data')),
        ).called(1);
      },
    );

    test(
      'Nên trả về lỗi từ Server khi dữ liệu không hợp lệ (ví dụ trùng Username)',
      () async {
        final mockErrorResponse = {
          'code': 400,
          'message': 'Username đã tồn tại',
        };

        when(() => mockDio.post(any(), data: any(named: 'data'))).thenAnswer(
          (_) async => Response(
            data: mockErrorResponse,
            statusCode: 400,
            requestOptions: RequestOptions(path: ApiEndPoint.register),
          ),
        );

        final result = await registerService.register(
          tFirstName,
          tLastName,
          tUsername,
          tPassword,
          tEmail,
        );

        expect(result['code'], 400);
        expect(result['message'], 'Username đã tồn tại');
      },
    );

    test('Nên ném ra Exception khi gặp lỗi kết nối (DioException)', () async {
      when(() => mockDio.post(any(), data: any(named: 'data'))).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: ApiEndPoint.register),
          message: 'No Internet Connection',
          type: DioExceptionType.connectionError,
        ),
      );

      expect(
        () => registerService.register(
          tFirstName,
          tLastName,
          tUsername,
          tPassword,
          tEmail,
        ),
        throwsA(
          isA<Exception>().having(
            (e) => e.toString(),
            'message',
            contains('Lỗi đăng ký tài khoản: No Internet Connection'),
          ),
        ),
      );
    });
  });
}
