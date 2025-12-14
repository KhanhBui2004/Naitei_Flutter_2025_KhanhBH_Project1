import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/auth/register/register_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/auth/register/register_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/auth/register/register_state.dart';
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

  void _handleRegister(BuildContext context) {
    final username = _usernameController.text.trim();
    final password = _passwordController.text.trim();
    final cfpassword = _cfpasswordController.text.trim();
    final firstName = _firstNameController.text.trim();
    final lastName = _lastNameController.text.trim();
    final email = _emailController.text.trim();

    context.read<RegisterBloc>().add(
      RegisterStarted(
        firstName: firstName,
        lastName: lastName,
        username: username,
        password: password,
        cfpassword: cfpassword,
        email: email,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocListener<RegisterBloc, RegisterState>(
        listener: (BuildContext context, state) {
          (switch (state) {
            RegisterInitial() => Container(),
            RegisterInProgress() => showDialog(
              context: context,
              barrierDismissible: false,
              builder: (_) => const Center(child: CircularProgressIndicator()),
            ),
            RegisterFailure() => {
              Navigator.pop(context),
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.message),
                  backgroundColor: Colors.red,
                  behavior: SnackBarBehavior.floating,
                ),
              ),
            },
            RegisterSuccess() => {
              Navigator.pop(context),
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.message),
                  backgroundColor: Colors.green,
                  behavior: SnackBarBehavior.floating,
                ),
              ),
              Navigator.pushReplacementNamed(context, AppRoutes.login),
            },
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
                TextInput(
                  hintText: 'Last Name',
                  controller: _lastNameController,
                ),
                const Spacer(),
                TextInput(
                  hintText: 'Username',
                  controller: _usernameController,
                ),
                const Spacer(),
                TextInput(
                  hintText: 'Password',
                  controller: _passwordController,
                ),
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
                    onPressed: () => _handleRegister(context),
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
                          Navigator.of(context).pushReplacementNamed(AppRoutes.login),
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
      ),
    );
  }
}
