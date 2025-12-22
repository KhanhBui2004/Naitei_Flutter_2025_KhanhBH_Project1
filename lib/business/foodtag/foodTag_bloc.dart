import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/foodtag/foodTag_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/foodtag/foodTag_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/service/food/rating_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/service/food/tag_service.dart';

class FoodtagBloc extends Bloc<FoodtagEvent, FoodtagState> {
  final RatingService ratingService;
  final TagService tagService;

  FoodtagBloc(this.tagService, this.ratingService) : super(FoodTagInitial()) {
    on<ViewFoodTag>(_loadFoodTag);
  }

  Future<void> _loadFoodTag(
    ViewFoodTag event,
    Emitter<FoodtagState> emit,
  ) async {
    emit(FoodTagInProgress());

    try {
      final response = await tagService.getFoodsByTagId(
        tagId: event.tagId,
        page: event.page,
        limit: event.limit,
        query: event.query,
      );

      final Map<int, double> ratings = {};

      if (response['code'] == 200) {
        final List<dynamic> foods = response['foods'] ?? [];

        if (foods.isNotEmpty) {
          for (final food in foods) {
            ratings[food.id] = await ratingService.getAverRating(food.id);
          }

          emit(
            ViewFoodTagSuccess(
              foods: response['foods'],
              totalPages: response['totalPages'] ?? 1,
              ratings: ratings,
              currentPage: event.page,
            ),
          );
        } else {
          emit(ViewFoodTagEmpty());
        }
      } else {
        emit(ViewFoodTagFailure(response['message']));
      }
    } catch (e) {
      emit(ViewFoodTagFailure(e.toString().replaceFirst('Exception: ', '')));
    }
  }
}
