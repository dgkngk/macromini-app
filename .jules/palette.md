## 2025-01-04 - Missing Form Label Associations
**Learning:** Found critical accessibility issue in authentication forms where labels were visually present but not programmatically associated with inputs. This prevents screen readers from announcing the label when focusing the input and breaks click-to-focus behavior.
**Action:** Use `React.useId()` to generate unique IDs and explicitly link `label` elements to `input` elements via `htmlFor` and `id` attributes in all form components.
