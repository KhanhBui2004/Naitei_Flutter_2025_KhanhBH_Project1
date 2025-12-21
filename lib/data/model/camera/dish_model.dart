class DishModel {
  final String id;
  final String name;
  final String ingredients; // Changed from List<String> to String
  final String? imageUrl;
  final String? description;
  
  // Additional fields from API
  final int? cookingTime;
  final String? servingSize;
  final String? dishType;
  final int? calories;
  final int? protein;
  final int? fat;
  final int? fiber;
  final int? sugar;
  final int? matchingCount;
  final double? score;
  final String? cookingMethod;
  final String? dishTags;

  const DishModel({
    required this.id,
    required this.name,
    required this.ingredients,
    this.imageUrl,
    this.description,
    this.cookingTime,
    this.servingSize,
    this.dishType,
    this.calories,
    this.protein,
    this.fat,
    this.fiber,
    this.sugar,
    this.matchingCount,
    this.score,
    this.cookingMethod,
    this.dishTags,
  });

  static int? _parseIntSafely(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is String) return int.tryParse(value);
    return null;
  }

  static double? _parseDoubleSafely(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }

  factory DishModel.fromJson(Map<String, dynamic> json) {
    return DishModel(
      id: json['id'].toString(),
      name: json['dish_name'] as String? ?? json['name'] as String,
      ingredients: json['ingredients'] as String,
      imageUrl: json['image_link'] as String? ?? json['imageUrl'] as String?,
      description: json['description'] as String?,
      cookingTime: _parseIntSafely(json['cooking_time']),
      servingSize: json['serving_size'] as String?,
      dishType: json['dish_type'] as String?,
      calories: _parseIntSafely(json['calories']),
      protein: _parseIntSafely(json['protein']),
      fat: _parseIntSafely(json['fat']),
      fiber: _parseIntSafely(json['fiber']),
      sugar: _parseIntSafely(json['sugar']),
      matchingCount: json['matching_count'] as int?,
      score: _parseDoubleSafely(json['score']),
      cookingMethod: json['cooking_method'] as String?,
      dishTags: json['dish_tags'] as String?,
    );
  }

  /// Convert ingredients string to List<String>
  List<String> get ingredientsList {
    if (ingredients.isEmpty) return [];
    return ingredients
        .split(',')
        .map((e) => e.trim())
        .where((e) => e.isNotEmpty)
        .toList();
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'ingredients': ingredients,
      'imageUrl': imageUrl,
      'description': description,
      'cookingTime': cookingTime,
      'servingSize': servingSize,
      'dishType': dishType,
      'calories': calories,
      'protein': protein,
      'fat': fat,
      'fiber': fiber,
      'sugar': sugar,
      'matchingCount': matchingCount,
      'score': score,
      'cookingMethod': cookingMethod,
      'dishTags': dishTags,
    };
  }

  /// Checks if this dish can be made with the given available ingredients
  bool canBeMadeWith(List<String> availableIngredients) {
    return ingredientsList.every((ingredient) =>
        availableIngredients.any((available) =>
            available.toLowerCase().contains(ingredient.toLowerCase()) ||
            ingredient.toLowerCase().contains(available.toLowerCase())));
  }

  /// Returns the percentage of ingredients that are available
  double getMatchPercentage(List<String> availableIngredients) {
    final ingredientsListValue = ingredientsList;
    if (ingredientsListValue.isEmpty) return 0.0;
    
    final matchCount = ingredientsListValue
        .where((ingredient) => availableIngredients.any((available) =>
            available.toLowerCase().contains(ingredient.toLowerCase()) ||
            ingredient.toLowerCase().contains(available.toLowerCase())))
        .length;
    
    return (matchCount / ingredientsListValue.length) * 100;
  }

  @override
  String toString() {
    return 'DishModel(id: $id, name: $name, ingredients: $ingredients)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is DishModel &&
        other.id == id &&
        other.name == name;
  }

  @override
  int get hashCode => Object.hash(id, name);
}