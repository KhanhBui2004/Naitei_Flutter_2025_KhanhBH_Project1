import 'package:flutter_test/flutter_test.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/camera/slider_type.dart';

void main() {
  group('SliderType Enum Test', () {
    test('SliderType phải có đúng 4 giá trị định nghĩa', () {
      expect(SliderType.values.length, 4);
    });

    test('Các giá trị enum phải được định nghĩa đúng tên', () {
      expect(SliderType.none.name, 'none');
      expect(SliderType.numItems.name, 'numItems');
      expect(SliderType.confidence.name, 'confidence');
      expect(SliderType.iou.name, 'iou');
    });

    test('Kiểm tra thứ tự index (nếu logic của bạn phụ thuộc vào index)', () {
      expect(SliderType.none.index, 0);
      expect(SliderType.iou.index, 3);
    });
  });
}
