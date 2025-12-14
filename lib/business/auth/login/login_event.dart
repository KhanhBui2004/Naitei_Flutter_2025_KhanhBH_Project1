class AuthEvent {}

class AuthLoginStarted extends AuthEvent {
  AuthLoginStarted({required this.username, required this.password});

  final String username;
  final String password;
}


