// // import 'package:flutter/material.dart';
// // import 'package:naitei_flutter_2025_khanhbh_project1/business/camera/api_service.dart';
// // import 'package:naitei_flutter_2025_khanhbh_project1/business/camera/dish_service.dart';
// // import 'package:naitei_flutter_2025_khanhbh_project1/business/camera/model_manager.dart';
// // import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/dual_dish_list_widget.dart';
// // import 'package:naitei_flutter_2025_khanhbh_project1/utils/routes/app_routes.dart';
// // import 'package:naitei_flutter_2025_khanhbh_project1/data/model/camera/dish_model.dart';
// // import 'package:naitei_flutter_2025_khanhbh_project1/data/model/camera/model_type.dart';
// // import 'package:naitei_flutter_2025_khanhbh_project1/data/model/camera/slider_type.dart';
// // // import 'package:ultralytics_yolo_dental/yolo_result.dart';
// // // import 'package:ultralytics_yolo_dental/yolo_streaming_config.dart';
// // // import 'package:ultralytics_yolo_dental/yolo_view.dart';
// // import 'package:ultralytics_yolo/ultralytics_yolo.dart';

// // class CameraInferenceScreen extends StatefulWidget {
// //   const CameraInferenceScreen({super.key});

// //   @override
// //   State<CameraInferenceScreen> createState() => _CameraInferenceScreenState();
// // }

// // class _CameraInferenceScreenState extends State<CameraInferenceScreen> {
// //   int _detectionCount = 0;
// //   double _confidenceThreshold = 0.5;
// //   double _iouThreshold = 0.45;
// //   int _numItemsThreshold = 30;
// //   double _currentFps = 0.0;

// //   SliderType _activeSlider = SliderType.none;
// //   ModelType _selectedModel = ModelType.detect;
// //   bool _isModelLoading = false;
// //   String? _modelPath;
// //   String _loadingMessage = '';
// //   double _downloadProgress = 0.0;
// //   double _currentZoomLevel = 1.0;
// //   bool _isFrontCamera = false;

// //   final _yoloController = YOLOViewController();
// //   final _yoloViewKey = GlobalKey<YOLOViewState>();
// //   final bool _useController = true;

// //   late final ModelManager _modelManager;

// //   List<String> _detectedIngredients = [];
// //   List<DishModel> _foodsWithIngredients = [];
// //   List<DishModel> _recommendationFoods = [];
// //   bool _isDishLoading = false;

// //   final Map<String, DateTime> _ingredientLastSeen = {};
// //   final Duration _ingredientTimeout = const Duration(seconds: 5);

// //   DateTime? _lastApiCall;
// //   final Duration _apiDebounceDelay = const Duration(seconds: 3);

// //   List<String> _previousIngredients = [];

// //   static const int _userId = 1;

// //   @override
// //   void initState() {
// //     super.initState();

// //     _modelManager = ModelManager(
// //       onDownloadProgress: (progress) {
// //         if (mounted) {
// //           setState(() {
// //             _downloadProgress = progress;
// //           });
// //         }
// //       },
// //       onStatusUpdate: (message) {
// //         if (mounted) {
// //           setState(() {
// //             _loadingMessage = message;
// //           });
// //         }
// //       },
// //     );

// //     _loadModelForPlatform();

// //     WidgetsBinding.instance.addPostFrameCallback((_) {
// //       if (_useController) {
// //         _yoloController.setThresholds(
// //           confidenceThreshold: _confidenceThreshold,
// //           iouThreshold: _iouThreshold,
// //           numItemsThreshold: _numItemsThreshold,
// //         );
// //       } else {
// //         _yoloViewKey.currentState?.setThresholds(
// //           confidenceThreshold: _confidenceThreshold,
// //           iouThreshold: _iouThreshold,
// //           numItemsThreshold: _numItemsThreshold,
// //         );
// //       }
// //     });
// //   }

// //   void _onDetectionResults(List<YOLOResult> results) {
// //     if (!mounted) return;

// //     final now = DateTime.now();

// //     final currentDetectedIngredients = <String>[];

// //     for (var result in results) {
// //       if (result.confidence > 0.6) {
// //         final originalClassName = result.className;
// //         final normalizedIngredient = DishService.normalizeIngredientName(
// //           originalClassName,
// //         );

// //         if (normalizedIngredient.isNotEmpty &&
// //             normalizedIngredient != originalClassName) {
// //           debugPrint(
// //             'Ingredient mapped: $originalClassName -> $normalizedIngredient',
// //           );
// //         }

// //         if (normalizedIngredient.isNotEmpty) {
// //           currentDetectedIngredients.add(normalizedIngredient);
// //           _ingredientLastSeen[normalizedIngredient] = now;
// //         }
// //       }
// //     }

// //     _ingredientLastSeen.removeWhere((ingredient, lastSeen) {
// //       return now.difference(lastSeen) > _ingredientTimeout;
// //     });

// //     final allActiveIngredients = _ingredientLastSeen.keys.toList();

// //     setState(() {
// //       _detectionCount = results.length;
// //       _detectedIngredients = allActiveIngredients;
// //     });

// //     final ingredientsChanged = !_areListsEqual(
// //       allActiveIngredients,
// //       _previousIngredients,
// //     );

// //     if (allActiveIngredients.isNotEmpty && ingredientsChanged) {
// //       final shouldCallApi =
// //           _lastApiCall == null ||
// //           now.difference(_lastApiCall!) > _apiDebounceDelay;

// //       if (shouldCallApi) {
// //         _lastApiCall = now;
// //         _previousIngredients = List<String>.from(allActiveIngredients);
// //         _fetchDishRecommendations(allActiveIngredients);
// //       }
// //     }

// //     if (allActiveIngredients.isEmpty && _previousIngredients.isNotEmpty) {
// //       _previousIngredients.clear();
// //     }
// //     for (var i = 0; i < results.length && i < 3; i++) {
// //       final r = results[i];
// //       debugPrint(
// //         'Detection $i: ${r.className} (${(r.confidence * 100).toStringAsFixed(1)}%) at ${r.boundingBox}',
// //       );
// //     }

// //     debugPrint('Detected ingredients: $_detectedIngredients');
// //   }

// //   Future<void> _fetchDishRecommendations(List<String> ingredients) async {
// //     if (_isDishLoading) return;
// //     debugPrint('Calling API with ingredients: $ingredients');

// //     setState(() {
// //       _isDishLoading = true;
// //     });

// //     try {
// //       final result = await ApiService.getRecommendationsByIngredients(
// //         userId: _userId,
// //         detectedIngredients: ingredients,
// //         topK: 5,
// //         alpha: 0.5,
// //       );

