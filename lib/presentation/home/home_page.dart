import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/tag/tag_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/tag/tag_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/tag/tag_state.dart';
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
  late int userId;
  String userName = '';

  @override
  void initState() {
    super.initState();
    _loadUser();
    _fetchTags(context);
    _fetchFoods(context);
  }

  Future<void> _fetchTags(BuildContext context) async {
    context.read<TagBloc>().add(ViewListTag(page: 1, limit: 5));
  }

  Future<void> _fetchFoods(BuildContext context) async {
    context.read<FoodBloc>().add(ViewAllFood(page: 1, limit: 5));
  }

  Future<void> _fetchMyFoods(BuildContext context) async {
    context.read<FoodBloc>().add(ViewMyFood(page: 1, userId: userId, limit: 5));
  }

  Future<void> _loadUser() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      userName = prefs.getString('firstname') ?? '';
      userId = prefs.getInt('userId')!;
    });
    _fetchMyFoods(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      bottomNavigationBar: AppNavbar(selectedIndex: 0),
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
                  child: BlocBuilder<TagBloc, TagState>(
                    builder: (context, state) {
                      return (switch (state) {
                        TagInitial() => Container(),
                        TagInProgress() => const Center(
                          child: CircularProgressIndicator(),
                        ),
                        ListTagFailure() => Center(child: Text(state.message)),
                        ListTagEmpty() => const Center(
                          child: Text("Don't have any tags"),
                        ),
                        ListTagSuccess() => SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: [
                              ...state.tags.take(4).map((tag) {
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
                      });
                    },
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
                BlocBuilder<FoodBloc, FoodState>(
                  builder: (context, state) {
                    return (switch (state) {
                      FoodInitial() => Container(),
                      FoodInProgress() => const Center(
                        child: CircularProgressIndicator(),
                      ),
                      ViewAllFoodFailure() => Center(
                        child: Text(state.message),
                      ),
                      ViewAllFoodEmpty() => const Center(
                        child: Text("Don't have any foods"),
                      ),
                      ViewAllFoodSuccess() => Column(
                        children: state.foods.take(3).map((food) {
                          final count = state.counts![food.id] ?? 0;
                          final rating = state.ratings![food.id] ?? 0.0;

                          return Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 5,
                            ),
                            child: InkWell(
                              onTap: () => Navigator.pushNamed(
                                context,
                                AppRoutes.detail,
                                arguments: food.id.toString(),
                              ),
                              child: FoodHomeCard(
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
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      _ => Container(),
                    });
                  },
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
                  child: BlocBuilder<FoodBloc, FoodState>(
                    builder: (context, state) {
                      return (switch (state) {
                        FoodInitial() => Container(),
                        FoodInProgress() => const Center(
                          child: CircularProgressIndicator(),
                        ),
                        ViewAllFoodEmpty() => const Center(
                          child: Text("Don't have any your foods"),
                        ),
                        ViewAllFoodFailure() => Center(
                          child: Text(state.message),
                        ),
                        ViewAllFoodSuccess() => SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: state.foods.take(5).map((myfood) {
                              final double rating =
                                  state.ratings![myfood.id] ?? 0.0;
                              final int count = state.counts![myfood.id] ?? 0;
                              return Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 10,
                                ),
                                child: InkWell(
                                  onTap: () => Navigator.pushNamed(
                                    context,
                                    AppRoutes.detail,
                                    arguments: myfood.id.toString(),
                                  ),
                                  child: MyFoodCard(
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
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                        _ => Container(),
                      });
                    },
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
