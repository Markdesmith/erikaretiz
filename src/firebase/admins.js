// Who may use the admin. Keep in sync with firestore.rules and storage.rules,
// which enforce the same list on the server.
export const ADMIN_EMAILS = ['markdesmith@gmail.com', 'actress_erikaretiz@outlook.com'];

export function isAdmin(user) {
  return Boolean(user?.email && user.emailVerified && ADMIN_EMAILS.includes(user.email.toLowerCase()));
}
