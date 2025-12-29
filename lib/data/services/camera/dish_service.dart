class DishService {
  static const Map<String, String> _ingredientMap = {
    "beef": "thịt bò",
    "bell_pepper": "ớt chuông",
    "cabbage": "bắp cải",
    "carrot": "cà rốt",
    "cauliflower": "súp lơ",
    "chicken": "thịt gà",
    "cucumber": "dưa leo",
    "egg": "trứng",
    "fish": "cá",
    "garlic": "tỏi",
    "ginger": "gừng",
    "kumquat": "quất",
    "lemon": "chanh",
    "onion": "hành tây",
    "pork": "thịt heo",
    "potato": "khoai tây",
    "shrimp": "tôm",
    "small_pepper": "ớt",
    "tofu": "đậu phụ",
    "tomato": "cà chua",
  };

  static String convertIngredientToVietnamese(String englishIngredient) {
    final normalized = englishIngredient.toLowerCase().trim();

    return _ingredientMap[normalized] ?? englishIngredient;
  }

  static List<String> convertIngredientsToVietnamese(
    List<String> englishIngredients,
  ) {
    return englishIngredients
        .map((ingredient) => convertIngredientToVietnamese(ingredient))
        .toList();
  }

  static String normalizeIngredientName(String ingredientName) {
    final normalized = ingredientName.toLowerCase().trim();

    final vietnameseIngredient = _ingredientMap[normalized];
    if (vietnameseIngredient != null) {
      return vietnameseIngredient;
    }

    final ingredientMappings = {
      'person': '',
      'bicycle': '',
      'car': '',
      'motorcycle': '',
      'airplane': '',
      'bus': '',
      'train': '',
      'truck': '',
      'boat': '',
      'traffic light': '',
      'fire hydrant': '',
      'stop sign': '',
      'parking meter': '',
      'bench': '',
      'bird': 'chicken',
      'cat': '',
      'dog': '',
      'horse': '',
      'sheep': '',
      'cow': 'beef',
      'elephant': '',
      'bear': '',
      'zebra': '',
      'giraffe': '',
      'backpack': '',
      'umbrella': '',
      'handbag': '',
      'tie': '',
      'suitcase': '',
      'frisbee': '',
      'skis': '',
      'snowboard': '',
      'sports ball': '',
      'kite': '',
      'baseball bat': '',
      'baseball glove': '',
      'skateboard': '',
      'surfboard': '',
      'tennis racket': '',
      'bottle': '',
      'wine glass': '',
      'cup': '',
      'fork': '',
      'knife': '',
      'spoon': '',
      'bowl': '',
      'banana': 'banana',
      'apple': 'apple',
      'sandwich': 'bread',
      'orange': 'orange',
      'broccoli': 'broccoli',
      'carrot': 'carrot',
      'hot dog': 'sausage',
      'pizza': 'cheese',
      'donut': '',
      'cake': '',
    };

    return ingredientMappings[normalized] ?? normalized;
  }
}
