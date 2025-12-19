abstract class FoodDetailEvent {}

class LoadFoodDetail extends FoodDetailEvent {
  final String foodId;
  LoadFoodDetail(this.foodId);
}

class PostRating extends FoodDetailEvent {
  final int rating;
  PostRating(this.rating);
}

class PatchRating extends FoodDetailEvent {
  final int rating;
  PatchRating(this.rating);
}

class LoadComments extends FoodDetailEvent {
  final int page;
  LoadComments({this.page = 1});
}

class PostComment extends FoodDetailEvent {
  final String content;
  PostComment(this.content);
}

class LoadTags extends FoodDetailEvent {}
