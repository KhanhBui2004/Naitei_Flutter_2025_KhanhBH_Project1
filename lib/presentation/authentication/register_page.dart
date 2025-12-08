import 'package:flutter/material.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/auth/register_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/textInput.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/constant.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/helper.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/routes/app_routes.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<StatefulWidget> createState() => _RegisterState();
}

class _RegisterState extends State<RegisterPage> {
  final TextEditingController _firstNameController = TextEditingController();
  final TextEditingController _lastNameController = TextEditingController();
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _cfpasswordController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();

  bool _isloading = false;

  final _register = RegisterService();

  Future<void> _handleRegister() async {
    final username = _usernameController.text.trim();
    final password = _passwordController.text.trim();
    final cfpassword = _cfpasswordController.text.trim();
    final firstName = _firstNameController.text.trim();
    final lastName = _lastNameController.text.trim();
    final email = _emailController.text.trim();

    if (username.isEmpty ||
        password.isEmpty ||
        cfpassword.isEmpty ||
        firstName.isEmpty ||
        lastName.isEmpty ||
        email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Hãy điền đầy đủ các thông tin!")),
      );
      return;
    }

    final usernameRegex = RegExp(r'^[a-zA-Z][a-zA-Z0-9]*$');
    if (!usernameRegex.hasMatch(username)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            "Username phải bắt đầu bằng chữ, không chứa khoảng trắng hoặc ký tự đặc biệt!",
          ),
        ),
      );
      return;
    }

    if (_passwordController.text != _cfpasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Mật khẩu và Xác nhận mật khẩu không khớp!"),
        ),
      );
      return;
    }

    if (email.isEmpty ||
        !RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email)) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Email không hợp lệ!")));
      return;
    }

    setState(() {
      _isloading = true;
    });

    try {
      await _register.register(firstName, lastName, username, password, email);
      if (!mounted) return;

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Đăng ký thành công!")));

      Navigator.pushReplacementNamed(context, AppRoutes.login);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Đăng ký thất bại: $e")));
    } finally {
      setState(() {
        _isloading = false;
      });
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
                'Sign Up',
                style: Helper.getTheme(context).headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  fontSize: 35,
                ),
              ),
              const Spacer(),
              TextInput(
                hintText: 'First Name',
                controller: _firstNameController,
              ),
              const Spacer(),
              TextInput(hintText: 'Last Name', controller: _lastNameController),
              const Spacer(),
              TextInput(hintText: 'Username', controller: _usernameController),
              const Spacer(),
              TextInput(hintText: 'Password', controller: _passwordController),
              const Spacer(),
              TextInput(
                hintText: 'Confirm Password',
                controller: _cfpasswordController,
              ),
              const Spacer(),
              TextInput(hintText: 'Email', controller: _emailController),
              const Spacer(),
              SizedBox(
                height: 50,
                width: MediaQuery.of(context).size.width * 0.7,
                child: ElevatedButton(
                  onPressed: () => _handleRegister(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.greend,
                  ),
                  child: const Text(
                    "Sign up",
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
                  Text("You had an account? "),
                  GestureDetector(
                    onTap: () =>
                        Navigator.of(context).pushNamed(AppRoutes.login),
                    child: Text(
                      'Login',
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
