import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/auth/register/register_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/auth/register/register_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/auth/register/register_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/auth/register_service.dart';

class MockRegisterService extends Mock implements RegisterService {}

void main() {
  late RegisterBloc registerBloc;
  late MockRegisterService mockRegisterService;

  setUp(() {
    mockRegisterService = MockRegisterService();
    registerBloc = RegisterBloc(mockRegisterService);
  });

  tearDown(() {
    registerBloc.close();
  });

  RegisterStarted createEvent({
    String? firstName,
    String? lastName,
    String? username,
    String? password,
    String? cfpassword,
    String? email,
  }) {
    return RegisterStarted(
      firstName: firstName ?? 'John',
      lastName: lastName ?? 'Doe',
      username: username ?? 'johndoe123',
      password: password ?? 'password123',
      cfpassword: cfpassword ?? 'password123',
      email: email ?? 'john@example.com',
    );
  }

  group('RegisterBloc - Validation Tests', () {
    blocTest<RegisterBloc, RegisterState>(
      'Nên emit [RegisterFailure] khi có bất kỳ thông tin nào bị bỏ trống',
      build: () => registerBloc,
      act: (bloc) => bloc.add(createEvent(firstName: '')),
      expect: () => [
        isA<RegisterInProgress>(),
        isA<RegisterFailure>().having((s) => s.message, 'message', 'Please write all information!'),
      ],
    );

    blocTest<RegisterBloc, RegisterState>(
      'Nên emit [RegisterFailure] khi username không bắt đầu bằng chữ cái',
      build: () => registerBloc,
      act: (bloc) => bloc.add(createEvent(username: '123user')), 
      expect: () => [
        isA<RegisterInProgress>(),
        isA<RegisterFailure>().having((s) => s.message, 'message', 'Username is invalid!'),
      ],
    );

    blocTest<RegisterBloc, RegisterState>(
      'Nên emit [RegisterFailure] khi mật khẩu xác nhận không khớp',
      build: () => registerBloc,
      act: (bloc) => bloc.add(createEvent(password: '123', cfpassword: '456')),
      expect: () => [
        isA<RegisterInProgress>(),
        isA<RegisterFailure>().having((s) => s.message, 'message', 'Confirm password is invalid!'),
      ],
    );

    blocTest<RegisterBloc, RegisterState>(
      'Nên emit [RegisterFailure] khi định dạng email sai',
      build: () => registerBloc,
      act: (bloc) => bloc.add(createEvent(email: 'not-an-email')),
      expect: () => [
        isA<RegisterInProgress>(),
        isA<RegisterFailure>().having((s) => s.message, 'message', 'Email is invalid'),
      ],
    );
  });

  group('RegisterBloc - API Interaction', () {
    blocTest<RegisterBloc, RegisterState>(
      'Nên emit [RegisterSuccess] khi dịch vụ trả về code 201',
      setUp: () {
        when(() => mockRegisterService.register(any(), any(), any(), any(), any()))
            .thenAnswer((_) async => {'code': 201, 'message': 'Account created'});
      },
      build: () => registerBloc,
      act: (bloc) => bloc.add(createEvent()),
      expect: () => [
        isA<RegisterInProgress>(),
        isA<RegisterSuccess>().having((s) => s.message, 'message', 'Account created'),
      ],
    );

    blocTest<RegisterBloc, RegisterState>(
      'Nên emit [RegisterFailure] khi dịch vụ trả về lỗi từ server',
      setUp: () {
        when(() => mockRegisterService.register(any(), any(), any(), any(), any()))
            .thenAnswer((_) async => {'code': 400, 'message': 'Username already exists'});
      },
      build: () => registerBloc,
      act: (bloc) => bloc.add(createEvent()),
      expect: () => [
        isA<RegisterInProgress>(),
        isA<RegisterFailure>().having((s) => s.message, 'message', 'Username already exists'),
      ],
    );

    blocTest<RegisterBloc, RegisterState>(
      'Nên emit [RegisterFailure] khi có Exception xảy ra',
      setUp: () {
        when(() => mockRegisterService.register(any(), any(), any(), any(), any()))
            .thenThrow(Exception('Connection Timeout'));
      },
      build: () => registerBloc,
      act: (bloc) => bloc.add(createEvent()),
      expect: () => [
        isA<RegisterInProgress>(),
        isA<RegisterFailure>().having((s) => s.message, 'message', 'Connection Timeout'),
      ],
    );
  });
}