// //       if (mounted) {
// //         setState(() {
// //           _foodsWithIngredients = result['foods_with_ingredients'] ?? [];
// //           _recommendationFoods = result['recommendation_foods'] ?? [];
// //           _isDishLoading = false;
// //         });
// //       }
// //     } catch (e) {
// //       debugPrint('Error fetching dish recommendations: $e');
// //       if (mounted) {
// //         setState(() {
// //           _isDishLoading = false;
// //         });
// //       }
// //     }
// //   }

// //   @override
// //   Widget build(BuildContext context) {
// //     final orientation = MediaQuery.of(context).orientation;
// //     final isLandscape = orientation == Orientation.landscape;
// //     final screenHeight = MediaQuery.of(context).size.height;
// //     final cameraHeight = screenHeight * 0.33;

// //     return Scaffold(
// //       appBar: AppBar(
// //         leading: IconButton(
// //           icon: const Icon(Icons.arrow_back),
// //           onPressed: () {
// //             Navigator.pushNamedAndRemoveUntil(
// //               context,
// //               AppRoutes.home,
// //               (route) => false,
// //             );
// //           },
// //         ),
// //       ),

// //       body: Column(
// //         children: [
// //           SizedBox(
// //             height: cameraHeight,
// //             child: Stack(
// //               children: [
// //                 if (_modelPath != null && !_isModelLoading) ...[
// //                   Builder(
// //                     builder: (context) {
// //                       debugPrint(
// //                         '[CameraInferenceScreen] Creating YOLOView with modelPath: $_modelPath',
// //                       );
// //                       return YOLOView(
// //                         key: _useController
// //                             ? const ValueKey('yolo_view_static')
// //                             : _yoloViewKey,
// //                         controller: _useController ? _yoloController : null,
// //                         modelPath: _modelPath!,
// //                         task: _selectedModel.task,
// //                         streamingConfig: const YOLOStreamingConfig.minimal(),
// //                         onResult: _onDetectionResults,
// //                         onPerformanceMetrics: (metrics) {
// //                           debugPrint(
// //                             'Performance Metrics - FPS: ${metrics.fps}, Processing: ${metrics.processingTimeMs}ms',
// //                           );
// //                           if (mounted) {
// //                             setState(() {
// //                               _currentFps = metrics.fps;
// //                             });
// //                           }
// //                         },
// //                         onZoomChanged: (zoomLevel) {
// //                           if (mounted) {
// //                             setState(() {
// //                               _currentZoomLevel = zoomLevel;
// //                             });
// //                           }
// //                         },
// //                       );
// //                     },
// //                   ),
// //                 ] else if (_isModelLoading)
// //                   IgnorePointer(
// //                     child: Container(
// //                       color: Colors.black87,
// //                       child: Center(
// //                         child: Column(
// //                           mainAxisAlignment: MainAxisAlignment.center,
// //                           children: [
// //                             Icon(
// //                               Icons.camera_alt,
// //                               size: 120,
// //                               color: Colors.white.withValues(alpha: 0.8),
// //                             ),
// //                             const SizedBox(height: 32),
// //                             Text(
// //                               _loadingMessage,
// //                               style: const TextStyle(
// //                                 color: Colors.white,
// //                                 fontSize: 16,
// //                                 fontWeight: FontWeight.w500,
// //                               ),
// //                               textAlign: TextAlign.center,
// //                             ),
// //                             const SizedBox(height: 24),
// //                             if (_downloadProgress > 0)
// //                               Column(
// //                                 children: [
// //                                   SizedBox(
// //                                     width: 200,
// //                                     child: LinearProgressIndicator(
// //                                       value: _downloadProgress,
// //                                       backgroundColor: Colors.white24,
// //                                       valueColor:
// //                                           const AlwaysStoppedAnimation<Color>(
// //                                             Colors.white,
// //                                           ),
// //                                       minHeight: 4,
// //                                     ),
// //                                   ),
// //                                   const SizedBox(height: 12),
// //                                   Text(
// //                                     '${(_downloadProgress * 100).toStringAsFixed(1)}%',
// //                                     style: const TextStyle(
// //                                       color: Colors.white,
// //                                       fontSize: 14,
// //                                     ),
// //                                   ),
// //                                 ],
// //                               ),
// //                           ],
// //                         ),
// //                       ),
// //                     ),
// //                   )
// //                 else
// //                   const Center(
// //                     child: Text(
// //                       'No model loaded',
// //                       style: TextStyle(color: Colors.white),
// //                     ),
// //                   ),

// //                 Positioned(
// //                   top:
// //                       MediaQuery.of(context).padding.top +
// //                       (isLandscape ? 8 : 16),
// //                   left: isLandscape ? 8 : 16,
// //                   right: isLandscape ? 8 : 16,
// //                   child: Column(
// //                     crossAxisAlignment: CrossAxisAlignment.center,
// //                     children: [
// //                       // Model selector
// //                       _buildModelSelector(),
// //                       SizedBox(height: isLandscape ? 8 : 12),
// //                       IgnorePointer(
// //                         child: Row(
// //                           mainAxisAlignment: MainAxisAlignment.center,
// //                           children: [
// //                             Text(
// //                               'DETECTIONS: $_detectionCount',
// //                               style: const TextStyle(
// //                                 color: Colors.white,
// //                                 fontWeight: FontWeight.w600,
// //                               ),
// //                             ),
// //                             const SizedBox(width: 16),
// //                             Text(
// //                               'FPS: ${_currentFps.toStringAsFixed(1)}',
// //                               style: const TextStyle(
// //                                 color: Colors.white,
// //                                 fontWeight: FontWeight.w600,
// //                               ),
// //                             ),
// //                           ],
// //                         ),
// //                       ),
// //                       const SizedBox(height: 8),
// //                       if (_activeSlider == SliderType.confidence)
// //                         _buildTopPill(
// //                           'CONFIDENCE THRESHOLD: ${_confidenceThreshold.toStringAsFixed(2)}',
// //                         ),
// //                       if (_activeSlider == SliderType.iou)
// //                         _buildTopPill(
// //                           'IOU THRESHOLD: ${_iouThreshold.toStringAsFixed(2)}',
// //                         ),
// //                       if (_activeSlider == SliderType.numItems)
// //                         _buildTopPill('ITEMS MAX: $_numItemsThreshold'),
// //                     ],
// //                   ),
// //                 ),

