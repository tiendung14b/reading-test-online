# Project Development Rules & Guidelines

This document outlines the architectural and design rules for the **Reading Test Online** project. Following these rules ensures a consistent, premium, and maintainable codebase.

## 1. Component Architecture

We follow a modular component structure to ensure reusability and clean code.

### 1.1 UI Components (`components/ui/`)
- **Purpose**: Generic, highly reusable atoms or molecules (e.g., Buttons, Modals, Badges, Cards).
- **Rule**: These components should be **stateless** (receive data via props) and **context-agnostic**.
- **Naming**: Use PascalCase (e.g., `ConfirmModal.tsx`, `StatsCard.tsx`).
- **Example**: Use `ConfirmModal` for all user confirmations instead of native `confirm()`.

### 1.2 Feature Components (`components/[FeatureName]/`)
- **Purpose**: Complex components specific to a certain part of the app (e.g., `components/Editor/`).
- **Rule**: Encapsulate logic that is only relevant to that feature. If a sub-component becomes reusable across features, move it to `components/ui/`.

### 1.3 Small Component Rule
- **Threshold**: If a component's render function exceeds **200 lines**, or if a specific part of the UI (like a list item or a sidebar) has complex internal logic, it **MUST** be extracted into a smaller component.
- **Benefits**: Improved readability, easier testing, and better performance (finer-grained re-renders).

---

## 2. UI & Design System

### 2.1 CSS Variables & Theming
- **Rule**: NEVER use hardcoded hex/rgb values for colors.
- **Practice**: Always use CSS variables defined in `globals.css` (e.g., `var(--accent)`, `var(--bg-surface)`, `var(--text-primary)`).
- **Dark Mode**: Ensure all components look premium in both Light and Dark modes by using the provided semantic variables.

### 2.2 Glassmorphism & Aesthetics
- **Rule**: Maintain the project's "Premium" look.
- **Implementation**: 
  - Use `card-glass` utility class for containers.
  - Apply `backdrop-blur-xl` and semi-transparent backgrounds for floating elements (Modals, Navbars).
  - Use subtle borders (`border-white/5` or `var(--border)`) and soft shadows.

### 2.3 Typography
- **Rule**: Use the established typography scale.
- **Practice**: 
  - `h1`: `text-3xl font-bold tracking-tight`
  - `h2`: `text-xl font-bold tracking-tight`
  - `body`: `text-sm leading-relaxed`

---

## 3. Interaction & Animation

### 3.1 Consistent Transitions
- **Rule**: All interactive elements (buttons, links, cards) must have hover/active states.
- **Standard**: Use `transition-all duration-200` and `active:scale-95` for tactile feedback.

### 3.2 Modal & Overlay Animations
- **Rule**: Use `@headlessui/react` `Transition` for all modals and drawers.
- **Standard**: 
  - Backdrops: Fade in/out.
  - Panels: Slide up (mobile) or Scale/Fade (desktop).

### 3.3 Scroll Behavior
- **Rule**: Use `scroll-smooth` for navigation jumps (like Table of Contents).
- **Implementation**: Prefer CSS-based smooth scrolling combined with `element.scrollIntoView()`.

---

## 4. Code Standards

### 4.1 Safe HTML Rendering
- **Rule**: Do not use `dangerouslySetInnerHTML` for user-generated or AI-generated content.
- **Tool**: Use `html-react-parser` to convert HTML strings to React components safely.

### 4.2 API Consistency
- **Rule**: Use standard `toast` notifications for all success/error feedback.
- **Standard**:
  - Success: `toast.success('Done!')`
  - Error: `toast.error(data.error || 'Something went wrong')`

### 4.3 Clean Effects
- **Rule**: Always clean up `useEffect` (disconnect `IntersectionObserver`, remove event listeners, clear timeouts).

---

## 5. Directory Structure Reference
- `app/(pages)/`: Routing and Page components.
- `components/ui/`: Core Design System components.
- `components/[Feature]/`: Feature-specific logic.
- `lib/`: Utilities, API clients, and shared logic.
- `public/`: Static assets.
