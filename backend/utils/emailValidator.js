const IIIT_EMAIL_DOMAIN = "@iiit.ac.in";

const isIIITEmail = (email) => {
  return email.toLowerCase().endsWith(IIIT_EMAIL_DOMAIN);
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return { valid: false, message: "Password must be at least 6 characters" };
  }
  return { valid: true, message: "Password is valid" };
};

module.exports = {
  isIIITEmail,
  isValidEmail,
  validatePassword,
  IIIT_EMAIL_DOMAIN,
};
