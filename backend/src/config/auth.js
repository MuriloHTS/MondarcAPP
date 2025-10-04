module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET || "default-secret-key-change-in-production",
    expiresIn: process.env.JWT_EXPIRE || "7d",
  },
  refreshToken: {
    secret:
      process.env.JWT_REFRESH_SECRET ||
      "default-refresh-secret-key-change-in-production",
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "30d",
  },
  bcrypt: {
    saltRounds: 10,
  },
};
