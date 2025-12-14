import 'package:flutter/material.dart';

class PaginationWidget extends StatelessWidget {
  final int currentPage;
  final int totalPages;
  final ValueChanged<int> onPageChanged;
  final int maxPagesToShow;

  const PaginationWidget({
    super.key,
    required this.currentPage,
    required this.totalPages,
    required this.onPageChanged,
    this.maxPagesToShow = 5,
  });

  @override
  Widget build(BuildContext context) {
    if (totalPages <= 1) return const SizedBox.shrink();

    int startPage = (currentPage - (maxPagesToShow ~/ 2)).clamp(1, totalPages);
    int endPage = (startPage + maxPagesToShow - 1).clamp(1, totalPages);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = (endPage - maxPagesToShow + 1).clamp(1, totalPages);
    }

    List<Widget> buttons = [];

    // First + Prev
    if (currentPage > 1) {
      buttons.add(
        IconButton(
          icon: const Icon(Icons.first_page),
          onPressed: () => onPageChanged(1),
        ),
      );
      buttons.add(
        IconButton(
          icon: const Icon(Icons.chevron_left),
          onPressed: () => onPageChanged(currentPage - 1),
        ),
      );
    }

    // Numbered pages
    for (int i = startPage; i <= endPage; i++) {
      buttons.add(
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 0),
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: currentPage == i
                    ? Colors.green
                    : Colors.grey.shade300,
                foregroundColor: currentPage == i ? Colors.white : Colors.black,
                minimumSize: const Size(32, 36),
                padding: EdgeInsets.zero,
              ),
              onPressed: () => onPageChanged(i),
              child: Text("$i"),
            ),
          ),
        ),
      );
    }

    // Next + Last
    if (currentPage < totalPages) {
      buttons.add(
        IconButton(
          icon: const Icon(Icons.chevron_right),
          onPressed: () => onPageChanged(currentPage + 1),
        ),
      );
      buttons.add(
        IconButton(
          icon: const Icon(Icons.last_page),
          onPressed: () => onPageChanged(totalPages),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      color: Colors.grey.shade100,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: buttons,
      ),
    );
  }
}
