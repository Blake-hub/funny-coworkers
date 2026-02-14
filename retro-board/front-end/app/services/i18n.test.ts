import i18n from './i18n';

jest.mock('i18next', () => ({
  use: jest.fn().mockReturnThis(),
  init: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  initReactI18next: jest.fn(),
}));

jest.mock('i18next-http-backend', () => jest.fn());

describe('i18n service', () => {
  it('should export i18n instance', () => {
    expect(i18n).toBeDefined();
  });
});
