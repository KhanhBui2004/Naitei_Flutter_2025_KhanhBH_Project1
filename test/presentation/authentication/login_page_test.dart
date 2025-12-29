import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/auth/login/login_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/auth/login/login_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/auth/login/login_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/authentication/login_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/routes/app_routes.dart';

class AuthEventFake extends Fake implements AuthEvent {}

class MockAuthBloc extends MockBloc<AuthEvent, AuthState> implements AuthBloc {}

void main() {
  late MockAuthBloc mockAuthBloc;

  setUpAll(() {
    registerFallbackValue(AuthEventFake());
  });

  setUp(() {
    mockAuthBloc = MockAuthBloc();
    when(() => mockAuthBloc.state).thenReturn(AuthInitial());
  });

  Widget makeTestableWidget() {
    return MaterialApp(
      routes: {
        AppRoutes.home: (context) => const Scaffold(body: Text('Home Page')),
        AppRoutes.login: (context) => const LoginPage(),
      },
      home: BlocProvider<AuthBloc>.value(
        value: mockAuthBloc,
        child: const LoginPage(),
      ),
    );
  }

  group('LoginPage Widget Test', () {
    testWidgets('Hiển thị đầy đủ các thành phần UI cơ bản', (tester) async {
      await tester.pumpWidget(makeTestableWidget());

      expect(find.text('Login'), findsNWidgets(2));
      expect(find.byType(TextField), findsNWidgets(2));
      expect(find.byType(ElevatedButton), findsOneWidget);
    });

    testWidgets(
      'Hiển thị Loading Indicator khi trạng thái là AuthLoginInProgress',
      (tester) async {
        when(() => mockAuthBloc.state).thenReturn(AuthLoginInProgress());

        await tester.pumpWidget(makeTestableWidget());

        expect(find.byType(CircularProgressIndicator), findsOneWidget);
      },
    );

    testWidgets('Gọi sự kiện AuthLoginStarted khi nhấn nút Login', (
      tester,
    ) async {
      await tester.pumpWidget(makeTestableWidget());

      await tester.enterText(find.byType(TextField).first, 'testuser');
      await tester.enterText(find.byType(TextField).last, 'password123');

      await tester.tap(find.byType(ElevatedButton));
      await tester.pump();
      verify(
        () => mockAuthBloc.add(any(that: isA<AuthLoginStarted>())),
      ).called(1);
    });

    testWidgets('Hiển thị SnackBar màu đỏ khi Login thất bại', (tester) async {
      whenListen(
        mockAuthBloc,
        Stream.fromIterable([AuthLoginFailure('Invalid credentials')]),
        initialState: AuthInitial(),
      );

      await tester.pumpWidget(makeTestableWidget());

      await tester.pumpAndSettle();

      expect(find.byType(SnackBar), findsOneWidget);
      expect(find.text('Invalid credentials'), findsOneWidget);

      final snackBar = tester.widget<SnackBar>(find.byType(SnackBar));
      expect(snackBar.backgroundColor, Colors.red);
    });
  });
}