// //                 Positioned(
// //                   bottom: isLandscape ? 16 : 32,
// //                   right: isLandscape ? 8 : 16,
// //                   child: Column(
// //                     children: [
// //                       if (!_isFrontCamera) ...[
// //                         _buildCircleButton(
// //                           '${_currentZoomLevel.toStringAsFixed(1)}x',
// //                           onPressed: () {
// //                             // Cycle through zoom levels: 0.5x -> 1.0x -> 3.0x -> 0.5x
// //                             double nextZoom;
// //                             if (_currentZoomLevel < 0.75) {
// //                               nextZoom = 1.0;
// //                             } else if (_currentZoomLevel < 2.0) {
// //                               nextZoom = 3.0;
// //                             } else {
// //                               nextZoom = 0.5;
// //                             }
// //                             _setZoomLevel(nextZoom);
// //                           },
// //                         ),
// //                         SizedBox(height: isLandscape ? 8 : 12),
// //                       ],
// //                       _buildIconButton(Icons.layers, () {
// //                         _toggleSlider(SliderType.numItems);
// //                       }),
// //                       SizedBox(height: isLandscape ? 8 : 12),
// //                       _buildIconButton(Icons.adjust, () {
// //                         _toggleSlider(SliderType.confidence);
// //                       }),
// //                       SizedBox(height: isLandscape ? 8 : 12),
// //                       _buildIconButton(Icons.tune, () {
// //                         _toggleSlider(SliderType.iou);
// //                       }),
// //                       SizedBox(height: isLandscape ? 16 : 40),
// //                     ],
// //                   ),
// //                 ),

// //                 if (_activeSlider != SliderType.none)
// //                   Positioned(
// //                     left: 0,
// //                     right: 0,
// //                     bottom: 0,
// //                     child: Container(
// //                       padding: EdgeInsets.symmetric(
// //                         horizontal: isLandscape ? 16 : 24,
// //                         vertical: isLandscape ? 8 : 12,
// //                       ),
// //                       color: Colors.black.withValues(alpha: 0.8),
// //                       child: SliderTheme(
// //                         data: SliderTheme.of(context).copyWith(
// //                           activeTrackColor: Colors.yellow,
// //                           inactiveTrackColor: Colors.white.withValues(
// //                             alpha: 0.3,
// //                           ),
// //                           thumbColor: Colors.yellow,
// //                           overlayColor: Colors.yellow.withValues(alpha: 0.2),
// //                         ),
// //                         child: Slider(
// //                           value: _getSliderValue(),
// //                           min: _getSliderMin(),
// //                           max: _getSliderMax(),
// //                           divisions: _getSliderDivisions(),
// //                           label: _getSliderLabel(),
// //                           onChanged: (value) {
// //                             setState(() {
// //                               _updateSliderValue(value);
// //                             });
// //                           },
// //                         ),
// //                       ),
// //                     ),
// //                   ),

// //                 Positioned(
// //                   top:
// //                       MediaQuery.of(context).padding.top +
// //                       (isLandscape ? 8 : 16),
// //                   left: isLandscape ? 8 : 16,
// //                   child: CircleAvatar(
// //                     radius: isLandscape ? 20 : 24,
// //                     backgroundColor: Colors.black.withValues(alpha: 0.5),
// //                     child: IconButton(
// //                       icon: const Icon(
// //                         Icons.flip_camera_ios,
// //                         color: Colors.white,
// //                       ),
// //                       onPressed: () {
// //                         setState(() {
// //                           _isFrontCamera = !_isFrontCamera;
// //                           // Reset zoom level when switching to front camera
// //                           if (_isFrontCamera) {
// //                             _currentZoomLevel = 1.0;
// //                           }
// //                         });
// //                         if (_useController) {
// //                           _yoloController.switchCamera();
// //                         } else {
// //                           _yoloViewKey.currentState?.switchCamera();
// //                         }
// //                       },
// //                     ),
// //                   ),
// //                 ),
// //               ],
// //             ),
// //           ),

// //           if (_detectedIngredients.isNotEmpty)
// //             Container(
// //               width: double.infinity,
// //               padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
// //               decoration: BoxDecoration(
// //                 color: Colors.blue[50],
// //                 border: Border(
// //                   top: BorderSide(color: Colors.grey[300]!, width: 1),
// //                   bottom: BorderSide(color: Colors.grey[300]!, width: 1),
// //                 ),
// //               ),
// //               child: Column(
// //                 crossAxisAlignment: CrossAxisAlignment.start,
// //                 children: [
// //                   Row(
// //                     children: [
// //                       Icon(Icons.visibility, color: Colors.blue[700], size: 20),
// //                       const SizedBox(width: 8),
// //                       Text(
// //                         'Nguyên liệu đã phát hiện',
// //                         style: TextStyle(
// //                           fontSize: 14,
// //                           fontWeight: FontWeight.w600,
// //                           color: Colors.blue[700],
// //                         ),
// //                       ),
// //                     ],
// //                   ),
// //                   const SizedBox(height: 8),
// //                   Wrap(
// //                     spacing: 8,
// //                     runSpacing: 6,
// //                     children: _detectedIngredients.map((ingredient) {
// //                       return Container(
// //                         padding: const EdgeInsets.symmetric(
// //                           horizontal: 12,
// //                           vertical: 6,
// //                         ),
// //                         decoration: BoxDecoration(
// //                           color: Colors.blue[100],
// //                           borderRadius: BorderRadius.circular(16),
// //                           border: Border.all(color: Colors.blue[300]!),
// //                         ),
// //                         child: Text(
// //                           ingredient,
// //                           style: TextStyle(
// //                             fontSize: 12,
// //                             color: Colors.blue[800],
// //                             fontWeight: FontWeight.w500,
// //                           ),
// //                         ),
// //                       );
// //                     }).toList(),
// //                   ),
// //                 ],
// //               ),
// //             ),

// //           Expanded(
// //             child: Container(
// //               decoration: BoxDecoration(
// //                 color: Colors.grey[100],
// //                 border: Border(
// //                   top: BorderSide(color: Colors.grey[300]!, width: 1),
// //                 ),
// //               ),
// //               child: Column(
// //                 children: [
// //                   // Header
// //                   Container(
// //                     padding: const EdgeInsets.all(16),
// //                     child: Row(
// //                       children: [
// //                         Icon(
// //                           Icons.restaurant_menu,
// //                           color: Colors.orange[700],
// //                           size: 24,
// //                         ),
// //                         const SizedBox(width: 8),
// //                         const Text(
// //                           'Suggested Dishes',
// //                           style: TextStyle(
// //                             fontSize: 18,
// //                             fontWeight: FontWeight.bold,
// //                             color: Colors.black87,
// //                           ),
// //                         ),
// //                         const Spacer(),
// //                         if (_detectedIngredients.isNotEmpty)
// //                           Container(
// //                             padding: const EdgeInsets.symmetric(
// //                               horizontal: 8,
// //                               vertical: 4,
// //                             ),
// //                             decoration: BoxDecoration(
// //                               color: Colors.green[100],
// //                               borderRadius: BorderRadius.circular(12),
// //                               border: Border.all(color: Colors.green[300]!),
// //                             ),
// //                             child: Text(
// //                               '${_detectedIngredients.length} ingredients',
// //                               style: TextStyle(
// //                                 fontSize: 12,
// //                                 color: Colors.green[800],
// //                                 fontWeight: FontWeight.w500,
// //                               ),
// //                             ),
// //                           ),
// //                       ],
// //                     ),
// //                   ),

