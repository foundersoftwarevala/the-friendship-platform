# AMS Manager parity plan

## Scope
- Compare the full reference repository against the current AMS Manager implementation.
- Port only confirmed gaps while preserving existing live-data pages and production records.
- Connect every imported action to the existing authenticated backend and database policies.
- Keep all AMS routes under the canonical AMS Manager name and existing navigation.

## Visual system
- Preserve the reference layouts and interactions.
- Replace reference-specific colours with Software Vala semantic colour tokens.
- Verify desktop and current preview widths for readability and overlap.

## Validation
- Run the AMS unit and integration tests.
- Check representative routes and actions in a signed-in browser with zero runtime errors.
