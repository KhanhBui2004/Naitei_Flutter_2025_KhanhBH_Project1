import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:mocktail_image_network/mocktail_image_network.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/tag/tag_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/tag/tag_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/tag/tag_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/tag_model.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/tag/allTag_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/tagListCard.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/routes/app_routes.dart';

class MockTagBloc extends MockBloc<TagEvent, TagState> implements TagBloc {}

class TagEventFake extends Fake implements TagEvent {}

void main() {
  late MockTagBloc mockTagBloc;

  setUpAll(() {
    registerFallbackValue(TagEventFake());
  });

  setUp(() {
    mockTagBloc = MockTagBloc();
    when(() => mockTagBloc.stream).thenAnswer((_) => const Stream.empty());
  });

  final mockTags = [
    Tag(id: 1, name: 'Healthy', imageUrl: 'https://example.com/h.png'),
    Tag(id: 2, name: 'Fast Food', imageUrl: 'https://example.com/f.png'),
  ];

  Widget makeTestableWidget() {
    return MaterialApp(
      routes: {
        AppRoutes.home: (context) => const Scaffold(body: Text('Home Page')),
        AppRoutes.foodsoftag: (context) => const Scaffold(body: Text('Foods of Tag')),
      },
      home: BlocProvider<TagBloc>.value(
        value: mockTagBloc,
        child: const AllTagsPage(),
      ),
    );
  }

  group('AllTagsPage Widget Test', () {
    testWidgets('Hiển thị Loading khi state là TagInProgress', (tester) async {
      when(() => mockTagBloc.state).thenReturn(TagInProgress());

      await tester.pumpWidget(makeTestableWidget());

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('Hiển thị danh sách Tag và Pagination khi tải thành công', (
      tester,
    ) async {
      await mockNetworkImages(() async {
        when(() => mockTagBloc.state).thenReturn(
          ListTagSuccess(tags: mockTags, currentPage: 1, totalPages: 5),
        );

        await tester.pumpWidget(makeTestableWidget());
        await tester.pumpAndSettle();

        expect(find.byType(Taglistcard), findsNWidgets(2));
        expect(find.text('Healthy'), findsOneWidget);
        expect(find.text('Fast Food'), findsOneWidget);

        expect(find.text('All Tags'), findsOneWidget);
      });
    });

    testWidgets('Hiển thị thông báo khi danh sách rỗng', (tester) async {
      when(() => mockTagBloc.state).thenReturn(ListTagEmpty());

      await tester.pumpWidget(makeTestableWidget());
      await tester.pumpAndSettle();

      expect(find.text("Don't have any tags"), findsOneWidget);
    });

    testWidgets('Gọi sự kiện tìm kiếm khi nhập vào SearchBar', (tester) async {
      when(() => mockTagBloc.state).thenReturn(TagInitial());

      await tester.pumpWidget(makeTestableWidget());

      await tester.enterText(find.byType(TextField), 'Fast');
      await tester.pump(
        const Duration(milliseconds: 500),
      ); 

      verify(
        () => mockTagBloc.add(any(that: isA<ViewListTag>())),
      ).called(greaterThan(0));
    });

    testWidgets('Hiển thị thông báo lỗi khi tải thất bại', (tester) async {
      when(
        () => mockTagBloc.state,
      ).thenReturn(ListTagFailure("Error connection"));

      await tester.pumpWidget(makeTestableWidget());
      await tester.pumpAndSettle();

      expect(find.text("Error connection"), findsOneWidget);
    });

    testWidgets('Quay lại trang Home khi nhấn nút Back', (tester) async {
      when(() => mockTagBloc.state).thenReturn(TagInitial());

      await tester.pumpWidget(makeTestableWidget());

      await tester.tap(find.byIcon(Icons.arrow_back));
      await tester.pumpAndSettle();

      expect(find.text('Home Page'), findsOneWidget);
    });
    group('Navigation Case', () {
      testWidgets('Chuyển sang trang FoodByTag khi nhấn vào một Tag', (
        tester,
      ) async {
        await mockNetworkImages(() async {
          when(() => mockTagBloc.state).thenReturn(
            ListTagSuccess(tags: mockTags, currentPage: 1, totalPages: 1),
          );

          await tester.pumpWidget(makeTestableWidget());
          await tester.pumpAndSettle();

          await tester.tap(find.text('Healthy'));
          await tester.pumpAndSettle();

          expect(find.text('Foods of Tag'), findsOneWidget);
        });
      });
    });
  });
}
