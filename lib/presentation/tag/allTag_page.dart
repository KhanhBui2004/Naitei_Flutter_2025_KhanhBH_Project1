import 'package:flutter/material.dart' hide SearchBar;
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/tag/tag_bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/tag/tag_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/tag/tag_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/tag_model.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/service/food/tag_service.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/buildPagination.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/searchBar.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/presentation/widget/tagListCard.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/utils/routes/app_routes.dart';

class AllTagsPage extends StatefulWidget {
  const AllTagsPage({super.key});

  @override
  State<AllTagsPage> createState() => _ViewAllTagsPageState();
}

class _ViewAllTagsPageState extends State<AllTagsPage> {
  final TagService _tagService = TagService();

  List<Tag> _tags = [];
  int _currentPage = 1;
  int _totalPages = 1;
  String _searchQuery = "";
  bool _isLoading = false;

  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchTags(context, 1, '');
  }

  Future<void> _fetchTags(BuildContext context, int page, String? query) async {
    context.read<TagBloc>().add(ViewListTag(page: 1, limit: 10, query: query));
  }

  void _onSearch(String query) {
    _fetchTags(context, 1, query);
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<TagBloc, TagState>(
      builder: (context, state) {
        if (state is TagInProgress) {
          return const Center(child: CircularProgressIndicator());
        } else if (state is ListTagFailure) {
          return Center(child: Text(state.message));
        } else if (state is ListTagEmpty) {
          return Center(child: Text("Don't have any tags"));
        } else if (state is ListTagSuccess) {
          _tags = state.tags;
          _totalPages = state.totalPages;
          _isLoading = false;
          return Scaffold(
            appBar: AppBar(
              title: const Text("All Tags"),
              leading: IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () {
                  Navigator.of(context).pushReplacementNamed(AppRoutes.home);
                },
              ),
            ),

            // 📋 Nội dung chính: searchbar + danh sách
            body: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8.0),
                  child: SearchBar(
                    title: "Search",
                    onChanged: _onSearch,
                    controller: _searchController,
                  ),
                ),

                Expanded(
                  child: _isLoading
                      ? const Center(child: CircularProgressIndicator())
                      : ListView.builder(
                          itemCount: _tags.length,
                          itemBuilder: (context, index) {
                            final tag = _tags[index];
                            return Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 8,
                              ),
                              child: GestureDetector(
                                onTap: () => Navigator.pushNamed(
                                  context,
                                  AppRoutes.foodsoftag,
                                  arguments: {'id': tag.id, 'name': tag.name},
                                ),
                                child: Taglistcard(
                                  name: tag.name,
                                  image: Image.network(
                                    tag.imageUrl,
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),

            bottomNavigationBar: PaginationWidget(
              currentPage: _currentPage,
              totalPages: _totalPages,
              onPageChanged: (page) => _fetchTags(context, page, _searchQuery),
            ),
          );
        } else {
          return const SizedBox.shrink();
        }
      },
    );
  }
}
