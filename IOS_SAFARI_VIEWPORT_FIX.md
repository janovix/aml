# iOS Safari Viewport Height Fix

## Problem

iOS Safari has a dynamic viewport that changes when the browser chrome (address bar/toolbar) hides or shows during scrolling. This causes issues with `100vh` and viewport-based layouts:

- Content jumps when scrolling
- Layout calculations break
- Content gets cut off
- Full-height layouts become unstable

## Solution

We've implemented a solution that uses the `visualViewport` API to track the actual viewport height and update a CSS custom property (`--viewport-height`) dynamically.

### Components

1. **`use-viewport-height.ts` Hook**
   - Uses `window.visualViewport` API when available (iOS Safari, modern browsers)
   - Falls back to `window.innerHeight` for older browsers
   - Listens to `resize`, `scroll`, and `orientationchange` events
   - Returns the current viewport height in pixels

2. **`ViewportHeightProvider.tsx` Component**
   - Sets the `--viewport-height` CSS custom property on `document.documentElement`
   - Updates automatically when the viewport changes
   - Wraps the application at the root level

3. **CSS Updates (`globals.css`)**
   - Defines `--viewport-height` CSS variable with fallbacks
   - Uses `100dvh` (dynamic viewport height) when supported
   - Overrides Tailwind's `h-screen` and `min-h-screen` classes to use the variable
   - Provides safe fallback to `100vh` for unsupported browsers

### How It Works

1. On mount, `ViewportHeightProvider` uses the `useViewportHeight` hook to get the current viewport height
2. It sets `--viewport-height` CSS variable on the document root
3. All `h-screen` and `min-h-screen` classes automatically use this variable instead of `100vh`
4. When the viewport changes (scroll, resize, orientation), the hook updates and the CSS variable is refreshed
5. The layout remains stable because it uses the actual visible viewport height, not the full browser height

### Browser Support

- **iOS Safari 15+**: Full support via `visualViewport` API
- **Chrome iOS**: Full support via `visualViewport` API
- **Modern browsers**: Uses `100dvh` when supported, falls back to CSS variable
- **Older browsers**: Falls back to `100vh` (standard behavior)

## Testing

### On Real iOS Devices

1. Open the application in Safari on iPhone/iPad
2. Scroll up and down to trigger the address bar to hide/show
3. Verify:
   - No layout jumping occurs
   - Content remains visible and accessible
   - Full-height layouts stay stable
   - No content cutoff

### In Safari Responsive Mode

1. Open Safari DevTools
2. Enable Responsive Design Mode
3. Select iPhone/iPad device
4. Test scrolling behavior
5. Rotate device orientation
6. Verify stable layout

### In Chrome iOS

1. Open the application in Chrome on iOS
2. Test scrolling and orientation changes
3. Verify consistent behavior

## Technical Details

### Why iOS Safari Breaks Viewport Units

iOS Safari uses a "dynamic viewport" where:

- `100vh` = full browser height (including hidden chrome)
- Actual visible height = browser height - chrome height
- When scrolling, chrome hides/shows, changing visible height
- `100vh` doesn't update, causing layout issues

### Why This Fix Works

1. **visualViewport API**: Provides the actual visible viewport height, accounting for browser chrome
2. **CSS Variables**: Allow dynamic updates without JavaScript re-renders
3. **Event Listeners**: Track viewport changes in real-time
4. **Fallbacks**: Ensure compatibility across all browsers

## Files Modified

- `/workspace/src/hooks/use-viewport-height.ts` - New hook
- `/workspace/src/components/ViewportHeightProvider.tsx` - New provider component
- `/workspace/src/components/ClientLayout.tsx` - Added ViewportHeightProvider
- `/workspace/src/app/globals.css` - Added CSS variable and overrides
- `/workspace/src/hooks/use-viewport-height.test.ts` - Tests

## Usage

The fix is automatically applied to all components using `h-screen` or `min-h-screen` classes. No changes needed to existing components.

If you need to use the viewport height in JavaScript:

```typescript
import { useViewportHeight } from "@/hooks/use-viewport-height";

function MyComponent() {
	const viewportHeight = useViewportHeight();
	// Use viewportHeight in pixels
}
```

If you need to use it in CSS:

```css
.my-element {
	height: var(--viewport-height, 100vh);
}
```

## Maintenance

- The solution is minimal and maintainable
- No heavy dependencies
- No user-agent sniffing
- Works automatically with existing Tailwind classes
- Compatible with SSR (Next.js)
