import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/detail/detail_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/detail/detail_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/detail/detail_state.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/food/comment_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/food/food_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/food/rating_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/food/tag_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/food_model.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/comment_model.dart';

class MockFoodService extends Mock implements FoodService {}
class MockRatingService extends Mock implements RatingService {}
class MockCommentService extends Mock implements CommentService {}
class MockTagService extends Mock implements TagService {}

void main() {
  late FoodDetailBloc foodDetailBloc;
  late MockFoodService mockFoodService;
  late MockRatingService mockRatingService;
  late MockCommentService mockCommentService;
  late MockTagService mockTagService;

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
    mockCommentService = MockCommentService();
    mockTagService = MockTagService();

    foodDetailBloc = FoodDetailBloc(
      foodService: mockFoodService,
      ratingService: mockRatingService,
      commentService: mockCommentService,
      tagService: mockTagService,
    );

    SharedPreferences.setMockInitialValues({'userId': 123});

    when(() => mockFoodService.getFoodDetail(any())).thenAnswer((_) async => mockFood);
    when(() => mockRatingService.getAverRating(any())).thenAnswer((_) async => 4.5);
    when(() => mockRatingService.getRating(any(), any())).thenAnswer((_) async => {'rating': 5, 'rateId': 1});
    
    when(() => mockCommentService.getFoodComment(
      foodId: any(named: 'foodId'),
      page: any(named: 'page'),
      limit: any(named: 'limit'),
    )).thenAnswer((_) async => {
      'comments': <Comment>[],
      'totalPages': 1
    });

    when(() => mockTagService.getTagsByFoodId(any())).thenAnswer((_) async => []);
  });

  tearDown(() {
    foodDetailBloc.close();
  });

  group('FoodDetailBloc - LoadFoodDetail', () {
    blocTest<FoodDetailBloc, FoodDetailState>(
      'Nên emit [FoodDetailInprogress, FoodDetailSuccess] khi tải dữ liệu thành công',
      build: () => foodDetailBloc,
      act: (bloc) => bloc.add(LoadFoodDetail('1')),
      expect: () => [
        isA<FoodDetailInprogress>(),
        isA<FoodDetailSuccess>().having((s) => s.averRating, 'averRating', 4.5),
      ],
    );
  });

  group('FoodDetailBloc - Rating & Comments', () {
    blocTest<FoodDetailBloc, FoodDetailState>(
      'Nên cập nhật state khi PostRating thành công',
      setUp: () {
        when(() => mockRatingService.postRate(any(), any(), any()))
            .thenAnswer((_) async => {'message': 'Success'});
        when(() => mockRatingService.getAverRating(any()))
            .thenAnswer((_) async => 5.0);
      },
      build: () => foodDetailBloc,
      act: (bloc) async {
        bloc.add(LoadFoodDetail('1'));
        await Future.delayed(Duration.zero);
        bloc.add(PostRating(5));
      },
      expect: () => [
        isA<FoodDetailInprogress>(),
        isA<FoodDetailSuccess>(),
        isA<FoodDetailSuccess>().having((s) => s.userRating, 'userRating', 5),
      ],
    );
  });
}