sealed class AuthState {}

class AuthInitial extends AuthState {}

class AuthLoginInProgress extends AuthState {}

class AuthLoginSuccess extends AuthState {
  final String message;
  AuthLoginSuccess(this.message);
}

class AuthLoginFailure extends AuthState {
  final String message;
  AuthLoginFailure(this.message);
}
