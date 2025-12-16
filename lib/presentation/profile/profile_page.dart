import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/profile/profile_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/profile/profile_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/profile/profile_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/appNavBar.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/constant.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/helper.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/service/profile/profile_service.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  String _accessToken = '';
  String _refreshToken = '';
  String _firstName = '';
  String _lastName = '';
  String _username = '';
  String _email = '';
  String _avt = '';
  late int _id;
  bool _isLoading = true;

  ProfileService profile = ProfileService();

  final TextEditingController _firstNameController = TextEditingController();
  final TextEditingController _lastNameController = TextEditingController();
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _cfpasswordController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final prefs = await SharedPreferences.getInstance();
    _accessToken = prefs.getString('token')!;
    _refreshToken = prefs.getString('refreshToken')!;
    _id = prefs.getInt('userId')!;
    _firstName = prefs.getString('firstname')!;
    _lastName = prefs.getString('lastname')!;
    _username = prefs.getString('username')!;
    _email = prefs.getString('email')!;
    _avt = prefs.getString('avt')!;
    setState(() {
      _isLoading = false;
      _firstNameController.text = _firstName;
      _lastNameController.text = _lastName;
      _usernameController.text = _username;
      _emailController.text = _email;
    });
  }

  Future<void> _blocPatchProfile(BuildContext context) async {
    final username = _usernameController.text.trim();
    final password = _passwordController.text.trim();
    final cfpassword = _cfpasswordController.text.trim();
    final firstName = _firstNameController.text.trim();
    final lastName = _lastNameController.text.trim();
    final email = _emailController.text.trim();
    final avtUrl = '';
    context.read<ProfileBloc>().add(
      PatchProfile(
        firstName: firstName,
        lastName: lastName,
        username: username,
        password: password,
        cfpassword: cfpassword,
        email: email,
        avtUrl: avtUrl,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      body: SafeArea(
        child: BlocListener<ProfileBloc, ProfileState>(
          listener: (BuildContext context, state) {
            (switch (state) {
              ProfileInitial() => Container(),
              ProfileInProgress() => showDialog(
                context: context,
                builder: (_) =>
                    const Center(child: CircularProgressIndicator()),
              ),
              PatchProfileSuccess() => {
                Navigator.pop(context),
                _passwordController.clear(),
                _cfpasswordController.clear(),
                _loadUser(),
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(state.message),
                    backgroundColor: Colors.green,
                    behavior: SnackBarBehavior.floating,
                  ),
                ),
              },
              PatchProfileFailure() => {
                Navigator.pop(context),
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(state.message),
                    backgroundColor: Colors.red,
                    behavior: SnackBarBehavior.floating,
                  ),
                ),
              },
            });
          },
          child: SizedBox(
            height: Helper.getScreenHeight(context),
            width: Helper.getScreenWidth(context),
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: Column(
                  children: [
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          "Thông tin",
                          style: Helper.getTheme(context).headlineMedium,
                        ),
                        SizedBox(width: 10),
                      ],
                    ),
                    SizedBox(height: 20),
                    ClipOval(
                      child: Stack(
                        children: [
                          SizedBox(
                            height: 80,
                            width: 80,
                            child: _avt.isNotEmpty
                                ? Image.network(_avt, fit: BoxFit.cover)
                                : const Icon(
                                    Icons.person,
                                    color: Colors.grey,
                                    size: 25,
                                  ),
                          ),
                          Positioned(
                            bottom: 0,
                            child: Container(
                              height: 20,
                              width: 80,
                              color: Colors.black.withOpacity(0.3),
                              child: Icon(Icons.camera_alt_outlined, size: 15),
                            ),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.edit, color: Colors.green),
                        SizedBox(width: 5),
                        Text(
                          "Sửa thông tin",
                          style: TextStyle(color: Colors.green),
                        ),
                      ],
                    ),
                    SizedBox(height: 10),
                    Text(
                      "Xin chào $_firstName!",
                      style: Helper.getTheme(
                        context,
                      ).headlineLarge?.copyWith(color: AppColors.primary),
                    ),
                    SizedBox(height: 40),
                    CustomFormImput(
                      label: "First Name",
                      controller: _firstNameController,
                    ),
                    SizedBox(height: 20),
                    CustomFormImput(
                      label: "Last Name",
                      controller: _lastNameController,
                    ),
                    SizedBox(height: 20),
                    CustomFormImput(
                      label: "Username",
                      controller: _usernameController,
                    ),
                    SizedBox(height: 20),
                    CustomFormImput(
                      label: "Email",
                      controller: _emailController,
                    ),
                    SizedBox(height: 20),
                    CustomFormImput(
                      label: "Password",
                      isPassword: true,
                      controller: _passwordController,
                    ),
                    SizedBox(height: 20),
                    CustomFormImput(
                      label: "Confirm password",
                      isPassword: true,
                      controller: _cfpasswordController,
                    ),
                    SizedBox(height: 20),
                    SizedBox(
                      height: 50,
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => _blocPatchProfile(context),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                        ),
                        child: const Text(
                          "Save",
                          style: TextStyle(
                            color: Colors.black,
                            fontWeight: FontWeight.bold,
                            fontSize: 20,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
      bottomNavigationBar: AppNavbar(selectedIndex: 2),
    );
  }
}

class CustomFormImput extends StatelessWidget {
  const CustomFormImput({
    super.key,
    required String label,
    this.controller,
    bool isPassword = false,
  }) : _label = label,
       _isPassword = isPassword;

  final String _label;
  final bool _isPassword;
  final TextEditingController? controller;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 50,
      padding: const EdgeInsets.only(left: 40),
      decoration: ShapeDecoration(
        shape: StadiumBorder(),
        color: AppColors.placeholderBg,
      ),
      child: TextFormField(
        controller: controller,
        decoration: InputDecoration(
          border: InputBorder.none,
          labelText: _label,
          contentPadding: const EdgeInsets.only(top: 10, bottom: 10),
        ),
        obscureText: _isPassword,
        // initialValue: _value,
        style: TextStyle(fontSize: 14),
      ),
    );
  }
}
