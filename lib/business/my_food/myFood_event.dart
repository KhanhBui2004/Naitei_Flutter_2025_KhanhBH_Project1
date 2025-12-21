class MyfoodEvent {}

class ViewMyFood extends MyfoodEvent {
  final int userId;
  final int page;
  final String? query;
  final int? limit;

  ViewMyFood({
    required this.userId,
    required this.page,
    this.query,
    this.limit,
  });
}

class MyFoodReset extends MyfoodEvent {}
