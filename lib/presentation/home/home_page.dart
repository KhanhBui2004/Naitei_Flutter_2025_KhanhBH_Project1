import 'package:flutter/material.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/food/food_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/food/rating_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/food/tag_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/food_model.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/tag_model.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/appNavBar.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/foodHomeCard.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/tagCard.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/routes/app_routes.dart';
import 'package:shared_preferences/shared_preferences.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<StatefulWidget> createState() => _HomeState();
}

class _HomeState extends State<HomePage> {
  List<Tag> _tags = [];
  List<Food> _foods = [];
  List<Food> _myFoods = [];
  late int userId;
  String userName = '';
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUser();
    _fetchTags();
    _fetchFoods();
  }

  final _tagService = TagService();
  final _foodService = FoodService();
  final _ratingService = RatingService();

  Future<void> _fetchTags() async {
    try {
      final data = await _tagService.getAllTags(page: 1, limit: 5);
      setState(() {
        _tags = data["tags"];
        _isLoading = false;
      });
    } catch (e) {
      debugPrint("Error loading tags: $e");
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchFoods() async {
    try {
      final result = await _foodService.getFoods(page: 1, limit: 5);
      setState(() {
        _foods = result["foods"];
        _isLoading = false;
      });
    } catch (e) {
      debugPrint("Error loading foods: $e");
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<double> _getAverRating(int foodId) async {
    try {
      final result = await _ratingService.getAverRating(foodId);
      return result;
    } catch (e) {
      debugPrint("Error get Rating $e");
      return 0;
    }
  }

  Future<int> _getCountRating(int foodId) async {
    try {
      final result = await _ratingService.getCountRating(foodId);
      return result;
    } catch (e) {
      debugPrint("Error get Count Rating $e");
      return 0;
    }
  }

  Future<Map<String, dynamic>> _getRatingAndCount(int foodId) async {
    try {
      final rating = await _getAverRating(foodId);
      final count = await _getCountRating(foodId);
      return {'rating': rating, 'count': count};
    } catch (e) {
      debugPrint("Error get rating and count $e");
      return {'rating': 0.0, 'count': 0};
    }
  }

  Future<void> _fetchMyFoods() async {
    try {
      final result = await _foodService.getMyFood(
        page: 1,
        userId: userId,
        limit: 5,
      );
      setState(() {
        _myFoods = result['data'];
        _isLoading = false;
      });
    } catch (e) {
      debugPrint("Fetch My Foods Error: $e");
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _loadUser() async {
    final prefs = await SharedPreferences.getInstance();
    userName = prefs.getString('nameUser') ?? '';
    userId = prefs.getInt('userId')!;
    setState(() {
        _isLoading = false;
      });
    _fetchMyFoods();
    
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      bottomNavigationBar: AppNavbar(),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(height: 20),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Text(
                        'Hi $userName!',
                        style: TextStyle(
                          fontSize: 30,
                          fontWeight: FontWeight.bold,
                          color: const Color.fromARGB(255, 29, 138, 74),
                        ),
                      ),
                      IconButton(
                        onPressed: () => debugPrint('create new food'),
                        color: const Color.fromARGB(255, 29, 138, 106),
                        icon: const Icon(Icons.edit),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: 10),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,

                  children: [
                    const Text(
                      'Tags',
                      style: TextStyle(
                        fontSize: 25,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    GestureDetector(
                      child: const Text(
                        'All Tags',
                        style: TextStyle(
                          fontSize: 15,
                          color: Color.fromARGB(255, 45, 113, 85),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      onTap: () => debugPrint('View all tags'),
                    ),
                  ],
                ),
                SizedBox(height: 10),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: _isLoading
                      ? const Center(child: CircularProgressIndicator())
                      : SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: [
                              ..._tags.take(4).map((tag) {
                                return Padding(
                                  padding: const EdgeInsets.only(right: 20),
                                  child: InkWell(
                                    onTap: () => debugPrint('Foods of Tag'),
                                    child: Tagcard(
                                      image: Image.network(
                                        tag.imageUrl,
                                        fit: BoxFit.cover,
                                        width: 100,
                                        height: 100,
                                        errorBuilder:
                                            (context, error, stackTrace) {
                                              return const Icon(
                                                Icons.broken_image,
                                                size: 100,
                                              );
                                            },
                                      ),
                                      name: tag.name,
                                    ),
                                  ),
                                );
                              }),
                            ],
                          ),
                        ),
                ),
                SizedBox(height: 20),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Foods',
                      style: TextStyle(
                        fontSize: 25,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    GestureDetector(
                      child: const Text(
                        'All Foods',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Color.fromARGB(255, 45, 113, 85),
                        ),
                      ),
                      onTap: () => debugPrint('View all foods'),
                    ),
                  ],
                ),
                SizedBox(height: 10),
                if (_isLoading)
                  const Center(child: SingleChildScrollView())
                else if (_foods.isNotEmpty)
                  Column(
                    children: _foods.take(3).map((food) {
                      return Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        child: InkWell(
                          // onTap: () => Navigator.pushNamed(
                          //   context,
                          //   AppRoutes.detail,
                          //   arguments: food.id.toString(),
                          // ),
                          onTap: () => debugPrint('food detail'),
                          child: FutureBuilder<Map<String, dynamic>>(
                            future: _getRatingAndCount(food.id),
                            builder: (context, snapshot) {
                              if (snapshot.connectionState ==
                                  ConnectionState.waiting) {
                                return const SizedBox(
                                  height: 150,
                                  child: Center(
                                    child: CircularProgressIndicator(),
                                  ),
                                );
                              }

                              final rating = snapshot.data?['rating'] ?? 0.0;
                              final count = snapshot.data?['count'] ?? 0;

                              return FoodHomeCard(
                                name: food.dishName,
                                image: Image.network(
                                  food.imageLink,
                                  fit: BoxFit.cover,
                                  loadingBuilder:
                                      (context, child, loadingProgress) {
                                        if (loadingProgress == null) {
                                          return child;
                                        }
                                        return const SizedBox(
                                          height: 150,
                                          child: Center(
                                            child: CircularProgressIndicator(),
                                          ),
                                        );
                                      },
                                  errorBuilder: (context, error, stackTrace) {
                                    return const SizedBox(
                                      height: 150,
                                      child: Center(
                                        child: Icon(
                                          Icons.broken_image,
                                          size: 50,
                                        ),
                                      ),
                                    );
                                  },
                                ),
                                rating: rating,
                                count: count,
                              );
                            },
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                SizedBox(height: 20),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'My Foods',
                      style: TextStyle(
                        fontSize: 25,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    GestureDetector(
                      child: const Text(
                        'All Foods',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Color.fromARGB(255, 45, 113, 85),
                        ),
                      ),
                      onTap: () => debugPrint('View all foods'),
                    ),
                  ],
                ),
                SizedBox(height: 10),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: _isLoading
                      ? const CircularProgressIndicator()
                      : SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: _myFoods.take(5).map((myfood) {
                              return Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 10,
                                ),
                                child: InkWell(
                                  onTap: () => debugPrint('my food detail'),

                                  // Navigator.pushNamed(
                                  //   context,
                                  //   AppRoutes.detail,
                                  //   arguments: myFood.id.toString(),
                                  // ),
                                  child: FutureBuilder<Map<String, dynamic>>(
                                    future: _getRatingAndCount(myfood.id),
                                    builder: (context, snapshot) {
                                      if (snapshot.connectionState ==
                                          ConnectionState.waiting) {
                                        return const SizedBox(
                                          height: 150,
                                          child: Center(
                                            child: CircularProgressIndicator(),
                                          ),
                                        );
                                      }

                                      if (snapshot.hasError) {
                                        return const SizedBox(
                                          height: 150,
                                          child: Center(
                                            child: Icon(
                                              Icons.error,
                                              color: Colors.red,
                                            ),
                                          ),
                                        );
                                      }

                                      final rating =
                                          snapshot.data?['rating'] ?? 0.0;
                                      final count =
                                          snapshot.data?['count'] ?? 0;

                                      return MyFoodCard(
                                        image: Image.network(
                                          myfood.imageLink,
                                          fit: BoxFit.cover,
                                          errorBuilder:
                                              (context, error, stackTrace) =>
                                                  const Icon(
                                                    Icons.broken_image,
                                                    size: 100,
                                                  ),
                                        ),
                                        name: myfood.dishName,
                                        rating: rating,
                                        count: count,
                                      );
                                    },
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
