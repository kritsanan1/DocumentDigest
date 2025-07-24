import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ServicesPage from '../pages/services';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('Services Page', () => {
  it('renders service categories', async () => {
    renderWithProviders(<ServicesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('บริการของเรา')).toBeInTheDocument();
      expect(screen.getByText('ชำระภาษี')).toBeInTheDocument();
      expect(screen.getByText('ขออนุญาต')).toBeInTheDocument();
      expect(screen.getByText('ร้องเรียน')).toBeInTheDocument();
      expect(screen.getByText('QR Code')).toBeInTheDocument();
    });
  });

  it('displays service requests', async () => {
    renderWithProviders(<ServicesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('คำขอบริการของคุณ')).toBeInTheDocument();
    });
  });
});