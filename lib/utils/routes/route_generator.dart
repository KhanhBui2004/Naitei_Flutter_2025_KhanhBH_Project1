import 'package:flutter/material.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/authentication/login_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/authentication/register_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/camera/camera_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/detail/detail_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/favorite/favorite_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/home/home_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/profile/profile_page.dart';
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
