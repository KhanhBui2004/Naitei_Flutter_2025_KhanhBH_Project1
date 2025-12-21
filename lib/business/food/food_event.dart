class FoodEvent {}

class ViewFavoriteFood extends FoodEvent {
  final int page;
  final String? query;

  ViewFavoriteFood({required this.page, this.query});
}

class ViewAllFood extends FoodEvent {
  final int page;
  final String? query;
  final int? limit;

  ViewAllFood({required this.page, this.query, this.limit});
}

class GetFoodDetail extends FoodEvent {
  final String foodId;

  GetFoodDetail({required this.foodId});
}

class FoodReset extends FoodEvent {}
