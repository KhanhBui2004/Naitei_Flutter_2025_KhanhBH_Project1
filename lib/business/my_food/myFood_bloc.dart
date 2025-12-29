import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/my_food/myFood_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/my_food/myFood_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/food/food_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/food/rating_service.dart';

class MyfoodBloc extends Bloc<MyfoodEvent, MyfoodState> {
  final FoodService foodService;
  final RatingService ratingService;

  MyfoodBloc(this.foodService, this.ratingService) : super(MyFoodInitial()) {
    on<ViewMyFood>(_isFetchMyFood);
    on<MyFoodReset>((event, emit) => emit(MyFoodInitial()));
  }

  Future<void> _isFetchMyFood(
    ViewMyFood event,
    Emitter<MyfoodState> emit,
  ) async {
    emit(MyFoodInProgress());

    try {
      final response = await foodService.getMyFood(
        userId: event.userId,
        page: event.page,
        query: event.query,
        limit: event.limit ?? 20,
      );

      if (response['code'] == 200) {
        final Map<int, double> ratings = {};
        final Map<int, int> counts = {};

        final List<dynamic> foods = response['data'] ?? [];
        if (foods.isEmpty) {
          emit(ViewMyFoodEmpty());
          return;
        }

        for (final food in foods) {
          ratings[food.id] = await ratingService.getAverRating(food.id);
          counts[food.id] = await ratingService.getCountRating(food.id);
        }

        emit(
          ViewMyFoodSuccess(
            foods: response['data'],
            totalPages: response['totalPages'],
            ratings: ratings,
            counts: counts,
          ),
        );
      } else {
        emit(ViewMyFoodFailure(response['message']));
      }
    } catch (e) {
      emit(ViewMyFoodFailure(e.toString().replaceFirst('Exception: ', '')));
    }
  }
}
