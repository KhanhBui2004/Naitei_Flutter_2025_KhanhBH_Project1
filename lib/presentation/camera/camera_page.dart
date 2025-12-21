import 'package:flutter/material.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/camera/api_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/camera/dish_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/camera/model_manager.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/dual_dish_list_widget.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/routes/app_routes.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/camera/dish_model.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/camera/model_type.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/camera/slider_type.dart';
import 'package:ultralytics_yolo/ultralytics_yolo.dart';

class CameraPage extends StatefulWidget {
  const CameraPage({super.key});

  @override
  State<CameraPage> createState() => _CameraPageState();
}

class _CameraPageState extends State<CameraPage> {
  int _detectionCount = 0;
  double _confidenceThreshold = 0.5;
  double _currentFps = 0.0;
  double _currentZoomLevel = 1.0;
  bool _isFrontCamera = false;

  SliderType _activeSlider = SliderType.none;
  ModelType _selectedModel = ModelType.detect;
  bool _isModelLoading = false;
  String? _modelPath;
  String _loadingMessage = '';
  double _downloadProgress = 0.0;

  late final ModelManager _modelManager;

  List<String> _detectedIngredients = [];
  List<DishModel> _foodsWithIngredients = [];
  List<DishModel> _recommendationFoods = [];
  bool _isDishLoading = false;

  final Map<String, DateTime> _ingredientLastSeen = {};
  final Duration _ingredientTimeout = const Duration(seconds: 5);

  DateTime? _lastApiCall;
  final Duration _apiDebounceDelay = const Duration(seconds: 3);

  List<String> _previousIngredients = [];

  static const int _userId = 1;

  @override
  void initState() {
    super.initState();

    _modelManager = ModelManager(
      onDownloadProgress: (progress) {
        if (mounted) setState(() => _downloadProgress = progress);
      },
      onStatusUpdate: (message) {
        if (mounted) setState(() => _loadingMessage = message);
      },
    );

    _loadModelForPlatform();
  }

  void _onDetectionResults(List<YOLOResult> results) {
    if (!mounted) return;

    final now = DateTime.now();
    final currentDetectedIngredients = <String>[];

    for (var result in results) {
      if (result.confidence >= _confidenceThreshold) {
        final normalizedIngredient =
            DishService.normalizeIngredientName(result.className);
        if (normalizedIngredient.isNotEmpty) {
          currentDetectedIngredients.add(normalizedIngredient);
          _ingredientLastSeen[normalizedIngredient] = now;
        }
      }
    }

    _ingredientLastSeen.removeWhere(
      (ingredient, lastSeen) => now.difference(lastSeen) > _ingredientTimeout,
    );

    final allActiveIngredients = _ingredientLastSeen.keys.toList();

    setState(() {
      _detectionCount = allActiveIngredients.length;
      _detectedIngredients = allActiveIngredients;
    });

    final ingredientsChanged = !_areListsEqual(allActiveIngredients, _previousIngredients);

    if (allActiveIngredients.isNotEmpty && ingredientsChanged) {
      final shouldCallApi =
          _lastApiCall == null || now.difference(_lastApiCall!) > _apiDebounceDelay;

      if (shouldCallApi) {
        _lastApiCall = now;
        _previousIngredients = List<String>.from(allActiveIngredients);
        _fetchDishRecommendations(allActiveIngredients);
      }
    }

    if (allActiveIngredients.isEmpty && _previousIngredients.isNotEmpty) {
      _previousIngredients.clear();
    }
  }