// //                   Expanded(
// //                     child: DualDishListWidget(
// //                       foodsWithIngredients: _foodsWithIngredients,
// //                       recommendationFoods: _recommendationFoods,
// //                       detectedIngredients: _detectedIngredients,
// //                       isLoading: _isDishLoading,
// //                       onDishTap: (id) => Navigator.pushNamed(
// //                         context,
// //                         AppRoutes.detail,
// //                         arguments: id,
// //                       ),
// //                     ),
// //                   ),
// //                 ],
// //               ),
// //             ),
// //           ),
// //         ],
// //       ),
// //     );
// //   }

// //   Widget _buildIconButton(dynamic iconOrAsset, VoidCallback onPressed) {
// //     return CircleAvatar(
// //       radius: 24,
// //       backgroundColor: Colors.black.withValues(alpha: 0.2),
// //       child: IconButton(
// //         icon: iconOrAsset is IconData
// //             ? Icon(iconOrAsset, color: Colors.white)
// //             : Image.asset(
// //                 iconOrAsset,
// //                 width: 24,
// //                 height: 24,
// //                 color: Colors.white,
// //               ),
// //         onPressed: onPressed,
// //       ),
// //     );
// //   }

// //   Widget _buildCircleButton(String label, {required VoidCallback onPressed}) {
// //     return CircleAvatar(
// //       radius: 24,
// //       backgroundColor: Colors.black.withValues(alpha: 0.2),
// //       child: TextButton(
// //         onPressed: onPressed,
// //         child: Text(
// //           label,
// //           style: const TextStyle(color: Colors.white, fontSize: 12),
// //         ),
// //       ),
// //     );
// //   }

// //   void _toggleSlider(SliderType type) {
// //     setState(() {
// //       _activeSlider = (_activeSlider == type) ? SliderType.none : type;
// //     });
// //   }

// //   Widget _buildTopPill(String label) {
// //     return Container(
// //       padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
// //       decoration: BoxDecoration(
// //         color: Colors.black.withValues(alpha: 0.6),
// //         borderRadius: BorderRadius.circular(24),
// //       ),
// //       child: Text(
// //         label,
// //         style: const TextStyle(
// //           color: Colors.white,
// //           fontWeight: FontWeight.w600,
// //         ),
// //       ),
// //     );
// //   }

// //   double _getSliderValue() {
// //     switch (_activeSlider) {
// //       case SliderType.numItems:
// //         return _numItemsThreshold.toDouble();
// //       case SliderType.confidence:
// //         return _confidenceThreshold;
// //       case SliderType.iou:
// //         return _iouThreshold;
// //       default:
// //         return 0;
// //     }
// //   }

// //   double _getSliderMin() => _activeSlider == SliderType.numItems ? 5 : 0.1;

// //   double _getSliderMax() => _activeSlider == SliderType.numItems ? 50 : 0.9;

// //   int _getSliderDivisions() => _activeSlider == SliderType.numItems ? 9 : 8;

// //   String _getSliderLabel() {
// //     switch (_activeSlider) {
// //       case SliderType.numItems:
// //         return '$_numItemsThreshold';
// //       case SliderType.confidence:
// //         return _confidenceThreshold.toStringAsFixed(1);
// //       case SliderType.iou:
// //         return _iouThreshold.toStringAsFixed(1);
// //       default:
// //         return '';
// //     }
// //   }

// //   void _updateSliderValue(double value) {
// //     switch (_activeSlider) {
// //       case SliderType.numItems:
// //         _numItemsThreshold = value.toInt();
// //         if (_useController) {
// //           _yoloController.setNumItemsThreshold(_numItemsThreshold);
// //         } else {
// //           _yoloViewKey.currentState?.setNumItemsThreshold(_numItemsThreshold);
// //         }
// //         break;
// //       case SliderType.confidence:
// //         _confidenceThreshold = value;
// //         if (_useController) {
// //           _yoloController.setConfidenceThreshold(value);
// //         } else {
// //           _yoloViewKey.currentState?.setConfidenceThreshold(value);
// //         }
// //         break;
// //       case SliderType.iou:
// //         _iouThreshold = value;
// //         if (_useController) {
// //           _yoloController.setIoUThreshold(value);
// //         } else {
// //           _yoloViewKey.currentState?.setIoUThreshold(value);
// //         }
// //         break;
// //       default:
// //         break;
// //     }
// //   }

// //   void _setZoomLevel(double zoomLevel) {
// //     setState(() {
// //       _currentZoomLevel = zoomLevel;
// //     });
// //     if (_useController) {
// //       _yoloController.setZoomLevel(zoomLevel);
// //     } else {
// //       _yoloViewKey.currentState?.setZoomLevel(zoomLevel);
// //     }
// //   }

// //   Widget _buildModelSelector() {
// //     return Container(
// //       height: 36,
// //       padding: const EdgeInsets.all(2),
// //       decoration: BoxDecoration(
// //         color: Colors.black.withValues(alpha: 0.6),
// //         borderRadius: BorderRadius.circular(8),
// //       ),
// //       child: Row(
// //         mainAxisSize: MainAxisSize.min,
// //         children: ModelType.values.map((model) {
// //           final isSelected = _selectedModel == model;
// //           return GestureDetector(
// //             onTap: () {
// //               if (!_isModelLoading && model != _selectedModel) {
// //                 setState(() {
// //                   _selectedModel = model;
// //                 });
// //                 _loadModelForPlatform();
// //               }
// //             },
// //             child: Container(
// //               padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
// //               decoration: BoxDecoration(
// //                 color: isSelected ? Colors.white : Colors.transparent,
// //                 borderRadius: BorderRadius.circular(6),
// //               ),
// //               child: Text(
// //                 model.name.toUpperCase(),
// //                 style: TextStyle(
// //                   color: isSelected ? Colors.black : Colors.white,
// //                   fontSize: 12,
// //                   fontWeight: FontWeight.w600,
// //                 ),
// //               ),
// //             ),
// //           );
// //         }).toList(),
// //       ),
// //     );
// //   }

// //   Future<void> _loadModelForPlatform() async {
// //     setState(() {
// //       _isModelLoading = true;
// //       _loadingMessage = 'Loading ${_selectedModel.modelName} model...';
// //       _downloadProgress = 0.0;
// //       _detectionCount = 0;
// //       _currentFps = 0.0;
// //       _detectedIngredients = [];
// //       _foodsWithIngredients = [];
// //       _recommendationFoods = [];
// //     });

// //     try {
// //       final modelPath = await _modelManager.getModelPath(_selectedModel);
// //       debugPrint(
// //         '[CameraInferenceScreen] ModelManager returned path: $modelPath',
// //       );

