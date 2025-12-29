import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/profile/profile_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/constant.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Mock Dio
class MockDio extends Mock implements Dio {}

void main() {
  late ProfileService profileService;
  late MockDio mockDio;

  setUp(() {
    mockDio = MockDio();
    profileService = ProfileService(dio: mockDio);

    // Giả lập SharedPreferences với dữ liệu cũ
    SharedPreferences.setMockInitialValues({
      'token': 'old_token_123',
      'userId': 99,
      'firstname': 'OldName',
    });
  });

  group('ProfileService - patchProfile Unit Test', () {
    const tFirstName = 'Khanh';
    const tLastName = 'Bui';
    const tUsername = 'khanhbh';
    const tEmail = 'khanh@gmail.com';
    const tAvtUrl = 'https://link.com/new_avt.png';

    test(
      'Nên gửi request PATCH đúng URL và cập nhật SharedPreferences khi thành công (200)',
      () async {
        when(
          () => mockDio.patch(
            any(),
            data: any(named: 'data'),
            options: any(named: 'options'),
          ),
        ).thenAnswer(
          (_) async => Response(
            data: {'code': 200, 'message': 'Update profile success'},
            statusCode: 200,
            requestOptions: RequestOptions(path: ''),
          ),
        );

        final result = await profileService.patchProfile(
          tFirstName,
          tLastName,
          tUsername,
          '',
          tEmail,
          tAvtUrl,
        );

        expect(result['code'], 200);

        final prefs = await SharedPreferences.getInstance();
        expect(prefs.getString('firstname'), tFirstName);
        expect(prefs.getString('avt'), tAvtUrl);
        verify(
          () => mockDio.patch(
            any(),
            data: any(named: 'data'),
            options: any(named: 'options'),
          ),
        ).called(1);
      },
    );

    test('Nên bao gồm password trong body nếu password không rỗng', () async {
      when(
        () => mockDio.patch(
          any(),
          data: any(named: 'data'),
          options: any(named: 'options'),
        ),
      ).thenAnswer(
        (_) async => Response(
          data: {'code': 200, 'message': 'Success'},
          statusCode: 200,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      await profileService.patchProfile(
        tFirstName,
        tLastName,
        tUsername,
        'new_password_123',
        tEmail,
        tAvtUrl,
      );
      final capturedRequest =
          verify(
                () => mockDio.patch(
                  any(),
                  data: captureAny(named: 'data'),
                  options: any(named: 'options'),
                ),
              ).captured.last
              as Map<String, dynamic>;

      expect(capturedRequest.containsKey('password'), isTrue);
      expect(capturedRequest['password'], 'new_password_123');
    });

    test('Nên ném Exception khi Dio bị lỗi network', () async {
      when(
        () => mockDio.patch(
          any(),
          data: any(named: 'data'),
          options: any(named: 'options'),
        ),
      ).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: ''),
          message: 'No Internet Connection',
        ),
      );

      expect(
        () => profileService.patchProfile(
          tFirstName,
          tLastName,
          tUsername,
          '',
          tEmail,
          tAvtUrl,
        ),
        throwsA(
          isA<Exception>().having(
            (e) => e.toString(),
            'message',
            contains('Patch profile Error'),
          ),
        ),
      );
    });
  });
}
