import 'dart:async';
import 'package:dio/dio.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/comment_model.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/service/network/api_client.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/constant.dart';
import 'package:shared_preferences/shared_preferences.dart';

class CommentService {
  final Dio _dio = ApiClient.dio;

  Future<Map<String, dynamic>> postComment(
    int userId,
    int foodId,
    String content,
  ) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      final response = await _dio.post(
        ApiEndPoint.comment,
        data: {'user_id': userId, 'food_id': foodId, 'content': content},
        options: Options(headers: {"Authorization": "Bearer $token"}),
      );
      final data = response.data;

      return {'code': data['code'], 'message': data['message']};
    } on DioException catch (e) {
      throw Exception("Lỗi comment: ${e.message}");
    }
  }

  Future<Map<String, dynamic>> getFoodComment({
    required int foodId,
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      final response = await _dio.get(
        "${ApiEndPoint.comment}/food",
        queryParameters: {'foodID': foodId, 'limit': limit, 'page': page},
        options: Options(headers: {"Authorization": "Bearer $token"}),
      );

      // print('Response data: ${response.data}');

      // ✅ kiểm tra code trả về từ server
      if (response.data['code'] != 200 || response.data['data'] == null) {
        return {"comments": <Comment>[], "totalPages": 1};
      }

      final List<Comment> commentList = (response.data['data'] as List)
          .map((json) => Comment.fromJson(json))
          .toList();

      final int totalPages = response.data['pagination']?['totalPages'] ?? 1;

      return {"comments": commentList, "totalPages": totalPages};
    } on DioException catch (e) {
      throw Exception("Lỗi khi gọi API comment: ${e.message}");
    } catch (e) {
      throw Exception("Lỗi không xác định khi lấy comments: $e");
    }
  }
}
