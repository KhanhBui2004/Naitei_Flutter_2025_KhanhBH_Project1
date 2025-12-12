import 'package:flutter/material.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/constant.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/helper.dart';

class Tagcard extends StatelessWidget {
  const Tagcard({super.key, required Image image, required String name})
    : _image = image,
      _name = name;

  final String _name;
  final Image _image;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: SizedBox(width: 100, height: 100, child: _image),
        ),
        SizedBox(height: 5),
        Text(
          _name,
          style: Helper.getTheme(
            context,
          ).headlineLarge?.copyWith(color: AppColors.primary, fontSize: 16),
        ),
      ],
    );
  }
}
