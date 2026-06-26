# Mobile-First Responsive Design - Quick Reference

## 📱 Breakpoints

| Device | Width | Layout | Usage |
|--------|-------|--------|-------|
| **Mobile** | 320px | 1 column | iPhone, Android phones |
| **Small Tablet** | 480px | 2 columns | Landscape phones |
| **Tablet** | 768px | 2-4 columns | iPad, medium tablets |
| **Desktop** | 1024px | 4 columns | Large tablets, computers |
| **Large Desktop** | 1200px | 4+ columns | Ultra-wide monitors |

## 🎨 CSS Classes

### Responsive Grid
```html
<!-- Mobile: 100%, Tablet: 50%, Desktop: 25% -->
<div class="col-12 col-md-6 col-lg-3"></div>

<!-- Mobile: 100%, Tablet: 50%, Desktop: 50% -->
<div class="col-12 col-lg-6"></div>

<!-- Mobile: 50%, Tablet: 50%, Desktop: 33% -->
<div class="col-6 col-md-6 col-lg-4"></div>
```

### Responsive Padding
```html
<!-- 12px on mobile, 16px on tablet, 20px on desktop -->
<div class="px-3 px-md-4"></div>

<!-- 8px on mobile, 12px on tablet, 16px on desktop -->
<div class="gap-2 gap-md-3"></div>

<!-- 12px on mobile, 16px on tablet, 24px on desktop -->
<div class="p-3 p-md-4"></div>
```

### Responsive Text
```html
<!-- Hide on mobile, show on tablet+ -->
<div class="d-none d-md-block"></div>

<!-- Show on mobile, hide on tablet+ -->
<div class="d-md-none"></div>

<!-- Responsive font sizes -->
<h1 class="h3 h2-md"></h1>
```

## 📡 JavaScript API

### Get Device Info
```javascript
MobileModule.getDeviceInfo()
// Returns: 
// {
//   isMobileDevice: true/false,
//   isTabletDevice: true/false,
//   currentOrientation: "portrait" | "landscape"
// }
```

### Check Device Type
```javascript
if (MobileModule.isMobile()) {
  // Mobile-specific code
}

if (MobileModule.isTablet()) {
  // Tablet-specific code
}

if (MobileModule.getOrientation() === 'landscape') {
  // Landscape-specific code
}
```

### Listen to Events
```javascript
// Swipe events
window.addEventListener('swipeLeft', () => {
  console.log('Swiped left');
});

window.addEventListener('swipeRight', () => {
  console.log('Swiped right');
});

// Orientation change
window.addEventListener('orientationChanged', (e) => {
  console.log('Orientation:', e.detail.orientation);
});
```

## 🎯 Touch Targets

All interactive elements must be at least 48x48px:
- ✅ Buttons
- ✅ Links
- ✅ Form inputs
- ✅ Navigation items

## 📏 Minimum Sizes

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| **Button Height** | 44-48px | 44-48px | 44-48px |
| **Button Width** | 48px+ | 48px+ | 44px+ |
| **Input Height** | 44px | 44px | 40px |
| **Line Height** | 1.6 | 1.5 | 1.5 |
| **Font Size** | 16px | 15px | 16px |
| **Icon Size** | 20-24px | 24-32px | 32px+ |

## 🔍 Testing Checklist

### Mobile (320px)
- [ ] All text is readable
- [ ] No horizontal scroll
- [ ] Buttons are 48x48px
- [ ] Hamburger menu works
- [ ] Tables scroll horizontally
- [ ] Forms are full-width

### Tablet (768px)
- [ ] 2-column layout works
- [ ] Navigation is accessible
- [ ] Cards display correctly
- [ ] Spacing is appropriate
- [ ] Images scale properly

### Desktop (1024px+)
- [ ] 4-column layout works
- [ ] Hover effects visible
- [ ] Full navigation displayed
- [ ] No layout issues
- [ ] Optimal spacing

## 🚀 Common Patterns

### Responsive Container
```html
<div class="container-fluid px-3 px-md-4">
  <!-- Responsive padding: 12px mobile, 16px tablet, 20px desktop -->
</div>
```

### Responsive Card
```html
<div class="col-12 col-md-6 col-lg-3">
  <div class="card cyber-card">
    <!-- Full-width on mobile, 50% on tablet, 25% on desktop -->
  </div>
</div>
```

### Responsive Button
```html
<button class="btn btn-primary w-100 w-md-auto">
  <!-- Full-width on mobile, auto on tablet+ -->
  Click me
</button>
```

### Responsive Form
```html
<input class="form-control" style="font-size: 16px;">
<!-- 16px prevents iOS zoom -->
```

### Responsive Table
```html
<div class="table-responsive">
  <table class="table">
    <!-- Horizontal scroll on mobile -->
  </table>
</div>
```

## 📚 Documentation Files

- **MOBILE_FIRST_DESIGN.md** - Complete technical documentation
- **IMPLEMENTATION_SUMMARY.txt** - Detailed implementation summary
- **QUICK_REFERENCE.md** - This file (quick reference)

## 🔗 Key Files

| File | Size | Purpose |
|------|------|---------|
| `static/css/style.css` | 30.5 KB | Mobile-first CSS with media queries |
| `static/js/mobile.js` | 14 KB | Device detection and touch handling |
| `templates/base.html` | 5.4 KB | Responsive base template |
| `templates/index.html` | 13.2 KB | Mobile-optimized dashboard |
| `templates/demo3.html` | 13.7 KB | Mobile-optimized network page |

## ⚠️ Important Notes

1. **Font Size**: Form inputs must be 16px on mobile to prevent iOS zoom
2. **Touch Targets**: Minimum 48x48px for all interactive elements
3. **Viewport**: Meta tag ensures proper mobile scaling
4. **Breakpoints**: Always use mobile-first (base styles first, then @media)
5. **Flexbox**: Preferred over floats for modern browser support

## 🐛 Troubleshooting

### Elements not responsive?
1. Check viewport meta tag is present
2. Verify responsive classes are applied
3. Clear browser cache
4. Check console for errors

### Touch targets too small?
1. Add min-width: 48px to buttons
2. Check padding on mobile
3. Verify icon sizing
4. Test on real device

### Tables not scrolling?
1. Verify table-responsive class
2. Check overflow-x: auto in CSS
3. Test on actual mobile device
4. Check CSS is loaded

### Menu not working?
1. Verify navbar-toggler is visible
2. Check mobile.js script is loaded
3. Verify Bootstrap JS is loaded
4. Check console for errors

## 📞 Support

For detailed technical information, refer to:
- **MOBILE_FIRST_DESIGN.md** for full specifications
- **IMPLEMENTATION_SUMMARY.txt** for detailed features
- Browser DevTools for real-time testing
- Console: `MobileModule.getDeviceInfo()` for device info

---

**Last Updated**: June 26, 2026
**Status**: ✅ Production Ready
