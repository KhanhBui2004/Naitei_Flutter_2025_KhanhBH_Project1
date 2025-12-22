import 'package:flutter/material.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/authentication/login_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/authentication/register_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/camera/camera_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/detail/detail_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/favorite/favorite_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/home/allFood_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/home/allMyFood_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/home/home_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/profile/profile_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/tag/allTag_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/tag/foodTag_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/routes/app_routes.dart';

class RouteGenerator {
  static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case AppRoutes.login:
        return _animatedRoute(const LoginPage());
      case AppRoutes.register:
        return _animatedRoute(const RegisterPage());
      case AppRoutes.home:
        return MaterialPageRoute(builder: (_) => const HomePage());
      case AppRoutes.camera:
        return MaterialPageRoute(builder: (_) => const CameraPage());
      case AppRoutes.fav:
        return MaterialPageRoute(builder: (_) => const FavoritePage());
      case AppRoutes.profile:
        return MaterialPageRoute(builder: (_) => const ProfilePage());
      case AppRoutes.allTag:
        return MaterialPageRoute(builder: (_) => const AllTagsPage());
      case AppRoutes.allFood:
        return MaterialPageRoute(builder: (_) => const AllfoodPage());
      case AppRoutes.allmyFood:
        return MaterialPageRoute(builder: (_) => const AllmyfoodPage());
      case AppRoutes.foodsoftag:
        final args = settings.arguments;

        if (args == null || args is! Map<String, dynamic>) {
          return MaterialPageRoute(
            builder: (_) => const Scaffold(
              body: Center(child: Text('Missing tag arguments')),
            ),
          );
        }

        return MaterialPageRoute(
          builder: (_) => FoodsTagPage(
            tagId: args['id'] as int,
            tagName: args['name'] as String,
          ),
        );
      case AppRoutes.detail:
        final id = settings.arguments as String;
        return MaterialPageRoute(builder: (_) => FoodDetailScreen(foodId: id));
      default:
        return MaterialPageRoute(
          builder: (_) => const Scaffold(body: Text('Page not found!')),
        );
    }
  }

  static PageRouteBuilder _animatedRoute(Widget page) {
    return PageRouteBuilder(
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (_, animation, _) => page,
      transitionsBuilder: (_, animation, _, child) {
        final slide = Tween(
          begin: const Offset(0.1, 0),
          end: Offset.zero,
        ).animate(animation);

        return SlideTransition(
          position: slide,
          child: FadeTransition(opacity: animation, child: child),
        );
      },
    );
  }
}
