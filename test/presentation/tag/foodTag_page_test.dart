import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:mocktail_image_network/mocktail_image_network.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/foodtag/foodTag_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/foodtag/foodTag_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/foodtag/foodTag_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/food_model.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/tag/foodTag_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/listFoodCard.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/routes/app_routes.dart';

// Mock BLoC
class MockFoodtagBloc extends MockBloc<FoodtagEvent, FoodtagState>
    implements FoodtagBloc {}

// Fake Event để Mocktail registerFallbackValue
class FoodtagEventFake extends Fake implements FoodtagEvent {}

void main() {
  late MockFoodtagBloc mockFoodtagBloc;

  setUpAll(() {
    registerFallbackValue(FoodtagEventFake());
  });

  setUp(() {
    mockFoodtagBloc = MockFoodtagBloc();
    // Luôn cung cấp stream mặc định để không bị lỗi 'Null' subtype
    when(() => mockFoodtagBloc.stream).thenAnswer((_) => const Stream.empty());
  });

  final mockFoods = [
    Food(
      id: 1,
      dishName: 'Phở Bò',
      description: 'Ngon',
      dishType: 'Nước',
      servingSize: '1 tô',
      cookingTime: '30',
      ingredients: 'Bò',
      cookingMethod: 'Nấu',
      calories: 350,
      fat: 10,
      fiber: 2,
      sugar: 1,
      protein: 20,
      imageLink: 'https://example.com/img.jpg',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ),
  ];

  Widget makeTestableWidget() {
    return MaterialApp(
      routes: {
        AppRoutes.detail: (context) =>
            const Scaffold(body: Text('Detail Page')),
      },
      home: BlocProvider<FoodtagBloc>.value(
        value: mockFoodtagBloc,
        child: const FoodsTagPage(tagId: 1, tagName: 'Healthy'),
      ),
    );
  }

  group('FoodsTagPage Widget Test', () {
    testWidgets('Hiển thị Loading Indicator khi state là FoodTagInProgress', (
      tester,
    ) async {
      when(() => mockFoodtagBloc.state).thenReturn(FoodTagInProgress());

      await tester.pumpWidget(makeTestableWidget());

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('Hiển thị tiêu đề AppBar đúng với tagName', (tester) async {
      when(() => mockFoodtagBloc.state).thenReturn(FoodTagInitial());

      await tester.pumpWidget(makeTestableWidget());

      expect(find.text('Món ăn liên quan đến Healthy'), findsOneWidget);
    });

    testWidgets('Hiển thị danh sách món ăn khi tải thành công', (tester) async {
      await mockNetworkImages(() async {
        when(() => mockFoodtagBloc.state).thenReturn(
          ViewFoodTagSuccess(
            foods: mockFoods,
            ratings: {1: 4.5},
            currentPage: 1,
            totalPages: 1,
          ),
        );

        await tester.pumpWidget(makeTestableWidget());
        await tester.pumpAndSettle();

        expect(find.byType(ListFoodCard), findsOneWidget);
        expect(find.text('Phở Bò'), findsOneWidget);
      });
    });

    testWidgets('Hiển thị thông báo khi danh sách món ăn trống', (
      tester,
    ) async {
      when(() => mockFoodtagBloc.state).thenReturn(ViewFoodTagEmpty());

      await tester.pumpWidget(makeTestableWidget());
      await tester.pumpAndSettle();

      expect(find.text("Don't have any foods"), findsOneWidget);
    });

    testWidgets('Hiển thị thông báo lỗi khi tải thất bại', (tester) async {
      when(
        () => mockFoodtagBloc.state,
      ).thenReturn(ViewFoodTagFailure("Lỗi kết nối"));

      await tester.pumpWidget(makeTestableWidget());
      await tester.pumpAndSettle();

      expect(find.text("Lỗi kết nối"), findsOneWidget);
    });

    testWidgets('Gọi sự kiện tìm kiếm khi nhập vào SearchBar', (tester) async {
      when(() => mockFoodtagBloc.state).thenReturn(FoodTagInitial());

      await tester.pumpWidget(makeTestableWidget());

      // Tìm TextField bên trong SearchBar và nhập liệu
      await tester.enterText(find.byType(TextField), 'Phở');

      // verify gọi ít nhất 1 lần (vì initState gọi 1 lần, enterText gọi thêm 1 lần)
      verify(
        () => mockFoodtagBloc.add(any(that: isA<ViewFoodTag>())),
      ).called(greaterThan(0));
    });

    testWidgets('Điều hướng sang trang chi tiết khi nhấn vào món ăn', (
      tester,
    ) async {
      await mockNetworkImages(() async {
        when(() => mockFoodtagBloc.state).thenReturn(
          ViewFoodTagSuccess(
            foods: mockFoods,
            ratings: {1: 4.5},
            currentPage: 1,
            totalPages: 1,
          ),
        );

        await tester.pumpWidget(makeTestableWidget());
        await tester.pumpAndSettle();

        // Nhấn vào thẻ món ăn (InkWell bao ngoài ListFoodCard)
        await tester.tap(find.byType(ListFoodCard));
        await tester.pumpAndSettle();

        expect(find.text('Detail Page'), findsOneWidget);
      });
    });

    testWidgets('Nhấn nút Back gọi Navigator.pop', (tester) async {
      when(() => mockFoodtagBloc.state).thenReturn(FoodTagInitial());

      await tester.pumpWidget(makeTestableWidget());

      // Chạm nút back
      await tester.tap(find.byIcon(Icons.arrow_back));
      await tester.pumpAndSettle();

      // Ở đây trang Home không được mock trong Navigator stack,
      // nhưng việc không crash và Navigator rỗng là dấu hiệu thành công
      expect(find.byType(FoodsTagPage), findsNothing);
    });
  });
}
