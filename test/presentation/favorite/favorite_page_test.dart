import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:bloc_test/bloc_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/favorite/favorite_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/food_model.dart';

class MockFoodBloc extends MockBloc<FoodEvent, FoodState> implements FoodBloc {}

void main() {
  late MockFoodBloc mockFoodBloc;

  setUp(() {
    mockFoodBloc = MockFoodBloc();
  });

  Food createMockFood({required int id, required String name}) {
    return Food(
      id: id,
      dishName: name,
      description: 'Test description',
      dishType: 'Fast Food',
      servingSize: '1',
      cookingTime: '10m',
      ingredients: 'Test',
      cookingMethod: 'Test',
      calories: 100,
      fat: 0,
      fiber: 0,
      sugar: 0,
      protein: 0,
      imageLink: 'test.png',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  Widget makeTestableWidget(Widget body) {
    return MaterialApp(
      home: BlocProvider<FoodBloc>.value(
        value: mockFoodBloc,
        child: body,
      ),
    );
  }

  testWidgets('Hiển thị Loading Indicator khi trạng thái là FoodInProgress', (WidgetTester tester) async {
    when(() => mockFoodBloc.state).thenReturn(FoodInProgress());

    await tester.pumpWidget(makeTestableWidget(const FavoritePage()));
    
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });

  testWidgets('Hiển thị thông báo trống khi danh sách yêu thích rỗng', (WidgetTester tester) async {
    when(() => mockFoodBloc.state).thenReturn(
      ViewAllFoodSuccess(foods: [], ratings: {}, totalPages: 1)
    );

    await tester.pumpWidget(makeTestableWidget(const FavoritePage()));
    await tester.pump(); 

    expect(find.text("You don't have any favorite foods"), findsOneWidget);
  });

  testWidgets('Hiển thị danh sách món ăn khi tải thành công', (WidgetTester tester) async {
    final mockFoods = [
      createMockFood(id: 1, name: 'Pizza'),
      createMockFood(id: 2, name: 'Burger'),
    ];

    when(() => mockFoodBloc.state).thenReturn(
      ViewAllFoodSuccess(
        foods: mockFoods,
        ratings: {1: 4.5, 2: 4.0},
        totalPages: 1,
      ),
    );

    await tester.pumpWidget(makeTestableWidget(const FavoritePage()));
    await tester.pump(); 

    expect(find.text('Pizza'), findsOneWidget);
    expect(find.text('Burger'), findsOneWidget);
  });

  testWidgets('Hiển thị SnackBar lỗi khi ViewAllFoodFailure', (WidgetTester tester) async {
    whenListen(
      mockFoodBloc,
      Stream.fromIterable([
        FoodInitial(), 
        ViewAllFoodFailure("Lỗi kết nối"), 
      ]),
      initialState: FoodInitial(),
    );

    await tester.pumpWidget(makeTestableWidget(const FavoritePage()));
    
    await tester.pumpAndSettle(); 

    expect(find.text("Lỗi kết nối"), findsOneWidget);
  });
}