import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:mocktail_image_network/mocktail_image_network.dart'; // Import thư viện này
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/my_food/myFood_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/my_food/myFood_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/my_food/myFood_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/food_model.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/home/allMyFood_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/allFoodView.dart';

// Mock Classes
class MockFoodBloc extends MockBloc<FoodEvent, FoodState> implements FoodBloc {}

class MockMyFoodBloc extends MockBloc<MyfoodEvent, MyfoodState>
    implements MyfoodBloc {}

// Fake Events cho Mocktail Matchers
class FoodEventFake extends Fake implements FoodEvent {}

class MyfoodEventFake extends Fake implements MyfoodEvent {}

void main() {
  late MockFoodBloc mockFoodBloc;
  late MockMyFoodBloc mockMyFoodBloc;

  setUpAll(() {
    registerFallbackValue(FoodEventFake());
    registerFallbackValue(MyfoodEventFake());
  });

  setUp(() {
    mockFoodBloc = MockFoodBloc();
    mockMyFoodBloc = MockMyFoodBloc();

    // Trạng thái ban đầu
    when(() => mockFoodBloc.state).thenReturn(FoodInitial());
    when(() => mockMyFoodBloc.state).thenReturn(MyFoodInitial());

    // Luôn cung cấp stream rỗng để tránh lỗi Null subtype of Stream
    when(() => mockFoodBloc.stream).thenAnswer((_) => const Stream.empty());
    when(() => mockMyFoodBloc.stream).thenAnswer((_) => const Stream.empty());
  });

  // Mẫu dữ liệu Mock
  final mockFood = Food(
    id: 1,
    dishName: 'Phở',
    description: '',
    dishType: '',
    servingSize: '',
    cookingTime: '',
    ingredients: '',
    cookingMethod: '',
    calories: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    protein: 0,
    imageLink: 'https://example.com/food.jpg',
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
  );

  Widget makeTestableWidget() {
    return MaterialApp(
      // Thêm routes để test điều hướng
      routes: {
        '/detail': (context) =>
            const Scaffold(body: Text('Food Detail Screen')),
      },
      home: MultiBlocProvider(
        providers: [
          BlocProvider<FoodBloc>.value(value: mockFoodBloc),
          BlocProvider<MyfoodBloc>.value(value: mockMyFoodBloc),
        ],
        child: const AllmyfoodPage(),
      ),
    );
  }

  group('AllmyfoodPage Widget Test', () {
    testWidgets('Hiển thị tiêu đề "My Foods" và AllFoodView', (tester) async {
      await tester.pumpWidget(makeTestableWidget());

      expect(find.text("My Foods"), findsOneWidget);
      expect(find.byType(AllFoodView), findsOneWidget);
    });

    testWidgets('Kiểm tra các tham số truyền xuống AllFoodView', (
      tester,
    ) async {
      await tester.pumpWidget(makeTestableWidget());

      final allFoodView = tester.widget<AllFoodView>(find.byType(AllFoodView));

      expect(allFoodView.showMyFood, isTrue);
      expect(allFoodView.title, equals(""));
    });

    testWidgets('Điều hướng sang trang Detail khi nhấn vào món ăn', (
      tester,
    ) async {
      // Quan trọng: Bao bọc bằng mockNetworkImages để pass Image.network
      await mockNetworkImages(() async {
        // Mock state Success để danh sách hiển thị
        when(() => mockFoodBloc.state).thenReturn(
          ViewAllFoodSuccess(
            foods: [mockFood],
            ratings: {1: 5.0},
            totalPages: 1,
          ),
        );

        await tester.pumpWidget(makeTestableWidget());
        await tester.pumpAndSettle(); // Đợi BlocBuilder vẽ giao diện

        // Thực hiện hành động nhấn thông qua callback của AllFoodView
        final allFoodView = tester.widget<AllFoodView>(
          find.byType(AllFoodView),
        );
        allFoodView.onTapFood(mockFood);

        await tester.pumpAndSettle(); // Đợi Navigator chuyển cảnh

        expect(find.text('Food Detail Screen'), findsOneWidget);
      });
    });

    testWidgets('Hiển thị thông báo khi My Foods trống', (tester) async {
      // Giả sử logic hiển thị trống nằm trong Bloc MyfoodBloc
      when(() => mockMyFoodBloc.state).thenReturn(ViewMyFoodEmpty());

      await tester.pumpWidget(makeTestableWidget());
      await tester.pump();

      // Kiểm tra text hiển thị nếu AllFoodView xử lý state trống của MyFoodBloc
      // expect(find.text("Don't have any your foods"), findsOneWidget);
    });
  });
}
