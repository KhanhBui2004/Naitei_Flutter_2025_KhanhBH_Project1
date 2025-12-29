import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/auth/register/register_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/auth/register/register_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/auth/register/register_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/authentication/register_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/textInput.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/routes/app_routes.dart';

class MockRegisterBloc extends MockBloc<RegisterEvent, RegisterState>
    implements RegisterBloc {}

class RegisterEventFake extends Fake implements RegisterEvent {}

void main() {
  late MockRegisterBloc mockRegisterBloc;

  setUpAll(() {
    registerFallbackValue(RegisterEventFake());
  });

  setUp(() {
    mockRegisterBloc = MockRegisterBloc();
    when(() => mockRegisterBloc.state).thenReturn(RegisterInitial());
  });

  Widget makeTestableWidget() {
    return MaterialApp(
      onGenerateRoute: (settings) {
        if (settings.name == AppRoutes.login) {
          return MaterialPageRoute(
            builder: (_) => const Scaffold(body: Text('Login Page')),
          );
        }
        return MaterialPageRoute(
          builder: (_) => BlocProvider<RegisterBloc>.value(
            value: mockRegisterBloc,
            child: const RegisterPage(),
          ),
        );
      },
    );
  }

  group('RegisterPage Widget Test', () {
    testWidgets('Hiển thị tiêu đề và đầy đủ 6 trường nhập liệu', (
      tester,
    ) async {
      await tester.pumpWidget(makeTestableWidget());

      expect(find.text('Sign Up'), findsOneWidget);
      expect(find.widgetWithText(TextInput, 'First Name'), findsOneWidget);
      expect(find.widgetWithText(TextInput, 'Last Name'), findsOneWidget);
      expect(find.widgetWithText(TextInput, 'Username'), findsOneWidget);
      expect(find.widgetWithText(TextInput, 'Password'), findsOneWidget);
      expect(
        find.widgetWithText(TextInput, 'Confirm Password'),
        findsOneWidget,
      );
      expect(find.widgetWithText(TextInput, 'Email'), findsOneWidget);
      expect(find.text('Sign up'), findsOneWidget);
    });

    testWidgets('Gọi RegisterStarted khi điền thông tin và nhấn nút Sign up', (
      tester,
    ) async {
      await tester.pumpWidget(makeTestableWidget());

      await tester.enterText(
        find.widgetWithText(TextInput, 'First Name'),
        'John',
      );
      await tester.enterText(
        find.widgetWithText(TextInput, 'Last Name'),
        'Doe',
      );
      await tester.enterText(
        find.widgetWithText(TextInput, 'Username'),
        'johndoe',
      );
      await tester.enterText(
        find.widgetWithText(TextInput, 'Password'),
        '123456',
      );
      await tester.enterText(
        find.widgetWithText(TextInput, 'Confirm Password'),
        '123456',
      );
      await tester.enterText(
        find.widgetWithText(TextInput, 'Email'),
        'john@example.com',
      );

      await tester.tap(find.text('Sign up'));
      await tester.pump();

      verify(
        () => mockRegisterBloc.add(any(that: isA<RegisterStarted>())),
      ).called(1);
    });

    testWidgets(
      'Hiển thị Loading (CircularProgressIndicator) khi state là RegisterInProgress',
      (tester) async {
        whenListen(
          mockRegisterBloc,
          Stream.fromIterable([RegisterInProgress()]),
          initialState: RegisterInitial(),
        );

        await tester.pumpWidget(makeTestableWidget());

        await tester.pump();
        await tester.pump();

        expect(find.byType(CircularProgressIndicator), findsOneWidget);
      },
    );

    testWidgets('Hiển thị SnackBar lỗi khi state là RegisterFailure', (
      tester,
    ) async {
      whenListen(
        mockRegisterBloc,
        Stream.fromIterable([RegisterFailure('Registration Failed')]),
        initialState: RegisterInitial(),
      );

      await tester.pumpWidget(makeTestableWidget());
      await tester.pump();

      expect(find.byType(SnackBar), findsOneWidget);
      expect(find.text('Registration Failed'), findsOneWidget);
    });

    testWidgets('Chuyển hướng sang trang Login khi đăng ký thành công', (
      tester,
    ) async {
      whenListen(
        mockRegisterBloc,
        Stream.fromIterable([RegisterInProgress(), RegisterSuccess('Success')]),
        initialState: RegisterInitial(),
      );

      await tester.pumpWidget(makeTestableWidget());
      await tester.pump();
      await tester.pumpAndSettle();

      expect(find.text('Login Page'), findsOneWidget);
    });
  });
}
