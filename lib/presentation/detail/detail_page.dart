import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/detail/detail_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/detail/detail_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/detail/detail_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/buildPagination.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/commentItem.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/constant.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/helper.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/routes/app_routes.dart';
import 'package:shared_preferences/shared_preferences.dart';

class FoodDetailScreen extends StatefulWidget {
  final String foodId;

  const FoodDetailScreen({super.key, required this.foodId});

  @override
  State<FoodDetailScreen> createState() => _FoodDetailScreenState();
}

class _FoodDetailScreenState extends State<FoodDetailScreen> {
  int? _userId;
  double? _averRating;
  int _currentPage = 1;
  int _totalPages = 1;

  final TextEditingController _commentController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadUser();
    _loadFoodDetail(context);
  }

  Future<void> _loadUser() async {
    final prefs = await SharedPreferences.getInstance();
    final id = prefs.getInt('userId');
    _userId = id;
  }

  Future<void> _loadFoodDetail(BuildContext context) async {
    context.read<FoodDetailBloc>().add(LoadFoodDetail(widget.foodId));
  }

  Future<void> _submitRating(BuildContext context, double rate) async {
    context.read<FoodDetailBloc>().add(PostRating(rate.toInt()));
  }

  Future<void> _patchRating(BuildContext context, double rate) async {
    context.read<FoodDetailBloc>().add(PatchRating(rate.toInt()));
  }

  Future<void> _loadTags(BuildContext context) async {
    context.read<FoodDetailBloc>().add(LoadTags());
  }

  Future<void> _addComment(BuildContext context, String content) async {
    context.read<FoodDetailBloc>().add(PostComment(content));
  }

  Future<void> _loadComments(BuildContext context, {int page = 1}) async {
    context.read<FoodDetailBloc>().add(LoadComments());
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleLarge?.copyWith(
          fontSize: 16,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          BlocBuilder<FoodDetailBloc, FoodDetailState>(
            builder: (context, state) {
              return (switch (state) {
                FoodDetailInitial() => Container(),
                FoodDetailInprogress() => const Center(
                  child: CircularProgressIndicator(),
                ),
                FoodDetailFailure() => Center(child: Text(state.message)),
                FoodDetailSuccess() => SingleChildScrollView(
                  child: Column(
                    children: [
                      Stack(
                        children: [
                          SizedBox(
                            height: Helper.getScreenHeight(context) * 0.5,
                            width: Helper.getScreenWidth(context),
                            child: Image.network(
                              state.food.imageLink,
                              fit: BoxFit.cover,
                            ),
                          ),
                          Container(
                            height: Helper.getScreenHeight(context) * 0.5,
                            width: Helper.getScreenWidth(context),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                stops: const [0.0, 0.4],
                                colors: [
                                  Colors.black.withOpacity(0.9),
                                  Colors.black.withOpacity(0.0),
                                ],
                              ),
                            ),
                          ),
                          SafeArea(
                            child: Column(
                              children: [
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 20.0,
                                    vertical: 10,
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.start,
                                    children: [
                                      GestureDetector(
                                        onTap: () =>
                                            Navigator.of(context).pop(),
                                        child: const Icon(
                                          Icons.arrow_back_ios_rounded,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                SizedBox(
                                  height:
                                      Helper.getScreenHeight(context) * 0.35,
                                ),
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 30,
                                  ),
                                  decoration: const BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.only(
                                      topLeft: Radius.circular(40),
                                      topRight: Radius.circular(40),
                                    ),
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      /// tên món ăn
                                      Padding(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 20,
                                        ),
                                        child: Text(
                                          state.food.dishName,
                                          style: Theme.of(
                                            context,
                                          ).textTheme.headlineMedium,
                                        ),
                                      ),
                                      const SizedBox(height: 6),

                                      // Rating
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.end,
                                        children: [
                                          Text(
                                            _averRating == null
                                                ? "0"
                                                : _averRating.toString(),
                                            style: const TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.bold,
                                              color: AppColors.greend,
                                            ),
                                          ),
                                          const SizedBox(width: 6),
                                          RatingBar.builder(
                                            initialRating: state.averRating,
                                            minRating: 1,
                                            direction: Axis.horizontal,
                                            allowHalfRating: false,
                                            itemCount: 5,
                                            itemSize: 22,
                                            itemBuilder: (context, _) =>
                                                const Icon(
                                                  Icons.star,
                                                  color: Colors.amber,
                                                ),
                                            onRatingUpdate: (rating) async {
                                              if (state.userRating == null) {
                                                _submitRating(context, rating);
                                                // _getRating();
                                                // context.read<FoodDetailBloc>().add();
                                              } else {
                                                _patchRating(context, rating);
                                              }
                                              // setState(() {
                                              //   _userRating = rating
                                              //       .toInt(); // cập nhật lại local
                                              //   _getAverRating();
                                              // });
                                            },
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 10),
                                      Padding(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 20,
                                          vertical: 10,
                                        ),
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              "Dinh dưỡng",
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .titleLarge
                                                  ?.copyWith(
                                                    fontSize: 16,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                            ),
                                            const SizedBox(height: 10),

                                            // Row 1: Calories
                                            Row(
                                              mainAxisAlignment:
                                                  MainAxisAlignment.start,
                                              children: [
                                                Text(
                                                  "${state.food.calories} kcal",
                                                  style: TextStyle(
                                                    fontSize: 16,
                                                    color: AppColors.orange,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 10),

                                            // Row 2: Protein & Fat
                                            Row(
                                              mainAxisAlignment:
                                                  MainAxisAlignment
                                                      .spaceBetween,
                                              children: [
                                                Text(
                                                  "Chất đạm: ${state.food.protein} g",
                                                  style: const TextStyle(
                                                    fontSize: 16,
                                                    fontWeight: FontWeight.w500,
                                                  ),
                                                ),
                                                Text(
                                                  "Chất béo: ${state.food.fat} g",
                                                  style: const TextStyle(
                                                    fontSize: 16,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 10),

                                            // Row 3: Fiber & Sugar
                                            Row(
                                              mainAxisAlignment:
                                                  MainAxisAlignment
                                                      .spaceBetween,
                                              children: [
                                                Text(
                                                  "Chất xơ: ${state.food.fiber} g",
                                                  style: const TextStyle(
                                                    fontSize: 16,
                                                  ),
                                                ),
                                                Text(
                                                  "Đường: ${state.food.sugar} g",
                                                  style: const TextStyle(
                                                    fontSize: 16,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),

                                      const SizedBox(height: 5),

                                      /// type
                                      _buildSectionTitle("Loại"),
                                      Padding(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 20,
                                        ),
                                        child: Text(state.food.dishType),
                                      ),

                                      /// serving size
                                      _buildSectionTitle("Khẩu phần"),
                                      Padding(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 20,
                                        ),
                                        child: Text(state.food.servingSize),
                                      ),

                                      /// cooking time
                                      _buildSectionTitle("Thời gian nấu"),
                                      Padding(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 20,
                                        ),
                                        child: Text(
                                          "${state.food.cookingTime} phút",
                                        ),
                                      ),

                                      /// mô tả
                                      _buildSectionTitle("Mô tả"),
                                      Padding(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 20,
                                          vertical: 10,
                                        ),
                                        child: Text(state.food.description),
                                      ),

                                      /// nguyên liệu
                                      _buildSectionTitle("Nguyên liệu"),
                                      Padding(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 20,
                                          vertical: 10,
                                        ),
                                        child: Text(state.food.ingredients),
                                      ),

                                      /// cooking method
                                      _buildSectionTitle("Công thức"),
                                      Padding(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 20,
                                          vertical: 10,
                                        ),
                                        child: Text(state.food.cookingMethod),
                                      ),

                                      _buildSectionTitle("Nhãn"),
                                      Padding(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 20,
                                          vertical: 10,
                                        ),
                                        child: state.tags.isEmpty
                                            ? const Text("Không có nhãn")
                                            : Wrap(
                                                spacing: 8,
                                                runSpacing: 6,
                                                children: state.tags.map((tag) {
                                                  return GestureDetector(
                                                    onTap: () {
                                                      Navigator.pushNamed(
                                                        context,
                                                        AppRoutes.foodsoftag,
                                                        arguments: {
                                                          'id': tag.id,
                                                          'name': tag.name,
                                                        },
                                                      );
                                                    },
                                                    child: Container(
                                                      padding:
                                                          const EdgeInsets.symmetric(
                                                            horizontal: 12,
                                                            vertical: 6,
                                                          ),
                                                      decoration: BoxDecoration(
                                                        color: Colors.green
                                                            .withOpacity(0.1),
                                                        borderRadius:
                                                            BorderRadius.circular(
                                                              20,
                                                            ),
                                                        border: Border.all(
                                                          color:
                                                              AppColors.greend,
                                                        ),
                                                      ),
                                                      child: Text(
                                                        tag.name,
                                                        style: const TextStyle(
                                                          color:
                                                              AppColors.greend,
                                                          fontWeight:
                                                              FontWeight.w500,
                                                        ),
                                                      ),
                                                    ),
                                                  );
                                                }).toList(),
                                              ),
                                      ),

                                      /// comments
                                      _buildSectionTitle("Bình luận"),
                                      Padding(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 20,
                                        ),
                                        child: Column(
                                          children: [
                                            // danh sách comment
                                            if (state.comments.isEmpty)
                                              const Text("Chưa có bình luận")
                                            else
                                              ListView.builder(
                                                shrinkWrap: true,
                                                physics:
                                                    const NeverScrollableScrollPhysics(),
                                                itemCount:
                                                    state.comments.length,
                                                itemBuilder: (context, index) =>
                                                    CommentItemWidget(
                                                      comment:
                                                          state.comments[index],
                                                      currentUserId: _userId,
                                                    ),
                                              ),
                                            const SizedBox(height: 10),
                                            if (_totalPages > 1)
                                              PaginationWidget(
                                                currentPage: _currentPage,
                                                totalPages: _totalPages,
                                                onPageChanged: (page) {
                                                  _loadComments(
                                                    context,
                                                    page: page,
                                                  );
                                                },
                                              ),
                                            const SizedBox(height: 10),
                                            // ô nhập comment
                                            Row(
                                              children: [
                                                Expanded(
                                                  child: TextField(
                                                    controller:
                                                        _commentController,
                                                    decoration: InputDecoration(
                                                      hintText:
                                                          "Viết bình luận...",
                                                      border: OutlineInputBorder(
                                                        borderRadius:
                                                            BorderRadius.circular(
                                                              12,
                                                            ),
                                                      ),
                                                      contentPadding:
                                                          const EdgeInsets.symmetric(
                                                            horizontal: 12,
                                                            vertical: 8,
                                                          ),
                                                    ),
                                                  ),
                                                ),
                                                IconButton(
                                                  icon: const Icon(
                                                    Icons.send,
                                                    color: AppColors.greend,
                                                  ),
                                                  onPressed: () {
                                                    final content =
                                                        _commentController.text
                                                            .trim();
                                                    if (content.isEmpty) {
                                                      ScaffoldMessenger.of(
                                                        context,
                                                      ).showSnackBar(
                                                        const SnackBar(
                                                          content: Text(
                                                            "Vui lòng nhập bình luận",
                                                          ),
                                                        ),
                                                      );
                                                      return;
                                                    }
                                                    _addComment(
                                                      context,
                                                      content,
                                                    );
                                                  },
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(height: 20),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              });
            },
          ),
        ],
      ),
    );
  }
}
