class TagEvent {}

class ViewListTag extends TagEvent {
  final int page;
  final int limit;
  final String? query;

  ViewListTag({required this.page, required this.limit, this.query});
}

