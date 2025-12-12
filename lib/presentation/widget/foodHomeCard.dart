import 'package:flutter/material.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/constant.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/helper.dart';

class FoodHomeCard extends StatelessWidget {
  const FoodHomeCard({
    super.key,
    required String name,
    required Image image,
    required double rating,
    required int count,
  }) : _image = image,
       _name = name,
       _rating = rating,
       _count = count;

  final String _name;
  final Image _image;
  final double _rating;
  final int _count;

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(vertical: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image responsive
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: SizedBox(
              width: double.infinity,
              height: screenWidth * 0.6,
              child: _image,
            ), // giảm chiều cao ảnh
          ),
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Text(_name, style: Helper.getTheme(context).displaySmall),
          ),
          const SizedBox(height: 5),
          // Row dài đổi thành Wrap
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Wrap(
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: 5,
              runSpacing: 5,
              children: [
                Icon(Icons.star, size: 18, color: Colors.amber),
                Text('$_rating', style: TextStyle(color: Colors.green)),
                _count == 0
                    ? Text("(Chưa có lượt đánh giá)")
                    : Text("($_count lượt đánh giá)"),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class MyFoodCard extends StatelessWidget {
  const MyFoodCard({
    super.key,
    required String name,
    required Image image,
    required double rating,
    required int count,
  }) : _name = name,
       _image = image,
       _rating = rating,
       _count = count;

  final String _name;
  final Image _image;
  final double _rating;
  final int _count;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 300,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min, // ✅ cho phép co lại
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: SizedBox(
              width: 300,
              height: 180,
              child: _image,
            ), // giảm chiều cao ảnh
          ),
          const SizedBox(height: 8),
          Flexible(
            child: Text(
              _name,
              style: Helper.getTheme(
                context,
              ).headlineLarge?.copyWith(color: AppColors.primary),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              // const Text("Cafe"),
              const SizedBox(width: 5),
              Icon(Icons.star, size: 18, color: Colors.amber),
              const SizedBox(width: 5),
              Text("$_rating", style: TextStyle(color: Colors.green)),
              const SizedBox(width: 5),
              _count == 0
                  ? Text("(Chưa có lượt đánh giá)")
                  : Text("($_count lượt đánh giá)"),
            ],
          ),
        ],
      ),
    );
  }
}
