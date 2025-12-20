import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/tag/tag_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/tag/tag_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/service/food/tag_service.dart';

class TagBloc extends Bloc<TagEvent, TagState> {
  TagBloc(this.tagService) : super(TagInitial()) {
    on<ViewListTag>(_fetchAllTag);
  }

  final TagService tagService;

  Future<void> _fetchAllTag(ViewListTag event, Emitter<TagState> emit) async {
    try {
      final response = await tagService.getAllTags(
        page: event.page,
        limit: event.limit,
      );

      if (response['code'] == 200) {
        final List<dynamic> tags = response['tags'] ?? [];
        if (tags.isEmpty) {
          emit(ListTagEmpty());
          return;
        }

        emit(
          ListTagSuccess(
            tags: response['tags'],
            totalPages: response['totalPages'],
          ),
        );
      } else {
        emit(ListTagFailure(response['message']));
      }
    } catch (e) {
      emit(ListTagFailure(e.toString().replaceFirst('Exception: ', '')));
    }
  }
}
