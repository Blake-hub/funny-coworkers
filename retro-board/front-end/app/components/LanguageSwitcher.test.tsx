import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

describe('LanguageSwitcher', () => {
  const mockUseTranslation = useTranslation as jest.MockedFunction<typeof useTranslation>;
  const mockChangeLanguage = jest.fn();
  
  // Helper function to create a mock i18n object
  const createMockI18n = (language: string) => ({
    language,
    changeLanguage: mockChangeLanguage,
  } as any);
  
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Mock useTranslation
    mockUseTranslation.mockReturnValue({
      t: () => '',
      i18n: createMockI18n('en'),
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render with English language by default', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('should render with Chinese language when language is zh', () => {
    mockUseTranslation.mockReturnValue({
      t: () => '',
      i18n: createMockI18n('zh'),
    } as any);
    render(<LanguageSwitcher />);
    expect(screen.getByText('中文')).toBeInTheDocument();
  });

  it('should open language menu when button is clicked', () => {
    render(<LanguageSwitcher />);
    const languageButton = screen.getByText('EN');
    fireEvent.click(languageButton);
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('中文')).toBeInTheDocument();
  });

  it('should change language to English when English option is clicked', () => {
    render(<LanguageSwitcher />);
    const languageButton = screen.getByText('EN');
    fireEvent.click(languageButton);
    fireEvent.click(screen.getByText('English'));
    expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    expect(localStorage.getItem('language')).toBe('en');
  });

  it('should change language to Chinese when Chinese option is clicked', () => {
    render(<LanguageSwitcher />);
    const languageButton = screen.getByText('EN');
    fireEvent.click(languageButton);
    fireEvent.click(screen.getByText('中文'));
    expect(mockChangeLanguage).toHaveBeenCalledWith('zh');
    expect(localStorage.getItem('language')).toBe('zh');
  });

  it('should close menu when clicking outside', () => {
    render(<LanguageSwitcher />);
    const languageButton = screen.getByText('EN');
    fireEvent.click(languageButton);
    expect(screen.getByText('English')).toBeInTheDocument();
    // Click outside the menu
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('English')).not.toBeInTheDocument();
  });

  it('should handle null menuRef gracefully', () => {
    render(<LanguageSwitcher />);
    // This test ensures that the component doesn't crash when menuRef is null
    // The handleClickOutside function should handle this case
    fireEvent.mouseDown(document.body);
    // No crash should occur
  });

  it('should highlight English language in menu when English is current language', () => {
    // Test with English as current language
    mockUseTranslation.mockReturnValue({
      t: () => '',
      i18n: createMockI18n('en'),
    } as any);

    render(<LanguageSwitcher />);
    const languageButton = screen.getByText('EN');
    fireEvent.click(languageButton);
    
    // Check that English option has active class
    const englishButton = screen.getByText('English');
    expect(englishButton).toHaveClass('bg-neutral-100');
    expect(englishButton).toHaveClass('font-medium');
    
    // Check that Chinese option does not have active class
    const chineseButton = screen.getByText('中文');
    expect(chineseButton).not.toHaveClass('bg-neutral-100');
    expect(chineseButton).not.toHaveClass('font-medium');
  });

  it('should highlight Chinese language in menu when Chinese is current language', () => {
    // Test with Chinese as current language
    mockUseTranslation.mockReturnValue({
      t: () => '',
      i18n: createMockI18n('zh'),
    } as any);

    render(<LanguageSwitcher />);
    const languageButton = screen.getByText('中文');
    fireEvent.click(languageButton);
    
    // Check that Chinese option has active class - use getAllByText and filter for the button
    const chineseElements = screen.getAllByText('中文');
    const chineseOption = chineseElements.find(el => el.tagName === 'BUTTON');
    expect(chineseOption).toHaveClass('bg-neutral-100');
    expect(chineseOption).toHaveClass('font-medium');
    
    // Check that English option does not have active class
    const englishButton = screen.getByText('English');
    expect(englishButton).not.toHaveClass('bg-neutral-100');
    expect(englishButton).not.toHaveClass('font-medium');
  });
});
