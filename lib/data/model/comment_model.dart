class Comment {
  final int id;
  final int userId;
  final String username;
  final String content;
  final String? avtUrl;

  Comment({
    required this.id,
    required this.userId,
    required this.username,
    required this.content,
    this.avtUrl,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: json['id'] ?? 0,
      userId: json['user']?['id'] ?? 0,
      username: json['user']?['username'] ?? '',
      content: json['content'] ?? '',
      avtUrl: json['user']?['image_link'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'username': username,
      'content': content,
      'avtUrl': avtUrl,
    };
  }
}
