# Product card actions and lifetime pricing

## Goal
Make Coming Soon clearly visible, keep all card actions compact, add practical sharing options, and show one fixed lifetime price of $249 for every product.

## Changes
- Restyle the disabled Coming Soon action with a high-contrast amber surface, border, icon, and readable text while retaining its disabled behavior.
- Rebalance the card action area so Live Demo, Buy Now, Notify Me, Coming Soon, and Share fit cleanly across desktop and mobile.
- Add a Share menu to every product card with device-native sharing when available, plus WhatsApp, Facebook, X, LinkedIn, email, and Copy Link.
- Build share links from each product’s real URL/name and keep sharing independent from purchasing or availability state.
- Replace varying card prices with the existing shared `$249` lifetime price and `$999` comparison price, including a clear lifetime label.
- Keep all products, status logic, demos, notifications, favorites, routes, and other page sections unchanged.

## Validation
- Check active and coming-soon cards on desktop and mobile.
- Verify Share opens the correct options, Copy Link works, and generated links contain the product name and URL.
- Verify existing Live Demo, Buy Now, Notify Me, tabs, favorites, and carousel controls still work.
- Confirm every homepage product card displays `$249` and lifetime licensing consistently.
