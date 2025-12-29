import 'package:dio/dio.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/network/api_client.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/constant.dart';

class ProfileService {
  final Dio _dio;
  ProfileService({Dio? dio}) : _dio = dio ?? ApiClient.dio;
  Future<Map<String, dynamic>> patchProfile(
    String firstName,
    String lastName,
    String username,
    String password,
    String email,
    String avtUrl,
  ) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      final userId = prefs.getInt("userId");

      final datarq = {
        'first_name': firstName,
        'last_name': lastName,
        'username': username,
        'email': email,
        'avatar_url': avtUrl,
        'role': "USER",
      };

      if (password.isNotEmpty) {
        datarq['password'] = password;
      }
      final response = await _dio.patch(
        "${ApiEndPoint.profile}/$userId",
        data: datarq,
        options: Options(headers: {"Authorization": "Bearer $token"}),
      );
      final data = response.data;

      if (data['code'] == 200) {
        await prefs.setString('firstname', firstName);
        await prefs.setString('lastname', lastName);
        await prefs.setString('username', username);
        await prefs.setString('email', email);
        await prefs.setString('avt', avtUrl);
      }

      return {'code': data['code'], 'message': data['message']};
    } on DioException catch (e) {
      throw Exception("Patch profile Error: ${e.message}");
    }
  }
}
