import 'package:flutter/material.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/services/food/food_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/allFoodView.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/routes/app_routes.dart';

class AllmyfoodPage extends StatelessWidget {
  const AllmyfoodPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("My Foods")),
      body: AllFoodView(
        title: "",
        foodService: FoodService(),
        showMyFood: true,
        onTapFood: (food) {
          Navigator.pushNamed(
            context,
            AppRoutes.detail,
            arguments: food.id.toString(),
          );
        },
      ),
    );
  }
}
