import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/helper.dart'; // Thay path đúng

void main() {
  group('Helper Unit Test', () {
    
    test('getAssetName trả về đúng định dạng đường dẫn', () {
      final path = Helper.getAssetName('logo.png', 'icons');
      expect(path, 'assets/images/icons/logo.png');
    });

    testWidgets('getScreenWidth trả về chiều rộng màn hình chính xác', (WidgetTester tester) async {
      double? width;
      
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              width = Helper.getScreenWidth(context);
              return const SizedBox();
            },
          ),
        ),
      );

      expect(width, 800.0);
    });

    testWidgets('getScreenHeight trả về chiều cao màn hình chính xác', (WidgetTester tester) async {
      double? height;
      
      await tester.pumpWidget(
        MaterialApp( home: Builder( builder: (context) {
          height = Helper.getScreenHeight(context);
          return const SizedBox();
        }))
      );

      expect(height, 600.0);
    });
  });
}