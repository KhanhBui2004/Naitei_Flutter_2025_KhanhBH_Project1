import 'package:bloc/bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/auth/register/register_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/auth/register/register_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/auth/register_service.dart';

class RegisterBloc extends Bloc<RegisterEvent, RegisterState> {
  RegisterBloc(this.registerService) : super(RegisterInitial()) {
    on<RegisterStarted>(_onRegisterStarted);
  }

  final RegisterService registerService;

  void _onRegisterStarted(
    RegisterStarted event,
    Emitter<RegisterState> emit,
  ) async {

    emit(RegisterInProgress());

    if (event.username.isEmpty ||
        event.password.isEmpty ||
        event.cfpassword.isEmpty ||
        event.firstName.isEmpty ||
        event.lastName.isEmpty ||
        event.email.isEmpty) {
      emit(RegisterFailure('Please write all information!'));
      return;
    }

    final usernameRegex = RegExp(r'^[a-zA-Z][a-zA-Z0-9]*$');
    if (!usernameRegex.hasMatch(event.username)) {
      emit(RegisterFailure('Username is invalid!'));
      return;
    }

    if (event.password != event.cfpassword) {
      emit(RegisterFailure('Confirm password is invalid!'));
      return;
    }

    if (event.email.isEmpty ||
        !RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(event.email)) {
      emit(RegisterFailure('Email is invalid'));
      return;
    }

    try {
      final isRegister = await registerService.register(
        event.firstName,
        event.lastName,
        event.username,
        event.password,
        event.email,
      );

      if (isRegister['code'] == 201) {
        emit(RegisterSuccess(isRegister['message']));
      } else {
        emit(RegisterFailure(isRegister['message'] ?? 'Register Failed'));
      }
    } catch (e) {
      emit(RegisterFailure(e.toString().replaceFirst('Exception: ', '')));
    }
  }
}
