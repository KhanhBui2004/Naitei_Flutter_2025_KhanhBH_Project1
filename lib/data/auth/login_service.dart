import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/user_model.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/network/api_client.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/constant.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LoginService {
  final Dio _dio = ApiClient.dio;
  Future<Map<String, dynamic>> login(String username, String password) async {
    final prefs = await SharedPreferences.getInstance();
    try {
      final response = await _dio.post(
        ApiEndPoint.login,
        data: {'username': username, 'password': password},
      );

      try {
        final data = response.data['data'] ?? '';
        if (response.data['code'] == 200) {
          await prefs.setString('token', data['token']);
          await prefs.setString('refreshToken', data['refreshToken']);
          await prefs.setInt('userId', data['id']);
          await prefs.setString('nameUser', data['first_name']);

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
        }

        return {
          'code': response.data['code'],
          'message': response.data['message'],
          'data': response.data['data'],
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
