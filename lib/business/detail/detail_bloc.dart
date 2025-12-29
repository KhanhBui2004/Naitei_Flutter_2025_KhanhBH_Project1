import 'package:flutter/widgets.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/detail/detail_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/detail/detail_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/food/comment_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/food/food_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/food/rating_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/food/tag_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class FoodDetailBloc extends Bloc<FoodDetailEvent, FoodDetailState> {
  final FoodService foodService;
  final RatingService ratingService;
  final CommentService commentService;
  final TagService tagService;

  int? _userId;

  FoodDetailBloc({
    required this.foodService,
    required this.ratingService,
    required this.commentService,
    required this.tagService,
  }) : super(FoodDetailInitial()) {
    on<LoadFoodDetail>(_onLoadFoodDetail);
    on<PostRating>(_onPostRating);
    on<PatchRating>(_onPatchRating);
    on<LoadComments>(_onLoadComments);
    on<PostComment>(_onPostComment);
    on<LoadTags>(_onLoadTags);
  }

  Future<void> _loadUser() async {
    final prefs = await SharedPreferences.getInstance();
    _userId = prefs.getInt('userId');
  }

  Future<void> _onLoadFoodDetail(
    LoadFoodDetail event,
    Emitter<FoodDetailState> emit,
  ) async {
    emit(FoodDetailInprogress());
    try {
      await _loadUser();

      final food = await foodService.getFoodDetail(event.foodId);
      final averRating = await ratingService.getAverRating(
        int.parse(event.foodId),
      );

      int? userRating;
      int? rateId;

      if (_userId != null) {
        final rating = await ratingService.getRating(
          _userId!,
          int.parse(event.foodId),
        );
        userRating = rating['rating'];
        rateId = rating['rateId'];
      }

      final commentRes = await commentService.getFoodComment(
        foodId: int.parse(event.foodId),
        page: 1,
        limit: 10,
      );

      final tags = await tagService.getTagsByFoodId(event.foodId);

      emit(
        FoodDetailSuccess(
          food: food,
          averRating: averRating,
          userRating: userRating,
          rateId: rateId,
          comments: commentRes['comments'],
          currentPage: 1,
          totalPages: commentRes['totalPages'],
          tags: tags,
        ),
      );
    } catch (e, stackTrace) {
      print('TEST LOG ERROR: $e'); // In ra lỗi thực tế
      print(stackTrace);
      emit(FoodDetailFailure(e.toString()));
    }
  }

  Future<void> _onPostRating(
    PostRating event,
    Emitter<FoodDetailState> emit,
  ) async {
    if (state is! FoodDetailSuccess || _userId == null) return;

    final current = state as FoodDetailSuccess;

    final response = await ratingService.postRate(
      _userId!,
      current.food.id,
      event.rating,
    );
    try {
      debugPrint(response['message']);

      final aver = await ratingService.getAverRating(current.food.id);

      emit(current.copyWith(userRating: event.rating, averRating: aver));
    } catch (e, stackTrace) {
      print('TEST LOG ERROR: $e'); // In ra lỗi thực tế
      print(stackTrace);
    }
  }

  Future<void> _onPatchRating(
    PatchRating event,
    Emitter<FoodDetailState> emit,
  ) async {
    if (state is! FoodDetailSuccess || _userId == null) return;

    final current = state as FoodDetailSuccess;

    final response = await ratingService.patchRate(
      _userId!,
      current.food.id,
      event.rating,
      current.rateId!,
    );

    debugPrint(response['message']);

    final aver = await ratingService.getAverRating(current.food.id);

    emit(current.copyWith(userRating: event.rating, averRating: aver));
  }

  Future<void> _onLoadComments(
    LoadComments event,
    Emitter<FoodDetailState> emit,
  ) async {
    if (state is! FoodDetailSuccess) return;

    final current = state as FoodDetailSuccess;

    final res = await commentService.getFoodComment(
      foodId: current.food.id,
      page: event.page,
      limit: 10,
    );

    emit(
      current.copyWith(
        comments: res['comments'],
        currentPage: event.page,
        totalPages: res['totalPages'],
      ),
    );
  }

  Future<void> _onPostComment(
    PostComment event,
    Emitter<FoodDetailState> emit,
  ) async {
    if (state is! FoodDetailSuccess || _userId == null) return;

    final current = state as FoodDetailSuccess;

    await commentService.postComment(_userId!, current.food.id, event.content);

    add(LoadComments(page: 1));
  }

  Future<void> _onLoadTags(
    LoadTags event,
    Emitter<FoodDetailState> emit,
  ) async {
    if (state is! FoodDetailSuccess) return;

    final current = state as FoodDetailSuccess;
    final tags = await tagService.getTagsByFoodId(current.food.id.toString());

    emit(current.copyWith(tags: tags));
  }
}
