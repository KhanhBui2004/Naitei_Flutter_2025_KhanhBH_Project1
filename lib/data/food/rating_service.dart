import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/network/api_client.dart';

import 'package:naitei_flutter_2025_khanhbh_project1/utils/constant.dart';
import 'package:shared_preferences/shared_preferences.dart';

class RatingService {
  final Dio _dio = ApiClient.dio;

  Future<Map<String, dynamic>> postRate(
    int userId,
    int foodId,
    int rate,
  ) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      final response = await _dio.post(
        ApiEndPoint.rating,
        data: {'user_id': userId, 'food_id': foodId, 'rating': rate},
        options: Options(headers: {"Authorization": "Bearer $token"}),
      );
      final data = response.data;
      debugPrint(data['message']);
      return {'code': data['code'], 'message': data['message']};
    } on DioException catch (e) {
      throw Exception("Lỗi rating: ${e.message}");
    }
  }

  Future<Map<String, dynamic>> patchRate(
    int userId,
    int foodId,
    int rate,
    int rateId,
  ) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      final response = await _dio.patch(
        "${ApiEndPoint.rating}/$rateId",
        data: {'user_id': userId, 'food_id': foodId, 'rating': rate},
        // queryParameters: {'id': rateId},
        options: Options(headers: {"Authorization": "Bearer $token"}),
      );
      final data = response.data;
      // print(data['data']);
      return {'code': data['code'], 'message': data['message']};
    } on DioException catch (e) {
      throw Exception("Lỗi rating: ${e.message}");
    }
  }

  Future<double> getAverRating(int foodId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      final response = await _dio.get(
        "${ApiEndPoint.rating}/average",
        queryParameters: {'foodID': foodId},
        options: Options(headers: {"Authorization": "Bearer $token"}),
      );
      final data = response.data;
      final avgStr = data['data']['averageRating'];
      final avg = double.tryParse(avgStr.toString()) ?? 0.0;
      // debugPrint("average: ${data['data']}");
      return avg;
    } on DioException catch (e) {
      throw Exception("Error get averate rating: ${e.message}");
    }
  }

  Future<Map<String, dynamic>> getRating(int userId, int foodId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      final response = await _dio.get(
        "${ApiEndPoint.rating}/user-food",
        queryParameters: {'userID': userId, 'foodID': foodId},
        options: Options(headers: {"Authorization": "Bearer $token"}),
      );
      final data = response.data;

      // debugPrint("getRating response: $data");

      // Nếu không có dữ liệu => return null
      if (data['data'] == null || (data['data'] as List).isEmpty) {
        return {'rating': null, 'rateId': null};
      }

      final first = data['data'][0];
      return {'rating': first['rating'], 'rateId': first['id']};
    } on DioException catch (e) {
      throw Exception("Error get rating: ${e.message}");
    }
  }

  Future<int> getCountRating(int foodId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      final response = await _dio.get(
        ApiEndPoint.countrate,
        queryParameters: {'foodID': foodId},
        options: Options(headers: {"Authorization": "Bearer $token"}),
      );
      final data = response.data;

      // debugPrint("getCountRating response: $data");

      // Nếu không có dữ liệu => return null
      if (data['code'] == 200) {
        return data['data'];
      }

      return -1;
    } on DioException catch (e) {
      throw Exception("Error get count rating: ${e.message}");
    }
  }
}
