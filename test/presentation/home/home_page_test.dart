import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/my_food/myFood_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/my_food/myFood_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/my_food/myFood_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/tag/tag_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/tag/tag_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/tag/tag_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/home/home_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/routes/app_routes.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MockTagBloc extends MockBloc<TagEvent, TagState> implements TagBloc {}

class MockFoodBloc extends MockBloc<FoodEvent, FoodState> implements FoodBloc {}

class MockMyFoodBloc extends MockBloc<MyfoodEvent, MyfoodState>
    implements MyfoodBloc {}

class FoodEventFake extends Fake implements FoodEvent {}

class TagEventFake extends Fake implements TagEvent {}

class MyfoodEventFake extends Fake implements MyfoodEvent {}

void main() {
  late MockTagBloc mockTagBloc;
  late MockFoodBloc mockFoodBloc;
  late MockMyFoodBloc mockMyFoodBloc;

  setUpAll(() {
    registerFallbackValue(FoodEventFake());
    registerFallbackValue(TagEventFake());
    registerFallbackValue(MyfoodEventFake());
  });

  setUp(() {
    SharedPreferences.setMockInitialValues({'userId': 1, 'firstname': 'Khanh'});

    mockTagBloc = MockTagBloc();
    mockFoodBloc = MockFoodBloc();
    mockMyFoodBloc = MockMyFoodBloc();

    when(() => mockTagBloc.state).thenReturn(TagInitial());
    when(() => mockFoodBloc.state).thenReturn(FoodInitial());
    when(() => mockMyFoodBloc.state).thenReturn(MyFoodInitial());

    when(() => mockTagBloc.stream).thenAnswer((_) => const Stream.empty());
    when(() => mockFoodBloc.stream).thenAnswer((_) => const Stream.empty());
    when(() => mockMyFoodBloc.stream).thenAnswer((_) => const Stream.empty());
  });

  Widget makeTestableWidget() {
    return MaterialApp(
      routes: {
        AppRoutes.login: (context) => const Scaffold(body: Text('Login Page')),
        AppRoutes.allTag: (context) =>
            const Scaffold(body: Text('All Tags Page')),
        AppRoutes.foodsoftag: (context) =>
            const Scaffold(body: Text('Foods Tag Page')),
      },
      home: MultiBlocProvider(
        providers: [
          BlocProvider<TagBloc>.value(value: mockTagBloc),
          BlocProvider<FoodBloc>.value(value: mockFoodBloc),
          BlocProvider<MyfoodBloc>.value(value: mockMyFoodBloc),
        ],
        child: const HomePage(),
      ),
    );
  }

  group('HomePage Widget Test', () {
    testWidgets('Điều hướng về Login khi không có userId', (tester) async {
      SharedPreferences.setMockInitialValues({}); // Xóa trắng data

      await tester.pumpWidget(makeTestableWidget());
      await tester.pumpAndSettle();

      expect(find.text('Login Page'), findsOneWidget);
    });

    testWidgets('Kiểm tra hiển thị khi danh sách Tags rỗng', (tester) async {
      when(() => mockTagBloc.state).thenReturn(ListTagEmpty());

      await tester.pumpWidget(makeTestableWidget());
      await tester.pump();

      expect(find.text("Don't have any tags"), findsOneWidget);
    });
  });
}
