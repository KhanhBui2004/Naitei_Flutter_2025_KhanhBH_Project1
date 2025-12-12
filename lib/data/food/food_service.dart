import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/food_model.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/network/api_client.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/constant.dart';

class FoodService {
  final Dio _dio = ApiClient.dio;

  Future<Map<String, dynamic>> getFoods({
    int page = 1,
    int limit = 20,
    String? query,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString("token");

      final response = await _dio.get(
        ApiEndPoint.food,
        queryParameters: {
          "limit": limit,
          "page": page,
          if (query != null && query.isNotEmpty) "keyWord": query,
        },
        options: Options(headers: {"Authorization": "Bearer $token"}),
      );

      final data = response.data;
      final List<Food> foods = (data['data'] as List)
          .map((json) => Food.fromJson(json))
          .toList();

      // Lấy tổng số trang từ pagination
      final int totalPages = data['pagination']?['totalPages'] ?? 1;

      return {"foods": foods, "totalPages": totalPages};
    } catch (e) {
      throw Exception("Lỗi tải danh sách món ăn: $e");
    }
  }

  Future<Map<String, dynamic>> getFavoriteFoods({
    int page = 1,
    String? query,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString("token");
      final userId = prefs.getInt("userId");

      final response = await _dio.get(
        ApiEndPoint.favorite,
        queryParameters: {
          "userID": userId,
          "page": page,
          "limit": 10,
          "keyWord": query,
        },
        options: Options(headers: {"Authorization": "Bearer $token"}),
      );

      final data = response.data;

      final List<Food> favorfoods = (data['data'] as List)
          .map((json) => Food.fromJson(json))
          .toList();
      final int totalPages = data['pagination']?['totalPages'] ?? 1;

      return {
        'data': favorfoods,
        'message': data['message'],
        'totalPages': totalPages,
      };
    } catch (e) {
      throw Exception("Lỗi khi tải danh sách món ăn yêu thích: $e");
    }
  }

  Future<Map<String, dynamic>> postFood({
    required int id,
    required String dishName,
    required String description,
    required String dishType,
    required String servingSize,
    required String cookingTime,
    required String ingredients,
    required String cookingMethod,
    required int calories,
    required int fat,
    required int fiber,
    required int sugar,
    required int protein,
    required String imageLink,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString("token");

      final data = {
        "dish_name": dishName,
        "description": description,
        "dish_type": dishType,
        "serving_size": servingSize,
        "cooking_time": cookingTime,
        "ingredients": ingredients,
        "cooking_method": cookingMethod,
        "calories": calories,
        "fat": fat,
        "fiber": fiber,
        "sugar": sugar,
        "protein": protein,
        "image_link": imageLink,
      };

      final response = await _dio.post(
        ApiEndPoint.food,
        data: data,
        options: Options(headers: {"Authorization": "Bearer $token"}),
      );

      final resData = response.data;
      return {
        "code": resData['code'] ?? 200,
        "message": resData['message'] ?? "Thêm món ăn thành công",
      };
    } on DioException catch (e) {
      debugPrint("❌ Lỗi postFood: ${e.response?.data ?? e.message}");
      throw Exception("Lỗi thêm món ăn: ${e.response?.data ?? e.message}");
    }
  }

  Future<Map<String, dynamic>> getMyFood({
    required int userId,
    int limit = 10,
    int page = 1,
    String? query,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString("token");

      final response = await _dio.get(
        ApiEndPoint.myfood,
        queryParameters: {
          "userID": userId,
          "limit": limit,
          "page": page,
          "keyWord": query,
        },
        options: Options(headers: {"Authorization": "Bearer $token"}),
      );

      final data = response.data;
      debugPrint("get my foods: $data");

      final List<Food> myfoods = (data['data'] as List)
          .map((json) => Food.fromJson(json))
          .toList();
      final int totalPages = data['pagination']?['totalPages'] ?? 1;

      return {
        'data': myfoods,
        'message': data['message'],
        'totalPages': totalPages,
      };
    } on DioException catch (e) {
      debugPrint("Lỗi getMyFood: ${e.response?.data ?? e.message}");
      throw Exception(
        "Lỗi lấy món ăn của tôi: ${e.response?.data ?? e.message}",
      );
    }
  }
}
