import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:mocktail_image_network/mocktail_image_network.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/my_food/myFood_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/my_food/myFood_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/my_food/myFood_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/food_model.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/home/allFood_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/allFoodView.dart';

class MockFoodBloc extends MockBloc<FoodEvent, FoodState> implements FoodBloc {}

class MockMyFoodBloc extends MockBloc<MyfoodEvent, MyfoodState>
    implements MyfoodBloc {}

void main() {
  late MockFoodBloc mockFoodBloc;
  late MockMyFoodBloc mockMyFoodBloc;

  setUp(() {
    mockFoodBloc = MockFoodBloc();
    mockMyFoodBloc = MockMyFoodBloc();

    when(() => mockFoodBloc.state).thenReturn(FoodInitial());
    when(() => mockFoodBloc.stream).thenAnswer((_) => const Stream.empty());

    when(() => mockMyFoodBloc.state).thenReturn(MyFoodInitial());
    when(() => mockMyFoodBloc.stream).thenAnswer((_) => const Stream.empty());
  });

  final mockFood = Food(
    id: 1,
    dishName: 'Phở Bò',
    description: 'Ngon',
    dishType: 'Nước',
    servingSize: '1 tô',
    cookingTime: '30',
    ingredients: 'Bò',
    cookingMethod: 'Nấu',
    calories: 350,
    fat: 10,
    fiber: 2,
    sugar: 1,
    protein: 20,
    imageLink: 'https://example.com/pho.jpg',
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
  );

  Widget makeTestableWidget() {
    return MaterialApp(
      routes: {
        '/detail': (context) =>
            const Scaffold(body: Text('Food Detail Screen')),
      },
      home: MultiBlocProvider(
        providers: [
          BlocProvider<FoodBloc>.value(value: mockFoodBloc),
          BlocProvider<MyfoodBloc>.value(value: mockMyFoodBloc),
        ],
        child: const AllfoodPage(),
      ),
    );
  }

  group('AllfoodPage Widget Test', () {
    testWidgets('Hiển thị AppBar với tiêu đề "All Foods"', (tester) async {
      await tester.pumpWidget(makeTestableWidget());
      expect(find.text('All Foods'), findsOneWidget);
    });

    testWidgets('Kiểm tra AllFoodView được khởi tạo với showMyFood = false', (
      tester,
    ) async {
      await tester.pumpWidget(makeTestableWidget());

      final allFoodViewFinder = find.byType(AllFoodView);
      expect(allFoodViewFinder, findsOneWidget);

      final allFoodView = tester.widget<AllFoodView>(allFoodViewFinder);
      expect(allFoodView.showMyFood, isFalse);
    });

    testWidgets('Điều hướng sang trang Detail khi nhấn vào món ăn', (
      tester,
    ) async {
      await mockNetworkImages(() async {
        whenListen(
          mockFoodBloc,
          Stream.fromIterable([
            ViewAllFoodSuccess(
              foods: [mockFood],
              ratings: {1: 4.5},
              totalPages: 1,
            ),
          ]),
          initialState: ViewAllFoodSuccess(
            foods: [mockFood],
            ratings: {1: 4.5},
            totalPages: 1,
          ),
        );

        await tester.pumpWidget(makeTestableWidget());
        await tester.pumpAndSettle();

        final foodItem = find.text('Phở Bò');
        expect(foodItem, findsOneWidget);

        await tester.tap(foodItem);
        await tester.pumpAndSettle();

        expect(find.text('Food Detail Screen'), findsOneWidget);
      });
    });

    testWidgets('Hiển thị thông báo khi không có món ăn nào', (tester) async {
      when(() => mockFoodBloc.state).thenReturn(ViewAllFoodEmpty());

      await tester.pumpWidget(makeTestableWidget());
      await tester.pump();

      expect(find.text("Don't have any foods"), findsOneWidget);
    });
  });
}
