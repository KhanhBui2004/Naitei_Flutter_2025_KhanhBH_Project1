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
  static const login = '/auth/login';
  static const register = '/auth/register';
  static const tag = "/tag";
  static const food = "/food";
  static const fgPW = "/auth/forgot-password";
  static const rsPW = "/auth/reset-password";
  static const refresh = "/refresh";
  static const verifyOTP = "/verify-otp";
  static const rating = "/rating";
  static const comment = "/comment";
  static const profile = "/user";
  static const favorite = "/food/favorite";
  static const myfood = "/food/user";
  static const countrate = "/rating/food/count";
  static const foodtag = "/foodTag";
}
