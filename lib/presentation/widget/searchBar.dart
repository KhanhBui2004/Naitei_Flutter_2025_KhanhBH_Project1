import 'package:flutter/material.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/constant.dart';

class SearchBar extends StatelessWidget {
  final String title;
  final ValueChanged<String>? onChanged; // ✅ thêm callback
  final ValueChanged<String>? onSubmitted; // ✅ thêm callback
  final TextEditingController? controller; // ✅ cho phép truyền controller

  const SearchBar({
    super.key,
    required this.title,
    this.onChanged,
    this.onSubmitted,
    this.controller,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        height: 50,
        width: double.infinity,
        decoration: ShapeDecoration(
          shape: const StadiumBorder(),
          color: AppColors.placeholderBg,
        ),
        child: TextField(
          controller: controller,
          decoration: InputDecoration(
            border: InputBorder.none,
            prefixIcon: Icon(Icons.search, size: 30),
            hintText: title,
            hintStyle: TextStyle(color: AppColors.placeholder, fontSize: 18),
            contentPadding: const EdgeInsets.only(top: 10, left: 10),
            suffixIcon: controller != null
                ? IconButton(
                    icon: const Icon(Icons.clear, color: Colors.grey),
                    onPressed: () {
                      controller!.clear();
                      if (onChanged != null) onChanged!('');
                    },
                  )
                : null,
          ),
          onChanged: onChanged,
          onSubmitted: onSubmitted,
        ),
      ),
    );
  }
}
