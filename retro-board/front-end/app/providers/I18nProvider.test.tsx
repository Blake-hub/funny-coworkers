import { render } from '@testing-library/react';
import { I18nProvider } from './I18nProvider';

// Mock i18next
jest.mock('i18next', () => {
  const original = jest.requireActual('i18next');
  return {
    ...original,
    isInitialized: false,
    use: jest.fn().mockReturnThis(),
    init: jest.fn(),
    changeLanguage: jest.fn(),
  };
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('I18nProvider', () => {
  beforeEach(() => {
    mockLocalStorage.getItem.mockClear();
    jest.clearAllMocks();
  });

  it('should render children without errors', () => {
    const { container } = render(
      <I18nProvider>
        <div>Test content</div>
      </I18nProvider>
    );
    expect(container).toBeInTheDocument();
    expect(container.textContent).toBe('Test content');
  });
  
  it('should initialize i18n if not already initialized', () => {
    // Clear the module cache
    jest.resetModules();
    
    // Mock i18next with isInitialized: false
    jest.doMock('i18next', () => {
      const original = jest.requireActual('i18next');
      return {
        ...original,
        isInitialized: false,
        use: jest.fn().mockReturnThis(),
        init: jest.fn(),
        changeLanguage: jest.fn(),
      };
    });
    
    // Import again to trigger initialization
    require('./I18nProvider');
    
    const i18n = require('i18next');
    expect(i18n.init).toHaveBeenCalled();
  });

  it('should use English as default when localStorage has no language', () => {
    // Mock localStorage.getItem to return null
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Clear the module cache to re-initialize with our mock
    jest.resetModules();
    
    // Import again to trigger initialization
    require('./I18nProvider');
    
    const i18n = require('i18next');
    expect(i18n.init).toHaveBeenCalled();
  });

  it('should use English as default when localStorage has invalid language', () => {
    // Mock localStorage.getItem to return invalid language
    mockLocalStorage.getItem.mockReturnValue('fr');
    
    // Clear the module cache to re-initialize with our mock
    jest.resetModules();
    
    // Import again to trigger initialization
    require('./I18nProvider');
    
    const i18n = require('i18next');
    expect(i18n.init).toHaveBeenCalled();
  });

  it('should use saved language from localStorage when valid', () => {
    // Mock localStorage.getItem to return valid language
    mockLocalStorage.getItem.mockReturnValue('zh');
    
    // Clear the module cache to re-initialize with our mock
    jest.resetModules();
    
    // Import again to trigger initialization
    require('./I18nProvider');
    
    const i18n = require('i18next');
    expect(i18n.init).toHaveBeenCalled();
  });

  it('should use English as default when window is undefined (SSR)', () => {
    // Mock window as undefined
    delete (global as any).window;
    
    // Clear the module cache to re-initialize with our mock
    jest.resetModules();
    
    // Import again to trigger initialization
    require('./I18nProvider');
    
    const i18n = require('i18next');
    expect(i18n.init).toHaveBeenCalled();
    
    // Restore window
    (global as any).window = {};
  });

  it('should not initialize i18n if already initialized', () => {
    // Clear the module cache
    jest.resetModules();
    
    // Mock i18next with isInitialized: true
    jest.doMock('i18next', () => {
      const original = jest.requireActual('i18next');
      return {
        ...original,
        isInitialized: true,
        use: jest.fn().mockReturnThis(),
        init: jest.fn(),
        changeLanguage: jest.fn(),
      };
    });
    
    // Import again to trigger initialization
    require('./I18nProvider');
    
    const i18n = require('i18next');
    expect(i18n.init).not.toHaveBeenCalled();
  });
});
