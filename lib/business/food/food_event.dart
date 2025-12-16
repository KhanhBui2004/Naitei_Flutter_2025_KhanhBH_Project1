class FoodEvent {}

class ViewAllFood extends FoodEvent {
  final int page;
  final String? query;

  ViewAllFood({required this.page, this.query});
}
