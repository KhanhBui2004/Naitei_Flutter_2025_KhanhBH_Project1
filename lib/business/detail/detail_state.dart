import 'package:naitei_flutter_2025_khanhbh_project1/data/model/comment_model.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/food_model.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/tag_model.dart';

sealed class FoodDetailState {}

class FoodDetailInitial extends FoodDetailState {}

class FoodDetailInprogress extends FoodDetailState {}

class FoodDetailFailure extends FoodDetailState {
  final String message;
  FoodDetailFailure(this.message);
}

class FoodDetailSuccess extends FoodDetailState {
  final Food food;

  final double averRating;
  final int? userRating;
  final int? rateId;

  final List<Comment> comments;
  final int currentPage;
  final int totalPages;

  final List<Tag> tags;

  FoodDetailSuccess({
    required this.food,
    required this.averRating,
    required this.userRating,
    required this.rateId,
    required this.comments,
    required this.currentPage,
    required this.totalPages,
    required this.tags,
  });

  FoodDetailSuccess copyWith({
    Food? food,
    double? averRating,
    int? userRating,
    int? rateId,
    List<Comment>? comments,
    int? currentPage,
    int? totalPages,
    List<Tag>? tags,
  }) {
    return FoodDetailSuccess(
      food: food ?? this.food,
      averRating: averRating ?? this.averRating,
      userRating: userRating ?? this.userRating,
      rateId: rateId ?? this.rateId,
      comments: comments ?? this.comments,
      currentPage: currentPage ?? this.currentPage,
      totalPages: totalPages ?? this.totalPages,
      tags: tags ?? this.tags,
    );
  }
}
