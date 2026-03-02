import '../../__mocks__/supabase-module-mock';
import { mockSupabase, resetSupabaseMocks } from '../../__mocks__/supabase';
import {
  createDraftReceipt,
  finalizeReceipt,
  deleteReceipt,
  getUserReceipts,
} from '@/lib/services/receipt';

beforeEach(() => {
  resetSupabaseMocks();
});

describe('createDraftReceipt', () => {
  it('inserts a draft receipt and returns the ID', async () => {
    const mockId = 'receipt-uuid-123';

    // Configure the mock chain to resolve with our data
    const mockBuilder = {
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: mockId },
        error: null,
      }),
    };
    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue(mockBuilder),
    } as any);

    const id = await createDraftReceipt('user-123', 'file:///photo.jpg');

    expect(id).toBe(mockId);
    expect(mockSupabase.from).toHaveBeenCalledWith('receipts');
  });

  it('throws on insert error', async () => {
    const mockBuilder = {
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'RLS violation' },
      }),
    };
    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue(mockBuilder),
    } as any);

    await expect(
      createDraftReceipt('user-123', 'file:///photo.jpg')
    ).rejects.toThrow('Failed to create receipt: RLS violation');
  });
});

describe('finalizeReceipt', () => {
  it('updates receipt with calculated values', async () => {
    const mockReceipt = {
      id: 'receipt-123',
      restaurant_name: 'Taco Bell',
      total: 12.5,
      total_calories: 1500,
      calories_per_dollar: 120,
      value_score: 120,
    };

    const updateMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockReceipt,
            error: null,
          }),
        }),
      }),
    });

    mockSupabase.from.mockReturnValue({ update: updateMock } as any);

    const result = await finalizeReceipt('receipt-123', {
      restaurantName: 'Taco Bell',
      subtotal: 11.0,
      total: 12.5,
      totalCalories: 1500,
    });

    expect(result.restaurant_name).toBe('Taco Bell');
    expect(updateMock).toHaveBeenCalled();
  });
});

describe('deleteReceipt', () => {
  it('calls delete on the receipts table', async () => {
    const eqMock = jest.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockReturnValue({
      delete: jest.fn().mockReturnValue({ eq: eqMock }),
    } as any);

    await expect(deleteReceipt('receipt-123')).resolves.toBeUndefined();
    expect(mockSupabase.from).toHaveBeenCalledWith('receipts');
  });

  it('throws on error', async () => {
    const eqMock = jest.fn().mockResolvedValue({
      error: { message: 'not found' },
    });
    mockSupabase.from.mockReturnValue({
      delete: jest.fn().mockReturnValue({ eq: eqMock }),
    } as any);

    await expect(deleteReceipt('bad-id')).rejects.toThrow('Failed to delete receipt');
  });
});

describe('getUserReceipts', () => {
  it('fetches paginated receipts for a user', async () => {
    const mockReceipts = [
      { id: '1', restaurant_name: 'McDonalds' },
      { id: '2', restaurant_name: 'Wendys' },
    ];

    const rangeMock = jest.fn().mockResolvedValue({
      data: mockReceipts,
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: rangeMock,
          }),
        }),
      }),
    } as any);

    const results = await getUserReceipts('user-123', { limit: 10, offset: 0 });

    expect(results).toHaveLength(2);
    expect(results[0].restaurant_name).toBe('McDonalds');
  });
});