// //       if (mounted) {
// //         setState(() {
// //           _modelPath = modelPath;
// //           _isModelLoading = false;
// //           _loadingMessage = '';
// //           _downloadProgress = 0.0;
// //         });

// //         debugPrint('[CameraInferenceScreen] Set _modelPath to: $_modelPath');

// //         if (modelPath == null) {
// //           // Model loading failed
// //           showDialog(
// //             context: context,
// //             builder: (context) => AlertDialog(
// //               title: const Text('Model Not Available'),
// //               content: Text(
// //                 'Failed to load ${_selectedModel.modelName} model. Please check your internet connection and try again.',
// //               ),
// //               actions: [
// //                 TextButton(
// //                   onPressed: () => Navigator.pop(context),
// //                   child: const Text('OK'),
// //                 ),
// //               ],
// //             ),
// //           );
// //         }
// //       }
// //     } catch (e) {
// //       debugPrint('Error loading model: $e');
// //       if (mounted) {
// //         setState(() {
// //           _isModelLoading = false;
// //           _loadingMessage = 'Failed to load model';
// //           _downloadProgress = 0.0;
// //         });
// //         // Show error dialog
// //         showDialog(
// //           context: context,
// //           builder: (context) => AlertDialog(
// //             title: const Text('Model Loading Error'),
// //             content: Text(
// //               'Failed to load ${_selectedModel.modelName} model: ${e.toString()}',
// //             ),
// //             actions: [
// //               TextButton(
// //                 onPressed: () => Navigator.pop(context),
// //                 child: const Text('OK'),
// //               ),
// //             ],
// //           ),
// //         );
// //       }
// //     }
// //   }

// //   /// Helper method to compare two string lists for equality
// //   bool _areListsEqual(List<String> list1, List<String> list2) {
// //     if (list1.length != list2.length) return false;

// //     // Sort both lists to compare content regardless of order
// //     final sorted1 = List<String>.from(list1)..sort();
// //     final sorted2 = List<String>.from(list2)..sort();

// //     for (int i = 0; i < sorted1.length; i++) {
// //       if (sorted1[i] != sorted2[i]) return false;
// //     }

// //     return true;
// //   }
// // }

// import 'package:flutter/material.dart';
// import 'package:naitei_flutter_2025_khanhbh_project1/business/camera/api_service.dart';
// import 'package:naitei_flutter_2025_khanhbh_project1/business/camera/dish_service.dart';
// import 'package:naitei_flutter_2025_khanhbh_project1/business/camera/model_manager.dart';
// import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/dual_dish_list_widget.dart';
// import 'package:naitei_flutter_2025_khanhbh_project1/utils/routes/app_routes.dart';
// import 'package:naitei_flutter_2025_khanhbh_project1/data/model/camera/dish_model.dart';
// import 'package:naitei_flutter_2025_khanhbh_project1/data/model/camera/model_type.dart';
// import 'package:naitei_flutter_2025_khanhbh_project1/data/model/camera/slider_type.dart';
// import 'package:ultralytics_yolo/ultralytics_yolo.dart';

// class CameraInferenceScreen extends StatefulWidget {
//   const CameraInferenceScreen({super.key});

//   @override
//   State<CameraInferenceScreen> createState() => _CameraInferenceScreenState();
// }

// class _CameraInferenceScreenState extends State<CameraInferenceScreen> {
//   int _detectionCount = 0;
//   double _confidenceThreshold = 0.5;
//   double _iouThreshold = 0.45;
//   int _numItemsThreshold = 30;
//   double _currentFps = 0.0;

//   SliderType _activeSlider = SliderType.none;
//   ModelType _selectedModel = ModelType.detect;
//   bool _isModelLoading = false;
//   String? _modelPath;
//   String _loadingMessage = '';
//   double _downloadProgress = 0.0;
//   double _currentZoomLevel = 1.0;
//   bool _isFrontCamera = false;

//   // final _yoloController = YOLOViewController();
//   // final _yoloViewKey = GlobalKey<YOLOViewState>();
//   // final bool _useController = true;
//   // final GlobalKey<YOLOViewState> _yoloViewKey = GlobalKey<YOLOViewState>();

//   late final ModelManager _modelManager;

//   List<String> _detectedIngredients = [];
//   List<DishModel> _foodsWithIngredients = [];
//   List<DishModel> _recommendationFoods = [];
//   bool _isDishLoading = false;

//   final Map<String, DateTime> _ingredientLastSeen = {};
//   final Duration _ingredientTimeout = const Duration(seconds: 5);

//   DateTime? _lastApiCall;
//   final Duration _apiDebounceDelay = const Duration(seconds: 3);

//   List<String> _previousIngredients = [];

//   static const int _userId = 1;

//   @override
//   void initState() {
//     super.initState();
//     _modelManager = ModelManager(
//       onDownloadProgress: (progress) {
//         if (mounted) setState(() => _downloadProgress = progress);
//       },
//       onStatusUpdate: (message) {
//         if (mounted) setState(() => _loadingMessage = message);
//       },
//     );
//     _loadModelForPlatform();

//     WidgetsBinding.instance.addPostFrameCallback((_) {
//       if (_useController) {
//         _yoloController.setThresholds(
//           confidenceThreshold: _confidenceThreshold,
//           iouThreshold: _iouThreshold,
//           numItemsThreshold: _numItemsThreshold,
//         );
//       } else {
//         _yoloViewKey.currentState?.setThresholds(
//           confidenceThreshold: _confidenceThreshold,
//           iouThreshold: _iouThreshold,
//           numItemsThreshold: _numItemsThreshold,
//         );
//       }
//     });
//   }

//   void _onDetectionResults(List<YOLOResult> results) {
//     if (!mounted) return;
//     final now = DateTime.now();
//     final currentDetectedIngredients = <String>[];

//     for (var result in results) {
//       if (result.confidence > 0.6) {
//         final normalizedIngredient = DishService.normalizeIngredientName(
//           result.className,
//         );
//         if (normalizedIngredient.isNotEmpty) {
//           currentDetectedIngredients.add(normalizedIngredient);
//           _ingredientLastSeen[normalizedIngredient] = now;
//         }
//       }
//     }

//     _ingredientLastSeen.removeWhere(
//       (key, lastSeen) => now.difference(lastSeen) > _ingredientTimeout,
//     );

//     final allActiveIngredients = _ingredientLastSeen.keys.toList();
//     setState(() {
//       _detectionCount = results.length;
//       _detectedIngredients = allActiveIngredients;
//     });

//     final ingredientsChanged = !_areListsEqual(
//       allActiveIngredients,
//       _previousIngredients,
//     );

//     if (allActiveIngredients.isNotEmpty && ingredientsChanged) {
//       if (_lastApiCall == null ||
//           now.difference(_lastApiCall!) > _apiDebounceDelay) {
//         _lastApiCall = now;
//         _previousIngredients = List.from(allActiveIngredients);
//         _fetchDishRecommendations(allActiveIngredients);
//       }
//     }

