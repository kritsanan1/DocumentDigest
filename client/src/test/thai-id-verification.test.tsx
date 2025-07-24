import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from '../pages/login';
import { Toaster } from '@/components/ui/toaster';

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => '550e8400-e29b-41d4-a716-446655440000',
  },
});

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
      <Toaster />
    </QueryClientProvider>
  );
};

describe('Thai ID Verification', () => {
  it('renders verification method selection', () => {
    renderWithProviders(<LoginPage />);
    
    expect(screen.getByText('เลือกวิธีการยืนยันตัวตน')).toBeInTheDocument();
    expect(screen.getByText('NDID Blockchain')).toBeInTheDocument();
    expect(screen.getByText('D.DOPA Database')).toBeInTheDocument();
    expect(screen.getByText('ThaID Mobile App')).toBeInTheDocument();
  });

  it('validates Thai ID format', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);
    
    // Select DOPA method
    await user.click(screen.getByText('D.DOPA Database'));
    
    // Fill form with invalid ID
    await user.type(screen.getByLabelText('เลขบัตรประชาชน *'), '123456');
    await user.type(screen.getByLabelText('ชื่อ *'), 'กฤษนันทน์');
    await user.type(screen.getByLabelText('นามสกุล *'), 'นำแปง');
    
    // Try to submit
    await user.click(screen.getByText('เริ่มยืนยันตัวตน'));
    
    await waitFor(() => {
      expect(screen.getByText('รูปแบบเลขบัตรประชาชนไม่ถูกต้อง')).toBeInTheDocument();
    });
  });

  it('successfully processes verification', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);
    
    // Select DOPA method
    await user.click(screen.getByText('D.DOPA Database'));
    
    // Fill valid form
    await user.type(screen.getByLabelText('เลขบัตรประชาชน *'), '1234567890123');
    await user.type(screen.getByLabelText('ชื่อ *'), 'กฤษนันทน์');
    await user.type(screen.getByLabelText('นามสกุล *'), 'นำแปง');
    
    // Submit form
    await user.click(screen.getByText('เริ่มยืนยันตัวตน'));
    
    // Should show verification in progress
    await waitFor(() => {
      expect(screen.getByText('กำลังยืนยันตัวตน')).toBeInTheDocument();
    });
  });

  it('displays security level badges correctly', () => {
    renderWithProviders(<LoginPage />);
    
    expect(screen.getByText('IAL3')).toBeInTheDocument(); // NDID
    expect(screen.getByText('IAL2')).toBeInTheDocument(); // DOPA
  });

  it('handles back navigation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);
    
    // Select method and go to input form
    await user.click(screen.getByText('D.DOPA Database'));
    expect(screen.getByText('กรอกข้อมูลยืนยันตัวตน')).toBeInTheDocument();
    
    // Go back
    await user.click(screen.getByText('ย้อนกลับ'));
    expect(screen.getByText('เลือกวิธีการยืนยันตัวตน')).toBeInTheDocument();
  });

  it('toggles citizen ID visibility', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);
    
    // Go to input form
    await user.click(screen.getByText('D.DOPA Database'));
    
    const idInput = screen.getByLabelText('เลขบัตรประชาชน *') as HTMLInputElement;
    expect(idInput.type).toBe('password');
    
    // Toggle visibility
    await user.click(screen.getByRole('button', { name: /toggle password visibility/i }));
    expect(idInput.type).toBe('text');
  });
});