import { createClient } from '@supabase/supabase-js';

const mockSupabase = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'mock-user-id', email: 'test@example.com' } },
      error: null,
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    getSession: jest.fn().mockResolvedValue({
      data: { session: { access_token: 'mock-token' } },
      error: null,
    }),
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: { id: 'mock-vendor-id' }, error: null }),
  insert: jest.fn().mockResolvedValue({ error: null }),
  functions: {
    invoke: jest.fn().mockResolvedValue({
      data: { couponCode: 'COUPON-TEST123', stripeCouponId: 'co_test123' },
      error: null,
    }),
  },
};

jest.mock('../../lib/supabase', () => ({
  supabase: mockSupabase,
}));

export {};