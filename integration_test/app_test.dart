import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Luồng Nghiệp vụ Chính', () {
    testWidgets(
      'Đăng nhập, Xem chi tiết và Gửi đánh giá, trang favorite, profile, đăng xuất',
      (tester) async {
        app.main();
        await tester.pumpAndSettle();

        final usernameField = find.byType(TextField).at(0);
        final passwordField = find.byType(TextField).at(1);

        await tester.enterText(usernameField, 'khanhbui');
        await tester.enterText(passwordField, 'khanh123');

        FocusManager.instance.primaryFocus?.unfocus();
        await tester.pumpAndSettle();

        final loginButton = find.text('Login').last;
        await tester.tap(loginButton);
        await tester.pumpAndSettle(const Duration(seconds: 2));

        final foodCard = find.text('Thịt Gà Rang Lá Lốt').first;
        await tester.tap(foodCard);
        await tester.pumpAndSettle();

        final ratingBarFinder = find.byType(RatingBar);
        expect(ratingBarFinder, findsOneWidget);

        await tester.tap(ratingBarFinder);
        await tester.pumpAndSettle();

        expect(find.text('Ingredients'), findsOneWidget);

        final backButton = find.byIcon(Icons.arrow_back_ios_rounded);
        await tester.tap(backButton);
        await tester.pumpAndSettle();
        await Future.delayed(const Duration(seconds: 2));

        expect(find.text('Home'), findsWidgets);

        final favoriteTab = find.byIcon(Icons.favorite);
        await tester.tap(favoriteTab);
        await tester.pumpAndSettle();
        await Future.delayed(const Duration(seconds: 2));

        final profileTab = find.byIcon(Icons.person);
        await tester.tap(profileTab);
        await tester.pumpAndSettle();
        await Future.delayed(const Duration(seconds: 2));

        final logoutButton = find.byIcon(Icons.logout);
        await tester.tap(logoutButton);
        await tester.pumpAndSettle();
        await Future.delayed(const Duration(seconds: 1));

        expect(find.text('Logout'), findsOneWidget);
        await tester.tap(find.text('Đăng xuất'));
        await tester.pumpAndSettle();

        expect(find.text('Login'), findsWidgets);
        await Future.delayed(const Duration(seconds: 2));
      },
    );
  });
}
