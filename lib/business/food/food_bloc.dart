import 'package:bloc/bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/service/food/food_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/service/food/rating_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class FoodBloc extends Bloc<FoodEvent, FoodState> {
  final FoodService foodService;
  final RatingService ratingService;

  FoodBloc(this.foodService, this.ratingService) : super(FoodInitial()) {
    on<ViewFavoriteFood>(_isFetchFavFood);
    on<ViewAllFood>(_isFetchAllFood);
    on<GetFoodDetail>(_isFetchFoodDetail);
    on<FoodReset>((event, emit) => emit(FoodInitial()));
  }

  Future<void> _isFetchFavFood(
    ViewFavoriteFood event,
    Emitter<FoodState> emit,
  ) async {
    emit(FoodInProgress());

    try {
      final response = await foodService.getFavoriteFoods(
        page: event.page,
        query: event.query,
      );

      if (response['code'] == 200) {
        final Map<int, double> ratings = {};

        for (final food in response['data']) {
          ratings[food.id] = await ratingService.getAverRating(food.id);
        }

        emit(
          ViewAllFoodSuccess(
            foods: response['data'],
            totalPages: response['totalPages'],
            ratings: ratings,
          ),
        );
      } else {
        emit(ViewAllFoodFailure(response['message']));
      }
    } catch (e) {
      emit(ViewAllFoodFailure(e.toString().replaceFirst('Exception: ', '')));
    }
  }

  Future<void> _isFetchAllFood(
    ViewAllFood event,
    Emitter<FoodState> emit,
  ) async {
    emit(FoodInProgress());

    try {
      final response = await foodService.getFoods(
        page: event.page,
        query: event.query,
        limit: event.limit ?? 20,
      );

      if (response['code'] == 200) {
        final Map<int, double> ratings = {};
        final Map<int, int> counts = {};

        final List<dynamic> foods = response['foods'] ?? [];
        if (foods.isEmpty) {
          emit(ViewAllFoodEmpty());
          return;
        }

        for (final food in foods) {
          ratings[food.id] = await ratingService.getAverRating(food.id);
          counts[food.id] = await ratingService.getCountRating(food.id);
        }

        emit(
          ViewAllFoodSuccess(
            foods: response['foods'],
            totalPages: response['totalPages'],
            ratings: ratings,
            counts: counts,
          ),
        );
      } else {
        emit(ViewAllFoodFailure(response['message']));
      }
    } catch (e) {
      emit(ViewAllFoodFailure(e.toString().replaceFirst('Exception: ', '')));
    }
  }

  Future<void> _isFetchFoodDetail(
    GetFoodDetail event,
    Emitter<FoodState> emit,
  ) async {
    emit(FoodInProgress());

    try {
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getInt('userId') ?? 0;
      final response = await foodService.getFoodDetail(event.foodId);
      if (response.id > 0) {
        final averRating = await ratingService.getAverRating(response.id);
        final rating = await ratingService.getRating(userId, response.id);
        emit(
          GetDetailSuccess(
            detail: response,
            averRating: averRating,
            rating: rating,
          ),
        );
      } else {
        emit(FoodFailure('Fetch detail error'));
      }
    } catch (e) {
      emit(FoodFailure(e.toString().replaceFirst('Exception: ', '')));
    }
  }
}
