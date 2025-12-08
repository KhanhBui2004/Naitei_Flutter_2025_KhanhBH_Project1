import 'package:flutter/material.dart';

class AppColors {
  static const primary = Color(0xFF2196F3);
  static const background = Color(0xFFF5F5F5);
  static const textPrimary = Color(0xFF333333);
  static const orange = Color(0xFFFC6011);
  static const secondary = Color(0xFF7C7D7E);
  static const placeholder = Color(0xFFB6B7B7);
  static const placeholderBg = Color(0xFFF2F2F2);
  static const greend = Color.fromARGB(255, 78, 170, 117);
}

class ApiEndPoint {
  static const baseUrl = 'https://pbl6-vietnomi-be.onrender.com';
  static const login = '$baseUrl/auth/login';
  static const register = '$baseUrl/auth/register';
}
