// class Favoritecard extends StatelessWidget {
//   const Favoritecard({
//     super.key,
//     required String name,
//     required Image image,
//     required double rating,
//   }) : _image = image,
//        _rating = rating,
//        _name = name;

//   final String _name;
//   final Image _image;
//   final double _rating;

//   @override
//   Widget build(BuildContext context) {
//     return Container(
//       height: 300,
//       width: double.infinity,
//       child: Column(
//         children: [
//           SizedBox(height: 200, width: double.infinity, child: _image),
//           SizedBox(height: 10),
//           Padding(
//             padding: const EdgeInsets.symmetric(horizontal: 20.0),
//             child: Row(
//               children: [
//                 Text(
//                   _name,
//                   style: Helper.getTheme(
//                     context,
//                   ).headlineLarge?.copyWith(color: AppColors.primary),
//                 ),
//               ],
//             ),
//           ),
//           Padding(
//             padding: const EdgeInsets.symmetric(horizontal: 20.0),
//             child: Row(
//               children: [
//                 Image.asset(Helper.getAssetName("star_filled.png", "virtual")),
//                 SizedBox(width: 5),
//                 Text('$_rating', style: TextStyle(color: AppColors.orange)),
//                 SizedBox(width: 5),
//                 // Text("(124 ratings) Cafe"),
//                 // SizedBox(width: 5),
//                 Padding(
//                   padding: const EdgeInsets.only(bottom: 5),
//                   child: Text(
//                     ".",
//                     style: TextStyle(
//                       color: AppColors.orange,
//                       fontWeight: FontWeight.bold,
//                     ),
//                   ),
//                 ),
//                 Text(" Western Food"),
//               ],
//             ),
//           ),
//         ],
//       ),
//     );
//   }
// }
