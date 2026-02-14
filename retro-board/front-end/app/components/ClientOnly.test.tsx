import { render, screen } from '@testing-library/react';
import { ClientOnly } from './ClientOnly';

describe('ClientOnly', () => {
  it('should render children after mount', async () => {
    render(
      <ClientOnly>
        <div>Test Content</div>
      </ClientOnly>
    );
    
    expect(await screen.findByText('Test Content')).toBeInTheDocument();
  });
});
