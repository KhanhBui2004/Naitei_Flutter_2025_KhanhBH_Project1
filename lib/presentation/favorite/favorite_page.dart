import 'package:flutter/material.dart' hide SearchBar;
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/appNavBar.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/buildPagination.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/listFoodCard.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/searchBar.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/helper.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/routes/app_routes.dart';

class FavoritePage extends StatefulWidget {
  const FavoritePage({super.key});

  @override
  State<FavoritePage> createState() => _FavoritePageState();
}

class _FavoritePageState extends State<FavoritePage> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = "";
  int _currentPage = 1;

  @override
  void initState() {
    super.initState();
    _fetchAllFavoriteFoods(context);
  }

  Future<void> _fetchAllFavoriteFoods(
    BuildContext context, {
    int page = 1,
    String? query,
  }) async {
    _currentPage = page;
    _searchQuery = query ?? "";
    context.read<FoodBloc>().add(ViewFavoriteFood(page: page, query: query));
  }

  void _onSearch(String query) {
    _fetchAllFavoriteFoods(context, page: 1, query: query);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      bottomNavigationBar: const AppNavbar(selectedIndex: 1),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.all(20.0),
                child: Text(
                  "Favorite Foods",
                  style: Helper.getTheme(context).headlineMedium,
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8.0),
                child: SearchBar(
                  title: "Search",
                  onChanged: _onSearch,
                  controller: _searchController,
                ),
              ),
              const SizedBox(height: 10),

              BlocConsumer<FoodBloc, FoodState>(
                listener: (context, state) {
                  if (state is ViewAllFoodFailure) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(state.message),
                        backgroundColor: Colors.red,
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  }
                },
                builder: (context, state) {
                  if (state is FoodInProgress) {
                    return const Center(
                      child: Padding(
                        padding: EdgeInsets.only(top: 50.0),
                        child: CircularProgressIndicator(),
                      ),
                    );
                  }

                  if (state is ViewAllFoodSuccess) {
                    final foods = state.foods;

                    if (foods.isEmpty) {
                      return const Center(
                        child: Padding(
                          padding: EdgeInsets.only(top: 50.0),
                          child: Text("You don't have any favorite foods"),
                        ),
                      );
                    }

                    return Column(
                      children: [
                        ...foods.map((food) {
                          final rating = state.ratings?[food.id] ?? 0.0;
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            child: InkWell(
                              onTap: () {
                                Navigator.pushNamed(
                                  context,
                                  AppRoutes.detail,
                                  arguments: food.id.toString(),
                                ).then(
                                  (_) => _fetchAllFavoriteFoods(
                                    context,
                                    page: _currentPage,
                                    query: _searchQuery,
                                  ),
                                );
                              },
                              child: ListFoodCard(dish: food, rating: rating),
                            ),
                          );
                        }),

                        if (state.totalPages > 1)
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            child: PaginationWidget(
                              currentPage: _currentPage,
                              totalPages: state.totalPages,
                              onPageChanged: (page) => _fetchAllFavoriteFoods(
                                context,
                                page: page,
                                query: _searchQuery,
                              ),
                            ),
                          ),
                      ],
                    );
                  }
                  return const SizedBox.shrink();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
