import '@testing-library/jest-dom';

// Фикс TextEncoder/TextDecoder (главное, что решает ошибку)
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}