import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/my_food/myFood_bloc.dart';

import 'package:naitei_flutter_2025_khanhbh_project1/business/my_food/myFood_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/my_food/myFood_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/food/food_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/food/rating_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/food_model.dart';

class MockFoodService extends Mock implements FoodService {}

class MockRatingService extends Mock implements RatingService {}

void main() {
  late MyfoodBloc myfoodBloc;
  late MockFoodService mockFoodService;
  late MockRatingService mockRatingService;

  final mockFood = Food(
    id: 1,
    dishName: 'Món ăn của tôi',
    description: 'Mô tả',
    dishType: 'Dessert',
    servingSize: '2',
    cookingTime: '15',
    ingredients: 'Sugar, Milk',
    cookingMethod: 'Bake',
    calories: 200,
    fat: 2,
    fiber: 1,
    sugar: 10,
    protein: 5,
    imageLink: '',
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
  );

  setUp(() {
    mockFoodService = MockFoodService();
    mockRatingService = MockRatingService();
    myfoodBloc = MyfoodBloc(mockFoodService, mockRatingService);
  });

  tearDown(() {
    myfoodBloc.close();
  });

  group('MyfoodBloc - ViewMyFood Event', () {
    blocTest<MyfoodBloc, MyfoodState>(
      'Nên emit [MyFoodInProgress, ViewMyFoodSuccess] khi lấy dữ liệu thành công',
      setUp: () {
        when(
          () => mockFoodService.getMyFood(
            userId: any(named: 'userId'),
            page: any(named: 'page'),
            query: any(named: 'query'),
            limit: any(named: 'limit'),
          ),
        ).thenAnswer(
          (_) async => {
            'code': 200,
            'data': <Food>[mockFood], 
            'totalPages': 1,
          },
        );

        when(
          () => mockRatingService.getAverRating(any()),
        ).thenAnswer((_) async => 4.2);
        when(
          () => mockRatingService.getCountRating(any()),
        ).thenAnswer((_) async => 5);
      },
      build: () => myfoodBloc,
      act: (bloc) => bloc.add(ViewMyFood(userId: 123, page: 1)),
      expect: () => [
        isA<MyFoodInProgress>(),
        isA<ViewMyFoodSuccess>()
            .having((s) => s.foods.length, 'số lượng món', 1)
            .having((s) => s.ratings?[1], 'đánh giá món id 1', 4.2),
      ],
    );

    blocTest<MyfoodBloc, MyfoodState>(
      'Nên emit [MyFoodInProgress, ViewMyFoodEmpty] khi không có món ăn nào',
      setUp: () {
        when(
          () => mockFoodService.getMyFood(
            userId: any(named: 'userId'),
            page: any(named: 'page'),
            query: any(named: 'query'),
            limit: any(named: 'limit'),
          ),
        ).thenAnswer(
          (_) async => {
            'code': 200,
            'data': <Food>[], 
            'totalPages': 0,
          },
        );
      },
      build: () => myfoodBloc,
      act: (bloc) => bloc.add(ViewMyFood(userId: 123, page: 1)),
      expect: () => [isA<MyFoodInProgress>(), isA<ViewMyFoodEmpty>()],
    );

    blocTest<MyfoodBloc, MyfoodState>(
      'Nên emit [MyFoodInProgress, ViewMyFoodFailure] khi API trả về lỗi',
      setUp: () {
        when(
          () => mockFoodService.getMyFood(
            userId: any(named: 'userId'),
            page: any(named: 'page'),
            query: any(named: 'query'),
            limit: any(named: 'limit'),
          ),
        ).thenAnswer((_) async => {'code': 400, 'message': 'User not found'});
      },
      build: () => myfoodBloc,
      act: (bloc) => bloc.add(ViewMyFood(userId: 999, page: 1)),
      expect: () => [
        isA<MyFoodInProgress>(),
        isA<ViewMyFoodFailure>().having(
          (s) => s.message,
          'lỗi',
          'User not found',
        ),
      ],
    );

    blocTest<MyfoodBloc, MyfoodState>(
      'Nên emit [MyFoodInProgress, ViewMyFoodFailure] khi xảy ra ngoại lệ',
      setUp: () {
        when(
          () => mockFoodService.getMyFood(
            userId: any(named: 'userId'),
            page: any(named: 'page'),
            query: any(named: 'query'),
            limit: any(named: 'limit'),
          ),
        ).thenThrow(Exception('Timeout error'));
      },
      build: () => myfoodBloc,
      act: (bloc) => bloc.add(ViewMyFood(userId: 123, page: 1)),
      expect: () => [
        isA<MyFoodInProgress>(),
        isA<ViewMyFoodFailure>().having(
          (s) => s.message,
          'lỗi',
          'Timeout error',
        ),
      ],
    );
  });

  group('MyfoodBloc - Reset Event', () {
    blocTest<MyfoodBloc, MyfoodState>(
      'Nên emit [MyFoodInitial] khi nhận sự kiện MyFoodReset',
      build: () => myfoodBloc,
      act: (bloc) => bloc.add(MyFoodReset()),
      expect: () => [isA<MyFoodInitial>()],
    );
  });
}
