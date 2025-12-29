import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:naitei_flutter_2025_khanhbh_project1/business/tag/tag_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/tag/tag_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/tag/tag_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/food/tag_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/tag_model.dart';

class MockTagService extends Mock implements TagService {}

void main() {
  late TagBloc tagBloc;
  late MockTagService mockTagService;

  final mockTag = Tag(
  id: 1,
  name: 'Món Cay',     
  imageUrl: 'https://example.com/image.png', 
);

  setUp(() {
    mockTagService = MockTagService();
    tagBloc = TagBloc(mockTagService);
  });

  tearDown(() {
    tagBloc.close();
  });

  group('TagBloc - ViewListTag Event', () {
    blocTest<TagBloc, TagState>(
      'Nên emit [TagInProgress, ListTagSuccess] khi lấy danh sách tag thành công',
      setUp: () {
        when(() => mockTagService.getAllTags(
              page: any(named: 'page'),
              limit: any(named: 'limit'),
            )).thenAnswer((_) async => {
              'code': 200,
              'tags': <Tag>[mockTag],
              'totalPages': 1,
            });
      },
      build: () => tagBloc,
      act: (bloc) => bloc.add(ViewListTag(page: 1, limit: 10)),
      expect: () => [
        isA<TagInProgress>(),
        isA<ListTagSuccess>()
            .having((s) => s.tags.length, 'số lượng tag', 1)
            .having((s) => s.currentPage, 'trang hiện tại', 1),
      ],
    );

    blocTest<TagBloc, TagState>(
      'Nên emit [TagInProgress, ListTagEmpty] khi danh sách tag trống',
      setUp: () {
        when(() => mockTagService.getAllTags(
              page: any(named: 'page'),
              limit: any(named: 'limit'),
            )).thenAnswer((_) async => {
              'code': 200,
              'tags': <Tag>[],
              'totalPages': 0,
            });
      },
      build: () => tagBloc,
      act: (bloc) => bloc.add(ViewListTag(page: 1, limit: 10)),
      expect: () => [
        isA<TagInProgress>(),
        isA<ListTagEmpty>(),
      ],
    );

    blocTest<TagBloc, TagState>(
      'Nên emit [TagInProgress, ListTagFailure] khi server trả về lỗi (code != 200)',
      setUp: () {
        when(() => mockTagService.getAllTags(
              page: any(named: 'page'),
              limit: any(named: 'limit'),
            )).thenAnswer((_) async => {
              'code': 400,
              'message': 'Không thể tải danh sách tag',
            });
      },
      build: () => tagBloc,
      act: (bloc) => bloc.add(ViewListTag(page: 1, limit: 10)),
      expect: () => [
        isA<TagInProgress>(),
        isA<ListTagFailure>().having((s) => s.message, 'message', 'Không thể tải danh sách tag'),
      ],
    );

    blocTest<TagBloc, TagState>(
      'Nên emit [TagInProgress, ListTagFailure] khi xảy ra lỗi ngoại lệ',
      setUp: () {
        when(() => mockTagService.getAllTags(
              page: any(named: 'page'),
              limit: any(named: 'limit'),
            )).thenThrow(Exception('Lỗi kết nối mạng'));
      },
      build: () => tagBloc,
      act: (bloc) => bloc.add(ViewListTag(page: 1, limit: 10)),
      expect: () => [
        isA<TagInProgress>(),
        isA<ListTagFailure>().having((s) => s.message, 'message', 'Lỗi kết nối mạng'),
      ],
    );
  });
}