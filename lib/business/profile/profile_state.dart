sealed class ProfileState {}

class ProfileInitial extends ProfileState {}

class ProfileInProgress extends ProfileState {}

class PatchProfileSuccess extends ProfileState {
  final String message;
  PatchProfileSuccess(this.message);
}

class PatchProfileFailure extends ProfileState {
  final String message;
  PatchProfileFailure(this.message);
}
