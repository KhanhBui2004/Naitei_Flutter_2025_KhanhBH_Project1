import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/authentication/login_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/home/home_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/routes/app_routes.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/routes/route_generator.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/detail/detail_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/tag/foodTag_page.dart';

void main() {
  group('RouteGenerator Unit Test', () {
    test('Nên trả về LoginPage khi route name là login', () {
      const settings = RouteSettings(name: AppRoutes.login);
      final route = RouteGenerator.generateRoute(settings);

      expect(route, isA<PageRouteBuilder>());

      final pageRoute = route as PageRouteBuilder;

      final widget = pageRoute.pageBuilder(
        FakeBuildContext(),
        MockAnimation(),
        MockAnimation(),
      );

      expect(widget, isA<LoginPage>());
    });

    test('Nên trả về HomePage khi route name là home', () {
      const settings = RouteSettings(name: AppRoutes.home);
      final route = RouteGenerator.generateRoute(settings);

      expect(route, isA<MaterialPageRoute>());
      final widget = (route as MaterialPageRoute).builder(FakeBuildContext());
      expect(widget, isA<HomePage>());
    });

    test(
      'Nên trả về FoodDetailScreen với foodId đúng khi vào trang Detail',
      () {
        const foodId = 'food_123';
        const settings = RouteSettings(
          name: AppRoutes.detail,
          arguments: foodId,
        );

        final route = RouteGenerator.generateRoute(settings);

        expect(route, isA<MaterialPageRoute>());
        // Kiểm tra xem builder có tạo ra đúng widget mong muốn không
        final widget = (route as MaterialPageRoute).builder(FakeBuildContext());
        expect(widget, isA<FoodDetailScreen>());
        expect((widget as FoodDetailScreen).foodId, foodId);
      },
    );

    test(
      'Nên trả về FoodsTagPage khi truyền đúng Map arguments cho foodsoftag',
      () {
        final args = {'id': 1, 'name': 'Món Cay'};
        final settings = RouteSettings(
          name: AppRoutes.foodsoftag,
          arguments: args,
        );

        final route = RouteGenerator.generateRoute(settings);
        final widget = (route as MaterialPageRoute).builder(FakeBuildContext());

        expect(widget, isA<FoodsTagPage>());
        expect((widget as FoodsTagPage).tagId, 1);
        expect((widget).tagName, 'Món Cay');
      },
    );

    test('Nên trả về trang lỗi khi thiếu arguments cho foodsoftag', () {
      const settings = RouteSettings(
        name: AppRoutes.foodsoftag,
        arguments: null,
      );

      final route = RouteGenerator.generateRoute(settings);
      final widget = (route as MaterialPageRoute).builder(FakeBuildContext());

      expect(findsTextInWidget(widget, 'Missing tag arguments'), isTrue);
    });

    test('Nên trả về trang "Page not found!" khi route name lạ', () {
      const settings = RouteSettings(name: '/unknown_route');

      final route = RouteGenerator.generateRoute(settings);
      final widget = (route as MaterialPageRoute).builder(FakeBuildContext());

      expect(findsTextInWidget(widget, 'Page not found!'), isTrue);
    });
  });
}

class FakeBuildContext extends Fake implements BuildContext {}

bool findsTextInWidget(Widget widget, String text) {
  if (widget is Scaffold) {
    final body = widget.body;
    if (body is Center && body.child is Text) {
      return (body.child as Text).data == text;
    }
    if (body is Text) {
      return body.data == text;
    }
  }
  return false;
}

class MockAnimation extends Fake implements Animation<double> {
  @override
  double get value => 0.0;
}
