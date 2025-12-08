import 'dart:async';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/user_model.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/constant.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LoginService {
  final Dio _dio = Dio();
  Future<Map<String, dynamic>> login(String username, String password) async {
    final prefs = await SharedPreferences.getInstance();
    try {
      final response = await _dio.post(
        ApiEndPoint.login,
        data: {'username': username, 'password': password},
      );

      print(response.data);

      try {
        final data = response.data['data'] ?? false;
        await prefs.setString('token', data['token']);
        await prefs.setString('refreshToken', data['refreshToken']);

        final user = User.fromJson({
          'accessToken': data['token'] ?? '',
          'refreshToken': data['refreshToken'] ?? '',
          'id': data['id']?.toString() ?? '',
          'username': data['username'] ?? '',
          'email': data['email'] ?? '',
          'firstName': data['first_name'] ?? '',
          'lastName': data['last_name'] ?? '',
          'gender': data['role'] ?? '',
          'image': data['avatar_url'] ?? '',
        });

        return {
          'code': response.data['code'],
          'message': response.data['message'],
          'data': user,
        };
      } catch (e) {
        debugPrint('Login reply error: $e');
        debugPrint('Response detail: ${response.data}');
        rethrow;
      }
    } on DioException catch (e) {
      throw Exception('Login Error: ${e.message}');
    } catch (e) {
      throw Exception('Login Information Error: ${e.toString()}');
    }
  }
}
