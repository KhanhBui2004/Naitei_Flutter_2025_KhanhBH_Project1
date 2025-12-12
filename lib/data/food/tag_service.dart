import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/network/api_client.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/food_model.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/constant.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/tag_model.dart';

class TagService {
  final Dio _dio = ApiClient.dio;

  Future<Map<String, dynamic>> getAllTags({
    int page = 1,
    int limit = 30,
    String? query,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString("token");

      final response = await _dio.get(
        ApiEndPoint.tag,
        queryParameters: {'limit': limit, 'page': page},
        options: Options(headers: {"Authorization": "Bearer $token"}),
      );

      try {
        final List<dynamic> tagList = (response.data['data'] as List)
            .map((json) => Tag.fromJson(json))
            .toList();

        final int totalPages = response.data['pagination']?['totalPages'] ?? 1;

        return {"tags": tagList, "totalPages": totalPages};
      } catch (e) {
        throw Exception(
          "Fetch Tag Error: ${response.statusCode}",
        );
      }
    } on DioException catch (e) {
      debugPrint("API error: ${e.response?.statusCode} - ${e.response?.data}");
      throw Exception("Lỗi network: ${e.message}");
    } catch (e) {
      throw Exception("Lỗi không xác định: ${e.toString()}");
    }
  }

  Future<List<Tag>> getTagsByFoodId(String foodId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString("token");

      final response = await _dio.get(
        "${ApiEndPoint.foodtag}/food/$foodId",
        options: Options(headers: {"Authorization": "Bearer $token"}),
      );

      final data = response.data;

      if (data['code'] == 200 && data['data'] != null) {
        final List<dynamic> list = data['data'];

        return list.map((item) => Tag.fromJson(item['tag'])).toList();
      } else {
        throw Exception("Invalid response: ${data['message']}");
      }
    } on DioException catch (e) {
      throw Exception("Error fetching tags: ${e.message}");
    }
  }

  Future<Map<String, dynamic>> getFoodsByTagId({
    required int tagId,
    int page = 1,
    int limit = 20,
    String? query,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString("token");

      final response = await _dio.get(
        "${ApiEndPoint.foodtag}/tag/$tagId",
        queryParameters: {
          'limit': 20,
          'page': 1,
          if (query != null && query.isNotEmpty) "keyWord": query,
        },
        options: Options(headers: {"Authorization": "Bearer $token"}),
      );

      final data = response.data;
      final List<Food> foods = (data['data'] as List)
          .map((json) => Food.fromJson(json))
          .toList();

      final int totalPages = data['pagination']?['totalPages'] ?? 1;

      return {"foods": foods, "totalPages": totalPages};
    } on DioException catch (e) {
      throw Exception("Error fetching foods: ${e.message}");
    }
  }
}
