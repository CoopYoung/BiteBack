import '../__mocks__/supabase-module-mock';
import { mockSupabase, resetSupabaseMocks } from '../__mocks__/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchRecentReceipts,
  fetchLeaderboard,
  fetchUserBadges,
  saveReceipt,
  updateUserProfile,
  fetchReceipt,
} from '@/lib/api';

jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  },
  __esModule: true,
}));

beforeEach(() => {
  resetSupabaseMocks();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
});

describe('fetchRecentReceipts', () => {
  it('returns receipts for a user', async () => {
    const mockReceipts = [
      { id: '1', restaurant_name: 'McDonalds', total: 12.5 },
      { id: '2', restaurant_name: 'Taco Bell', total: 8.0 },
    ];

    const limitMock = jest.fn().mockResolvedValue({
      data: mockReceipts,
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: limitMock,
          }),
        }),
      }),
    } as any);

    const results = await fetchRecentReceipts('user-123', 5);

    expect(results).toHaveLength(2);
    expect(results[0].restaurant_name).toBe('McDonalds');
    expect(mockSupabase.from).toHaveBeenCalledWith('receipts');
  });

  it('throws on error', async () => {
    const limitMock = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'RLS denied' },
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: limitMock,
          }),
        }),
      }),
    } as any);

    await expect(fetchRecentReceipts('user-123')).rejects.toThrow('Failed to fetch receipts');
  });
});

describe('fetchLeaderboard', () => {
  it('returns ranked entries', async () => {
    const mockUsers = [
      { id: 'u1', display_name: 'Alice', best_value_score: 200, total_scans: 10 },
      { id: 'u2', display_name: 'Bob', best_value_score: 150, total_scans: 5 },
    ];

    const limitMock = jest.fn().mockResolvedValue({
      data: mockUsers,
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: limitMock,
        }),
      }),
    } as any);

    const results = await fetchLeaderboard('alltime');

    expect(results).toHaveLength(2);
    expect(results[0].rank).toBe(1);
    expect(results[0].best_score).toBe(200);
    expect(results[1].rank).toBe(2);
  });

  it('applies weekly filter', async () => {
    const gteMock = jest.fn().mockResolvedValue({ data: [], error: null });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            gte: gteMock,
          }),
        }),
      }),
    } as any);

    await fetchLeaderboard('weekly');

    expect(gteMock).toHaveBeenCalledWith('updated_at', expect.any(String));
  });

  it('applies city filter', async () => {
    const eqMock = jest.fn().mockResolvedValue({ data: [], error: null });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            eq: eqMock,
          }),
        }),
      }),
    } as any);

    await fetchLeaderboard('alltime', 50, 'NYC');

    expect(eqMock).toHaveBeenCalledWith('city', 'NYC');
  });

  it('throws on error', async () => {
    const limitMock = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'query failed' },
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: limitMock,
        }),
      }),
    } as any);

    await expect(fetchLeaderboard()).rejects.toThrow('Failed to fetch leaderboard');
  });
});

describe('fetchUserBadges', () => {
  it('returns badges with earned status', async () => {
    let callCount = 0;
    mockSupabase.from.mockImplementation((table: string) => {
      callCount++;
      if (table === 'user_badges') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{ badge_id: 'b1', earned_at: '2024-01-01' }],
              error: null,
            }),
          }),
        } as any;
      }
      // badges table
      return {
        select: jest.fn().mockResolvedValue({
          data: [
            { id: 'b1', name: 'First Bite', category: 'starter' },
            { id: 'b2', name: 'Deal Hunter', category: 'scoring' },
          ],
          error: null,
        }),
      } as any;
    });

    const results = await fetchUserBadges('user-123');

    expect(results).toHaveLength(2);
    expect(results.find((b) => b.id === 'b1')?.earned).toBe(true);
    expect(results.find((b) => b.id === 'b2')?.earned).toBe(false);
  });

  it('throws when user_badges query fails', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'RLS error' },
        }),
      }),
    } as any);

    await expect(fetchUserBadges('user-123')).rejects.toThrow('Failed to fetch badges');
  });
});