  Future<void> _fetchDishRecommendations(List<String> ingredients) async {
    if (_isDishLoading) return;

    setState(() => _isDishLoading = true);

    try {
      final result = await ApiService.getRecommendationsByIngredients(
        userId: _userId,
        detectedIngredients: ingredients,
        topK: 5,
        alpha: 0.5,
      );

      if (mounted) {
        setState(() {
          _foodsWithIngredients = result['foods_with_ingredients'] ?? [];
          _recommendationFoods = result['recommendation_foods'] ?? [];
          _isDishLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching dish recommendations: $e');
      if (mounted) setState(() => _isDishLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final orientation = MediaQuery.of(context).orientation;
    final isLandscape = orientation == Orientation.landscape;
    final screenHeight = MediaQuery.of(context).size.height;
    final cameraHeight = screenHeight * 0.33;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pushNamedAndRemoveUntil(
            context,
            AppRoutes.home,
            (route) => false,
          ),
        ),
      ),
      body: Column(
        children: [
          SizedBox(
            height: cameraHeight,
            child: Stack(
              children: [
                if (_modelPath != null && !_isModelLoading)
                  YOLOView(
                    modelPath: _modelPath!,
                    task: _selectedModel.task,
                    streamingConfig: const YOLOStreamingConfig.minimal(),
                    onResult: _onDetectionResults,
                    onPerformanceMetrics: (metrics) {
                      if (mounted) setState(() => _currentFps = metrics.fps);
                    },
                    onZoomChanged: (zoom) {
                      if (mounted) setState(() => _currentZoomLevel = zoom);
                    },
                  )
                else if (_isModelLoading)
                  IgnorePointer(
                    child: Container(
                      color: Colors.black87,
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.camera_alt, size: 120, color: Colors.white70),
                            const SizedBox(height: 32),
                            Text(
                              _loadingMessage,
                              style: const TextStyle(color: Colors.white, fontSize: 16),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 24),
                            if (_downloadProgress > 0)
                              SizedBox(
                                width: 200,
                                child: LinearProgressIndicator(
                                  value: _downloadProgress,
                                  backgroundColor: Colors.white24,
                                  valueColor:
                                      const AlwaysStoppedAnimation<Color>(Colors.white),
                                  minHeight: 4,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  )
                else
                  const Center(
                    child: Text('No model loaded', style: TextStyle(color: Colors.white)),
                  ),
              ],
            ),
          ),
          if (_detectedIngredients.isNotEmpty)
            _buildDetectedIngredientsWidget(),
          Expanded(
            child: DualDishListWidget(
              foodsWithIngredients: _foodsWithIngredients,
              recommendationFoods: _recommendationFoods,
              detectedIngredients: _detectedIngredients,
              isLoading: _isDishLoading,
              onDishTap: (id) => Navigator.pushNamed(context, AppRoutes.detail, arguments: id),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetectedIngredientsWidget() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.blue[50],
        border: Border(
          top: BorderSide(color: Colors.grey[300]!, width: 1),
          bottom: BorderSide(color: Colors.grey[300]!, width: 1),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.visibility, color: Colors.blue[700], size: 20),
              const SizedBox(width: 8),
              Text(
                'Nguyên liệu đã phát hiện',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.blue[700],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: _detectedIngredients
                .map((ingredient) => Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.blue[100],
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.blue[300]!),
                      ),
                      child: Text(
                        ingredient,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.blue[800],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ))
                .toList(),
          ),
        ],
      ),
    );
  }

  Future<void> _loadModelForPlatform() async {
    setState(() {
      _isModelLoading = true;
      _loadingMessage = 'Loading ${_selectedModel.modelName} model...';
      _downloadProgress = 0.0;
    });

    try {
      final modelPath = await _modelManager.getModelPath(_selectedModel);

      if (mounted) {
        setState(() {
          _modelPath = modelPath;
          _isModelLoading = false;
          _loadingMessage = '';
        });
      }

      if (modelPath == null) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Model Not Available'),
            content: Text(
              'Failed to load ${_selectedModel.modelName} model.',
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context), child: const Text('OK'))
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isModelLoading = false;
          _loadingMessage = 'Failed to load model';
        });
      }
    }
  }

  bool _areListsEqual(List<String> list1, List<String> list2) {
    if (list1.length != list2.length) return false;
    final sorted1 = List<String>.from(list1)..sort();
    final sorted2 = List<String>.from(list2)..sort();
    for (int i = 0; i < sorted1.length; i++) {
      if (sorted1[i] != sorted2[i]) return false;
    }
    return true;
  }
}

