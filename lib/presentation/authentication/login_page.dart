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
  State<StatefulWidget> createState() {
    return _LoginPageState();
  }
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
      body: BlocListener<AuthBloc, AuthState>(
        listener: (BuildContext context, state) {
          (switch (state) {
            AuthInitial() => Container(),
            AuthLoginInProgress() => showDialog(
              context: context,
              barrierDismissible: false,
              builder: (_) => const Center(child: CircularProgressIndicator()),
            ),
            AuthLoginSuccess() => {
              if (Navigator.canPop(context)) {Navigator.pop(context)},
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.message),
                  backgroundColor: Colors.green,
                  behavior: SnackBarBehavior.floating,
                ),
              ),
              Navigator.pushReplacementNamed(context, AppRoutes.home),
            },
            AuthLoginFailure() => {
              Navigator.pop(context),
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.message),
                  backgroundColor: Colors.red,
                  behavior: SnackBarBehavior.floating,
                ),
              ),
            },
            _ => Container(),
          });
        },

        child: SizedBox(
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
                const SizedBox(height: 10),
                Padding(
                  padding: EdgeInsets.only(
                    right: MediaQuery.of(context).size.width * 0.1,
                  ),
                  child: Align(
                    alignment: Alignment.centerRight,
                    child: GestureDetector(
                      onTap: () => debugPrint('Forgot password'),
                      child: Text(
                        'Forgot Password?',
                        style: TextStyle(
                          color: AppColors.greend,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ),
                const Spacer(),
                SizedBox(
                  height: 50,
                  width: MediaQuery.of(context).size.width * 0.7,
                  child: ElevatedButton(
                    // onPressed: () => _handleLogin(),
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text("You don't have an account? "),
                    GestureDetector(
                      onTap: () => Navigator.of(
                        context,
                      ).pushReplacementNamed(AppRoutes.register),
                      child: Text(
                        'Register',
                        style: TextStyle(
                          color: AppColors.greend,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const Spacer(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
