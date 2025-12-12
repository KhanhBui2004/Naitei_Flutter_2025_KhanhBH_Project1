class Food {
  final int id;
  final String dishName;
  final String description;
  final String dishType;
  final String servingSize;
  final String cookingTime;
  final String ingredients;
  final String cookingMethod;
  final int calories;
  final int fat;
  final int fiber;
  final int sugar;
  final int protein;
  final String imageLink;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? deletedAt;

  Food({
    required this.id,
    required this.dishName,
    required this.description,
    required this.dishType,
    required this.servingSize,
    required this.cookingTime,
    required this.ingredients,
    required this.cookingMethod,
    required this.calories,
    required this.fat,
    required this.fiber,
    required this.sugar,
    required this.protein,
    required this.imageLink,
    required this.createdAt,
    required this.updatedAt,
    this.deletedAt,
  });

  factory Food.fromJson(Map<String, dynamic> json) {
    return Food(
      id: json['id'],
      dishName: json['dish_name'],
      description: json['description'],
      dishType: json['dish_type'],
      servingSize: json['serving_size'],
      cookingTime: json['cooking_time'],
      ingredients: json['ingredients'],
      cookingMethod: json['cooking_method'],
      calories: json['calories'],
      fat: json['fat'],
      fiber: json['fiber'],
      sugar: json['sugar'],
      protein: json['protein'],
      imageLink: json['image_link'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      deletedAt: json['deletedAt'] != null
          ? DateTime.tryParse(json['deletedAt'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      "id": id,
      "dish_name": dishName,
      "description": description,
      "dish_type": dishType,
      "serving_size": servingSize,
      "cooking_time": cookingTime,
      "ingredients": ingredients,
      "cooking_method": cookingMethod,
      "calories": calories,
      "fat": fat,
      "fiber": fiber,
      "sugar": sugar,
      "protein": protein,
      "image_link": imageLink,
      "createdAt": createdAt.toIso8601String(),
      "updatedAt": updatedAt.toIso8601String(),
      "deletedAt": deletedAt?.toIso8601String(),
    };
  }
}

class FavorFood {
  final int id;
  final String image;
  final String name;
  FavorFood({required this.id, required this.image, required this.name});
  factory FavorFood.fromJson(Map<String, dynamic> json) {
    return FavorFood(
      id: json['id'],
      image: json['image_link'],
      name: json['dish_name'],
    );
  }
}
