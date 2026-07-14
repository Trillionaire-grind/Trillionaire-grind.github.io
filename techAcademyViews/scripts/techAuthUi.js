/**
 * Shared auth UX helpers for Tech Academy landing pages.
 * Replaces debug alerts with short, user-facing messages.
 */

export function friendlyAuthError(error) {
  const code = error?.code || "";
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/missing-email":
      return "Please enter your email address.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Email or password is incorrect. Please try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function friendlyResetError(error) {
  const code = error?.code || "";
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/missing-email":
      return "Please enter your email address.";
    case "auth/user-not-found":
      // Do not confirm whether an account exists
      return "If an account exists for that email, you will receive a reset link shortly.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return "Could not send the reset email. Please try again.";
  }
}

export function validateEmail(email) {
  return typeof email === "string" && email.includes("@") && email.trim().length > 5;
}
