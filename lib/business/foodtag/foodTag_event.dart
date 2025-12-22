class FoodtagEvent {}

class ViewFoodTag extends FoodtagEvent {
  final int page;
  final int limit;
  final String? query;
  final int tagId;

  ViewFoodTag(this.page, this.limit, this.query, {required this.tagId});
}
