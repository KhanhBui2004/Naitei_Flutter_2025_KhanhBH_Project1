import 'package:flutter/material.dart' hide SearchBar;
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/foodtag/foodTag_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/foodtag/foodTag_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/foodtag/foodTag_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/tag/tag_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/buildPagination.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/listFoodCard.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/searchBar.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/routes/app_routes.dart';

class FoodsTagPage extends StatefulWidget {
  const FoodsTagPage({super.key, required this.tagId, required this.tagName});

  final int tagId;
  final String tagName;

  @override
  State<FoodsTagPage> createState() => _FoodsTagPageState();
}

class _FoodsTagPageState extends State<FoodsTagPage> {
  String _searchQuery = "";

  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadFoods(context);
  }

  void _loadFoods(BuildContext context, {int page = 1, String? query}) {
    context.read<FoodtagBloc>().add(
      ViewFoodTag(page, 20, query, tagId: widget.tagId),
    );
  }

  void _onSearch(String query) {
    _loadFoods(context, page: 1, query: query);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Món ăn liên quan đến ${widget.tagName}"),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            Navigator.of(context).pop();
          },
        ),
      ),

      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8.0),
            child: SearchBar(
              title: "Tìm kiếm",
              onChanged: _onSearch,
              controller: _searchController,
            ),
          ),
          SizedBox(height: 10),
          BlocBuilder<FoodtagBloc, FoodtagState>(
            builder: (context, state) {
              if (state is FoodTagInProgress) {
                return const Center(child: CircularProgressIndicator());
              } else if (state is ViewFoodTagFailure) {
                return Center(child: Text(state.message));
              } else if (state is ViewFoodTagEmpty) {
                return const Center(child: Text("Don't have any foods"));
              } else if (state is ViewFoodTagSuccess) {
                return Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    itemCount: state.foods.length,
                    itemBuilder: (context, index) {
                      final food = state.foods[index];
                      final rating = state.ratings[food.id] ?? 0.0;

                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        child: InkWell(
                          onTap: () {
                            Navigator.pushNamed(
                              context,
                              AppRoutes.detail,
                              arguments: food.id.toString(),
                            );
                          },
                          child: ListFoodCard(dish: food, rating: rating),
                        ),
                      );
                    },
                  ),
                );
              } else {
                return Container();
              }
            },
          ),
        ],
      ),

      bottomNavigationBar: BlocBuilder<FoodtagBloc, FoodtagState>(
        builder: (context, state) {
          if (state is ViewFoodTagSuccess) {
            return PaginationWidget(
              currentPage: state.currentPage,
              totalPages: state.totalPages,
              onPageChanged: (page) =>
                  _loadFoods(context, page: page, query: _searchQuery),
            );
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }
}
