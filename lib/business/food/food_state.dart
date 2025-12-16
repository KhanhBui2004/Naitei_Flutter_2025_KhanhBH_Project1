import 'package:naitei_flutter_2025_khanhbh_project1/data/model/food_model.dart';

sealed class FoodState {}

class FoodInitial extends FoodState {}

class FoodInProgress extends FoodState {}

class ViewAllFoodSuccess extends FoodState {
  final List<Food> foods;
  final int totalPages;

  ViewAllFoodSuccess({required this.foods, required this.totalPages});
}

class ViewAllFoodFailure extends FoodState {
  final String message;

  ViewAllFoodFailure(this.message);
}
