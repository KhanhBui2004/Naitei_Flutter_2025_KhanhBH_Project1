import 'package:flutter/material.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/food_model.dart';

class ListFoodCard extends StatelessWidget {
  final Food dish;
  final double rating;

  const ListFoodCard({super.key, required this.dish, required this.rating});

  @override
  Widget build(BuildContext context) {
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
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  width: 80,
                  height: 80,
                  color: Colors.grey[200],
                  child: dish.imageLink.isNotEmpty
                      ? Image.network(
                          dish.imageLink,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => _fallbackIcon(),
                        )
                      : _fallbackIcon(),
                ),
              ),

              const SizedBox(width: 12),

              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      dish.dishName,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),

                    const SizedBox(height: 4),

                    Text(
                      dish.description,
                      style: TextStyle(color: Colors.grey[600], fontSize: 14),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),

                    const SizedBox(height: 8),

                    Row(
                      children: [
                        _infoItem(Icons.access_time, '${dish.cookingTime}p'),
                        const SizedBox(width: 12),
                        _infoItem(Icons.people, dish.servingSize),
                        const SizedBox(width: 12),
                        _infoItem(Icons.star, '$rating'),
                      ],
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

  Widget _fallbackIcon() {
    return Icon(Icons.restaurant, color: Colors.grey[400], size: 32);
  }

  Widget _infoItem(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 14, color: Colors.grey[600]),
        const SizedBox(width: 4),
        Text(text, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
      ],
    );
  }
}
