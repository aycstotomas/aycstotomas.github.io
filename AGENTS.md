# Project Guidance

## Structure
- This is a static portfolio site. `index.html` contains the page markup and inline JavaScript; `styles.css` contains the styling.
- `me.jpg` is the local portrait asset referenced by the page.
- There is no package manager, build step, or automated test suite in this project. Avoid adding frameworks or dependencies for small changes.

## Editing
- Keep changes consistent with the existing dark, night-sky visual direction and the responsive layout in `styles.css`.
- Keep HTML, CSS, and JavaScript in their current files unless a change clearly warrants a new file.
- Preserve responsive behavior and check keyboard access, readable contrast, and reduced-motion implications when changing interactive or animated elements.

## Verification
- Open `index.html` in a browser to verify page behavior and appearance.
- For visual or layout changes, check both desktop and narrow/mobile widths. Check the browser console when changing the inline JavaScript.