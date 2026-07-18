# Design Spec: macOS-Style Liquid Glass Desktop Shell

Transition the retro Windows 95/98 desktop shell of the portfolio to a macOS-inspired "Liquid Glass" desktop environment. The core functionality of the window manager, the content layers, and the App Forge dynamic app generation will be preserved, but the presentation layer will be modernized with glassmorphic visuals.

## Goal

Provide a premium, high-craft macOS-style desktop shell in the browser featuring:
1. A top translucent macOS status bar.
2. A bottom interactive Dock with hover zoom/magnification.
3. Translucent, glassmorphic draggable windows with rounded corners and macOS-style traffic light control dots.
4. App Forge housed as a standalone project application window instead of a background wallpaper widget.
5. Grayscale-to-color footer logo grid embedded on the desktop wallpaper.

---

## Architectural & UI Design Details

### 1. Top Menu Bar
- **Dimensions**: `26px` height, full width, pinned to `top: 0`.
- **Styling**: `backdrop-filter: blur(12px)`, background `rgba(255, 255, 255, 0.15)` in light mode and `rgba(0, 0, 0, 0.3)` in dark mode. Semi-transparent bottom border.
- **Left Items**:  menu icon, **Portfolio** title, and links for **File**, **Edit**, **View**, **Go**, **Window**, **Help** (each opening a simple dummy drop-down).
- **Right Items**: Pixelart system status icons (WiFi, Battery, Control Center) and a real-time Clock display (`Sat Jul 18  5:00 PM`). The Control Center icon toggles the System Settings theme panel.

### 2. Bottom Dock
- **Dimensions**: Centered horizontally, absolute positioned at `bottom: 12px`. Height `58px`, padding `4px 8px`.
- **Styling**: Large border-radius (`16px`), glassmorphic background with frosted blur, thin top-highlight border.
- **Shortcuts**:
  - Finder icon -> Opens **Projects** window
  - Safari icon -> Opens **About Me** window
  - App Forge icon -> Opens **App Forge** generator window
  - Terminal icon -> Opens **Terminal** window
  - Notes icon -> Opens **Notes** window
  - Settings icon -> Opens **Theme Settings** window
  - Mail icon -> Opens **Contact** window
  - Pages icon -> Opens **Resume** window
- **Interactions**:
  - Bounces/magnifies on hover: scales icon up to `1.25` and lifts it up slightly (`translateY(-8px)`).
  - Neighbors scale up slightly (`1.1`) to mimic the macOS curve magnification.
  - Active/open indicator dot rendered directly under the corresponding icon in the dock.

### 3. Glassmorphic Windows
- **Visuals**:
  - `border-radius: 12px`, soft outer shadows (`box-shadow: 0 10px 30px rgba(0,0,0,0.15)`).
  - Background uses `backdrop-filter: blur(20px)` and semi-translucent colors (`rgba(255,255,255,0.2)` or `rgba(30,30,30,0.45)`).
- **Title Bar**:
  - Traffic light control dots on the far-left: Red (Close), Yellow (Minimize), Green (Maximize/Restore).
  - Center-aligned window title text.
- **Animations**:
  - Zoom-in scale transition (`scale(0.9) -> scale(1)`) on open.
  - Fade-out and scale-down transition on close.

### 4. App Forge Window
- Removed from the desktop wallpaper.
- Represented as a standalone project window.
- Shows the prompt input box, example chips, and generation status. Once created, mock apps open in their own separate macOS-style windows.

---

## Codebase Modifications

### 1. `content.js`
- Remove the background launcher configuration fields.
- Update `windows` array to list **App Forge** as a custom standalone window by default (so it has an icon and window definition).
- Add **App Forge** to the `projects` array as a portfolio project.

### 2. `app.js`
- Update `render()` to remove the background launcher form and insert the new translucent **Top Menu Bar** and **Bottom Dock**.
- Implement dock hover listeners or CSS hover scaling.
- Add active indicator logic to render status dots under open application icons in the dock.
- Update `renderWindow()` to render macOS-style title bars (traffic light dots on the left, title in the center).
- Add the dedicated App Forge query form inside the `forge` case of `renderWindowBody(type)`.

### 3. `styles.css`
- Add utility styles for glassmorphic elements (`.glass-panel`, `.glass-window`).
- Style the macOS top status bar (`.mac-menubar`) and bottom dock (`.mac-dock`).
- Implement dock magnification scaling in CSS.
- Style the red/yellow/green window buttons.
