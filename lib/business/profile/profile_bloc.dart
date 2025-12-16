import 'package:bloc/bloc.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/profile/profile_event.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/business/profile/profile_state.dart';
import 'package:naitei_flutter_2025_khanhbh_project1/data/service/profile/profile_service.dart';

class ProfileBloc extends Bloc<ProfileEvent, ProfileState> {
  ProfileBloc(this.profileService) : super(ProfileInitial()) {
    on<PatchProfile>(_onPatchProfile);
  }

  final ProfileService profileService;

  Future<void> _onPatchProfile(
    PatchProfile event,
    Emitter<ProfileState> emit,
  ) async {
    emit(ProfileInProgress());

    if (event.password != event.cfpassword) {
      emit(PatchProfileFailure('Confirm password is invalid!'));
      return;
    }

    if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(event.email)) {
      emit(PatchProfileFailure('Email is invalid!'));
      return;
    }

    try {
      final response = await profileService.patchProfile(
        event.firstName,
        event.lastName,
        event.username,
        event.password,
        event.email,
        event.avtUrl,
      );

      if (response['code'] == 200) {
        emit(PatchProfileSuccess(response['message']));
      } else {
        emit(PatchProfileFailure(response['message']));
      }
    } catch (e) {
      emit(PatchProfileFailure(e.toString().replaceFirst('Exception: ', '')));
    }
  }
}
