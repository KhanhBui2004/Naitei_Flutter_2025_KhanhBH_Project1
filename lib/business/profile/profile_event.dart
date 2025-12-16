class ProfileEvent {}

class PatchProfile extends ProfileEvent {
  final String firstName;
  final String lastName;
  final String username;
  final String password;
  final String cfpassword;
  final String email;
  final String avtUrl;

  PatchProfile({
    required this.firstName,
    required this.lastName,
    required this.username,
    required this.password,
    required this.cfpassword,
    required this.email,
    required this.avtUrl,
  });
}
