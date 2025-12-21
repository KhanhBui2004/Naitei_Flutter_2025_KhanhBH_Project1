import 'package:flutter/material.dart' hide SearchBar;
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/food_model.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/service/food/food_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/my_food/myFood_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/my_food/myFood_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/food/food_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/my_food/myFood_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/listFoodCard.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/searchBar.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/buildPagination.dart';

typedef FoodTapCallback = void Function(Food food);

class AllFoodView extends StatefulWidget {
  const AllFoodView({
    super.key,
    required this.title,
    required this.foodService,
    required this.onTapFood,
    this.showMyFood = false,
    this.pageSize = 20,
  });

  final String title;
  final FoodService foodService;
  final FoodTapCallback onTapFood;
  final bool showMyFood;
  final int pageSize;

  @override
  State<AllFoodView> createState() => _AllFoodViewState();
}

class _AllFoodViewState extends State<AllFoodView> {
  List<Food> _foods = [];
  Map<int, double> _ratings = {};
  int _currentPage = 1;
  int _totalPages = 1;
  String _searchQuery = "";
  bool _isLoading = true;
  int? _userId;

  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.showMyFood) {
      _loadUserAndFetch();
    } else {
      _fetchPage(1);
    }
  }

  Future<void> _loadUserAndFetch() async {
    setState(() => _isLoading = true);
    final prefs = await SharedPreferences.getInstance();
    final id = prefs.getInt("userId");
    if (id != null) {
      _userId = id;
      _fetchPage(1);
    } else {
      setState(() => _isLoading = false);
    }
  }

  void _fetchPage(int page) {
    setState(() => _currentPage = page);
    setState(() => _isLoading = true);

    if (widget.showMyFood && _userId != null) {
      context.read<MyfoodBloc>().add(
        ViewMyFood(
          userId: _userId!,
          page: page,
          query: _searchQuery,
          limit: widget.pageSize,
        ),
      );
    } else {
      context.read<FoodBloc>().add(
        ViewAllFood(page: page, query: _searchQuery, limit: widget.pageSize),
      );
    }
  }

  void _onSearch(String query) {
    _searchQuery = query;
    _fetchPage(1);
  }

  void _updateStateFromSuccess(
    List<Food> foods,
    int totalPages,
    Map<int, double> ratings,
  ) {
    setState(() {
      _foods = foods;
      _ratings = ratings;
      _totalPages = totalPages;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (widget.title.isNotEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8.0),
            child: Text(
              widget.title,
              style: Theme.of(context).textTheme.headlineSmall,
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
        Expanded(
          child: widget.showMyFood
              ? BlocListener<MyfoodBloc, MyfoodState>(
                  listener: (context, state) {
                    if (state is MyFoodInProgress) {
                      setState(() => _isLoading = true);
                    } else if (state is ViewMyFoodSuccess) {
                      _updateStateFromSuccess(
                        state.foods,
                        state.totalPages,
                        state.ratings ?? {},
                      );
                    } else if (state is ViewMyFoodEmpty) {
                      setState(() {
                        _foods = [];
                        _ratings = {};
                        _totalPages = 1;
                        _isLoading = false;
                      });
                    } else if (state is ViewMyFoodFailure) {
                      setState(() => _isLoading = false);
                    }
                  },
                  child: _buildListView(),
                )
              : BlocListener<FoodBloc, FoodState>(
                  listener: (context, state) {
                    if (state is FoodInProgress) {
                      setState(() => _isLoading = true);
                    } else if (state is ViewAllFoodSuccess) {
                      _updateStateFromSuccess(
                        state.foods,
                        state.totalPages,
                        state.ratings ?? {},
                      );
                    } else if (state is ViewAllFoodEmpty) {
                      setState(() {
                        _foods = [];
                        _ratings = {};
                        _totalPages = 1;
                        _isLoading = false;
                      });
                    } else if (state is ViewAllFoodFailure) {
                      setState(() => _isLoading = false);
                    }
                  },
                  child: _buildListView(),
                ),
        ),
        if (_totalPages > 1)
          PaginationWidget(
            currentPage: _currentPage,
            totalPages: _totalPages,
            onPageChanged: _fetchPage,
          ),
      ],
    );
  }

  Widget _buildListView() {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_foods.isEmpty) {
      return const Center(child: Text("Don't have any foods"));
    }

    return ListView.builder(
      itemCount: _foods.length,
      itemBuilder: (context, index) {
        final food = _foods[index];
        final rating = _ratings[food.id] ?? 0.0;
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: InkWell(
            onTap: () => widget.onTapFood(food),
            child: ListFoodCard(dish: food, rating: rating),
          ),
        );
      },
    );
  }
}
