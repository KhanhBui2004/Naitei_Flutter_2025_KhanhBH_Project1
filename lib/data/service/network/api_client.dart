import 'package:dio/dio.dart';

import 'package:naitei_flutter_2025_khanhbh_project1/data/service/network/auth_interceptor.dart';

class ApiClient {
  static final Dio dio = Dio(
    BaseOptions(
      baseUrl: 'https://pbl6-vietnomi-be.onrender.com',
      connectTimeout: Duration(seconds: 15),
      receiveTimeout: Duration(seconds: 15),
    ),
  )..interceptors.add(AuthInterceptor());
}
