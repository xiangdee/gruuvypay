# GruuvyPay Design Guide

## Philosophy
Dark, premium, minimal. Every element earns its place.
High contrast. Lime accent on near-black. No gradients for their own sake.

---

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `BG` | `#0D0D0D` | App background |
| `CARD_BG` | `#1A1A1A` | Cards, sheets, list items |
| `CARD_BORDER` | `rgba(255,255,255,0.07)` | Subtle card borders |
| `ACCENT` | `#0a3a03` | Primary accent — lime green |
| `ACCENT_DIM` | `rgba(200,255,87,0.12)` | Accent tinted backgrounds |
| `ACCENT_BORDER` | `rgba(200,255,87,0.2)` | Accent tinted borders |
| `WHITE` | `#FFFFFF` | Primary text |
| `MUTED` | `rgba(255,255,255,0.45)` | Secondary text, labels |
| `DIVIDER` | `rgba(255,255,255,0.08)` | List dividers |

---


## Components

### BalanceCard
- Full-width, `borderRadius: 24`
- Background: `#1C1C1E` with two subtle decorative circles (ACCENT at 5–6% opacity)
- Top row: currency pill (left) + optional action (right)
- Balance: 36px 800 weight white, eye toggle beside it
- Bottom row: balance label + toggle only — NO card numbers, no virtual tag
- Plus button: `+` icon in ACCENT circle, top-right corner, triggers top-up

```
┌─────────────────────────────────┐
│ 🇳🇬 NGN ▾              [+]      │
│                                 │
│ BALANCE                         │
│ ₦144,890.00          👁         │
└─────────────────────────────────┘
```

### ActionButton
- 56×56 circle, `backgroundColor: CARD_BG`
- 1px border: `CARD_BORDER`
- Icon: 22px white Ionicon
- Label below: 10px, 700, MUTED, `letterSpacing: 1`, ALL CAPS

### BillChip
- 56×56 rounded square (`borderRadius: 16`), `backgroundColor: ACCENT_DIM`
- 1px border: `ACCENT_BORDER`
- Icon: 20px `ACCENT`
- Label: 11px, 600, MUTED, centered below

### TransactionItem
- Background: `CARD_BG`
- Left: icon circle (type-colored) + narration + date
- Right: amount (green if credit, red if debit) + status pill
- Divider: 0.5px `DIVIDER`, indented to align with text not icon
- First item: top radius 0 (continues from section header card)
- Last item: `borderBottomRadius: 16`

### SectionHeader
- `fontSize: 15`, `fontWeight: 700`, `color: #fff`
- Optional right link: `fontSize: 13`, `color: ACCENT`
- `paddingHorizontal: spacing[5]`, `marginBottom: spacing[3]`

### IconButton (top bar)
- 40×40 circle, `backgroundColor: CARD_BG`
- Icon: 20px white

### Avatar
- 44×44 circle, `backgroundColor: ACCENT`
- Initial: 18px 800 weight black

---

## Layout Patterns

### Screen structure
```
SafeAreaView (BG)
  └── FlatList
        ├── ListHeaderComponent
        │     ├── TopBar (avatar, name, icon actions)
        │     ├── BalanceCard (horizontal scroll if multiple currencies)
        │     ├── ActionsRow (TOP UP, PAY, RECEIVE, CONVERT)
        │     ├── BillsSection (horizontal scroll chips)
        │     └── TransactionsSectionHeader
        ├── renderItem (TransactionItem)
        └── ListFooterComponent (load more / bottom pad)
```

### Card continuation pattern
When transactions follow a section header card, the header card has no bottom radius and the transaction list items extend it visually — last item gets bottom radius.

### Horizontal scroll cards
- `pagingEnabled` for wallet cards
- `showsHorizontalScrollIndicator={false}`
- Card width: `SCREEN_W - spacing[8]`
- Gap between cards: `spacing[3]`

---

## Iconography

All icons from `@expo/vector-icons` Ionicons.

| Action | Icon |
|--------|------|
| Scan | `scan-outline` |
| Pay / Send | `arrow-up-outline` |
| Receive / Top Up | `arrow-down-outline` |
| Convert | `swap-horizontal-outline` |
| Airtime | `call-outline` |
| Data | `wifi-outline` |
| Betting | `game-controller-outline` |
| Airtime→Cash | `refresh-outline` |
| Notifications | `notifications-outline` |
| Analytics | `stats-chart-outline` |
| Eye show | `eye-outline` |
| Eye hide | `eye-off-outline` |
| Add / Plus | `add` |
| Back | `arrow-back` |
| Rewards | `gift-outline` |
| Chat | `chatbubble-outline` |

Icons without outline variants (use base name for both states):
- `logo-bitcoin`

---

## States

### Loading
- Skeleton: `rgba(255,255,255,0.08)` rounded rect, same dimensions as content
- Spinner: `ActivityIndicator` with `color: ACCENT`
- Overlay: `rgba(0,0,0,0.5)` Modal + white card with green spinner

### Empty
- Center-aligned illustration or icon
- Headline + subtext in MUTED
- CTA button (primary)

### Error
- `ErrorCard` component, red tinted background
- Icon + message text

### Disabled
- `opacity: 0.5` on the element
- `disabled={true}` on TouchableOpacity

---

## Elevation / Shadow

```typescript
// Card shadow
shadowColor:   '#000',
shadowOpacity: 0.5,
shadowRadius:  20,
shadowOffset:  { width: 0, height: 8 },
elevation:     10,
```

Only use on cards that float above the background. List items and inline elements get no shadow.

---

## Do / Don't

| ✅ Do | ❌ Don't |
|-------|---------|
| Use `#0a3a03` as the single accent | Use multiple accent colors |
| Keep backgrounds near-black | Use white or light backgrounds |
| Use 700–800 weight for key numbers | Use light weights on dark bg |
| Indent dividers past the icon | Full-width dividers |
| ALL CAPS for micro labels | Mixed case for action labels |
| Round only the last transaction item | Round every item individually |
| Use `FlatList` for transaction lists | Use `ScrollView` with mapped items |