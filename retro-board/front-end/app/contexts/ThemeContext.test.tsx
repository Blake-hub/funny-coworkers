import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, ThemeContext } from './ThemeContext';
import React from 'react';

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

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: jest.fn().mockReturnValue({
    matches: false,
  }),
  writable: true,
});

describe('ThemeProvider', () => {
  beforeEach(() => {
    mockLocalStorage.getItem.mockReset();
    mockLocalStorage.setItem.mockReset();
    mockLocalStorage.removeItem.mockReset();
    (window.matchMedia as jest.Mock).mockReset();
    (window.matchMedia as jest.Mock).mockReturnValue({
      matches: false,
    });
    jest.clearAllMocks();
  });

  it('should render children without errors', () => {
    const { container } = render(
      <ThemeProvider>
        <div>Test content</div>
      </ThemeProvider>
    );
    expect(container).toBeInTheDocument();
    expect(container.textContent).toBe('Test content');
  });

  it('should use light theme by default when no saved theme', () => {
    // Mock localStorage.getItem to return null
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Mock matchMedia to return false (prefers light)
    (window.matchMedia as jest.Mock).mockReturnValue({
      matches: false,
    });
    
    let contextValue: { theme: string; toggleTheme: () => void } | undefined;
    render(
      <ThemeProvider>
        <ThemeContext.Consumer>
          {(value) => {
            contextValue = value;
            return <div>Test</div>;
          }}
        </ThemeContext.Consumer>
      </ThemeProvider>
    );
    
    expect(contextValue?.theme).toBe('light');
  });

  it('should use dark theme when system prefers dark', () => {
    // Mock localStorage.getItem to return null
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Mock matchMedia to return true (prefers dark)
    (window.matchMedia as jest.Mock).mockReturnValue({
      matches: true,
    });
    
    let contextValue: { theme: string; toggleTheme: () => void } | undefined;
    render(
      <ThemeProvider>
        <ThemeContext.Consumer>
          {(value) => {
            contextValue = value;
            return <div>Test</div>;
          }}
        </ThemeContext.Consumer>
      </ThemeProvider>
    );
    
    expect(contextValue?.theme).toBe('dark');
  });

  it('should use saved theme from localStorage', () => {
    // Mock localStorage.getItem to return dark theme
    mockLocalStorage.getItem.mockReturnValue('dark');
    
    let contextValue: { theme: string; toggleTheme: () => void } | undefined;
    render(
      <ThemeProvider>
        <ThemeContext.Consumer>
          {(value) => {
            contextValue = value;
            return <div>Test</div>;
          }}
        </ThemeContext.Consumer>
      </ThemeProvider>
    );
    
    expect(contextValue?.theme).toBe('dark');
  });

  it('should toggle theme correctly', async () => {
    // Mock matchMedia to return false (prefers light)
    (window.matchMedia as jest.Mock).mockReturnValue({
      matches: false,
    });
    
    const TestComponent = () => {
      const value = React.useContext(ThemeContext);
      return (
        <div>
          <span data-testid="theme">{value?.theme}</span>
          <button data-testid="toggle" onClick={value?.toggleTheme}>
            Toggle Theme
          </button>
        </div>
      );
    };
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    // Wait for useEffect to complete
    await screen.findByTestId('theme');
    expect(screen.getByTestId('theme').textContent).toBe('light');
    
    // Click to toggle theme
    fireEvent.click(screen.getByTestId('toggle'));
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('should handle SSR case when window is undefined', async () => {
    // Mock window as undefined
    delete (global as any).window;
    
    const TestComponent = () => {
      const value = React.useContext(ThemeContext);
      return (
        <span data-testid="theme">{value?.theme}</span>
      );
    };
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    // Wait for component to render
    await screen.findByTestId('theme');
    expect(screen.getByTestId('theme').textContent).toBe('light');
    
    // Restore window
    (global as any).window = {
      localStorage: mockLocalStorage,
      matchMedia: jest.fn().mockReturnValue({ matches: false }),
      document: {
        documentElement: {
          classList: {
            add: jest.fn(),
            remove: jest.fn(),
          },
        },
      },
    };
  });
});
