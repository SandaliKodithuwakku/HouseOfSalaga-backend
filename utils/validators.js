const validateEmail = (email) => {
  const regex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return regex.test(email);
};

const validatePassword = (password) => {
  return password.length >= 6;
};

const validatePhone = (phone) => {
  const regex = /^[0-9]{10}$/;
  return regex.test(phone);
};

module.exports = {
  validateEmail,
  validatePassword,
  validatePhone,
};