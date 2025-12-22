import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/auth/login/login_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/auth/login/login_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/auth/login/login_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/helper.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/textInput.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/constant.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/routes/app_routes.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _usernameControler = TextEditingController();
  final _passwordControler = TextEditingController();

  void _blocLogin(BuildContext context) {
    context.read<AuthBloc>().add(
      AuthLoginStarted(
        username: _usernameControler.text,
        password: _passwordControler.text,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocConsumer<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is AuthLoginFailure) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.red,
                behavior: SnackBarBehavior.floating,
              ),
            );
          }

          if (state is AuthLoginSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.green,
                behavior: SnackBarBehavior.floating,
              ),
            );
            Navigator.pushReplacementNamed(context, AppRoutes.home);
          }
        },
        builder: (context, state) {
          final isLoading = state is AuthLoginInProgress;

          return Stack(
            children: [
              _buildLoginForm(context),

              if (isLoading)
                Container(
                  color: Colors.black.withOpacity(0.3),
                  child: const Center(child: CircularProgressIndicator()),
                ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildLoginForm(BuildContext context) {
    return SizedBox(
      height: Helper.getScreenHeight(context),
      width: Helper.getScreenWidth(context),
      child: SafeArea(
        child: Column(
          children: [
            const Spacer(),
            Text(
              'Login',
              style: Helper.getTheme(context).headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                fontSize: 35,
              ),
            ),
            const Spacer(),
            TextInput(controller: _usernameControler, hintText: 'Username'),
            const Spacer(),
            TextInput(
              hintText: 'Password',
              controller: _passwordControler,
              obscureText: true,
            ),
            const Spacer(),
            SizedBox(
              height: 50,
              width: MediaQuery.of(context).size.width * 0.7,
              child: ElevatedButton(
                onPressed: () => _blocLogin(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.greend,
                ),
                child: const Text(
                  "Login",
                  style: TextStyle(
                    color: Colors.black,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const Spacer(),
          ],
        ),
      ),
    );
  }
}
