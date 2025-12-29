import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/food/food_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/food/rating_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/food_model.dart';

class MockFoodService extends Mock implements FoodService {}

class MockRatingService extends Mock implements RatingService {}

void main() {
  late FoodBloc foodBloc;
  late MockFoodService mockFoodService;
  late MockRatingService mockRatingService;

  final mockFood = Food(
    id: 1,
    dishName: 'Phở',
    description: 'Ngon',
    dishType: 'Main',
    servingSize: '1',
    cookingTime: '10',
    ingredients: 'Beef',
    cookingMethod: 'Boil',
    calories: 100,
    fat: 1,
    fiber: 1,
    sugar: 1,
    protein: 1,
    imageLink: '',
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
  );

  setUp(() {
    mockFoodService = MockFoodService();
    mockRatingService = MockRatingService();
    foodBloc = FoodBloc(mockFoodService, mockRatingService);

    SharedPreferences.setMockInitialValues({'userId': 123});
  });

  tearDown(() {
    foodBloc.close();
  });

  group('FoodBloc - ViewAllFood', () {
    blocTest<FoodBloc, FoodState>(
      'Nên emit [FoodInProgress, ViewAllFoodSuccess] khi lấy danh sách món ăn thành công',
      setUp: () {
        when(
          () => mockFoodService.getFoods(
            page: any(named: 'page'),
            query: any(named: 'query'),
            limit: any(named: 'limit'),
          ),
        ).thenAnswer(
          (_) async => {
            'code': 200,
            'foods': <Food>[mockFood],
            'totalPages': 1,
          },
        );

        when(
          () => mockRatingService.getAverRating(any()),
        ).thenAnswer((_) async => 4.5);
        when(
          () => mockRatingService.getCountRating(any()),
        ).thenAnswer((_) async => 10);
      },
      build: () => foodBloc,
      act: (bloc) => bloc.add(ViewAllFood(page: 1)),
      expect: () => [
        isA<FoodInProgress>(),
        isA<ViewAllFoodSuccess>().having(
          (s) => s.foods.length,
          'số lượng món',
          1,
        ),
      ],
    );

    blocTest<FoodBloc, FoodState>(
      'Nên emit [FoodInProgress, ViewAllFoodEmpty] khi danh sách món ăn trống',
      setUp: () {
        when(
          () => mockFoodService.getFoods(
            page: any(named: 'page'),
            query: any(named: 'query'),
            limit: any(named: 'limit'),
          ),
        ).thenAnswer(
          (_) async => {'code': 200, 'foods': <Food>[], 'totalPages': 0},
        );
      },
      build: () => foodBloc,
      act: (bloc) => bloc.add(ViewAllFood(page: 1)),
      expect: () => [isA<FoodInProgress>(), isA<ViewAllFoodEmpty>()],
    );
  });

  group('FoodBloc - GetFoodDetail', () {
    blocTest<FoodBloc, FoodState>(
      'Nên emit [FoodInProgress, GetDetailSuccess] khi lấy chi tiết thành công',
      setUp: () {
        when(
          () => mockFoodService.getFoodDetail(any()),
        ).thenAnswer((_) async => mockFood);
        when(
          () => mockRatingService.getAverRating(any()),
        ).thenAnswer((_) async => 4.0);
        when(
          () => mockRatingService.getRating(any(), any()),
        ).thenAnswer((_) async => {'rating': 5});
      },
      build: () => foodBloc,
      act: (bloc) => bloc.add(GetFoodDetail(foodId: '1')),
      expect: () => [
        isA<FoodInProgress>(),
        isA<GetDetailSuccess>().having(
          (s) => s.detail.dishName,
          'tên món',
          'Phở',
        ),
      ],
    );

    blocTest<FoodBloc, FoodState>(
      'Nên emit [FoodInProgress, FoodFailure] khi API getFoodDetail lỗi',
      setUp: () {
        when(
          () => mockFoodService.getFoodDetail(any()),
        ).thenThrow(Exception('Lỗi kết nối'));
      },
      build: () => foodBloc,
      act: (bloc) => bloc.add(GetFoodDetail(foodId: '1')),
      expect: () => [
        isA<FoodInProgress>(),
        isA<FoodFailure>().having((s) => s.message, 'message', 'Lỗi kết nối'),
      ],
    );
  });

  group('FoodBloc - Reset', () {
    blocTest<FoodBloc, FoodState>(
      'Nên emit [FoodInitial] khi nhận event FoodReset',
      build: () => foodBloc,
      act: (bloc) => bloc.add(FoodReset()),
      expect: () => [isA<FoodInitial>()],
    );
  });
}
