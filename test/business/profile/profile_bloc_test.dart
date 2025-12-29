import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

// Import các file từ dự án của bạn
import 'package:naitei_flutter_2025_khanhbh_project1/business/profile/profile_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/profile/profile_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/profile/profile_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/profile/profile_service.dart';

// Tạo Mock cho ProfileService
class MockProfileService extends Mock implements ProfileService {}

void main() {
  late ProfileBloc profileBloc;
  late MockProfileService mockProfileService;

  setUp(() {
    mockProfileService = MockProfileService();
    profileBloc = ProfileBloc(mockProfileService);
  });

  tearDown(() {
    profileBloc.close();
  });

  // Helper function để tạo event PatchProfile nhanh
  PatchProfile createEvent({
    String? password,
    String? cfpassword,
    String? email,
  }) {
    return PatchProfile(
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      password: password ?? 'password123',
      cfpassword: cfpassword ?? password ?? 'password123',
      email: email ?? 'test@gmail.com',
      avtUrl: 'https://link-to-avatar.png',
    );
  }

  group('ProfileBloc - PatchProfile Logic', () {
    blocTest<ProfileBloc, ProfileState>(
      'Nên emit [ProfileInProgress, PatchProfileFailure] khi mật khẩu xác nhận không khớp',
      build: () => profileBloc,
      act: (bloc) => bloc.add(createEvent(password: '123', cfpassword: '456')),
      expect: () => [
        isA<ProfileInProgress>(),
        isA<PatchProfileFailure>().having(
          (s) => s.message,
          'message',
          'Confirm password is invalid!',
        ),
      ],
    );

    blocTest<ProfileBloc, ProfileState>(
      'Nên emit [ProfileInProgress, PatchProfileFailure] khi email sai định dạng',
      build: () => profileBloc,
      act: (bloc) => bloc.add(createEvent(email: 'wrong-email')),
      expect: () => [
        isA<ProfileInProgress>(),
        isA<PatchProfileFailure>().having(
          (s) => s.message,
          'message',
          'Email is invalid!',
        ),
      ],
    );

    blocTest<ProfileBloc, ProfileState>(
      'Nên emit [ProfileInProgress, PatchProfileSuccess] khi API cập nhật thành công (code 200)',
      setUp: () {
        when(
          () => mockProfileService.patchProfile(
            any(),
            any(),
            any(),
            any(),
            any(),
            any(),
          ),
        ).thenAnswer(
          (_) async => {'code': 200, 'message': 'Update Successful'},
        );
      },
      build: () => profileBloc,
      act: (bloc) => bloc.add(createEvent()),
      expect: () => [
        isA<ProfileInProgress>(),
        isA<PatchProfileSuccess>().having(
          (s) => s.message,
          'message',
          'Update Successful',
        ),
      ],
    );

    blocTest<ProfileBloc, ProfileState>(
      'Nên emit [ProfileInProgress, PatchProfileFailure] khi API trả về lỗi từ server',
      setUp: () {
        when(
          () => mockProfileService.patchProfile(
            any(),
            any(),
            any(),
            any(),
            any(),
            any(),
          ),
        ).thenAnswer(
          (_) async => {'code': 400, 'message': 'Username already taken'},
        );
      },
      build: () => profileBloc,
      act: (bloc) => bloc.add(createEvent()),
      expect: () => [
        isA<ProfileInProgress>(),
        isA<PatchProfileFailure>().having(
          (s) => s.message,
          'message',
          'Username already taken',
        ),
      ],
    );

    blocTest<ProfileBloc, ProfileState>(
      'Nên emit [ProfileInProgress, PatchProfileFailure] khi có ngoại lệ (Exception)',
      setUp: () {
        when(
          () => mockProfileService.patchProfile(
            any(),
            any(),
            any(),
            any(),
            any(),
            any(),
          ),
        ).thenThrow(Exception('No Internet Connection'));
      },
      build: () => profileBloc,
      act: (bloc) => bloc.add(createEvent()),
      expect: () => [
        isA<ProfileInProgress>(),
        isA<PatchProfileFailure>().having(
          (s) => s.message,
          'message',
          'No Internet Connection',
        ),
      ],
    );
  });
}
