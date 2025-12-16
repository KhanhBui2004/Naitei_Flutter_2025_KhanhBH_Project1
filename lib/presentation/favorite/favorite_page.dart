import 'package:flutter/material.dart' hide SearchBar;
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/appNavBar.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/buildPagination.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/listFoodCard.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/searchBar.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/food_model.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/helper.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/routes/app_routes.dart';

class FavoritePage extends StatefulWidget {
  const FavoritePage({super.key});

  @override
  State<FavoritePage> createState() => _FavoritePageState();
}

class _FavoritePageState extends State<FavoritePage> {

  List<Food> _foods = [];
  int _currentPage = 1;
  int _totalPages = 1;
  String _searchQuery = "";

  final TextEditingController _searchController = TextEditingController();

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
    context.read<FoodBloc>().add(ViewAllFood(page: page, query: query));
  }

  void _onSearch(String query) {
    if (query.isEmpty) {
      _fetchAllFavoriteFoods(context);
    } else {
      _fetchAllFavoriteFoods(context, page: 1, query: query);
    }
  }

  @override
  Widget build(BuildContext context) {
    Widget favoriteBuid = Container();
    return Scaffold(
      bottomNavigationBar: const AppNavbar(selectedIndex: 1),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    SizedBox(height: 10),
                    Text(
                      "Favorite Foods",
                      style: Helper.getTheme(context).headlineMedium,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8.0),
                child: SearchBar(
                  title: "Search",
                  onChanged: _onSearch,
                  controller: _searchController,
                ),
              ),
              const SizedBox(height: 10),
              BlocListener<FoodBloc, FoodState>(
                listener: (context, state) {
                  (switch (state) {
                    FoodInProgress() => showDialog(
                      context: context,
                      builder: (_) =>
                          const Center(child: CircularProgressIndicator()),
                    ),
                    ViewAllFoodSuccess() => {
                      Navigator.pop(context),
                      _foods = state.foods,
                      if (_foods.isEmpty)
                        {
                          favoriteBuid = Center(
                            child: Text("You don't have any favorite foods"),
                          ),
                        }
                      else
                        {
                          favoriteBuid = Column(
                            children: [
                              ..._foods.map((food) {
                                final rating = state.ratings[food.id] ?? 0.0;
                                return Padding(
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 10,
                                  ),
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
                                    child: ListFoodCard(
                                      dish: food,
                                      rating: rating,
                                    ),
                                  ),
                                );
                              }),

                              if (_totalPages > 1)
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 16,
                                  ),
                                  child: PaginationWidget(
                                    currentPage: _currentPage,
                                    totalPages: _totalPages,
                                    onPageChanged: (page) =>
                                        _fetchAllFavoriteFoods(
                                          context,
                                          page: page,
                                          query: _searchQuery,
                                        ),
                                  ),
                                ),
                            ],
                          ),
                        },
                    },
                    ViewAllFoodFailure() => {
                      Navigator.pop(context),
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(state.message),
                          backgroundColor: Colors.red,
                          behavior: SnackBarBehavior.floating,
                        ),
                      ),
                      debugPrint(state.message),
                    },
                    _ => Container(),
                  });
                },
                child: BlocBuilder<FoodBloc, FoodState>(
                  builder: (context, state) {
                    return favoriteBuid;
                  },
                ),
              ),
              // favoriteBuid,
            ],
          ),
        ),
      ),
    );
  }
}
