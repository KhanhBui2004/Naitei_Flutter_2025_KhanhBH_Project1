import 'package:bloc/bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/service/food/food_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/service/food/rating_service.dart';

class FoodBloc extends Bloc<FoodEvent, FoodState> {
  final FoodService foodService;
  final RatingService ratingService;

  FoodBloc(this.foodService, this.ratingService) : super(FoodInitial()) {
    on<ViewAllFood>(_isFetchAllFood);
  }

  Future<void> _isFetchAllFood(
    ViewAllFood event,
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
}
