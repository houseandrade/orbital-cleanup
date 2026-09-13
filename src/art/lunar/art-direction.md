# Lunar art review — v1

Generated with the built-in image generation tool. Art approved by Brian. Preserve the distant Earth when creatively cropping the Moon for gameplay. Mission briefing implementation is the next step, followed by the world selector and first three Moon missions.

Five transparent salvage sprites and one opaque Moon background. Originals preserved. Style references: src/art/tool-crate.png and src/art/earth.png. During integration, preserve the playable dark sky and position lunar terrain below the failure boundary; the old Earth crop would omit the distant Earth.

Approved implementation sequence requested by Brian:
1. Review and approve lunar art.
2. Selected mission card expands its briefing immediately below it, headed MISSION BRIEFING, with objectives as a bulleted list. Collapse prior briefing when another mission is selected.
3. First three Moon missions and world selector.

## rover-wheel

Asset: rover-wheel.png

Use case: stylized-concept. Create ONE isolated game sprite for Orbital Cleanup. The reference is STYLE ONLY, not an object to reproduce. Match its chunky retro pixel art, cream/off-white metal, silver gray stepped shading, very dark navy outlines, small mint accents. Consistent coarse pixel grid and large simple clusters, 3-4 shades per material, readable at 32-48px gameplay scale. No gradients, blur, glow, antialiasing, lettering, labels, watermark, border, scenery, floor or cast shadow. Complete connected object centered with 12% clear padding on a genuinely transparent alpha background. Square PNG. Subject: one discarded lunar rover mesh wheel, nearly round silhouette in slight three-quarter view; thick silver-gray open mesh tire rendered as a few broad crossed pixel bands, dark interior, cream central hub, short broken axle projecting right, small ochre collar. No chassis or other wheels. Clearly a lightweight metal lunar wheel rather than a rubber car tire.

## oxygen-tank

Asset: oxygen-tank.png

Use case: stylized-concept. Create ONE isolated game sprite for Orbital Cleanup. The reference is STYLE ONLY, not an object to reproduce. Match its chunky retro pixel art, cream/off-white metal, silver gray stepped shading, very dark navy outlines, small mint accents. Consistent coarse pixel grid and large simple clusters, 3-4 shades per material, readable at 32-48px gameplay scale. No gradients, blur, glow, antialiasing, lettering, labels, watermark, border, scenery, floor or cast shadow. Complete connected object centered with 12% clear padding on a genuinely transparent alpha background. Square PNG. Subject: one spent lunar oxygen tank, a stout cream cylindrical pressure bottle with rounded shoulders, chunky dark protective valve collar on top and silver valve, one broad muted blue band around the body, a tiny mint rectangular indicator. Floating at a 20-degree diagonal. Intact inert empty salvage, no hoses, no leaks, no flame. Clear simple bottle silhouette.

## lander-leg

Asset: lander-leg.png

Use case: stylized-concept. Create ONE isolated game sprite for Orbital Cleanup. The reference is STYLE ONLY, not an object to reproduce. Match its chunky retro pixel art, cream/off-white metal, silver gray stepped shading, very dark navy outlines, small mint accents. Consistent coarse pixel grid and large simple clusters, 3-4 shades per material, readable at 32-48px gameplay scale. No gradients, blur, glow, antialiasing, lettering, labels, watermark, border, scenery, floor or cast shadow. Complete connected object centered with 12% clear padding on a genuinely transparent alpha background. Square PNG. Subject: one broken-off lunar lander landing leg, a connected gold/ochre telescoping strut angled diagonally down to one broad round silver-gray footpad, one short attached triangular brace, cream broken mounting bracket at top. Entire object intact within canvas. Distinct long strut and broad disk silhouette; no complete spacecraft, no engine, no separate fragments. Gold stepped shading is the main lunar accent.

## instrument-package

Asset: instrument-package.png

Use case: stylized-concept. Create ONE isolated game sprite for Orbital Cleanup. The reference is STYLE ONLY, not an object to reproduce. Match its chunky retro pixel art, cream/off-white metal, silver gray stepped shading, very dark navy outlines, small mint accents. Consistent coarse pixel grid and large simple clusters, 3-4 shades per material, readable at 32-48px gameplay scale. No gradients, blur, glow, antialiasing, lettering, labels, watermark, border, scenery, floor or cast shadow. Complete connected object centered with 12% clear padding on a genuinely transparent alpha background. Square PNG. Subject: one abandoned lunar scientific instrument package. Low cream hexagonal equipment body with a gold foil side panel, dark front sensor window and small mint indicator, one short stiff antenna mast ending in a crossbar, two compact mounting feet. Three-quarter view. Distinct squat body with antenna silhouette, unlike a tool case: no carrying handle, no latches, no wheels, no dish, no long solar wings.

## rover-chassis

Asset: rover-chassis.png

Use case: stylized-concept. Create ONE isolated game sprite for Orbital Cleanup. The reference is STYLE ONLY, not an object to reproduce. Match its chunky retro pixel art, cream/off-white metal, silver gray stepped shading, very dark navy outlines, small mint accents. Consistent coarse pixel grid and large simple clusters, 3-4 shades per material, readable at 32-48px gameplay scale. No gradients, blur, glow, antialiasing, lettering, labels, watermark, border, scenery, floor or cast shadow. Complete connected object centered with 12% clear padding on a genuinely transparent alpha background. Square PNG. Subject: one abandoned uncrewed lunar rover chassis as a special finale recovery sprite. Compact wide cream and gold equipment deck on a dark exposed frame, two remaining gray mesh wheels and a visibly empty front wheel mount with a short broken axle, one short folded antenna, a dark sensor box with mint status panel. Three-quarter view, width about 1.5 times height. Broken but salvageable, no people, no seats, no flags, no loose fragments. Strong simple vehicle silhouette readable at 48px.

## moon-background

Asset: moon-background.png

Use case: stylized-concept. Create a landscape 1536x1024 pixel-art Moon environment background for Orbital Cleanup. Reference image is STYLE AND COMPOSITION ONLY: replace the Earth foreground with the lunar surface. Match crisp stepped pixel clusters and retro game art. A broad gently curved gray cratered lunar horizon rises to about 55% canvas height at center, lower at edges, terrain fills the bottom edge. Cool charcoal, slate gray, silver highlights, broad readable crater bowls and restrained surface texture. Upper half is near-black navy empty space with only a few faint tiny stars; a small distant blue-and-white Earth in the upper right, about 5% image width. No lunar atmosphere, no atmospheric glow, no clouds over Moon, no mountains protruding into gameplay space. No astronaut, station, debris, vehicle, HUD, text or watermark. Keep center sky very dark and empty for gameplay legibility. Opaque background PNG, no transparency.

## Oxygen tank cleanup prompt

Preserve this exact oxygen tank sprite, its pixel edges, colors, scale, position, proportions, valve, blue band and all hardware. Remove ALL gray-white checkerboard and distorted background outside the tank, including background visible through valve guard holes. Replace background with genuinely transparent alpha pixels, NOT a rendered checkerboard, white, or black. One clean isolated unchanged sprite on actual transparent PNG. No other changes.

