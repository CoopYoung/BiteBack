# CONVENTIONS.md — Bite Back Code Conventions
# The agent follows these exactly. When something is not covered,
# match the style of the surrounding code.

---

## TypeScript Rules

### Strictness
`tsconfig.json` has `strict: true`. Every line satisfies the strict
compiler. No exceptions.

- No implicit `any` — all variables, parameters, and return values
  are explicitly or correctly inferred typed
- No non-null assertions (`!`) unless nullability is provably
  impossible at that exact point, with a comment explaining why
- No `as any` or `as unknown as T` casts — fix the type model instead
- Use `unknown` over `any` when a type cannot be known
- Prefer `interface` for object shapes that could be extended;
  use `type` for unions, intersections, and aliases
- No `enum` — use `as const` objects:

```typescript
// Good
const ScoreCategory = {
  EXCELLENT: 'excellent',
  FAIR: 'fair',
  POOR: 'poor',
} as const
type ScoreCategory = typeof ScoreCategory[keyof typeof ScoreCategory]

// Bad
enum ScoreCategory { Excellent, Fair, Poor }
```

### Type Locations
- Types shared across multiple files → `types/index.ts`
- Types local to one file → top of that file, before the component
- Supabase row types → `types/index.ts`, named `[TableName]Row`
- API response types → `types/index.ts`, named `[Resource]Response`

---

## Naming

### Files
- Expo Router screens follow the router convention: `kebab-case.tsx`
  or directory groups with `(group-name)/`
- Shared components: `PascalCase.tsx` in `components/`
- Context files: `PascalCase.tsx` in `contexts/` (e.g. `AuthContext.tsx`)
- Library files: `camelCase.ts` in `lib/` (e.g. `api.ts`, `utils.ts`)
- Type files: `camelCase.ts` in `types/`
- Test files: `[filename].test.tsx` or `[filename].test.ts`

### Variables and Functions
- Variables and functions: `camelCase`
- Booleans: prefix with `is`, `has`, `can`, `should`, `was`
  (e.g. `isLoading`, `hasScanned`, `canSubmit`, `wasSuccessful`)
- Event handlers: prefix with `handle`
  (e.g. `handleScan`, `handleLogin`, `handleBadgePress`)
- Async functions: name by action, not by async-ness
  (`fetchLeaderboard` not `fetchLeaderboardAsync`)
- Supabase query functions in `lib/api.ts`:
  `[verb][Resource]` (e.g. `createReceipt`, `fetchUserBadges`,
  `updateUserScore`, `checkBadgeEligibility`)

### Components
- Component functions: `PascalCase`
- Props interfaces: `[ComponentName]Props`
- Named exports only — no default exports from component files:

```typescript
// Good
export function ScoreHeatMap({ score }: ScoreHeatMapProps) { ... }

// Bad — default exports complicate mocking and tree-shaking
export default function ScoreHeatMap() { ... }
```

### Constants
- Module-level: `SCREAMING_SNAKE_CASE`
- Local (within a function): `camelCase`
- Score thresholds (defined in `constants/colors.ts`):
  `SCORE_EXCELLENT`, `SCORE_FAIR_MIN` — import, never redefine

---

## Expo Router Conventions

Expo Router screens are just React components in `app/`. Follow
these rules specific to this project:

- Every screen file exports one component, named after the screen:
  `app/(tabs)/leaderboard.tsx` exports `function Leaderboard()`
- Screen components do not contain business logic — they call
  functions from `lib/api.ts` and render state
- Route groups `(auth)` and `(tabs)` must not be reorganised without
  updating ARCHITECTURE.md navigation section
- Use `expo-router`'s `Link`, `useRouter`, and `useLocalSearchParams`
  for navigation — never `@react-navigation` directly in screens

---

## Component Structure

Every component file follows this order:

```typescript
// 1. React and React Native imports
import React, { useState, useCallback, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native'

// 2. Expo imports
import { useRouter } from 'expo-router'

// 3. Internal imports — contexts, lib, components, constants, types
import { useAuth } from '@/contexts/AuthContext'
import { fetchUserReceipts } from '@/lib/api'
import { getScoreColor, getScoreLabel } from '@/lib/utils'
import { colors } from '@/constants/colors'
import type { ReceiptRow } from '@/types'

// 4. Props interface (if this is a component, not a screen)
interface ScoreCardProps {
  score: number
  restaurantName: string
  onPress: (score: number) => void
}

// 5. Component
export function ScoreCard({ score, restaurantName, onPress }: ScoreCardProps) {
  // a. Hooks
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)

  // b. Derived values and callbacks
  const scoreColor = getScoreColor(score)
  const handlePress = useCallback(() => onPress(score), [onPress, score])

  // c. Effects
  useEffect(() => {
    // cleanup returned from here
  }, [])

  // d. Early returns for loading / error / empty
  if (!score) return null

  // e. Main render
  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <View style={[styles.indicator, { backgroundColor: scoreColor }]} />
      <Text style={styles.name}>{restaurantName}</Text>
      <Text style={styles.score}>{score.toFixed(1)}</Text>
    </Pressable>
  )
}

// 6. Styles at the bottom — always StyleSheet.create, always theme values
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: colors.spacing.md,       // 16 (2 × 8px grid)
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: colors.spacing.sm,           // 8
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  name: {
    flex: 1,
    fontSize: colors.typography.body,
    color: colors.text.primary,
  },
  score: {
    fontSize: colors.typography.body,
    color: colors.text.secondary,
    fontWeight: '600',
  },
})
```

---

## Styling Rules

### Always Use the Theme
Every style value comes from `constants/colors.ts`. Never hardcode:

```typescript
// Good
color: colors.accent           // #00D9A3
backgroundColor: colors.bg     // #0F0F0F
padding: colors.spacing.md     // 16

// Bad — hardcoded values break theming and are hard to maintain
color: '#00D9A3'
backgroundColor: '#0F0F0F'
padding: 16
```

### 8px Grid
All spacing is a multiple of 8:
```
spacing.xs = 4    (half-unit — use sparingly)
spacing.sm = 8
spacing.md = 16
spacing.lg = 24
spacing.xl = 32
spacing.xxl = 48
```

### StyleSheet Rules
- Always `StyleSheet.create()` — never inline style objects on JSX
- Never `style={{ margin: 8 }}` — always reference a named style
- Dynamic styles (e.g. score-based color) go in a computed value:
  ```typescript
  const dynamicStyle = { backgroundColor: getScoreColor(score) }
  // then: style={[styles.base, dynamicStyle]}
  ```

---

## Supabase & API Patterns

### Query Structure in `lib/api.ts`

```typescript
export async function fetchUserReceipts(userId: string): Promise<ReceiptRow[]> {
  try {
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('user_id', userId)
      .order('scanned_at', { ascending: false })

    if (error) throw error
    return data ?? []
  } catch (error) {
    console.error('fetchUserReceipts:', error)
    // Fall back to AsyncStorage cache
    const cached = await AsyncStorage.getItem(`receipts:${userId}`)
    return cached ? JSON.parse(cached) : []
  }
}
```

### Rules
- Every query function is `async` and returns a typed Promise
- Every query has a try/catch — never let Supabase errors bubble
  silently to the UI as empty state
- After a successful write, update the AsyncStorage cache
- For realtime subscriptions, return the channel so the caller
  can unsubscribe in a useEffect cleanup

### Screen Data Fetching Pattern

Every screen that fetches data handles all three states:

```typescript
if (isLoading) return <LoadingSpinner />
if (error) return <ErrorView message={error} onRetry={refetch} />
if (!data || data.length === 0) return <EmptyState message="No scans yet" />
return <MainContent data={data} />
```

Never render an empty screen silently — always tell the user what
is happening.

---

## Score & Heat Map

Score calculation lives only in `lib/utils.ts`:

```typescript
// Only ever calculated here — never inline in a component
export function calcScore(calories: number, totalSpent: number): number {
  if (totalSpent <= 0) return 0
  return calories / totalSpent
}
```

Score color lookup uses thresholds from `constants/colors.ts`:

```typescript
export function getScoreColor(score: number): string {
  if (score >= SCORE_EXCELLENT) return colors.success   // teal
  if (score >= SCORE_FAIR_MIN)  return colors.warning   // amber
  return colors.danger                                   // red
}
```

---

## Performance Rules

- All list data uses `FlatList` — never `map()` inside a `ScrollView`
- Leaderboard and scan history lists must specify `keyExtractor`
  and `getItemLayout` if items are fixed height
- Callbacks passed as props are wrapped in `useCallback`
- Heavy computations (score ranking, list sorting) are wrapped in
  `useMemo`
- Receipt images are compressed before upload via
  `expo-image-manipulator` — never upload raw camera output
- Realtime subscriptions are always cleaned up in `useEffect` return

---

## Error Handling

- API errors are typed — use the `ApiError` interface from `types/index.ts`
- User-facing messages are always plain English — never expose raw
  Supabase error objects to the UI
- Auth errors (invalid credentials, email taken) surface inline on
  the form field, not as a toast or alert

---

## Testing

### What to Test
- Every function in `lib/utils.ts` (pure functions — easy to test)
- Every function in `lib/api.ts` with mocked Supabase client
- Every shared component in `components/` — at minimum a render test
- Score calculation and heat map color logic — these are core product

### Test Structure

```typescript
import { render, screen } from '@testing-library/react-native'
import { calcScore, getScoreColor } from '@/lib/utils'
import { colors } from '@/constants/colors'

describe('calcScore', () => {
  it('returns calories divided by dollars spent', () => {
    expect(calcScore(600, 12)).toBe(50)
  })

  it('returns 0 when totalSpent is 0', () => {
    expect(calcScore(600, 0)).toBe(0)
  })

  it('handles fractional dollars correctly', () => {
    expect(calcScore(300, 7.50)).toBe(40)
  })
})

describe('getScoreColor', () => {
  it('returns teal for excellent scores (150+)', () => {
    expect(getScoreColor(200)).toBe(colors.success)
  })

  it('returns amber for fair scores (50–149)', () => {
    expect(getScoreColor(100)).toBe(colors.warning)
  })

  it('returns red for poor scores (<50)', () => {
    expect(getScoreColor(30)).toBe(colors.danger)
  })

  it('correctly handles boundary value 150', () => {
    expect(getScoreColor(150)).toBe(colors.success)
  })

  it('correctly handles boundary value 50', () => {
    expect(getScoreColor(50)).toBe(colors.warning)
  })
})
```

### Test Rules
- Mock `lib/supabase.ts` in all tests — no real database calls
- Mock `@react-native-async-storage/async-storage` in all tests
- Tests are independent and deterministic
- Use `testID` props on interactive elements for reliable queries
- Test fixtures live in `__tests__/fixtures/`

---

## Git Commit Messages

```
type(scope): short present-tense description
```

**Types:** `feat`, `fix`, `refactor`, `test`, `style`, `types`, `chore`

**Scopes for Bite Back:**
`auth`, `scan`, `results`, `leaderboard`, `profile`, `dashboard`,
`api`, `utils`, `badges`, `theme`, `supabase`, `navigation`, `deps`

**Examples:**
```
feat(scan): add gallery fallback when camera permission denied

fix(leaderboard): unsubscribe from realtime channel on unmount

test(utils): add boundary tests for score heat map thresholds

feat(badges): award Value Wolf badge at 10 scans above 150 score

fix(api): handle RLS policy rejection on receipt insert

chore(deps): update expo-camera to SDK 51 compatible version
```

---

## What the Agent Must Never Do

- Import `lib/supabase.ts` in any screen or component file
- Hardcode any color, hex value, score threshold, or spacing number
- Call `console.log` in committed code (use a logger or remove it)
- Use `map()` inside a `ScrollView` for list data
- Modify `CLAUDE.md` or `WORKFLOW.md`
- Modify the heat map score thresholds in `constants/colors.ts`
  without explicit instruction in GOALS.md
- Commit any file containing Supabase URLs or keys
- Add an `import * as` wildcard import — import only what is used
