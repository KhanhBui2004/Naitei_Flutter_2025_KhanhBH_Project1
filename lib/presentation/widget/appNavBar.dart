import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/helper.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/routes/app_routes.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/constant.dart';

class AppNavbar extends StatefulWidget implements PreferredSizeWidget {
  final int selectedIndex;
  const AppNavbar({super.key, required this.selectedIndex});

  @override
  State<AppNavbar> createState() => _AppNavbarState();

  @override
  Size get preferredSize => const Size.fromHeight(120);
}

class _AppNavbarState extends State<AppNavbar> {
  Future<void> _checkToken() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');

    if (token == null || token.isEmpty) {
      // Token hết hạn hoặc bị xoá → tự đăng xuất
      if (!mounted) return;

      Navigator.of(
        context,
      ).pushNamedAndRemoveUntil(AppRoutes.login, (route) => false);
    }
  }

  Future<void> _logout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Logout"),
        content: const Text("Bạn có chắc chắn muốn đăng xuất không?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text("Hủy"),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text("Đăng xuất", style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();

    if (!mounted) return;
    Navigator.of(
      context,
    ).pushNamedAndRemoveUntil(AppRoutes.login, (route) => false);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text("Đăng xuất thành công"),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  void initState() {
    super.initState();
    _checkToken();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 120,
      width: Helper.getScreenWidth(context),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Align(
            alignment: Alignment.bottomCenter,
            child: Stack(
              children: [
                // bóng
                Container(
                  height: 90,
                  width: Helper.getScreenWidth(context),
                  decoration: BoxDecoration(
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.3),
                        blurRadius: 10,
                        offset: Offset(0, -2),
                      ),
                    ],
                  ),
                ),
                // navbar thực
                ClipPath(
                  clipper: CustomNavBarClipper(),
                  child: Container(
                    height: 80,
                    width: Helper.getScreenWidth(context),
                    color: AppColors.placeholderBg,
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _navItem(
                          index: 0,
                          icon: Icons.home,
                          label: 'Home',
                          onTap: () => Navigator.of(
                            context,
                          ).pushReplacementNamed(AppRoutes.home),
                          selected: widget.selectedIndex == 0,
                        ),

                        _navItem(
                          index: 1,
                          icon: Icons.favorite,
                          label: 'Favorite',
                          onTap: () => Navigator.of(
                            context,
                          ).pushReplacementNamed(AppRoutes.fav),
                          selected: widget.selectedIndex == 1,
                        ),
                        const SizedBox(width: 40),

                        _navItem(
                          index: 2,
                          icon: Icons.person,
                          label: 'Profile',
                          onTap: () => Navigator.of(
                            context,
                          ).pushReplacementNamed(AppRoutes.profile),
                          selected: widget.selectedIndex == 2,
                        ),
                        IconButton(
                          icon: const Icon(Icons.logout, color: Colors.grey),
                          iconSize: 30,
                          onPressed: _logout,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          Positioned(
            top: 10,
            left: 0,
            right: 0,
            child: Center(
              child: SizedBox(
                width: 70,
                height: 70,
                child: Container(
                  width: 70,
                  height: 70,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Colors.green.shade300, Colors.green.shade500],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 8,
                        offset: Offset(0, 4),
                      ),
                    ],
                  ),
                  child: RawMaterialButton(
                    shape: const CircleBorder(),
                    onPressed: () {
                      Navigator.pop(context);
                      Navigator.pushNamed(context, AppRoutes.camera);
                    },
                    child: const Icon(
                      Icons.camera_alt,
                      color: Colors.white,
                      size: 35,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _navItem({
    required int index,
    required IconData icon,
    required String label,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: () {
        onTap();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedScale(
              scale: selected ? 1.3 : 1.0,
              duration: const Duration(milliseconds: 200),
              child: Icon(
                icon,
                size: 28,
                color: selected ? Colors.green : Colors.grey,
              ),
            ),
            const SizedBox(height: 4),
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 200),
              style: TextStyle(
                fontSize: selected ? 14 : 7,
                color: selected ? Colors.green : Colors.grey,
                fontWeight: selected ? FontWeight.bold : FontWeight.normal,
              ),
              child: selected ? Text(label) : Text(''),
            ),
          ],
        ),
      ),
    );
  }
}

class CustomNavBarClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    Path path = Path();
    path.moveTo(0, 0);
    path.lineTo(size.width * 0.3, 0);
    path.quadraticBezierTo(
      size.width * 0.375,
      0,
      size.width * 0.375,
      size.height * 0.1,
    );
    path.cubicTo(
      size.width * 0.4,
      size.height * 0.9,
      size.width * 0.6,
      size.height * 0.9,
      size.width * 0.625,
      size.height * 0.1,
    );
    path.quadraticBezierTo(size.width * 0.625, 0, size.width * 0.7, 0.1);
    path.lineTo(size.width, 0);
    path.lineTo(size.width, size.height);
    path.lineTo(0, size.height);
    path.lineTo(0, 0);
    path.close();
    return path;
  }

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) {
    return true;
  }
}
