import 'package:dio/dio.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/constant.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/navigator_global.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/routes/app_routes.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthInterceptor extends Interceptor {
  final Dio? _refreshDio;

  AuthInterceptor({Dio? refreshDio}) : _refreshDio = refreshDio;
  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    // Nếu lỗi 401 → token hết hạn
    if (err.response?.statusCode == 401) {
      final prefs = await SharedPreferences.getInstance();
      final refreshToken = prefs.getString("refreshToken");

      if (refreshToken == null) {
        return handler.next(err);
      }

      final dio = _refreshDio ?? Dio();

      try {
        final refreshResponse = await dio.post(
          ApiEndPoint.refresh,
          data: {"refreshToken": refreshToken},
        );

        final newToken = refreshResponse.data["token"];

        await prefs.setString("token", newToken);

        final RequestOptions req = err.requestOptions;
        req.headers["Authorization"] = "Bearer $newToken";

        final retryResponse = await dio.fetch(req);
        return handler.resolve(retryResponse);
      } catch (_) {
        // Refresh thất bại → logout
        await prefs.clear();
        navigatorKey.currentState?.pushNamedAndRemoveUntil(
          AppRoutes.login,
          (route) => false,
        );
      }
    }
    return handler.next(err);
  }
}