//     if (allActiveIngredients.isEmpty) _previousIngredients.clear();

//     for (var i = 0; i < results.length && i < 3; i++) {
//       final r = results[i];
//       debugPrint(
//         'Detection $i: ${r.className} (${(r.confidence * 100).toStringAsFixed(1)}%) at ${r.boundingBox}',
//       );
//     }
//   }

//   Future<void> _fetchDishRecommendations(List<String> ingredients) async {
//     if (_isDishLoading) return;
//     setState(() => _isDishLoading = true);
//     try {
//       final result = await ApiService.getRecommendationsByIngredients(
//         userId: _userId,
//         detectedIngredients: ingredients,
//         topK: 5,
//         alpha: 0.5,
//       );
//       if (mounted) {
//         setState(() {
//           _foodsWithIngredients = result['foods_with_ingredients'] ?? [];
//           _recommendationFoods = result['recommendation_foods'] ?? [];
//           _isDishLoading = false;
//         });
//       }
//     } catch (e) {
//       debugPrint('Error fetching dish recommendations: $e');
//       if (mounted) setState(() => _isDishLoading = false);
//     }
//   }

//   @override
//   Widget build(BuildContext context) {
//     final orientation = MediaQuery.of(context).orientation;
//     final isLandscape = orientation == Orientation.landscape;
//     final screenHeight = MediaQuery.of(context).size.height;
//     final cameraHeight = screenHeight * 0.33;

//     return Scaffold(
//       appBar: AppBar(
//         leading: IconButton(
//           icon: const Icon(Icons.arrow_back),
//           onPressed: () => Navigator.pushNamedAndRemoveUntil(
//             context,
//             AppRoutes.home,
//             (route) => false,
//           ),
//         ),
//       ),
//       body: Column(
//         children: [
//           SizedBox(
//             height: cameraHeight,
//             child: Stack(
//               children: [
//                 _buildCameraView(),
//                 _buildTopOverlay(isLandscape),
//                 _buildRightControls(isLandscape),
//                 if (_activeSlider != SliderType.none)
//                   _buildBottomSlider(isLandscape),
//                 _buildFlipCameraButton(isLandscape),
//               ],
//             ),
//           ),
//           if (_detectedIngredients.isNotEmpty) _buildDetectedIngredientsList(),
//           Expanded(child: _buildSuggestedDishes()),
//         ],
//       ),
//     );
//   }

//   /// --- WIDGET BUILD HELPERS ---

//   Widget _buildCameraView() {
//     if (_modelPath != null && !_isModelLoading) {
//       return YOLOView(
//         // key: _useController ? const ValueKey('yolo_view_static') : _yoloViewKey,
//         // controller: _useController ? _yoloController : null,
//         // modelPath: _modelPath!,
//         // task: _selectedModel.task,
//         // streamingConfig: const YOLOStreamingConfig.minimal(),
//         // onResult: _onDetectionResults,
//         // onPerformanceMetrics: (metrics) {
//         //   if (mounted) setState(() => _currentFps = metrics.fps);
//         // },
//         // onZoomChanged: (zoomLevel) {
//         //   if (mounted) setState(() => _currentZoomLevel = zoomLevel);
//         // },
//         modelPath: _modelPath!,
//         task: _selectedModel.task,
//         streamingConfig: const YOLOStreamingConfig.minimal(),
//         onResult: _onDetectionResults,
//         onPerformanceMetrics: (metrics) {
//           if (mounted) {
//             setState(() {
//               _currentFps = metrics.fps;
//             });
//           }
//         },
//         onZoomChanged: (zoom) {
//           if (mounted) {
//             setState(() {
//               _currentZoomLevel = zoom;
//             });
//           }
//         },
//       );
//     } else if (_isModelLoading) {
//       return _buildLoadingOverlay();
//     } else {
//       return const Center(
//         child: Text('No model loaded', style: TextStyle(color: Colors.white)),
//       );
//     }
//   }

//   Widget _buildLoadingOverlay() {
//     return Container(
//       color: Colors.black87,
//       child: Center(
//         child: Column(
//           mainAxisAlignment: MainAxisAlignment.center,
//           children: [
//             Icon(
//               Icons.camera_alt,
//               size: 120,
//               color: Colors.white.withOpacity(0.8),
//             ),
//             const SizedBox(height: 32),
//             Text(
//               _loadingMessage,
//               style: const TextStyle(
//                 color: Colors.white,
//                 fontSize: 16,
//                 fontWeight: FontWeight.w500,
//               ),
//               textAlign: TextAlign.center,
//             ),
//             const SizedBox(height: 24),
//             if (_downloadProgress > 0)
//               Column(
//                 children: [
//                   SizedBox(
//                     width: 200,
//                     child: LinearProgressIndicator(
//                       value: _downloadProgress,
//                       backgroundColor: Colors.white24,
//                       valueColor: const AlwaysStoppedAnimation(Colors.white),
//                       minHeight: 4,
//                     ),
//                   ),
//                   const SizedBox(height: 12),
//                   Text(
//                     '${(_downloadProgress * 100).toStringAsFixed(1)}%',
//                     style: const TextStyle(color: Colors.white, fontSize: 14),
//                   ),
//                 ],
//               ),
//           ],
//         ),
//       ),
//     );
//   }

//   Widget _buildTopOverlay(bool isLandscape) {
//     return Positioned(
//       top: MediaQuery.of(context).padding.top + (isLandscape ? 8 : 16),
//       left: isLandscape ? 8 : 16,
//       right: isLandscape ? 8 : 16,
//       child: Column(
//         crossAxisAlignment: CrossAxisAlignment.center,
//         children: [
//           _buildModelSelector(),
//           SizedBox(height: isLandscape ? 8 : 12),
//           Row(
//             mainAxisAlignment: MainAxisAlignment.center,
//             children: [
//               Text(
//                 'DETECTIONS: $_detectionCount',
//                 style: const TextStyle(
//                   color: Colors.white,
//                   fontWeight: FontWeight.w600,
//                 ),
//               ),
//               const SizedBox(width: 16),
//               Text(
//                 'FPS: ${_currentFps.toStringAsFixed(1)}',
//                 style: const TextStyle(
//                   color: Colors.white,
//                   fontWeight: FontWeight.w600,
//                 ),
//               ),
//             ],
//           ),
//           const SizedBox(height: 8),
//           if (_activeSlider == SliderType.confidence)
//             _buildTopPill(
//               'CONFIDENCE THRESHOLD: ${_confidenceThreshold.toStringAsFixed(2)}',
//             ),
//           if (_activeSlider == SliderType.iou)
//             _buildTopPill('IOU THRESHOLD: ${_iouThreshold.toStringAsFixed(2)}'),
//           if (_activeSlider == SliderType.numItems)
//             _buildTopPill('ITEMS MAX: $_numItemsThreshold'),
//         ],
//       ),
//     );
//   }

