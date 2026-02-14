import { render, screen } from '@testing-library/react';
import { I18nProvider } from './I18nProvider';

jest.mock('i18next', () => ({
  isInitialized: false,
  use: jest.fn().mockReturnThis(),
  init: jest.fn(),
}));

describe('I18nProvider', () => {
  it('should render children', () => {
    render(
      <I18nProvider>
        <div data-testid="child">Test Child</div>
      </I18nProvider>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toHaveTextContent('Test Child');
  });
});
