import 'package:flutter/material.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/model/comment_model.dart';

class CommentItemWidget extends StatelessWidget {
  final Comment comment;
  final int? currentUserId;

  const CommentItemWidget({
    super.key,
    required this.comment,
    this.currentUserId,
  });

  @override
  Widget build(BuildContext context) {
    final isCurrentUser =
        currentUserId != null && comment.userId.toString() == currentUserId;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: Colors.grey.shade300,
            backgroundImage:
                (comment.avtUrl != null && comment.avtUrl!.isNotEmpty)
                ? NetworkImage(comment.avtUrl!)
                : null, // nếu có URL thì load
            child: (comment.avtUrl == null || comment.avtUrl!.isEmpty)
                ? const Icon(Icons.person, color: Colors.white, size: 18)
                : null,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.grey.shade200,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isCurrentUser ? "Bạn" : comment.username,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(comment.content),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
