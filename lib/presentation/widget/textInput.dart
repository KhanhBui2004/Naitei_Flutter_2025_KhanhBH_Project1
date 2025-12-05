import 'package:flutter/material.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/constant.dart';

class TextInput extends StatelessWidget {
  final String hintText;
  final EdgeInsets padding;
  final TextEditingController? controller;
  final bool obscureText;
  final TextInputType keyboardType;

  const TextInput({
    super.key,
    required this.hintText,
    this.controller,
    this.padding = const EdgeInsets.only(left: 40),
    this.obscureText = false,
    this.keyboardType = TextInputType.text,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: MediaQuery.of(context).size.width * 0.85,
      height: 50,
      decoration: const ShapeDecoration(
        shape: StadiumBorder(),
        color: AppColors.placeholderBg,
      ),
      child: TextField(
        controller: controller,
        obscureText: obscureText,
        keyboardType: keyboardType,
        decoration: InputDecoration(
          border: InputBorder.none,
          hintText: hintText,
          hintStyle: const TextStyle(color: AppColors.placeholder),
          contentPadding: padding,
        ),
      ),
    );
  }
}
