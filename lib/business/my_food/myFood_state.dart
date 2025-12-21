import 'package:naitei_flutter_2025_khanhbh_project1/data/model/food_model.dart';

class MyfoodState {}

class MyFoodInitial extends MyfoodState {}

class MyFoodInProgress extends MyfoodState {}

class ViewMyFoodSuccess extends MyfoodState {
  final List<Food> foods;
  final int totalPages;
  final Map<int, double>? ratings;
  final Map<int, int>? counts;

  ViewMyFoodSuccess({
    required this.foods,
    required this.totalPages,
    this.ratings,
    this.counts,
  });
}

class ViewMyFoodEmpty extends MyfoodState {}

class ViewMyFoodFailure extends MyfoodState {
  final String message;
  ViewMyFoodFailure(this.message);
}
