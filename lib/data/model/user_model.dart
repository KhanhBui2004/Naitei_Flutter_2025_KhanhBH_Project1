class User {
  final String accessToken;
  final String refreshToken;
  final String id;
  final String username;
  final String email;
  final String firstName;
  final String lastName;
  final String role;
  final String image;

  User({
    required this.accessToken,
    required this.refreshToken,
    required this.id,
    required this.username,
    required this.email,
    this.firstName = '',
    this.lastName = '',
    this.role = '',
    this.image = '',
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
    accessToken: json['accessToken'] ?? '',
    refreshToken: json['refreshToken'] ?? '',
    id: json['id']?.toString() ?? '',
    username: json['username'] ?? '',
    email: json['email'] ?? '',
    firstName: json['firstName'] ?? '',
    lastName: json['lastName'] ?? '',
    role: json['role'] ?? '',
    image: json['image'] ?? '',
  );

  /// 👉 thêm hàm này để tiện lưu/convert
  Map<String, dynamic> toJson() => {
    'accessToken': accessToken,
    'refreshToken': refreshToken,
    'id': id,
    'username': username,
    'email': email,
    'firstName': firstName,
    'lastName': lastName,
    'role': role,
    'image': image,
  };
}
