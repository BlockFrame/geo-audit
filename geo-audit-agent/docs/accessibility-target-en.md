# GEO Audit Agent: Accessibility Target

## Target Standard

GEO Audit Agent targets **WCAG 2.2 Level AA** for user-facing web application surfaces.

This target applies to:

- the audit dashboard,
- the URL audit form,
- the CopilotKit chat surface as integrated in the application,
- modal dialogs,
- report viewing and export controls,
- empty, loading, error, and completed audit states.

## Current Accessibility Baseline

The application currently includes these accessibility safeguards:

- semantic page landmarks for the dashboard and chat regions,
- a skip link to move directly to the audit dashboard,
- visible focus treatment for keyboard navigation,
- accessible labels for the audit URL field and chat input,
- live status announcements for audit progress and dashboard updates,
- alert semantics for audit errors,
- accessible modal dialog labeling and focus restoration,
- reduced-motion support through `prefers-reduced-motion`,
- improved contrast for chat links, footer text, form controls, and key actions,
- decorative third-party SVG icons hidden from assistive technologies where possible.

## Acceptance Criteria

Before release, a user should be able to:

- navigate the main app with keyboard only,
- identify the current focus location at all times,
- start an audit from the URL form without using a mouse,
- understand audit progress through visible text and assistive technology status announcements,
- access completed audit findings in a logical reading order,
- open and close the methodology dialog with keyboard controls,
- close the methodology dialog with `Escape`,
- return focus to the invoking control after closing the dialog,
- use the chat input with an accessible name,
- export reports without relying on color alone.

## Manual Release Checklist

Run this checklist before a release or major UI change:

1. Tab from the browser address bar through the page and verify focus is visible.
2. Activate the skip link and confirm focus moves to the audit dashboard.
3. Run an audit from the URL field using keyboard only.
4. Confirm the loading state is announced through a status region.
5. Confirm the completed dashboard appears after the audit.
6. Open the methodology dialog and confirm focus moves to the Close button.
7. Close the dialog with `Escape` and confirm focus returns to the opener.
8. Send a chat message using keyboard only.
9. Verify text contrast for small labels, chat links, footer text, and error messages.
10. Enable reduced motion in the OS/browser and confirm animations are minimized.

## Automated Testing Target

Automated accessibility regression checks are available through Playwright plus axe-core.

Run them from `geo-audit-agent/frontend`:

```bash
npm run test:a11y
```

Current automated checks:

- no serious or critical axe violations on the empty dashboard state,
- no serious or critical axe violations after a completed audit,
- no unlabeled buttons, links, inputs, or dialogs,
- keyboard smoke test for URL audit flow,
- keyboard smoke test for methodology dialog open and close.

## Known Limitations

The app integrates third-party CopilotKit UI components. Some internal chat markup is controlled by that library. The app currently mitigates known issues with labels, icon hiding, and contrast overrides, but upstream component changes should be rechecked after CopilotKit upgrades.

## Ownership

Accessibility is a product quality target, not a one-time cleanup task. New UI work should preserve WCAG 2.2 AA compatibility unless there is an explicitly documented exception.