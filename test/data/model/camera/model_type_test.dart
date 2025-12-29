import 'package:flutter_test/flutter_test.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/camera/model_type.dart';
import 'package:ultralytics_yolo/ultralytics_yolo.dart';

void main() {
  group('ModelType Enum Test', () {
    
    test('ModelType.detect phải có giá trị modelName và task chính xác', () {
      const model = ModelType.detect;

      expect(model.modelName, 'best_float32');

      expect(model.task, YOLOTask.detect);
    });

    test('Enum ModelType phải có đầy đủ các giá trị dự kiến', () {
      expect(ModelType.values.length, 1);
      
      expect(ModelType.values.contains(ModelType.detect), isTrue);
    });

    test('Kiểm tra tính bất biến của các thuộc tính', () {
      expect(ModelType.detect.modelName, isA<String>());
      expect(ModelType.detect.task, isA<YOLOTask>());
    });
  });
}