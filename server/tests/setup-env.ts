process.env.NODE_ENV = 'test';
process.env.MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/material_mundi_test';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || 'test-access-secret-0123456789abcdef0123456789abcdef';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-0123456789abcdef0123456789abcdef';
process.env.JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
process.env.IMAGE_STORAGE = 'local';
process.env.LOCAL_UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR || 'uploads-test';
process.env.EMAIL_PROVIDER = 'console';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error';
process.env.RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX || '100000';
process.env.RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS || '900000';
process.env.LOGIN_RATE_LIMIT_MAX = process.env.LOGIN_RATE_LIMIT_MAX || '5';
process.env.UPLOAD_RATE_LIMIT_MAX = process.env.UPLOAD_RATE_LIMIT_MAX || '100000';
process.env.UPLOAD_RATE_LIMIT_WINDOW_MS =
  process.env.UPLOAD_RATE_LIMIT_WINDOW_MS || '900000';
process.env.PASSWORD_RESET_EXPIRES_MINUTES =
  process.env.PASSWORD_RESET_EXPIRES_MINUTES || '30';