//   Widget _buildRightControls(bool isLandscape) {
//     return Positioned(
//       bottom: isLandscape ? 16 : 32,
//       right: isLandscape ? 8 : 16,
//       child: Column(
//         children: [
//           if (!_isFrontCamera)
//             _buildCircleButton(
//               '${_currentZoomLevel.toStringAsFixed(1)}x',
//               onPressed: _cycleZoom,
//             ),
//           SizedBox(height: isLandscape ? 8 : 12),
//           _buildIconButton(
//             Icons.layers,
//             () => _toggleSlider(SliderType.numItems),
//           ),
//           SizedBox(height: isLandscape ? 8 : 12),
//           _buildIconButton(
//             Icons.adjust,
//             () => _toggleSlider(SliderType.confidence),
//           ),
//           SizedBox(height: isLandscape ? 8 : 12),
//           _buildIconButton(Icons.tune, () => _toggleSlider(SliderType.iou)),
//           SizedBox(height: isLandscape ? 16 : 40),
//         ],
//       ),
//     );
//   }

//   Widget _buildFlipCameraButton(bool isLandscape) {
//     return Positioned(
//       top: MediaQuery.of(context).padding.top + (isLandscape ? 8 : 16),
//       left: isLandscape ? 8 : 16,
//       child: CircleAvatar(
//         radius: isLandscape ? 20 : 24,
//         backgroundColor: Colors.black.withOpacity(0.5),
//         child: IconButton(
//           icon: const Icon(Icons.flip_camera_ios, color: Colors.white),
//           onPressed: () {
//             setState(() {
//               _isFrontCamera = !_isFrontCamera;
//               _currentZoomLevel = 1.0;
//             });
//             if (_useController) {
//               _yoloController.switchCamera();
//             } else {
//               _yoloViewKey.currentState?.switchCamera();
//             }
//           },
//         ),
//       ),
//     );
//   }

//   Widget _buildDetectedIngredientsList() {
//     return Container(
//       width: double.infinity,
//       padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
//       decoration: BoxDecoration(
//         color: Colors.blue[50],
//         border: Border(
//           top: BorderSide(color: Colors.grey[300]!, width: 1),
//           bottom: BorderSide(color: Colors.grey[300]!, width: 1),
//         ),
//       ),
//       child: Column(
//         crossAxisAlignment: CrossAxisAlignment.start,
//         children: [
//           Row(
//             children: [
//               Icon(Icons.visibility, color: Colors.blue[700], size: 20),
//               const SizedBox(width: 8),
//               Text(
//                 'Nguyên liệu đã phát hiện',
//                 style: TextStyle(
//                   fontSize: 14,
//                   fontWeight: FontWeight.w600,
//                   color: Colors.blue[700],
//                 ),
//               ),
//             ],
//           ),
//           const SizedBox(height: 8),
//           Wrap(
//             spacing: 8,
//             runSpacing: 6,
//             children: _detectedIngredients.map((ingredient) {
//               return Container(
//                 padding: const EdgeInsets.symmetric(
//                   horizontal: 12,
//                   vertical: 6,
//                 ),
//                 decoration: BoxDecoration(
//                   color: Colors.blue[100],
//                   borderRadius: BorderRadius.circular(16),
//                   border: Border.all(color: Colors.blue[300]!),
//                 ),
//                 child: Text(
//                   ingredient,
//                   style: TextStyle(
//                     fontSize: 12,
//                     color: Colors.blue[800],
//                     fontWeight: FontWeight.w500,
//                   ),
//                 ),
//               );
//             }).toList(),
//           ),
//         ],
//       ),
//     );
//   }

//   Widget _buildSuggestedDishes() {
//     return Container(
//       decoration: BoxDecoration(
//         color: Colors.grey[100],
//         border: Border(top: BorderSide(color: Colors.grey[300]!, width: 1)),
//       ),
//       child: Column(
//         children: [
//           Container(
//             padding: const EdgeInsets.all(16),
//             child: Row(
//               children: [
//                 Icon(
//                   Icons.restaurant_menu,
//                   color: Colors.orange[700],
//                   size: 24,
//                 ),
//                 const SizedBox(width: 8),
//                 const Text(
//                   'Suggested Dishes',
//                   style: TextStyle(
//                     fontSize: 18,
//                     fontWeight: FontWeight.bold,
//                     color: Colors.black87,
//                   ),
//                 ),
//                 const Spacer(),
//                 if (_detectedIngredients.isNotEmpty)
//                   Container(
//                     padding: const EdgeInsets.symmetric(
//                       horizontal: 8,
//                       vertical: 4,
//                     ),
//                     decoration: BoxDecoration(
//                       color: Colors.green[100],
//                       borderRadius: BorderRadius.circular(12),
//                       border: Border.all(color: Colors.green[300]!),
//                     ),
//                     child: Text(
//                       '${_detectedIngredients.length} ingredients',
//                       style: TextStyle(
//                         fontSize: 12,
//                         color: Colors.green[800],
//                         fontWeight: FontWeight.w500,
//                       ),
//                     ),
//                   ),
//               ],
//             ),
//           ),
//           Expanded(
//             child: DualDishListWidget(
//               foodsWithIngredients: _foodsWithIngredients,
//               recommendationFoods: _recommendationFoods,
//               detectedIngredients: _detectedIngredients,
//               isLoading: _isDishLoading,
//               onDishTap: (id) =>
//                   Navigator.pushNamed(context, AppRoutes.detail, arguments: id),
//             ),
//           ),
//         ],
//       ),
//     );
//   }

//   /// --- UTILITIES ---

//   bool _areListsEqual(List<String> list1, List<String> list2) {
//     if (list1.length != list2.length) return false;
//     final sorted1 = List<String>.from(list1)..sort();
//     final sorted2 = List<String>.from(list2)..sort();
//     for (var i = 0; i < sorted1.length; i++) {
//       if (sorted1[i] != sorted2[i]) return false;
//     }
//     return true;
//   }

//   void _toggleSlider(SliderType type) => setState(() {
//     _activeSlider = (_activeSlider == type) ? SliderType.none : type;
//   });

//   void _cycleZoom() {
//     double nextZoom;
//     if (_currentZoomLevel < 0.75)
//       nextZoom = 1.0;
//     else if (_currentZoomLevel < 2.0)
//       nextZoom = 3.0;
//     else
//       nextZoom = 0.5;
//     _setZoomLevel(nextZoom);
//   }

//   void _setZoomLevel(double zoomLevel) {
//     setState(() => _currentZoomLevel = zoomLevel);
//     if (_useController)
//       _yoloController.setZoomLevel(zoomLevel);
//     else
//       _yoloViewKey.currentState?.setZoomLevel(zoomLevel);
//   }

