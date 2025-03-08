import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import VendorDashboard from '../VendorDashboard';
import { supabase } from '../../lib/supabase'; // Ensure this matches your import

// Mock vendor data
const mockVendor = {
  id: 'c2d3e909-2756-45fe-8477-d2e1b4a41e36',
  business_name: 'Test Vendor',
  subscription_plan: 'plan_monthly',
  slug: 'test-vendor',
};

describe('VendorDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders vendor dashboard with metrics and generates coupon', async () => {
    render(
      <BrowserRouter>
        <VendorDashboard vendor={mockVendor} />
      </BrowserRouter>
    );

    // Check initial render
    expect(screen.getByText(/Welcome, Test Vendor!/i)).toBeInTheDocument();
    expect(screen.getByText(/Upcoming Appointments/i)).toBeInTheDocument();

    // Simulate coupon generation
    const generateButton = screen.getByText(/Generate Coupon/i);
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Your Coupon Code: COUPON-TEST123/i)).toBeInTheDocument();
      expect(screen.getByText(/Stripe Coupon ID: co_test123/i)).toBeInTheDocument();
    });
  });

  it('handles coupon generation error', async () => {
    // Mock error response
    supabase.functions.invoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'Failed to generate coupon' },
    });

    render(
      <BrowserRouter>
        <VendorDashboard vendor={mockVendor} />
      </BrowserRouter>
    );

    const generateButton = screen.getByText(/Generate Coupon/i);
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to generate coupon/i)).toBeInTheDocument();
    });
  });
});