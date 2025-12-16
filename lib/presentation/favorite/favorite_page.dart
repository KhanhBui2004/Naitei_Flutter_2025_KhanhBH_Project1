import 'package:flutter/material.dart' hide SearchBar;
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/service/food/food_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/service/food/rating_service.dart';
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
  final FoodService _foodService = FoodService();
  final RatingService _ratingService = RatingService();

  List<Food> _foods = [];
  int _currentPage = 1;
  int _totalPages = 1;
  String _searchQuery = "";
  bool _isLoading = false;

  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // _loadFoods();
    _fetchAllFavoriteFoods(context);
  }

  Future<void> _loadFoods({int page = 1, String? query}) async {
    setState(() => _isLoading = true);

    try {
      final result = await _foodService.getFavoriteFoods(
        page: page,
        query: query,
      );

      setState(() {
        _foods = result["data"];
        _totalPages = result["totalPages"];
        _currentPage = page;
        _searchQuery = query ?? "";
      });
    } catch (e) {
      debugPrint("Error: $e");
    } finally {
      setState(() => _isLoading = false);
    }
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
      // _loadFoods();
      _fetchAllFavoriteFoods(context);
    } else {
      _fetchAllFavoriteFoods(context, page: 1, query: query);
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
                      "Món ăn yêu thích",
                      style: Helper.getTheme(context).headlineMedium,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8.0),
                child: SearchBar(
                  title: "Tìm kiếm",
                  onChanged: _onSearch,
                  controller: _searchController,
                ),
              ),
              const SizedBox(height: 10),

              // if (_isLoading)
              //   const Center(child: CircularProgressIndicator())
              // else if (_foods.isNotEmpty)
              //   Column(
              //     children: [
              //       ..._foods.map((food) {
              //         return Padding(
              //           padding: const EdgeInsets.symmetric(vertical: 10),
              //           child: InkWell(
              //             onTap: () {
              //               Navigator.pushNamed(
              //                 context,
              //                 AppRoutes.detail,
              //                 arguments: food.id.toString(),
              //               ).then(
              //                 (_) => _loadFoods(
              //                   page: _currentPage,
              //                   query: _searchQuery,
              //                 ),
              //               );
              //             },
              //             child: FutureBuilder<double>(
              //               future: _getAverRating(food.id),
              //               builder: (context, snapshot) {
              //                 if (snapshot.connectionState ==
              //                     ConnectionState.waiting) {
              //                   return const SizedBox(
              //                     height: 150,
              //                     child: Center(
              //                       child: CircularProgressIndicator(),
              //                     ),
              //                   );
              //                 }

              //                 // final rating = snapshot.data ?? 0.0;
              //                 return ListFoodCard(dish: food);
              //               },
              //             ),
              //           ),
              //         );
              //       }),

              //       if (_totalPages > 1)
              //         Padding(
              //           padding: const EdgeInsets.symmetric(vertical: 16),
              //           child: PaginationWidget(
              //             currentPage: _currentPage,
              //             totalPages: _totalPages,
              //             onPageChanged: (page) =>
              //                 _loadFoods(page: page, query: _searchQuery),
              //           ),
              //         ),
              //     ],
              //   )
              // else
              //   const Padding(
              //     padding: EdgeInsets.symmetric(vertical: 20),
              //     child: Center(child: Text("Không có món ăn yêu thích nào")),
              //   ),
              BlocListener<FoodBloc, FoodState>(
                listener: (context, state) {
                  (switch (state) {
                    FoodInitial() => Container(),
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
                            child: Text("Không có món ăn yêu thích nào"),
                          ),
                        }
                      else
                        {
                          favoriteBuid = Column(
                            children: [
                              ..._foods.map((food) {
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
                                        // (_) => _loadFoods(
                                        //   page: _currentPage,
                                        //   query: _searchQuery,
                                        // ),
                                        (_) => _fetchAllFavoriteFoods(
                                          context,
                                          page: _currentPage,
                                          query: _searchQuery,
                                        ),
                                      );
                                    },
                                    child: FutureBuilder<double>(
                                      future: _getAverRating(food.id),
                                      builder: (context, snapshot) {
                                        if (snapshot.connectionState ==
                                            ConnectionState.waiting) {
                                          return const SizedBox(
                                            height: 150,
                                            child: Center(
                                              child:
                                                  CircularProgressIndicator(),
                                            ),
                                          );
                                        }

                                        // final rating = snapshot.data ?? 0.0;
                                        return ListFoodCard(dish: food);
                                      },
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
                                    // onPageChanged: (page) => _loadFoods(
                                    //   page: page,
                                    //   query: _searchQuery,
                                    // ),
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
