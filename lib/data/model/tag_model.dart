class Tag {
  final int id;
  final String name;
  final String imageUrl;

  Tag({required this.id, required this.name, required this.imageUrl});

  factory Tag.fromJson(Map<String, dynamic> json) {
    return Tag(
      id: json['id'],
      name: json['name'],
      imageUrl: json['image_url'] ?? '',
    );
  }
}
