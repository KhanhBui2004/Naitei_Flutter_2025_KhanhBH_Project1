import 'package:naitei_flutter_2025_khanhbh_project1/data/model/food_model.dart';

class FoodtagState {}

class FoodTagInitial extends FoodtagState {}

class FoodTagInProgress extends FoodtagState {}

class ViewFoodTagSuccess extends FoodtagState {
  final List<Food> foods;
  final int totalPages;
  final Map<int, double> ratings;
  final int currentPage;

  ViewFoodTagSuccess({
    required this.foods,
    required this.totalPages,
    required this.ratings,
    required this.currentPage,
  });
}

class ViewFoodTagFailure extends FoodtagState {
  final String message;

  ViewFoodTagFailure(this.message);
}

class ViewFoodTagEmpty extends FoodtagState {}
