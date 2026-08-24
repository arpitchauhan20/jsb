# JSB Mobile Truck and Trailer Repair

Official website and Progressive Web App (PWA) for JSB Mobile Truck and Trailer Repair, featuring 24/7 roadside assistance info, service offerings, and contact/quote dispatch with Google Apps Script backend integration.

## Project Structure

- `index.html` - Homepage with emergency dispatch hero, stats, bento grid, and testimonials
- `about.html` - About Us & credential overview
- `services.html` - Comprehensive services menu and dispatch options
- `contact.html` - Contact & 24/7 callback request form
- `legal.html` - Terms & Privacy policy
- `manifest.json` - PWA Web App Manifest configuration
- `sw.js` - Service Worker for offline shell caching and network fallback
- `css/styles.css` - Custom styling, dark mode theme, and responsive layouts
- `js/main.js` - Interactive scripts, burger menu transitions, counter animations, and Service Worker registration
- `images/` - Optimized WebP photo assets, PNG icons, and PWA application icons
- `google-apps-script/` - (Local only) Backend script handling form submissions

## Progressive Web App (PWA) Implementation

This site is configured as a fully compliant Progressive Web App (PWA):

1. **Web App Manifest (`manifest.json`)**:
   - `display: standalone` for an app-like fullscreen experience.
   - Standard branding themes (`#0b1018` theme color, `#070b12` background color).
   - App shortcuts for instant access to **Services** and **Contact Dispatch**.
2. **Icons (`images/`)**:
   - `icon-192.png`: 192×192 standard launcher icon.
   - `icon-512.png`: 512×512 high-resolution splash/store icon.
   - `icon-maskable-512.png`: 512×512 adaptive maskable icon for Android.
   - `apple-touch-icon.png`: 180×180 iOS home-screen icon.
3. **Service Worker (`sw.js`)**:
   - **Pre-caches** all core pages, CSS, JS, and optimized WebP images during the `install` phase.
   - **Network-First with Cache Fallback** for navigation requests (ensures updated content with offline fallback).
   - **Cache-First** strategy with runtime updates for static assets (images, CSS, JS, fonts).
4. **Service Worker Registration**:
   - Registered asynchronously in `js/main.js` on `window.load`.
5. **HTML Meta Tags**:
   - Integrated `theme-color`, `apple-touch-icon`, `manifest.json`, and iOS web app capability headers across all HTML pages.

