import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:network_image_mock/network_image_mock.dart';

import 'package:naitei_flutter_2025_khanhbh_project1/business/detail/detail_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/detail/detail_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/detail/detail_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/food_model.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/detail/detail_page.dart';

class MockFoodDetailBloc extends MockBloc<FoodDetailEvent, FoodDetailState>
    implements FoodDetailBloc {}

class FoodDetailEventFake extends Fake implements FoodDetailEvent {}

void main() {
  late MockFoodDetailBloc mockBloc;

  setUpAll(() {
    registerFallbackValue(FoodDetailEventFake());
  });

  setUp(() {
    mockBloc = MockFoodDetailBloc();
  });

  final mockFood = Food(
    id: 1,
    dishName: 'Phở Bò',
    description: 'Ngon tuyệt vời',
    dishType: 'Món nước',
    servingSize: '1 tô',
    cookingTime: '30',
    ingredients: 'Thịt bò, bánh phở, nước dùng',
    cookingMethod: 'Ninh xương',
    calories: 350,
    fat: 10,
    fiber: 2,
    sugar: 1,
    protein: 20,
    imageLink: 'https://example.com/pho.jpg',
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
  );

  Widget makeTestableWidget() {
    return MaterialApp(
      home: BlocProvider<FoodDetailBloc>.value(
        value: mockBloc,
        child: const FoodDetailScreen(foodId: '1'),
      ),
    );
  }

  group('FoodDetailScreen Widget Test', () {
    testWidgets('Hiển thị Loading Indicator khi đang tải', (tester) async {
      await mockNetworkImagesFor(() async {
        when(() => mockBloc.state).thenReturn(FoodDetailInprogress());

        await tester.pumpWidget(makeTestableWidget());
        expect(find.byType(CircularProgressIndicator), findsOneWidget);
      });
    });

    testWidgets('Hiển thị đầy đủ thông tin món ăn khi tải thành công', (
      tester,
    ) async {
      await mockNetworkImagesFor(() async {
        when(() => mockBloc.state).thenReturn(
          FoodDetailSuccess(
            food: mockFood,
            averRating: 4.5,
            userRating: null,
            comments: [],
            totalPages: 1,
            currentPage: 1,
            tags: [],
            rateId: 1,
          ),
        );

        await tester.pumpWidget(makeTestableWidget());
        await tester.pumpAndSettle();

        expect(find.text('Phở Bò'), findsOneWidget);
        expect(find.text('Ngon tuyệt vời'), findsOneWidget);
        expect(find.text('350 kcal'), findsOneWidget);
        expect(find.byType(RatingBar), findsOneWidget);
      });
    });

    testWidgets('Gửi comment thành công khi nhập text và nhấn nút Send', (
      tester,
    ) async {
      await mockNetworkImagesFor(() async {
        tester.view.physicalSize = const Size(1080, 3000);
        tester.view.devicePixelRatio = 1.0;

        when(() => mockBloc.state).thenReturn(
          FoodDetailSuccess(
            food: mockFood,
            averRating: 4.0,
            userRating: 5,
            comments: [],
            totalPages: 1,
            currentPage: 1,
            tags: [],
            rateId: 1,
          ),
        );

        await tester.pumpWidget(makeTestableWidget());
        await tester.pumpAndSettle();

        final scrollFinder = find.byType(SingleChildScrollView);
        await tester.drag(scrollFinder, const Offset(0, -2000));
        await tester.pump();

        final commentInput = find.byType(TextField);
        await tester.enterText(commentInput, 'Món này quá ngon!');
        await tester.pump();

        final sendButton = find.byIcon(Icons.send);
        await tester.tap(sendButton);
        await tester.pump();

        verify(() => mockBloc.add(any(that: isA<PostComment>()))).called(1);

        addTearDown(tester.view.resetPhysicalSize);
      });
    });

    testWidgets('Gọi sự kiện PostRating khi tương tác với RatingBar', (
      tester,
    ) async {
      await mockNetworkImagesFor(() async {
        when(() => mockBloc.state).thenReturn(
          FoodDetailSuccess(
            food: mockFood,
            averRating: 4.0,
            userRating: null,
            comments: [],
            totalPages: 1,
            currentPage: 1,
            tags: [],
            rateId: 1,
          ),
        );

        await tester.pumpWidget(makeTestableWidget());
        await tester.pumpAndSettle();

        await tester.tap(find.byType(RatingBar));
        await tester.pump();

        verify(() => mockBloc.add(any(that: isA<PostRating>()))).called(1);
      });
    });

    testWidgets('Hiển thị text thông báo khi không có comment', (tester) async {
      await mockNetworkImagesFor(() async {
        when(() => mockBloc.state).thenReturn(
          FoodDetailSuccess(
            food: mockFood,
            averRating: 4.0,
            userRating: 5,
            comments: [],
            totalPages: 1,
            currentPage: 1,
            tags: [],
            rateId: 1,
          ),
        );

        await tester.pumpWidget(makeTestableWidget());
        await tester.pump();

        expect(find.text("Don't have any comments"), findsOneWidget);
      });
    });

    testWidgets('Hiển thị thông báo lỗi khi tải dữ liệu thất bại', (
      tester,
    ) async {
      await mockNetworkImagesFor(() async {
        when(() => mockBloc.state).thenReturn(FoodDetailFailure("Lỗi máy chủ"));

        await tester.pumpWidget(makeTestableWidget());
        await tester.pump();

        expect(find.text("Lỗi máy chủ"), findsOneWidget);
      });
    });
  });
}
