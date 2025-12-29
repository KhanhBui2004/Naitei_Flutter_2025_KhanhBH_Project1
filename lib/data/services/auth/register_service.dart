import 'dart:async';
import 'package:dio/dio.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/network/api_client.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/constant.dart';

class RegisterService {
  final Dio _dio;
  RegisterService({Dio? dio}) : _dio = dio ?? ApiClient.dio;

  Future<Map<String, dynamic>> register(
    String firstName,
    String lastName,
    String username,
    String password,
    String email,
  ) async {
    try {
      final response = await _dio.post(
        ApiEndPoint.register,
        data: {
          'first_name': firstName,
          'last_name': lastName,
          'username': username,
          'password': password,
          'email': email,
        },
      );
      final data = response.data;
      return {'code': data['code'], 'message': data['message']};
    } on DioException catch (e) {
      throw Exception("Lỗi đăng ký tài khoản: ${e.message}");
    }
  }
}
