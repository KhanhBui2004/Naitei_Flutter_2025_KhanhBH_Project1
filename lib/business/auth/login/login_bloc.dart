import 'package:bloc/bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/auth/login/login_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/auth/login/login_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/service/auth/login_service.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  AuthBloc(this.loginService) : super(AuthInitial()) {
    on<AuthLoginStarted>(_onLoginStarted);
  }

  final LoginService loginService;

  void _onLoginStarted(AuthLoginStarted event, Emitter<AuthState> emit) async {
    emit(AuthLoginInProgress());

    if (event.username.trim().isEmpty) {
      emit(AuthLoginFailure('Please Enter username'));
      return;
    }

    if (event.password.trim().isEmpty) {
      emit(AuthLoginFailure('Please Enter password'));
      return;
    }

    try {
      final isloggedIn = await loginService.login(
        event.username,
        event.password,
      );

      if (isloggedIn['code'] == 200) {
        emit(AuthLoginSuccess(isloggedIn['message']));
      } else {
        emit(AuthLoginFailure(isloggedIn['message'] ?? 'Login Failed!'));
      }
    } catch (e) {
      emit(AuthLoginFailure(e.toString().replaceFirst('Exception: ', '')));
    }
  }
}
