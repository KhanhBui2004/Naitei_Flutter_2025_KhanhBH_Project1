import 'package:naitei_flutter_2025_khanhbh_project1/data/model/tag_model.dart';

sealed class TagState {}

class TagInitial extends TagState {}

class TagInProgress extends TagState {}

class ListTagSuccess extends TagState {
  final List<Tag> tags;
  final int totalPages;
  final int currentPage;

  ListTagSuccess({
    required this.tags,
    required this.totalPages,
    required this.currentPage,
  });
}

class ListTagEmpty extends TagState {}

class ListTagFailure extends TagState {
  final String message;

  ListTagFailure(this.message);
}
