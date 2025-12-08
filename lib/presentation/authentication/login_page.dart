import 'package:flutter/material.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/auth/login_service.dart';
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

  final _loginService = LoginService();

  bool _isLoading = false;

  Future<void> _handleLogin() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final response = await _loginService.login(
        _usernameControler.text.trim(),
        _passwordControler.text.trim(),
      );
      // if (user.id.isNotEmpty && user.username.isNotEmpty) {
      // if (mounted) {
      //   Navigator.of(context).pushReplacementNamed(AppRoutes.home);
      // }
      // debugPrint(message.to);
      if (response['code'] == 200) {
        debugPrint("User login thành công: ${response['message']}");
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Sai tài khoản hoặc mật khẩu")),
        );
      }
    } catch (e) {
      // Nếu login thất bại → hiển thị thông báo
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Đăng nhập thất bại: $e")));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SizedBox(
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
                  onPressed: () => _handleLogin(),
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
                    onTap: () =>
                        Navigator.of(context).pushNamed(AppRoutes.register),
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
    );
  }
}
