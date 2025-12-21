import 'package:flutter/material.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/camera/dish_model.dart';

class DualDishListWidget extends StatelessWidget {
  final List<DishModel> foodsWithIngredients;
  final List<DishModel> recommendationFoods;
  final List<String> detectedIngredients;
  final bool isLoading;

  final Function(String)? onDishTap;

  const DualDishListWidget({
    super.key,
    required this.foodsWithIngredients,
    required this.recommendationFoods,
    required this.detectedIngredients,
    this.isLoading = false,
    this.onDishTap,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32.0),
          child: CircularProgressIndicator(),
        ),
      );
    }

    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(bottom: BorderSide(color: Colors.grey[300]!)),
            ),
            child: TabBar(
              labelColor: Colors.orange[700],
              unselectedLabelColor: Colors.grey[600],
              indicatorColor: Colors.orange[700],
              tabs: [
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.restaurant, size: 16),
                      const SizedBox(width: 4),
                      Text('Có nguyên liệu (${foodsWithIngredients.length})'),
                    ],
                  ),
                ),
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.thumb_up, size: 16),
                      const SizedBox(width: 4),
                      Text('Gợi ý (${recommendationFoods.length})'),
                    ],
                  ),
                ),
              ],
            ),
          ),

          Expanded(
            child: TabBarView(
              children: [
                _buildFoodList(
                  foods: foodsWithIngredients,
                  emptyMessage:
                      'Chưa phát hiện nguyên liệu nào.\nHãy hướng camera về các nguyên liệu để tìm món ăn!',
                  showMatchingInfo: true,
                ),

                _buildFoodList(
                  foods: recommendationFoods,
                  emptyMessage:
                      'Chưa có gợi ý món ăn.\nHệ thống sẽ gợi ý món ăn phù hợp với sở thích của bạn.',
                  showMatchingInfo: false,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFoodList({
    required List<DishModel> foods,
    required String emptyMessage,
    required bool showMatchingInfo,
  }) {
    if (foods.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.restaurant_menu, size: 64, color: Colors.grey[400]),
              const SizedBox(height: 16),
              Text(
                emptyMessage,
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey[600], fontSize: 16),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(8.0),
      itemCount: foods.length,
      itemBuilder: (context, index) {
        final dish = foods[index];
        return InkWell(
          onTap: () => onDishTap?.call(dish.id),
          child: _buildDishCard(dish, showMatchingInfo),
        );
      },
    );
  }

  Widget _buildDishCard(DishModel dish, bool showMatchingInfo) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Dish image
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  width: 80,
                  height: 80,
                  color: Colors.grey[200],
                  child: dish.imageUrl != null && dish.imageUrl!.isNotEmpty
                      ? Image.network(
                          dish.imageUrl!,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return Icon(
                              Icons.restaurant,
                              color: Colors.grey[400],
                              size: 32,
                            );
                          },
                        )
                      : Icon(
                          Icons.restaurant,
                          color: Colors.grey[400],
                          size: 32,
                        ),
                ),
              ),

              const SizedBox(width: 12),

              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Dish name
                    Text(
                      dish.name,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),

                    const SizedBox(height: 4),

                    if (dish.description != null)
                      Text(
                        dish.description!,
                        style: TextStyle(color: Colors.grey[600], fontSize: 14),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),

                    const SizedBox(height: 8),

                    Row(
                      children: [
                        if (dish.cookingTime != null) ...[
                          Icon(
                            Icons.access_time,
                            size: 14,
                            color: Colors.grey[600],
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${dish.cookingTime}p',
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 12,
                            ),
                          ),
                          const SizedBox(width: 12),
                        ],

                        if (dish.servingSize != null) ...[
                          Icon(Icons.people, size: 14, color: Colors.grey[600]),
                          const SizedBox(width: 4),
                          Text(
                            dish.servingSize!,
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ],
                    ),

                    const SizedBox(height: 8),

                    if (showMatchingInfo && dish.matchingCount != null)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.green[100],
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.green[300]!),
                        ),
                        child: Text(
                          'Khớp ${dish.matchingCount} nguyên liệu',
                          style: TextStyle(
                            fontSize: 10,
                            color: Colors.green[800],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      )
                    else if (!showMatchingInfo && dish.score != null)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.blue[100],
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.blue[300]!),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.star, size: 12, color: Colors.blue[800]),
                            const SizedBox(width: 2),
                            Text(
                              dish.score!.toStringAsFixed(1),
                              style: TextStyle(
                                fontSize: 10,
                                color: Colors.blue[800],
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
