# Right FAB Toolbar System

## Overview

The Right FAB Toolbar is a unified system of Floating Action Buttons (FABs) positioned vertically on the right side of the map interface. It replaces the old vertical Paper-based toolbar with individual FAB buttons using Material Icons.

## File Location

**Main Component:** `src/features/narzedzia/RightFABToolbar.tsx`

## Icon System

### Coral/Red Icons (Primary Color - `theme.palette.primary.main`)

These icons use the brand's primary color (#f75e4c) and are mostly for authenticated user features:

| Icon | Name | Tooltip | Function | Auth Required |
|------|------|---------|----------|---------------|
| 🏠 Home | `HomeIcon` | Strona główna | Navigate to homepage | No |
| 📍 Place | `PlaceIcon` | Wyszukiwanie działek | Parcel search | Yes |
| ✏️ Edit | `EditIcon` | Edycja | Edit mode | Yes |
| 🏗️ Architecture | `ArchitectureIcon` | Narzędzia geometrii | Geometry tools | Yes |
| 📏 Straighten | `StraightenIcon` | Mierzenie | Measurement modal | No |
| 🔍 Search | `SearchIcon` | Wyszukiwanie | Search modal | No |

### White Icons (Default Color - Always visible)

These icons use default styling (white on paper background):

| Icon | Name | Tooltip | Function | Auth Required |
|------|------|---------|----------|---------------|
| ℹ️ Info | `InfoIcon` | Identyfikacja obiektu | Identify tool | No |
| 🖨️ Print | `PrintIcon` | Drukuj / Eksportuj PDF | PDF export | No |
| 🗺️ Map | `MapIcon` | Warstwy mapy | Map layers | No |
| ✂️ Crop | `CropIcon` | Przycinanie do maski | Crop to mask | Yes |
| ⌨️ Keyboard | `KeyboardIcon` | Skróty klawiszowe | Keyboard shortcuts | No |
| 📧 Email | `EmailIcon` | Kontakt | Contact | No |
| ⚙️ Settings | `SettingsIcon` | Ustawienia | Settings | No |

## Layout

### Desktop
- **Position:** Fixed right side, `top: 16px`, `right: 16px`
- **FAB Size:** 56px × 56px (medium)
- **Spacing:** 8px gap between FABs
- **Z-index:** 1200

### Mobile (< md breakpoint)
- **Position:** Same as desktop
- **FAB Size:** 48px × 48px (small)
- **Spacing:** 8px gap between FABs
- **Z-index:** 1200

### User Avatar FAB
- **Position:** Top of column (16px from top)
- **Color:** Green (#10b981) when authenticated, Orange (#f97316) when guest
- **Size:** 56px × 56px (desktop), 48px × 48px (mobile)
- **Icon:** `AccountCircle`

## Features

### 1. Authentication-Based Filtering
Tools marked with `authRequired: true` are hidden when user is not authenticated:
- Wyszukiwanie działek (Parcel Search)
- Edycja (Edit)
- Narzędzia geometrii (Geometry Tools)
- Przycinanie do maski (Crop to Mask)

### 2. Active State Highlighting
FABs highlight when active (e.g., measurement mode, identify mode):
```typescript
bgcolor: isActive ? theme.palette.primary.main : (isPrimary ? theme.palette.primary.main : 'background.paper')
color: isActive ? 'white' : (isPrimary ? 'white' : 'text.secondary')
```

### 3. Haptic Feedback (Mobile)
All FAB clicks trigger haptic feedback on mobile devices:
```typescript
if ('vibrate' in navigator) {
  navigator.vibrate(50); // 50ms vibration
}
```

### 4. Hover & Touch Effects
- **Hover:** Scale up 1.05×, increase shadow
- **Active (pressed):** Scale down 0.95×, reduce shadow
- **Transition:** All animations use 0.2s ease timing

### 5. User Menu
Clicking the user avatar FAB opens a dropdown menu with:

**Authenticated:**
- User info (name, email)
- Dashboard
- Ustawienia konta (Account Settings)
- Wyloguj się (Logout)

**Guest:**
- Guest indicator
- Zaloguj się (Login)
- Zarejestruj się (Register)
- Dashboard

## Modals

The RightFABToolbar manages three modals:

1. **SearchModal** - Mapbox place search
2. **MeasurementModal** - Distance and area measurement
3. **ExportPDFModal** - PDF export configuration

## Integration with Map

### Measurement Info Tooltip
When measurement mode is active, a floating tooltip appears next to the measurement FAB:
```typescript
position: "fixed"
top: Approximately near measurement FAB
right: FAB_SIZE + 12px
```

### Identify Tool Integration
The Identify FAB toggles `identify.isActive` in Redux, which activates/deactivates the IdentifyTool component rendered inside `<Map>`.

## Styling Philosophy

### Color Scheme
- **Primary FABs:** Use brand coral color for main actions
- **Default FABs:** Use white background with gray text for secondary actions
- **Active FABs:** Switch to primary color regardless of original color

### Accessibility
- Minimum touch target: 48px × 48px (WCAG 2.1 Level AAA)
- Clear tooltips on hover
- High contrast colors
- Visible focus states

### Consistency
All FABs follow Material Design 3 specifications:
- Rounded shape (circular)
- Elevation shadow
- Icon-only (no text labels)
- Tooltip on hover/long-press

## Migration from Old Toolbar

### Before (Paper-based vertical toolbar)
```typescript
<Paper>
  {tools.map(tool => (
    <IconButton>
      <ToolIcon />
    </IconButton>
  ))}
</Paper>
```

### After (FAB-based system)
```typescript
<RightFABToolbar />
```

### Removed Components
The following individual FAB components are now consolidated:
- `UserFAB.tsx` → Part of RightFABToolbar
- `SearchFAB.tsx` → Part of RightFABToolbar
- `DroneFAB.tsx` → Part of RightFABToolbar
- `DocumentFAB.tsx` → Part of RightFABToolbar
- `MeasurementFAB.tsx` → Part of RightFABToolbar
- `GeolocationFAB.tsx` → Part of RightFABToolbar

### Still Separate
- `MobileFAB.tsx` - Drawing tools (Point, Line, Polygon) - remains separate for drawing workflow

## Future Improvements

1. **Keyboard Shortcuts:** Implement actual keyboard shortcuts modal
2. **Contact Form:** Add contact modal
3. **Settings Panel:** Add user settings modal
4. **Geolocation:** Add geolocation indicator when active
5. **Responsive Reordering:** Consider different icon order on mobile vs desktop

## Testing Checklist

- [ ] All icons render correctly
- [ ] Primary color icons show coral color
- [ ] Default icons show white background
- [ ] Active states toggle correctly (measurement, identify)
- [ ] User menu opens/closes smoothly
- [ ] Authenticated vs guest view works
- [ ] Modals open/close correctly
- [ ] Haptic feedback works on mobile
- [ ] Touch targets meet 48px minimum
- [ ] Tooltips appear on hover
- [ ] Responsive sizing (desktop vs mobile)
- [ ] Z-index doesn't conflict with other UI

## Performance Considerations

- **Lazy Loading:** Modals only render when needed
- **Event Debouncing:** Not needed (FAB clicks are discrete events)
- **Memo:** Not needed (FABs are lightweight)
- **Re-renders:** Only when Redux state changes (measurement, identify, auth)

## Accessibility

- **ARIA Labels:** Tooltips provide accessible names
- **Keyboard Navigation:** FABs are focusable with Tab key
- **Screen Readers:** Icon buttons announce their purpose
- **Color Contrast:** All icons meet WCAG AA standards
