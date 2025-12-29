import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:naitei_flutter_2025_khanhbh_project1/business/foodtag/foodtag_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/foodtag/foodTag_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/foodtag/foodTag_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/food/rating_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/food/tag_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/food_model.dart';

class MockTagService extends Mock implements TagService {}

class MockRatingService extends Mock implements RatingService {}

void main() {
  late FoodtagBloc foodtagBloc;
  late MockTagService mockTagService;
  late MockRatingService mockRatingService;

  final mockFood = Food(
    id: 1,
    dishName: 'Cơm tấm',
    description: 'Ngon',
    dishType: 'Main',
    servingSize: '1',
    cookingTime: '20',
    ingredients: 'Gạo, sườn',
    cookingMethod: 'Grilled',
    calories: 400,
    fat: 5,
    fiber: 2,
    sugar: 1,
    protein: 20,
    imageLink: '',
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
  );

  setUp(() {
    mockTagService = MockTagService();
    mockRatingService = MockRatingService();
    foodtagBloc = FoodtagBloc(mockTagService, mockRatingService);
  });

  tearDown(() {
    foodtagBloc.close();
  });

  group('FoodtagBloc - ViewFoodTag', () {
    blocTest<FoodtagBloc, FoodtagState>(
      'Nên emit [FoodTagInProgress, ViewFoodTagSuccess] khi lấy danh sách theo tag thành công',
      setUp: () {
        when(
          () => mockTagService.getFoodsByTagId(
            tagId: any(named: 'tagId'),
            page: any(named: 'page'),
            limit: any(named: 'limit'),
            query: any(named: 'query'),
          ),
        ).thenAnswer(
          (_) async => {
            'code': 200,
            'foods': <Food>[
              mockFood,
            ],
            'totalPages': 5,
          },
        );

        when(
          () => mockRatingService.getAverRating(any()),
        ).thenAnswer((_) async => 4.8);
      },
      build: () => foodtagBloc,
      act: (bloc) => bloc.add(ViewFoodTag(1, 10, null, tagId: 1)),
      expect: () => [
        isA<FoodTagInProgress>(),
        isA<ViewFoodTagSuccess>()
            .having((s) => s.foods.length, 'số lượng món', 1)
            .having((s) => s.ratings[1], 'điểm đánh giá món id 1', 4.8),
      ],
    );

    blocTest<FoodtagBloc, FoodtagState>(
      'Nên emit [FoodTagInProgress, ViewFoodTagEmpty] khi tag không có món ăn nào',
      setUp: () {
        when(
          () => mockTagService.getFoodsByTagId(
            tagId: any(named: 'tagId'),
            page: any(named: 'page'),
            limit: any(named: 'limit'),
            query: any(named: 'query'),
          ),
        ).thenAnswer(
          (_) async => {
            'code': 200,
            'foods': <Food>[], 
            'totalPages': 0,
          },
        );
      },
      build: () => foodtagBloc,
      act: (bloc) => bloc.add(ViewFoodTag(1, 10, null, tagId: 2)),
      expect: () => [isA<FoodTagInProgress>(), isA<ViewFoodTagEmpty>()],
    );

    blocTest<FoodtagBloc, FoodtagState>(
      'Nên emit [FoodTagInProgress, ViewFoodTagFailure] khi server trả về code != 200',
      setUp: () {
        when(
          () => mockTagService.getFoodsByTagId(
            tagId: any(named: 'tagId'),
            page: any(named: 'page'),
            limit: any(named: 'limit'),
            query: any(named: 'query'),
          ),
        ).thenAnswer((_) async => {'code': 404, 'message': 'Tag not found'});
      },
      build: () => foodtagBloc,
      act: (bloc) => bloc.add(ViewFoodTag(1, 10, null, tagId: 99)),
      expect: () => [
        isA<FoodTagInProgress>(),
        isA<ViewFoodTagFailure>().having(
          (s) => s.message,
          'thông báo lỗi',
          'Tag not found',
        ),
      ],
    );

    blocTest<FoodtagBloc, FoodtagState>(
      'Nên emit [FoodTagInProgress, ViewFoodTagFailure] khi có ngoại lệ xảy ra',
      setUp: () {
        when(
          () => mockTagService.getFoodsByTagId(
            tagId: any(named: 'tagId'),
            page: any(named: 'page'),
            limit: any(named: 'limit'),
            query: any(named: 'query'),
          ),
        ).thenThrow(Exception('Lỗi mạng'));
      },
      build: () => foodtagBloc,
      act: (bloc) => bloc.add(ViewFoodTag(1, 10, null, tagId: 1)),
      expect: () => [
        isA<FoodTagInProgress>(),
        isA<ViewFoodTagFailure>().having(
          (s) => s.message,
          'message',
          'Lỗi mạng',
        ),
      ],
    );
  });
}