//   Widget _buildIconButton(IconData icon, VoidCallback onPressed) {
//     return CircleAvatar(
//       radius: 24,
//       backgroundColor: Colors.black.withOpacity(0.2),
//       child: IconButton(
//         icon: Icon(icon, color: Colors.white),
//         onPressed: onPressed,
//       ),
//     );
//   }

//   Widget _buildCircleButton(String label, {required VoidCallback onPressed}) {
//     return CircleAvatar(
//       radius: 24,
//       backgroundColor: Colors.black.withOpacity(0.2),
//       child: TextButton(
//         onPressed: onPressed,
//         child: Text(
//           label,
//           style: const TextStyle(color: Colors.white, fontSize: 12),
//         ),
//       ),
//     );
//   }

//   Widget _buildTopPill(String label) {
//     return Container(
//       padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
//       decoration: BoxDecoration(
//         color: Colors.black.withOpacity(0.6),
//         borderRadius: BorderRadius.circular(24),
//       ),
//       child: Text(
//         label,
//         style: const TextStyle(
//           color: Colors.white,
//           fontWeight: FontWeight.w600,
//         ),
//       ),
//     );
//   }

//   Widget _buildBottomSlider(bool isLandscape) {
//     return Positioned(
//       left: 0,
//       right: 0,
//       bottom: 0,
//       child: Container(
//         padding: EdgeInsets.symmetric(
//           horizontal: isLandscape ? 16 : 24,
//           vertical: isLandscape ? 8 : 12,
//         ),
//         color: Colors.black.withOpacity(0.8),
//         child: Slider(
//           value: _getSliderValue(),
//           min: _getSliderMin(),
//           max: _getSliderMax(),
//           divisions: _getSliderDivisions(),
//           label: _getSliderLabel(),
//           activeColor: Colors.yellow,
//           inactiveColor: Colors.white.withOpacity(0.3),
//           onChanged: (value) => setState(() => _updateSliderValue(value)),
//         ),
//       ),
//     );
//   }

//   double _getSliderValue() {
//     switch (_activeSlider) {
//       case SliderType.numItems:
//         return _numItemsThreshold.toDouble();
//       case SliderType.confidence:
//         return _confidenceThreshold;
//       case SliderType.iou:
//         return _iouThreshold;
//       default:
//         return 0;
//     }
//   }

//   double _getSliderMin() => _activeSlider == SliderType.numItems ? 5 : 0.1;
//   double _getSliderMax() => _activeSlider == SliderType.numItems ? 50 : 0.9;
//   int _getSliderDivisions() => _activeSlider == SliderType.numItems ? 9 : 8;
//   String _getSliderLabel() {
//     switch (_activeSlider) {
//       case SliderType.numItems:
//         return '$_numItemsThreshold';
//       case SliderType.confidence:
//         return _confidenceThreshold.toStringAsFixed(2);
//       case SliderType.iou:
//         return _iouThreshold.toStringAsFixed(2);
//       default:
//         return '';
//     }
//   }

//   void _updateSliderValue(double value) {
//     switch (_activeSlider) {
//       case SliderType.numItems:
//         _numItemsThreshold = value.toInt();
//         if (_useController)
//           _yoloController.setNumItemsThreshold(_numItemsThreshold);
//         else
//           _yoloViewKey.currentState?.setNumItemsThreshold(_numItemsThreshold);
//         break;
//       case SliderType.confidence:
//         _confidenceThreshold = value;
//         if (_useController)
//           _yoloController.setConfidenceThreshold(value);
//         else
//           _yoloViewKey.currentState?.setConfidenceThreshold(value);
//         break;
//       case SliderType.iou:
//         _iouThreshold = value;
//         if (_useController)
//           _yoloController.setIoUThreshold(value);
//         else
//           _yoloViewKey.currentState?.setIoUThreshold(value);
//         break;
//       default:
//         break;
//     }
//   }

//   Widget _buildModelSelector() {
//     return Container(
//       height: 36,
//       padding: const EdgeInsets.all(2),
//       decoration: BoxDecoration(
//         color: Colors.black.withOpacity(0.6),
//         borderRadius: BorderRadius.circular(8),
//       ),
//       child: Row(
//         mainAxisSize: MainAxisSize.min,
//         children: ModelType.values.map((model) {
//           final isSelected = _selectedModel == model;
//           return GestureDetector(
//             onTap: () {
//               if (!_isModelLoading && model != _selectedModel) {
//                 setState(() => _selectedModel = model);
//                 _loadModelForPlatform();
//               }
//             },
//             child: Container(
//               padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
//               decoration: BoxDecoration(
//                 color: isSelected ? Colors.white : Colors.transparent,
//                 borderRadius: BorderRadius.circular(6),
//               ),
//               child: Text(
//                 model.name.toUpperCase(),
//                 style: TextStyle(
//                   color: isSelected ? Colors.black : Colors.white,
//                   fontSize: 12,
//                   fontWeight: FontWeight.w600,
//                 ),
//               ),
//             ),
//           );
//         }).toList(),
//       ),
//     );
//   }

//   Future<void> _loadModelForPlatform() async {
//     setState(() {
//       _isModelLoading = true;
//       _loadingMessage = 'Loading ${_selectedModel.modelName} model...';
//       _downloadProgress = 0.0;
//       _detectionCount = 0;
//       _currentFps = 0.0;
//       _detectedIngredients = [];
//       _foodsWithIngredients = [];
//       _recommendationFoods = [];
//     });

//     try {
//       final modelPath = await _modelManager.getModelPath(_selectedModel);
//       if (mounted) {
//         setState(() {
//           _modelPath = modelPath;
//           _isModelLoading = false;
//           _loadingMessage = '';
//           _downloadProgress = 0.0;
//         });
//         if (modelPath == null) {
//           _showErrorDialog(
//             'Model Not Available',
//             'Failed to load ${_selectedModel.modelName} model. Please check your internet connection and try again.',
//           );
//         }
//       }
//     } catch (e) {
//       if (mounted) {
//         setState(() {
//           _isModelLoading = false;
//           _loadingMessage = 'Failed to load model';
//           _downloadProgress = 0.0;
//         });
//         _showErrorDialog(
//           'Model Loading Error',
//           'Failed to load ${_selectedModel.modelName} model: $e',
//         );
//       }
//     }
//   }

//   void _showErrorDialog(String title, String message) {
//     showDialog(
//       context: context,
//       builder: (_) => AlertDialog(
//         title: Text(title),
//         content: Text(message),
//         actions: [
//           TextButton(
//             onPressed: () => Navigator.pop(context),
//             child: const Text('OK'),
//           ),
//         ],
//       ),
//     );
//   }
// }

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

