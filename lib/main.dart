import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/auth/login/login_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/auth/login/login_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/auth/login/login_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/auth/register/register_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/profile/profile_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/service/auth/login_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/service/auth/register_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/service/food/food_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/service/profile/profile_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/authentication/login_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/home/home_page.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/navigator_global.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/routes/app_routes.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/routes/route_generator.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiRepositoryProvider(
      providers: [
        RepositoryProvider<LoginService>(create: (_) => LoginService()),
        RepositoryProvider<RegisterService>(create: (_) => RegisterService()),
        RepositoryProvider<ProfileService>(create: (_) => ProfileService()),
        RepositoryProvider<FoodService>(create: (_) => FoodService()),
      ],
      child: MultiBlocProvider(
        providers: [
          BlocProvider<AuthBloc>(
            create: (context) =>
                AuthBloc(context.read<LoginService>())
                  ..add(AuthenticateStarted()),
          ),
          BlocProvider<RegisterBloc>(
            create: (context) => RegisterBloc(context.read<RegisterService>()),
          ),
          BlocProvider<ProfileBloc>(
            create: (context) => ProfileBloc(context.read<ProfileService>()),
          ),
          BlocProvider<FoodBloc>(
            create: (context) => FoodBloc(context.read<FoodService>()),
          ),
        ],
        child: BlocBuilder<AuthBloc, AuthState>(
          builder: (BuildContext context, AuthState state) {
            return MaterialApp(
              initialRoute: AppRoutes.login,
              onGenerateRoute: RouteGenerator.generateRoute,
              navigatorKey: navigatorKey,
              // home: _buildHomeByState(state),
            );
          },
        ),
      ),
    );
  }

  Widget _buildHomeByState(AuthState state) {
    if (state is AuthenticateSuccess) return const HomePage();
    if (state is AuthenticateFailure) return const LoginPage();
    return const Scaffold(body: Center(child: CircularProgressIndicator()));
  }
}
