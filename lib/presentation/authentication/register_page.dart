import 'package:flutter/material.dart';
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
                  onPressed: () => debugPrint('Sign up'),
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
