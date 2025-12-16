import 'package:bloc/bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/service/food/food_service.dart';

class FoodBloc extends Bloc<FoodEvent, FoodState> {
  final FoodService foodService;

  FoodBloc(this.foodService) : super(FoodInitial()) {
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
        emit(
          ViewAllFoodSuccess(
            foods: response['data'],
            totalPages: response['totalPages'],
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
