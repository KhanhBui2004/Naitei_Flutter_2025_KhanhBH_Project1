import 'package:naitei_flutter_2025_khanhbh_project1/data/model/food_model.dart';

sealed class FoodState {}

class FoodInitial extends FoodState {}

class FoodInProgress extends FoodState {}

class ViewAllFoodSuccess extends FoodState {
  final List<Food> foods;
  final int totalPages;
  final Map<int, double>? ratings;
  final Map<int, int>? counts;

  ViewAllFoodSuccess({
    required this.foods,
    required this.totalPages,
    this.ratings,
    this.counts,
  });
}

class ViewAllFoodEmpty extends FoodState {}

class ViewAllFoodFailure extends FoodState {
  final String message;

  ViewAllFoodFailure(this.message);
}

class GetDetailSuccess extends FoodState {
  final Food detail;
  final Map<String, dynamic> rating;
  final double averRating;

  GetDetailSuccess({
    required this.detail,
    required this.averRating,
    required this.rating,
  });
}

class FoodFailure extends FoodState {
  final String message;

  FoodFailure(this.message);
}
