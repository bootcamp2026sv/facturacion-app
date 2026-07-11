---
name: premium-ui-ux-design
description: Instructions, rules, and code patterns for implementing highly aesthetic, premium, and interactive UI/UX designs using React, PrimeReact, CSS, and modern web methodologies. Trigger this skill whenever you need to build or modify frontend components, login pages, dashboards, tables, or forms.
---

# Premium UI/UX Design Skill

Use these guidelines and design patterns when designing, editing, or optimizing any frontend user interfaces in this project. 

## 1. Core Visual Principles

### Harmonious Color Palettes
Avoid flat or generic colors (like pure red, blue, green). Instead, use curated, modern hues:
*   **Slate Dark Mode Background**: `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`
*   **Primary Accent (Indigo/Blue)**: `#6366f1` / `#3b82f6`
*   **Secondary Accent (Purple)**: `#a855f7`
*   **Success (Emerald)**: `#10b981`
*   **Danger (Rose)**: `#f43f5e`
*   **Surface / Card Backgrounds**:
    *   Light Mode: `#ffffff` with thin border `rgba(0, 0, 0, 0.05)` and shadow `rgba(0, 0, 0, 0.04) 0px 5px 22px, rgba(0, 0, 0, 0.03) 0px 0px 0px 1px`
    *   Dark Mode: `rgba(30, 41, 59, 0.7)` with glassmorphism `backdrop-filter: blur(12px)` and border `rgba(255, 255, 255, 0.08)`

### Glassmorphism & Soft Shadows
Create depth with layers:
```css
.premium-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.premium-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px -15px rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.3);
}
```

### Micro-Animations
Make elements feel responsive and alive:
*   **Hover Transitions**: Always use `transition: all 0.2s ease-in-out` or `transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` for color, shadow, and scale changes.
*   **Click State**: Scale down slightly on press: `transform: scale(0.97)` to give haptic feedback.
*   **Icons**: Rotate, bounce, or slide slightly on hover of their parent container (e.g., `button:hover i { transform: translateX(3px); }`).

---

## 2. PrimeReact Customization & Optimization

When working with PrimeReact, avoid using its default style variables as-is. Blend them with custom CSS:
*   **Input fields**: Add transition effects, focus ring custom styling, and left icons inside a relative container.
*   **Tables (`DataTable`)**:
    *   Set custom padding (`padding: 1rem 1.5rem`).
    *   Use header styling with solid or subtle backgrounds.
    *   Alternate row colors using subtle background variations.
    *   Add hover states for table rows.
*   **Dialogs / Modals**:
    *   Use `max-width: 500px` for standard inputs.
    *   Set custom border-radius (`12px` or `16px`).
    *   Apply custom overlays.

### Styled Form Controls Template
```jsx
// Premium styled input container
<div className="field-container">
  <label className="custom-label" htmlFor="name">Full Name</label>
  <div className="input-with-icon">
    <i className="pi pi-user input-icon" />
    <InputText id="name" placeholder="John Doe" className="custom-input" />
  </div>
</div>
```
```css
.field-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}
.custom-label {
  font-size: 14px;
  font-weight: 600;
  color: #4b5563;
}
.input-with-icon {
  position: relative;
}
.input-icon {
  position: absolute;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  color: #9ca3af;
  pointer-events: none;
  transition: color 0.2s ease;
}
.custom-input {
  width: 100%;
  padding-left: 38px !important;
  border-radius: 8px !important;
  border: 1px solid #d1d5db !important;
  transition: all 0.2s ease !important;
}
.custom-input:focus {
  border-color: #6366f1 !important;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15) !important;
}
.input-with-icon:focus-within .input-icon {
  color: #6366f1;
}
```

---

## 3. Responsive Layout Guidelines

*   Use a CSS Grid or Flexbox-based system.
*   Breakpoints:
    *   Mobile: `< 640px` (Stack layouts vertically)
    *   Tablet: `640px - 1024px` (Two column structures)
    *   Desktop: `> 1024px` (Sidebar + main dashboard or multi-column grids)
*   **Sidebar layout** should dynamically collapse on tablet/mobile screens into a hamburger menu overlay.
