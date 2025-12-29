import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/camera/dish_model.dart';

class ApiService {
  static const String baseUrl =
      'https://warless-aden-atavistically.ngrok-free.dev';

  static Future<Map<String, dynamic>> chatbot({
    required String message,
    dynamic imageFile,
  }) async {
    final uri = Uri.parse('$baseUrl/chat_agent');
    final body = {'message': message};
    final request = http.MultipartRequest('POST', uri);
    if (imageFile != null) {
      Uint8List bytes;
      String filename = 'file';
      if (imageFile is XFile) {
        bytes = await imageFile.readAsBytes();
        filename = imageFile.name;
      } else if (imageFile is Uint8List) {
        bytes = imageFile;
      } else {
        try {
          final dynamic dyn = imageFile;
          final List<int> b = await dyn.readAsBytes();
          bytes = Uint8List.fromList(b);
          filename = dyn.name ?? filename;
        } catch (_) {
          throw Exception('Unsupported imageFile type for multipart upload');
        }
      }

      request.files.add(
        http.MultipartFile.fromBytes('file', bytes, filename: filename),
      );
    }
    request.fields.addAll(body);
    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return {
        'answer': data['answer'] ?? '',
        'similar_foods': data['similar_foods'] ?? [],
      };
    } else {
      throw Exception('API call failed with status: ${response.statusCode}');
    }
  }

  static Future<Map<String, List<DishModel>>> getRecommendationsByIngredients({
    required int userId,
    required List<String> detectedIngredients,
    int topK = 5,
    double alpha = 0.5,
  }) async {
    try {
      final queryParams = {
        'user_id': userId.toString(),
        'top_k': topK.toString(),
        'alpha': alpha.toString(),
      };

      final uri = Uri.parse(
        '$baseUrl/recommend_by_ingredients',
      ).replace(queryParameters: queryParams);

      debugPrint('API URL: $uri');
      debugPrint('Detected ingredients in body: $detectedIngredients');

      final response = await http
          .post(
            uri,
            headers: {'Content-Type': 'application/json'},
            body: json.encode(detectedIngredients),
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);

        final foodsWithIngredients = <DishModel>[];
        if (data['foods_with_ingredients'] != null) {
          for (var item in data['foods_with_ingredients']) {
            foodsWithIngredients.add(_parseDishFromApi(item));
          }
        }

        final recommendationFoods = <DishModel>[];
        if (data['recommendation_foods'] != null) {
          for (var item in data['recommendation_foods']) {
            recommendationFoods.add(_parseDishFromApi(item));
          }
        }

        return {
          'foods_with_ingredients': foodsWithIngredients,
          'recommendation_foods': recommendationFoods,
        };
      } else if (response.statusCode == 404) {
        throw Exception('Resource not found (404)');
      } else {
        throw Exception('API call failed with status: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error calling API: $e');
      rethrow;
    }
  }

  static Future<Map<String, List<dynamic>>> getRecommendationsByImage({
    required dynamic imageFile,
    required int userId,
    int topK = 5,
    double alpha = 0.5,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/recommend_by_image').replace(
        queryParameters: {
          'user_id': userId.toString(),
          'top_k': topK.toString(),
          'alpha': alpha.toString(),
        },
      );

      final request = http.MultipartRequest('POST', uri);

      if (imageFile != null) {
        Uint8List bytes;
        String filename = 'file';

        if (imageFile is XFile) {
          bytes = await imageFile.readAsBytes();
          filename = imageFile.name;
        } else if (imageFile is Uint8List) {
          bytes = imageFile;
        } else {
          try {
            final dynamic dyn = imageFile;
            final List<int> b = await dyn.readAsBytes();
            bytes = Uint8List.fromList(b);
            filename = dyn.name ?? filename;
          } catch (_) {
            throw Exception('Unsupported imageFile type for multipart upload');
          }
        }

        request.files.add(
          http.MultipartFile.fromBytes('file', bytes, filename: filename),
        );
      }

      final streamedResponse = await request.send().timeout(
        const Duration(seconds: 30),
      );
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);

        final foodsWithIngredients = <DishModel>[];
        if (data['foods_with_ingredients'] != null) {
          for (var item in data['foods_with_ingredients']) {
            foodsWithIngredients.add(_parseDishFromApi(item));
          }
        }

        final recommendationFoods = <DishModel>[];
        if (data['recommendation_foods'] != null) {
          for (var item in data['recommendation_foods']) {
            recommendationFoods.add(_parseDishFromApi(item));
          }
        }

        final detectionInfo = [];
        if (data['detection_info'] != null) {
          for (var item in data['detection_info']) {
            detectionInfo.add(item['class_vi']);
          }
        }

        return {
          'detection_info': detectionInfo,
          'foods_with_ingredients': foodsWithIngredients,
          'recommendation_foods': recommendationFoods,
        };
      } else if (response.statusCode == 404) {
        throw Exception('Resource not found (404)');
      } else {
        throw Exception('API call failed with status: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error calling API: $e');
      rethrow;
    }
  }

  /// Parse dữ liệu món ăn từ API response
  static DishModel _parseDishFromApi(Map<String, dynamic> json) {
    return DishModel(
      id: json['id']?.toString() ?? '',
      name: json['dish_name'] ?? '',
      description: json['description'] ?? '',
      ingredients: json['ingredients'] ?? '',
      imageUrl: json['image_link'] ?? '',
      cookingTime: _parseCookingTime(json['cooking_time']),
      servingSize: json['serving_size'] ?? '',
      dishType: json['dish_type'] ?? '',
      calories: _parseToInt(json['calories']),
      protein: _parseToInt(json['protein']),
      fat: _parseToInt(json['fat']),
      fiber: _parseToInt(json['fiber']),
      sugar: _parseToInt(json['sugar']),
      matchingCount: json['matching_count'] ?? 0,
      score: _parseToDouble(json['score']),
      cookingMethod: json['cooking_method'] ?? '',
      dishTags: json['dish_tags'] ?? '',
    );
  }

  static int _parseCookingTime(dynamic cookingTime) {
    if (cookingTime == null) return 0;
    if (cookingTime is int) return cookingTime;
    if (cookingTime is String) {
      return int.tryParse(cookingTime.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;
    }
    return 0;
  }

  static int _parseToInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) {
      return int.tryParse(value.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;
    }
    return 0;
  }

  static double _parseToDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) {
      return double.tryParse(value) ?? 0.0;
    }
    return 0.0;
  }
}
