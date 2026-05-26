# Button Animations & Hover Effects

## Overview
Added dynamic, professional hover effects and transitions to all interactive buttons across the UFC Fight Prediction web app.

## What Was Added

### 1. **FightCenter.jsx**
- **Dropdown buttons**: Scale + shadow on hover
- **Round selector buttons**: Scale + glow effect when active
- **Fighter search results**: Slide-in animation on hover
- **Main "Run Simulation" button**: 
  - Animated shine effect (sweeping gradient)
  - Scale + shadow on hover
  - Press animation on click

### 2. **RosterPage.jsx**
- **Weight class filters**: Scale + shadow on hover
- **View Profile buttons**: 
  - Animated shine effect
  - Scale + shadow on hover
  - Press animation on click

### 3. **SelectionScreen.jsx**
- **Weight class ribbon**: Scale + shadow on hover
- **Fight button**: 
  - Animated shine effect
  - Scale + glow on hover
  - Press animation on click

### 4. **AnalysisScreen.jsx**
- **Back button**: Slide animation + pulse icon on hover

## Animation Types

### Shine Effect
```jsx
<span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
```
- Sweeping light effect across button
- Duration: 1 second
- Triggers on hover

### Scale Transform
```jsx
hover:scale-105    // 5% larger
hover:scale-110    // 10% larger
active:scale-95    // Press down effect
```

### Shadow Glow
```jsx
hover:shadow-2xl hover:shadow-ufcRed/50    // Red glow
hover:shadow-[0_0_30px_rgba(229,169,59,0.8)]  // Gold glow
```

### Slide Animation
```jsx
hover:translate-x-2    // Slide right
hover:translate-x-[-4px]  // Slide left
```

## Custom CSS Classes

Created `button-animations.css` with reusable classes:

- `.btn-hover-lift` - Lift on hover
- `.btn-glow` - Ripple glow effect
- `.btn-scale-pulse` - Bounce animation
- `.btn-ufc-red` - UFC red gradient with glow
- `.btn-gold` - Gold gradient with shine
- `.btn-loading` - Spinner animation

## Transition Timings

- **Fast**: 200ms - Instant feedback (clicks)
- **Normal**: 300ms - Standard hover effects
- **Slow**: 700-1000ms - Shine/sweep effects

## Browser Performance

All animations use:
- `transform` (GPU accelerated)
- `opacity` (GPU accelerated)
- `box-shadow` (optimized)

Avoid:
- `width/height` changes
- `top/left` positioning
- Heavy filters

## Accessibility

- Disabled buttons have `cursor-not-allowed`
- Loading states prevent double-clicks
- Active states clearly visible
- Reduced motion support (can be added)

## Future Enhancements

1. **Ripple effect on click** - Material Design style
2. **Haptic feedback** - Vibration on mobile
3. **Sound effects** - Button click sounds
4. **Particle effects** - Confetti on prediction
5. **Prefers-reduced-motion** - Respect user preferences

## Testing

Test all buttons in:
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Mobile browsers

Check:
- Hover states work
- Click animations smooth
- No layout shift
- Performance 60fps
