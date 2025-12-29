import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/profile/profile_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/profile/profile_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/profile/profile_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/profile/profile_page.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MockProfileBloc extends MockBloc<ProfileEvent, ProfileState>
    implements ProfileBloc {}

class ProfileEventFake extends Fake implements ProfileEvent {}

void main() {
  late MockProfileBloc mockProfileBloc;

  setUpAll(() {
    registerFallbackValue(ProfileEventFake());
  });

  setUp(() async {
    mockProfileBloc = MockProfileBloc();
    SharedPreferences.setMockInitialValues({
      'firstname': 'Khanh',
      'lastname': 'Bui',
      'username': 'khanhbh',
      'email': 'khanh@gmail.com',
      'avt': '',
      'token': 'mock_token',
    });
    when(() => mockProfileBloc.state).thenReturn(ProfileInitial());
  });

  Widget makeTestableWidget() {
    return MaterialApp(
      routes: {'/login': (context) => const Scaffold(body: Text('Login Page'))},
      home: BlocProvider<ProfileBloc>.value(
        value: mockProfileBloc,
        child: const ProfilePage(),
      ),
    );
  }

  group('ProfilePage Widget Test', () {
    testWidgets('Hiển thị Loading khi đang load user từ SharedPreferences', (
      tester,
    ) async {
      await tester.pumpWidget(makeTestableWidget());
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('Hiển thị đúng thông tin user sau khi load xong', (
      tester,
    ) async {
      await tester.pumpWidget(makeTestableWidget());
      await tester.pumpAndSettle();

      expect(find.text('Xin chào Khanh!'), findsOneWidget);
      expect(
        find.widgetWithText(CustomFormImput, 'First Name'),
        findsOneWidget,
      );

      final firstNameField = tester.widget<TextFormField>(
        find.descendant(
          of: find.widgetWithText(CustomFormImput, 'First Name'),
          matching: find.byType(TextFormField),
        ),
      );
      expect(firstNameField.controller?.text, 'Khanh');
    });

    testWidgets('Gọi PatchProfile event khi nhấn nút Save', (tester) async {
      tester.view.physicalSize = const Size(1080, 1920);
      tester.view.devicePixelRatio = 1.0;

      await tester.pumpWidget(makeTestableWidget());
      await tester.pumpAndSettle();

      await tester.drag(
        find.byType(SingleChildScrollView),
        const Offset(0, -500),
      );
      await tester.pump();

      await tester.enterText(
        find.widgetWithText(CustomFormImput, 'Password'),
        '123456',
      );
      await tester.enterText(
        find.widgetWithText(CustomFormImput, 'Confirm password'),
        '123456',
      );

      await tester.tap(find.text('Save'));

      await tester.pump();

      verify(
        () => mockProfileBloc.add(any(that: isA<PatchProfile>())),
      ).called(1);

      addTearDown(tester.view.resetPhysicalSize);
    });

    testWidgets('Hiển thị Dialog Loading khi ProfileInProgress', (
      tester,
    ) async {
      whenListen(
        mockProfileBloc,
        Stream.fromIterable([ProfileInProgress()]),
        initialState: ProfileInitial(),
      );

      await tester.pumpWidget(makeTestableWidget());

      await tester.pump();

      await tester.pump(const Duration(milliseconds: 500));

      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsNWidgets(1));
    });

    testWidgets(
      'Hiển thị SnackBar thành công và clear mật khẩu khi PatchProfileSuccess',
      (tester) async {
        whenListen(
          mockProfileBloc,
          Stream.fromIterable([
            ProfileInProgress(),
            PatchProfileSuccess('Thành công'),
          ]),
          initialState: ProfileInitial(),
        );

        await tester.pumpWidget(makeTestableWidget());

        await tester.pumpAndSettle();

        await tester.pump();

        await tester.pumpAndSettle();

        expect(find.byType(SnackBar), findsOneWidget);
        expect(find.text('Thành công'), findsOneWidget);
      },
    );
  });
}