describe('saveReceipt', () => {
  it('updates receipt and user stats', async () => {
    const mockReceipt = {
      id: 'r1',
      restaurant_name: 'McDonalds',
      total: 10,
      total_calories: 1500,
    };

    let callCount = 0;
    mockSupabase.from.mockImplementation((table: string) => {
      callCount++;
      if (table === 'receipts') {
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockReceipt,
                  error: null,
                }),
              }),
            }),
          }),
        } as any;
      }
      // users table
      return {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      } as any;
    });

    const result = await saveReceipt('r1', 'user-123', {
      restaurantName: 'McDonalds',
      subtotal: 9.0,
      total: 10.0,
      totalCalories: 1500,
      currentTotalScans: 5,
      currentBestScore: 100,
    });

    expect(result.restaurant_name).toBe('McDonalds');
  });

  it('throws when user stats update fails', async () => {
    let callCount = 0;
    mockSupabase.from.mockImplementation((table: string) => {
      callCount++;
      if (table === 'receipts') {
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'r1', restaurant_name: 'Test' },
                  error: null,
                }),
              }),
            }),
          }),
        } as any;
      }
      // users table — fail
      return {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: { message: 'user update failed' } }),
        }),
      } as any;
    });

    await expect(
      saveReceipt('r1', 'user-123', {
        restaurantName: 'Test',
        subtotal: 0,
        total: 10,
        totalCalories: 500,
        currentTotalScans: 0,
        currentBestScore: 0,
      })
    ).rejects.toThrow('Failed to save receipt');
  });

  it('throws when receipt update fails', async () => {
    mockSupabase.from.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'not found' },
            }),
          }),
        }),
      }),
    } as any);

    await expect(
      saveReceipt('r1', 'user-123', {
        restaurantName: 'Test',
        subtotal: 0,
        total: 10,
        totalCalories: 500,
        currentTotalScans: 0,
        currentBestScore: 0,
      })
    ).rejects.toThrow('Failed to save receipt');
  });
});

describe('updateUserProfile', () => {
  it('updates display_name and city', async () => {
    const mockUser = { id: 'u1', display_name: 'New Name', city: 'NYC' };

    mockSupabase.from.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUser,
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    const result = await updateUserProfile('u1', { display_name: 'New Name', city: 'NYC' });

    expect(result.display_name).toBe('New Name');
    expect(mockSupabase.from).toHaveBeenCalledWith('users');
  });

  it('throws on error', async () => {
    mockSupabase.from.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'forbidden' },
            }),
          }),
        }),
      }),
    } as any);

    await expect(
      updateUserProfile('u1', { display_name: 'Test' })
    ).rejects.toThrow('Failed to update profile');
  });
});

describe('fetchReceipt', () => {
  it('returns a single receipt', async () => {
    const mockReceipt = { id: 'r1', restaurant_name: 'McDonalds', total: 12 };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockReceipt,
            error: null,
          }),
        }),
      }),
    } as any);

    const result = await fetchReceipt('r1');

    expect(result.restaurant_name).toBe('McDonalds');
    expect(mockSupabase.from).toHaveBeenCalledWith('receipts');
  });

  it('throws on error', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'not found' },
          }),
        }),
      }),
    } as any);

    await expect(fetchReceipt('bad-id')).rejects.toThrow('Failed to fetch receipt');
  });
});

describe('AsyncStorage cache fallback', () => {
  it('fetchRecentReceipts caches on success', async () => {
    const mockReceipts = [{ id: '1', restaurant_name: 'Test' }];

    const limitMock = jest.fn().mockResolvedValue({
      data: mockReceipts,
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: limitMock,
          }),
        }),
      }),
    } as any);

    await fetchRecentReceipts('user-123');

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'cache:receipts:user-123',
      JSON.stringify(mockReceipts)
    );
  });

  it('fetchRecentReceipts falls back to cache on error', async () => {
    const cachedData = [{ id: '1', restaurant_name: 'Cached' }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));

    const limitMock = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'network error' },
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: limitMock,
          }),
        }),
      }),
    } as any);

    const result = await fetchRecentReceipts('user-123');

    expect(result).toEqual(cachedData);
  });

  it('fetchRecentReceipts throws when no cache and error', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const limitMock = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'network error' },
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: limitMock,
          }),
        }),
      }),
    } as any);

    await expect(fetchRecentReceipts('user-123')).rejects.toThrow('Failed to fetch receipts');
  });

  it('fetchUserBadges falls back to cache on error', async () => {
    const cachedBadges = [{ id: 'b1', name: 'Cached Badge', earned: true }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cachedBadges));

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'network error' },
        }),
      }),
    } as any);

    const result = await fetchUserBadges('user-123');

    expect(result).toEqual(cachedBadges);
  });

  it('fetchLeaderboard falls back to cache on error', async () => {
    const cachedEntries = [{ rank: 1, user: { id: 'u1' }, best_score: 200, total_scans: 5 }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cachedEntries));

    const limitMock = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'network error' },
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: limitMock,
        }),
      }),
    } as any);

    const result = await fetchLeaderboard();

    expect(result).toEqual(cachedEntries);
  });
});
