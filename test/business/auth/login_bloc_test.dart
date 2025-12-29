import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/auth/login/login_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/auth/login/login_state.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:naitei_flutter_2025_khanhbh_project1/business/auth/login/login_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/auth/login_service.dart';

class MockLoginService extends Mock implements LoginService {}

void main() {
  late AuthBloc authBloc;
  late MockLoginService mockLoginService;

  setUp(() {
    mockLoginService = MockLoginService();
    authBloc = AuthBloc(mockLoginService);
    
    SharedPreferences.setMockInitialValues({}); 
  });

  tearDown(() {
    authBloc.close();
  });

  group('AuthBloc - Login Event', () {
    
    blocTest<AuthBloc, AuthState>(
      'Nên emit [AuthLoginFailure] khi username trống',
      build: () => authBloc,
      act: (bloc) => bloc.add(AuthLoginStarted(username: '', password: '123')),
      expect: () => [
        isA<AuthLoginInProgress>(),
        isA<AuthLoginFailure>().having((s) => s.message, 'message', 'Please Enter username'),
      ],
    );

    blocTest<AuthBloc, AuthState>(
      'Nên emit [AuthLoginSuccess, AuthenticateSuccess] khi đăng nhập thành công',
      setUp: () {
        when(() => mockLoginService.login(any(), any()))
            .thenAnswer((_) async => {'code': 200, 'message': 'Success'});
        SharedPreferences.setMockInitialValues({'token': 'fake_token'});
      },
      build: () => authBloc,
      act: (bloc) => bloc.add(AuthLoginStarted(username: 'admin', password: '123')),
      expect: () => [
        isA<AuthLoginInProgress>(),
        isA<AuthLoginSuccess>(),
        isA<AuthenticateSuccess>().having((s) => s.token, 'token', 'fake_token'),
      ],
    );

    blocTest<AuthBloc, AuthState>(
      'Nên emit [AuthLoginFailure] khi API trả về lỗi (code != 200)',
      setUp: () {
        when(() => mockLoginService.login(any(), any()))
            .thenAnswer((_) async => {'code': 401, 'message': 'Invalid credentials'});
      },
      build: () => authBloc,
      act: (bloc) => bloc.add(AuthLoginStarted(username: 'admin', password: 'wrong')),
      expect: () => [
        isA<AuthLoginInProgress>(),
        isA<AuthLoginFailure>().having((s) => s.message, 'message', 'Invalid credentials'),
      ],
    );
  });

  group('AuthBloc - Check Login (AuthenticateStarted)', () {
    
    blocTest<AuthBloc, AuthState>(
      'Nên emit [AuthenticateSuccess] nếu tìm thấy token trong SharedPreferences',
      setUp: () {
        SharedPreferences.setMockInitialValues({'token': 'stored_token'});
      },
      build: () => authBloc,
      act: (bloc) => bloc.add(AuthenticateStarted()),
      expect: () => [
        isA<AuthenticateSuccess>().having((s) => s.token, 'token', 'stored_token'),
      ],
    );

    blocTest<AuthBloc, AuthState>(
      'Nên emit [AuthenticateFailure] nếu không tìm thấy token',
      setUp: () {
        SharedPreferences.setMockInitialValues({}); // Trống
      },
      build: () => authBloc,
      act: (bloc) => bloc.add(AuthenticateStarted()),
      expect: () => [
        isA<AuthenticateFailure>().having((s) => s.message, 'message', 'Token not found'),
      ],
    );
  });
}