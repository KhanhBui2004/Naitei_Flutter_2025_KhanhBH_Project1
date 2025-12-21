import 'package:flutter/material.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/service/food/food_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/allFoodView.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/routes/app_routes.dart';

class AllfoodPage extends StatefulWidget {
  const AllfoodPage({super.key});

  @override
  State<StatefulWidget> createState() => _AllFoodPageState();
}

class _AllFoodPageState extends State<AllfoodPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("All Foods")),
      body: AllFoodView(
        title: "",
        foodService: FoodService(),
        showMyFood: false,
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
