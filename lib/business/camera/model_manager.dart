import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/camera/model_type.dart';
class ModelManager {
  static const MethodChannel _channel = MethodChannel(
    'yolo_single_image_channel',
  );

  final void Function(double progress)? onDownloadProgress;

  final void Function(String message)? onStatusUpdate;

  ModelManager({this.onDownloadProgress, this.onStatusUpdate});

  Future<String?> getModelPath(ModelType modelType) async {
    debugPrint('[ModelManager] Getting model path for: ${modelType.modelName}');
    if (Platform.isAndroid) {
      final result = await _getAndroidModelPath(modelType);
      debugPrint('[ModelManager] Android model path result: $result');
      return result;
    }
    return null;
  }

  Future<String?> _getAndroidModelPath(ModelType modelType) async {
    final bundledModelName = '${modelType.modelName}.tflite';
    final documentsDir = await getApplicationDocumentsDirectory();

    try {
      final result = await _channel.invokeMethod('checkModelExists', {
        'modelPath': bundledModelName,
      });

      if (result != null && result['exists'] == true) {
        debugPrint(
          'Found model in Android ${result['location']}: ${result['path']}',
        );
        if (result['location'] == 'assets') {
          debugPrint('Returning Android native asset path: $bundledModelName');
          return bundledModelName;
        }
        return result['path'] as String;
      }
    } catch (e) {
      debugPrint('Error checking Android native assets: $e');
    }
    final modelFile = File(
      '${documentsDir.path}/${modelType.modelName}.tflite',
    );

    if (await modelFile.exists()) {
      debugPrint('Found downloaded model at: ${modelFile.path}');
      return modelFile.path;
    }
    final flutterAssetPath = 'assets/models/$bundledModelName';
    try {
      await rootBundle.load(flutterAssetPath);
      debugPrint('Found model in Flutter assets: $flutterAssetPath');
      
      final resolvedPath = await _resolveAndroidAssetPath(bundledModelName);
      if (resolvedPath != null) {
        debugPrint('Successfully resolved Android asset path: $resolvedPath');
        return resolvedPath;
      } else {
        debugPrint('⚠️  Flutter asset exists but cannot be accessed by Android native code');
        debugPrint('   This suggests the asset may need to be manually copied to android/app/src/main/assets/');
      }
    } catch (e) {
      debugPrint('Model not found in Flutter assets: $flutterAssetPath');
    }

    debugPrint('All model loading attempts failed for ${modelType.modelName}');
    return null;
  }

  Future<bool> _validateAndroidModelPath(String modelPath) async {
    try {
      final result = await _channel.invokeMethod('checkModelExists', {
        'modelPath': modelPath,
      });
      return result != null && result['exists'] == true;
    } catch (e) {
      debugPrint('Error validating Android model path "$modelPath": $e');
      return false;
    }
  }

  Future<String?> _resolveAndroidAssetPath(String modelName) async {
    final possiblePaths = [
      modelName,                         
      'models/$modelName',               
      'assets/models/$modelName', 
    ];

    for (final path in possiblePaths) {
      debugPrint('Testing Android asset path: $path');
      if (await _validateAndroidModelPath(path)) {
        debugPrint('✅ Valid Android asset path found: $path');
        return path;
      }
    }

    debugPrint('❌ No valid Android asset path found for: $modelName');
    return null;
  }
}
