---
name: Pagefy
description: Find local businesses with no website and arrive with their page already built.
colors:
  green: "#357a27"
  green-hover: "#2c6821"
  green-ink: "#2f6e22"
  lime: "#6fcf3c"
  lime-soft: "#e4f5d6"
  brand-green: "#3f8f2f"
  forest: "#17351a"
  forest-2: "#1f4622"
  on-green: "#ffffff"
  on-lime: "#0d160b"
  bg: "#f6f6f3"
  surface: "#ffffff"
  surface-2: "#efefec"
  ink: "#141614"
  ink-2: "#3d3f3b"
  muted: "#60625d"
  line: "#e3e3de"
  line-strong: "#cfcfc9"
  danger: "#b3261e"
  dark-bg: "#111214"
  dark-surface: "#1a1b1e"
  dark-surface-2: "#232428"
  dark-ink: "#eeeff0"
  dark-ink-2: "#cfd1d4"
  dark-muted: "#9d9fa4"
  dark-line: "#2c2e31"
  dark-line-strong: "#3a3c40"
  dark-green: "#6fcf3c"
  dark-green-hover: "#83da55"
  dark-green-ink: "#8fdc66"
  dark-lime-soft: "#1f3317"
  dark-forest: "#142e16"
  dark-forest-2: "#1b3d1e"
  dark-on-green: "#0d160b"
  dark-danger: "#f2b8b5"
  azure: "#2d6cdf"
  azure-soft: "#e5eefd"
  azure-ink: "#1c52b8"
  grape: "#7b4fd6"
  grape-soft: "#efe9fd"
  grape-ink: "#5b35ad"
  coral: "#e8643a"
  coral-soft: "#fde9e0"
  coral-ink: "#b0431b"
  honey: "#e2a31b"
  honey-soft: "#fcf1d4"
  honey-ink: "#85590a"
  on-honey: "#2a1d02"
  berry: "#d63b63"
  berry-soft: "#fce5eb"
  berry-ink: "#a8264a"
  on-hue: "#ffffff"
  graphite-band: "#17191d"
  app-bg: "#ecece8"
  app-surface: "#ffffff"
  app-surface-2: "#f2f2ef"
  app-ink-2: "#3d3f3b"
  app-muted: "#61635e"
  app-line: "#deded9"
  app-line-strong: "#cbcbc5"
  app-paper: "#fafaf8"
  dark-azure: "#6e9ff5"
  dark-azure-soft: "#15223a"
  dark-azure-ink: "#a3c3fa"
  dark-grape: "#a68af0"
  dark-grape-soft: "#221a38"
  dark-grape-ink: "#c9b8f8"
  dark-coral: "#f28a63"
  dark-coral-soft: "#321a10"
  dark-coral-ink: "#f7b397"
  dark-honey: "#f0bf4c"
  dark-honey-soft: "#2c230f"
  dark-honey-ink: "#f5d283"
  dark-berry: "#f07592"
  dark-berry-soft: "#341520"
  dark-berry-ink: "#f6a5b8"
  dark-on-hue: "#0b100a"
  dark-app-bg: "#111214"
  dark-app-surface: "#1d1e21"
  dark-app-surface-2: "#26282b"
  dark-app-ink: "#eeeff0"
  dark-app-ink-2: "#cfd1d4"
  dark-app-muted: "#9d9fa4"
  dark-app-line: "#303236"
  dark-app-line-strong: "#404247"
  dark-app-paper: "#18191b"
typography:
  display:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "4.1rem"
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "2.6rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "1.2rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  title-sm:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "1.08rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.02em"
  numeral:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "1.65rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.03em"
    fontFeature: "\"tnum\""
  body:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "1.04rem"
    fontWeight: 400
    lineHeight: 1.625
    fontFeature: "\"ss01\""
  body-sm:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "\"ss01\""
  label:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "0.94rem"
    fontWeight: 600
    lineHeight: 1.2
    fontFeature: "\"ss01\""
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.76rem"
    fontWeight: 400
    lineHeight: 1.3
rounded:
  tile-sm: "9px"
  tile: "10px"
  tile-md: "12px"
  tile-lg: "14px"
  row: "12px"
  well: "16px"
  frame: "22px"
  band: "28px"
  pill: "9999px"
spacing:
  gutter: "20px"
  gutter-wide: "32px"
  row: "12px"
  card: "24px"
  panel: "32px"
  section: "96px"
  section-wide: "128px"
components:
  button-primary:
    backgroundColor: "{colors.green}"
    textColor: "{colors.on-green}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 28px"
    height: "52px"
  button-primary-hover:
    backgroundColor: "{colors.green-hover}"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bg}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  button-ink-hover:
    backgroundColor: "{colors.ink-2}"
  button-lime:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.on-lime}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 28px"
    height: "52px"
  button-ghost:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-2}"
  button-outline:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "44px"
  input-field:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "0 16px 0 44px"
    height: "48px"
  select:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 36px 0 14px"
    height: "36px"
  segmented-control:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "4px"
  segmented-option-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bg}"
    rounded: "{rounded.pill}"
    height: "40px"
  badge-status:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  badge-neutral:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  badge-highlight:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.on-lime}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  chip-credit:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-2}"
    typography: "{typography.mono}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  list-row:
    textColor: "{colors.ink}"
    rounded: "{rounded.row}"
    padding: "12px 10px"
  list-row-hover:
    backgroundColor: "{colors.surface-2}"
  list-row-selected:
    backgroundColor: "{colors.lime-soft}"
  frame:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.frame}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.frame}"
    padding: "{spacing.card}"
  card-highlight:
    backgroundColor: "{colors.forest}"
    textColor: "#ffffff"
    rounded: "{rounded.frame}"
    padding: "{spacing.card}"
  well:
    backgroundColor: "{colors.surface-2}"
    rounded: "{rounded.well}"
  band-soft:
    backgroundColor: "{colors.lime-soft}"
    rounded: "{rounded.band}"
  band-forest:
    backgroundColor: "{colors.forest}"
    textColor: "#ffffff"
    rounded: "{rounded.band}"
  theme-toggle:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    size: "40px"
  nav-link:
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  app-card:
    backgroundColor: "{colors.app-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.frame}"
    padding: "{spacing.card}"
  app-hero:
    backgroundColor: "{colors.app-surface}"
    rounded: "{rounded.band}"
    padding: "36px"
  hue-tile:
    backgroundColor: "{colors.azure-soft}"
    textColor: "{colors.azure-ink}"
    rounded: "{rounded.tile-md}"
    size: "40px"
  hue-tile-solid:
    backgroundColor: "{colors.azure}"
    textColor: "{colors.on-hue}"
    rounded: "{rounded.tile-md}"
    size: "40px"
  hue-tile-header:
    backgroundColor: "{colors.azure}"
    textColor: "{colors.on-hue}"
    rounded: "{rounded.tile-lg}"
    size: "48px"
  badge-hue:
    backgroundColor: "{colors.coral-soft}"
    textColor: "{colors.coral-ink}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  stat-card:
    backgroundColor: "{colors.honey-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.frame}"
    padding: "20px"
  app-nav-item:
    textColor: "{colors.app-ink-2}"
    typography: "{typography.label}"
    rounded: "14px"
    padding: "6px 8px"
  app-nav-item-active:
    backgroundColor: "{colors.app-surface}"
    textColor: "{colors.ink}"
  credit-chip-app:
    backgroundColor: "{colors.lime-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "4px 14px 4px 4px"
  app-select:
    backgroundColor: "{colors.app-bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 40px 0 16px"
    height: "48px"
  button-hue:
    backgroundColor: "{colors.grape}"
    textColor: "{colors.on-hue}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "36px"
  button-honey:
    backgroundColor: "{colors.honey}"
    textColor: "{colors.on-honey}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "44px"
---

# Design System: Pagefy

## Overview

**Creative North Star: "The Honest Workbench"**

Pagefy looks like a well-made tool that has nothing to hide: a pale neutral ground, white working surfaces cut by 1px hairlines, near-black ink, one green that means "do this", and a journey palette that gives each step of the job its own color. The product proves itself by showing its own interface, so the most important visual object is the app frame: a white window with a mono URL bar, a list of real-looking rows, and a phone holding the generated site. Everything else steps back to let that frame and its single action read clearly.

Density is calm on marketing surfaces (96 to 128px between sections, 58 to 62ch text measures) and tighter inside frames, where rows sit at 12px padding and type drops to 0.86 to 0.95rem. That in-frame density is the native register for the logged-in app: the landing already renders the app's search screen, so the app inherits the frame interior, not the marketing rhythm.

Grounds and cards are neutral everywhere, never green-tinted, so color can carry meaning: each step of the path to a sale owns one hue (azure to find, grape to build, coral to offer, honey to get paid, berry for lost), and that hue marks the step wherever it appears: the landing's three-step wells and feature panels, and the app's nav tiles, page headers, badges, funnel, and stat cards. Green stays the action. The result reads colorful without being decorative: every hue answers "which part of the job is this?".

The world is the category standard played straight at full craft. It refuses gradient text, glow effects, fabricated stats and testimonials, and section kickers or eyebrows above headlines. Headlines carry the message on their own in tight Sora; green emphasis inside a headline is a flat color span, never a gradient. Both themes are first-class: dark mode is a neutral graphite ground (never pure black) where lime takes over as the action color.

**Key Characteristics:**
- Neutral light ground (bg), white surfaces, 1px hairlines; flat by default on the landing.
- One action green per theme: deep green in light, lime in dark and on any dark ground.
- Lime as a state signal: dots, "sem site" marks, selected rows, highlight badges.
- Sora 600 with negative tracking for every heading; Manrope for everything read; Geist Mono only for data strings.
- Pill-shaped controls, rounded-rectangle containers (10 to 28px, scaled by size).
- The app frame is the signature object and the component library's source.
- Journey palette as wayfinding on both surfaces; in `/app` the ground sits one step darker than the cards and every card carries a soft shadow.

## Colors

True neutrals for grounds, surfaces, and text; the greens for action, state, and brand; and the journey palette for meaning. The landing and the app share all three. The app only re-maps its neutrals one step darker (scoped to `.pf-canvas`) and adds the card shadow.

### Primary
- **Workbench Green** (green): the resting action color in light theme. Primary buttons, the check discs, the focus outline, the caret, and the input focus border. Hover deepens to **Pressed Green** (green-hover). In dark theme the `green` slot resolves to lime (dark-green), so components built on `green` switch automatically.
- **Leaf Ink** (green-ink): green used as text or icon on light surfaces: inline links, the emphasized half of the hero headline, feature icons, the "Feito" sparkle. It exists because the action green is tuned for white text on it, not for text on white. Dark theme lightens it (dark-green-ink).

### Secondary
- **Signal Lime** (lime): state, not decoration. The 6 to 8px dot beside "Sem site", the demo status dot, the "Recomendado" badge, text selection, and the selected discount tag. It becomes the action color on dark grounds: the forest band's primary button, the highlighted plan card's button, and the whole dark theme. Text on lime is always **Root Black** (on-lime).
- **Sprout Wash** (lime-soft): the quiet lime tint. Selected list rows, the input focus ring (4px), the credit chip, the unselected discount tag.
- **Brand Green** (brand-green): the logo's back square only. It is not an action or text color.

### Tertiary
- **Deep Forest** (forest, forest-2): the highlighted plan card (landing and app), with white text at 100/85/70% and lime actions.
- **Graphite Band** (graphite-band): the closing conversion band on the landing, identical in both themes, topped by a 6px four-segment strip in the dark-theme journey hues (azure, grape, coral, honey). White text at 100% and 72%, a lime primary and an outline-on-dark secondary.

### Journey Palette
Each hue owns one step of the path to a sale and appears wherever that step does. Every hue ships three roles: the base (fills, bars, dots, solid tiles), `-soft` (tile, badge, and stat-card grounds), and `-ink` (the same hue tuned for text and icons on its soft ground, 4.5:1 or better). Dark theme lifts the base and ink and sinks the soft ground (the `dark-*` tokens).
- **Azure** (azure, azure-soft, azure-ink): Encontrar. Landing: step 1 well and disc, the search-feature tile, the demo's map pin and "E mais N na lista" well. App: Buscar leads, the map pin icon in search fields, the "Novo" lead stage, the demo-environment banner, the monthly-revenue stat.
- **Grape** (grape, grape-soft, grape-ink): Montar. Landing: step 2, the AI-chat feature panel, the CRM tile, the Agência plan. App: Sites, "Gerar site" and "Copiar link" buttons, the "Proposta enviada" stage, the sales-count stat.
- **Coral** (coral, coral-soft, coral-ink): Oferecer. Landing: step 3, the preview-link feature panel and its notification disc, the phone tile. App: Leads and the funnel, the "Contatado" stage, saved-lead state, the "site antigo" badge.
- **Honey** (honey, honey-soft, honey-ink): Receber. Landing: the "Comece grátis" band ("before you pay anything") and its check discs, the financeiro tile. App: Financeiro, revenue, ratings (the star), the low-credit notice, and the upgrade path ("Liberar no plano Início"). Text and icons on a honey fill are **on-honey**, never white.
- **Berry** (berry, berry-soft, berry-ink): the "Perdido" stage only.
- **On Hue** (on-hue): icon and text color on a solid journey fill; white in light theme, near-black in dark.
- Business category colors (the earthy padaria brown, barbearia navy, salão magenta, etc. in `lib/demo-data.ts`) are content, not palette: they paint avatar tiles, map pins, and site thumbnails only.

### App Neutrals (app only)
- **App Ground** (app-bg): the canvas, sidebar, topbar, mobile tab bar, and field fills. One clear step darker than the cards. Dark: a neutral graphite (dark-app-bg), never pure black.
- **App Surface** (app-surface) and **App Well** (app-surface-2): cards and recessed regions, both neutral.
- **App Paper** (app-paper): the ground of illustrations (map, empty-state art).
- App text and hairlines use the neutral app-ink-2, app-muted, app-line, and app-line-strong.

### Neutral
- **Paper** (bg): neutral page ground, input fill, and the text color on ink buttons.
- **Surface White** (surface): cards, frames, the nav on scroll, footer, and alternating full-width sections.
- **Well** (surface-2): recessed wells inside cards and frames, hover fill for ghost controls and rows, neutral badges.
- **Ink** (ink): headings, primary text, and the fill of secondary solid buttons, and chat bubbles from the user.
- **Ink Two** (ink-2): body copy and secondary labels.
- **Muted** (muted): helper text, captions, placeholder, inactive icons.
- **Hairline** (line) and **Strong Hairline** (line-strong): 1px dividers and card borders; the strong variant for control borders (inputs, selects, segmented, outline buttons).
- **Danger** (danger): input error border and inline error text only.

### Named Rules
**The Two Greens Rule.** Actions use `green` (#357a27 in light); the logo's #3f8f2f never paints a button, link, or text. If you are reaching for a green, it is `green` for fills and `green-ink` for text.

**The Lime Signal Rule.** On light grounds lime marks state (a dot, a selected row, a highlight badge) and never fills a primary button. On dark grounds (forest, dark theme) lime is the action. One lime action per view.

**The Journey Hue Rule.** In the app a hue is an address, not a decoration: it appears only where its step is the subject. A new screen picks the hue of the step it serves; a screen that serves none (account, settings) stays neutral with at most one hue per setting tile.

**The Neutral Card Rule.** Cards, grounds, and section bands are never green or green-tinted, on the landing or in the app. Green in the app is limited to the primary action, the credit chip and meter, the "Fechado" stage, the field focus ring, and the selected list row.

## Typography

**Display Font:** Sora (with system-ui, sans-serif)
**Body Font:** Manrope (with system-ui, sans-serif), stylistic set `ss01` on
**Label/Mono Font:** Geist Mono (with ui-monospace)

**Character:** Sora is the logo's face and speaks in short, tight, confident lines; Manrope is open and friendly for a reader who has never built a site. Mono appears only where the content is literally machine data.

### Hierarchy
- **Display** (600, 2.6rem mobile, 3.6rem at 640px, 4.1rem at 1024px; 1.04; -0.04em): the one page headline, max 21ch, balanced wrap.
- **Headline** (600, 2rem mobile to 2.6rem at 640px; 1.1; -0.035em): section headings. Long statement headings drop to 1.7rem on mobile with 1.12 line height.
- **Title** (600, 1.15 to 1.35rem; -0.02 to -0.025em): card and step titles.
- **Title Small** (600, 1.05 to 1.08rem; -0.02em): accordion questions, definition terms, form labels that act as a question, mobile menu items (1.25rem).
- **Numeral** (Sora 600, 1.65rem, -0.03em, tabular): live counts in frames. Prices scale to 2.2rem at -0.04em.
- **Body** (Manrope 400, 1.02 to 1.08rem; 1.625): paragraphs in ink-2, max 46 to 62ch, pretty wrap.
- **Body Small** (0.86 to 0.95rem): in-frame text, row secondary lines, helper and caption text.
- **Label** (Manrope 600, 0.92 to 1.02rem): buttons, nav links, segmented options, badges (0.72 to 0.78rem, 600 to 700).
- **Mono** (Geist Mono 400, 0.7 to 0.78rem): URLs (`pagefy.app/p/...`), credit costs ("1 crédito"), and numeric tags.

### Named Rules
**The Mono Is Data Rule.** Geist Mono sets URLs, credit costs, and counts, nothing else. No mono headings, labels, or decorative codes.

**The Tight Sora Rule.** Every Sora heading is weight 600 with negative tracking that grows with size: -0.02em at title, -0.035em at headline, -0.04em at display. Sora 700 is reserved for the business-site previews inside phones.

**The No Kicker Rule.** Headings stand alone. No uppercase eyebrow, tag, or small label above a section heading.

## Layout

A single centered container (max 1152px) with 20px side padding, 32px from 640px up. Marketing sections separate with 96px vertical padding (128px at 640px up for primary sections, 112px for secondary ones) and alternate between the neutral ground and white full-width bands bounded by hairlines. The how-it-works band is white with each step's visual in its journey `-soft` well; the "Comece grátis" band is honey-soft; the closing band is graphite. Two-column splits are asymmetric (1.15fr/1fr, 1fr/1.6fr, 1.2fr/1fr) with the heading on the left; three-step rows divide with vertical hairlines rather than cards. Card grids use 16 to 20px gaps.

Inside frames the rhythm tightens: 16px (mobile) to 24px padding, 12px row padding, 12 to 20px between blocks, hairline-separated rows. The frame grid is list plus a fixed 380px preview column at 1024px, stacking below it.

The app shell is a fixed 256px sidebar from 768px up, painted in the app ground (same color as the canvas) and separated by a 1px hairline, over a sticky 76px topbar and a content column capped at 1152px. Below 768px the sidebar becomes a bottom tab bar (Início, Buscar, Leads, Sites, Mais). App pages stack with 20 to 24px gaps; the home opens with a 28px-radius hero split (text and search left, city map right, 1.08fr/1fr), then the four-step journey, then a 1.45fr/1fr row (funnel, recent sites with live previews).

Breakpoints are Tailwind's defaults (640, 768, 1024px). On mobile, button groups stack full-width with the primary first, rows hide their secondary column (rating) and collapse the status badge to a dot, and lists cap at four visible rows.

## Elevation & Depth

Flat by default. Depth comes from tonal layering (bg, surface, surface-2) and 1px hairlines; shadows are rare and soft. Three shadows exist (frame and soft everywhere, card in the app only), all tinted with the ink hue in light theme and pure black at higher opacity in dark.

### Shadow Vocabulary
- **Frame** (`--shadow-frame`): the app frame, the highlighted plan card, and floating notifications. The one lifted object on a view.
- **Soft** (`--shadow-soft`): small white pieces resting inside a recessed well (mock rows, bubbles, the phone), so they read as objects on a tray.

- **Card** (`--shadow-card`, app only): every app card and the home hero, so white cards separate clearly from the darker neutral ground. Light: `0 1px 2px rgb(20 22 20 / 0.06), 0 6px 18px -8px rgb(20 22 20 / 0.14)`; dark: `0 1px 2px rgb(0 0 0 / 0.4), 0 8px 22px -10px rgb(0 0 0 / 0.6)`.

### Named Rules
**The One Lifted Object Rule.** A view has at most one frame-shadowed surface. Everything else is a bordered or tonal surface. In the app, the card shadow is the baseline for every card and does not count against this rule; the frame shadow still marks only one object (the highlighted plan card).

## Shapes

Two shape families. Every interactive control is a full pill: buttons, inputs, selects, the segmented control, badges, chips, the theme toggle, nav links, and the copy-link field. Containers are rounded rectangles whose radius scales with their size: 10px for avatar tiles, 12px for list rows and mock rows, 16px for wells and chat bubbles, 22px for frames and cards, 28px for full-width bands. Chat bubbles cut one corner to 6px on the speaker's side. Borders are 1px, never heavier.

The logo mark (two overlapping rounded squares) is the source of the rounded-square avatar tile used in rows, and of the app's hue tiles: 28px at 9px corners (inline), 32px at 10px (nav), 40px at 12px (default), 48px at 14px (page header).

## Components

### Buttons
Tactile pills with a small press.
- **Shape:** full pill; heights 52px (hero and band actions), 48px (form and card actions), 44px (card and secondary actions), 40px (nav and icon buttons).
- **Primary:** green fill, on-green text, Manrope 600, 28px side padding, trailing 16 to 18px arrow icon for forward actions. Hover to green-hover in 200ms; press scales to 0.97.
- **Ink:** ink fill, bg text; hover to ink-2. The secondary solid action (nav "Começar grátis", in-band actions on lime-soft).
- **Lime:** lime fill, on-lime text, hover brightness 105%. Only on dark grounds.
- **Ghost:** no fill, ink text; hover fills surface-2. Its trailing arrow nudges 2px on hover.
- **Outline:** 1px line-strong border, ink text; hover darkens the border to ink at 30%. On dark grounds: white at 20% border, white text, hover fill white at 10%.
- **Inline link:** green-ink 600 with a 1px underline at green 30%, offset 4px; hover to full green. Arrow links widen their icon gap on hover.

### Badges and Chips
- **Status badge:** lime dot (6px) plus 0.78rem 600 ink-2 label in a line-strong pill on surface. On mobile it collapses to an 8px dot with a screen-reader label.
- **Neutral badge:** surface-2 pill, muted text ("dados ilustrativos").
- **Highlight badge:** lime pill, on-lime 700 text ("Recomendado").
- **Credit chip:** surface-2 pill with mono ink-2 text, always showing the cost before an action.

### Cards / Containers
- **Corner Style:** 22px.
- **Background:** surface with a 1px line border; the highlighted variant is a forest card, identical in both themes, with white text at 100/85/70/65% and the frame shadow. Never an ink card: in dark theme ink turns near-white and lime drops out.
- **Internal Padding:** 24px (cards), 28 to 32px (feature panels).
- **Wells:** surface-2 regions (or a journey `-soft` ground when the card belongs to a step) inside cards (16px corners standalone, square when flush to a card's bottom) that hold illustrations and mock UI.
- **Bands:** 28px full-width containers for a single message: honey-soft for the free-start offer, graphite for the closing CTA.

### Frame (signature)
The app window: 22px surface card, 1px line border, frame shadow, a 1px-divided top bar with the route in mono muted text on the left and a lime-dot status on the right. Interior is a list column plus a surface-2 preview column separated by a hairline. This is the shell the logged-in app should grow from.

### Inputs / Fields
- **Style:** 48px pill, bg fill, 1px line-strong border, 18px muted leading icon at 16px inset, ink text, muted placeholder, green caret.
- **Focus:** border turns green and a 4px lime-soft ring appears (transition on border and shadow). No default outline.
- **Error:** border turns danger; a 0.86rem danger message with `role="alert"` replaces the helper line below.
- **Helper line:** 0.86rem muted text under the field, indented 4px; may hold inline-link suggestions separated by middle dots.
- **Select:** 36px surface pill, line-strong border, custom 16px chevron at 12px right; hover darkens border, focus-visible turns it green. In the app selects match the fields: 48px, app-ground fill, `appearance: none` with a 16px chevron at 14px right, and the same green border plus 4px lime-soft ring on focus. App fields suppress the global outline so the ring never doubles.
- **Loading submit:** the icon swaps to a spinning loader and the label to a present participle ("Buscando"); the list below fades to 40% opacity.

### Segmented Control
A surface pill with a line-strong border and 4px inset; options are 40px pills, the selected one ink with bg text, unselected ink-2 turning ink on hover. Built as a radiogroup.

### List Rows
Full-width buttons with 12px corners and 12px x 10px padding, separated by hairlines. Leading 40px avatar tile (10px corners, category color, white Sora initials), a two-line name and muted "category · place" line, an optional tabular rating with an amber star (#c98a0b; honey in the app), and a trailing status badge. Hover fills surface-2; selected fills lime-soft and sets `aria-pressed`.

### Hue Tile (app)
A rounded square holding one 15 to 20px lucide icon in a journey hue. Soft variant: `-soft` ground with `-ink` icon (inactive nav items, section headers, feature lists). Solid variant: base fill with on-hue icon (the active nav item, the page header tile with a soft shadow, finished or current journey steps). Neutral areas use surface-2 with ink-2.

### App Navigation
Sidebar items are 14px-radius rows with a 32px hue tile and a 0.93rem label. Hover fills surface-2; the active item becomes a white card with the soft shadow, a solid tile, semibold ink text, and a 6px green dot at the end. Account items sit under a small "Conta" group label and keep neutral tiles. The sidebar foot holds the credit card: the count in Sora 1.9rem with "/ 6", a segmented credit meter (one 6px pill per credit, green when available), the costs in mono, and a full-width green "Aumentar créditos". The mobile tab bar puts each icon in a 48 x 32px pill that fills with its hue when active.

### Page Header (app)
A 48px solid hue tile beside a Sora 1.6 to 1.9rem title and a muted one-line description; the tile's hue is the page's step.

### Journey Track (app home)
One card: title and "N de 4 etapas", a four-segment progress bar (each segment fills with its hue when the step is done, 700ms expo), then four hairline-divided columns. Each column: hue tile (solid when done or current), a "Feito" hue badge or "Próximo passo" in hue ink, Title Small step name, muted one-line description, a tabular Sora count with a muted unit, and a hue-ink arrow link at the bottom. The current step's column fills with its `-soft` ground.

### Stat Card (app)
A 22px card filled with a hue's `-soft` ground: hue-ink label, a small solid tile, a Sora 2rem tabular value, and a hue-ink hint. Used for the step's own numbers (Financeiro, Plano), never as a generic metric row.

### Funnel (app)
A 12px stacked bar of stage segments sized by count (4px gaps, pill ends), a five-column legend with dots and tabular counts, then the latest leads with a stage badge. Empty: the five segments in their soft grounds plus a well explaining the stages, with an ink "Buscar leads" button.

### Illustrations (app)
- **City map:** a hand-drawn neighborhood in SVG (neutral blocks on paper, a green park, a honey avenue with a dashed center line, an azure river) with teardrop pins in business category colors, one enlarged with a lime halo. Always captioned or clearly decorative; never presented as a real map.
- **Site thumbnail:** a mini browser window whose hero is the business's category color with its name in Sora 700, placeholder bars, a white button, and three tinted content blocks.
- **Empty-state art:** a paper strip above the empty-state message showing what the full screen looks like (board columns in stage colors, fading site thumbnails).

### Accordion
Native `details` rows between hairlines. Summary in Title Small ink with a muted 20px plus icon that rotates 45 degrees on open (300ms expo); answer in body ink-2, max 62ch, 24px bottom padding.

### Chat Bubbles
16px bubbles with the speaker-side bottom corner cut to 6px. The user's message is an ink bubble with bg text, right aligned; the assistant reply is a surface bubble with a line border and soft shadow, led by a green-ink sparkle. The composer is a line-strong pill with the credit chip at its end.

### Navigation
Sticky 64px bar, transparent at the top; after 8px of scroll it gains bg at 90%, a 12px backdrop blur, and a bottom hairline. Links are 0.94rem Manrope 500 ink-2 pills that fill surface-2 and turn ink on hover. Right side: theme toggle, ghost "Entrar", ink primary. On mobile, a full-height sheet with Sora 1.25rem hairline-separated links and stacked full-width green and outline buttons.

### Theme Toggle
A 40px round ghost button in ink-2. Sun and moon icons (18px) cross-fade with a 90-degree rotation and 50% scale over 500ms on the expo curve. It writes `data-theme` on the root and persists the choice; with no choice the system preference applies.

### Motion
One easing curve, `cubic-bezier(0.16, 1, 0.3, 1)`. 200ms for color and press, 300ms for icon transforms and nav state, 500ms for the theme toggle and content swap (a 6px rise-in). Counts animate with an exponential ease over 900ms. Reduced motion collapses all of it to instant.

## Do's and Don'ts

### Do:
- **Do** use `green` for filled actions and `green-ink` for green text; let the dark theme swap both through the tokens.
- **Do** keep lime to state marks on light grounds, and use it as the action only on forest, ink, or dark-theme grounds, with on-lime text.
- **Do** make every control a pill and every container a rounded rectangle from the 10/12/16/22/28px scale.
- **Do** separate with 1px hairlines and tonal steps before reaching for a shadow; keep the frame shadow to one object per view.
- **Do** set URLs, credit costs, and counts in Geist Mono or tabular numerals, and show the credit cost next to any action that spends credits.
- **Do** focus with the 2px green outline at 3px offset on everything except fields, which use the green border plus 4px lime-soft ring.
- **Do** label demo or illustrative data visibly (neutral badge or caption) wherever synthetic data appears.
- **Do** give every app screen the hue of the step it serves, and reuse that hue for its tiles, badges, and numbers.
- **Do** keep app cards white (light) or neutral graphite (dark) on a ground one step darker, with the card shadow.

### Don't:
- **Don't** paint buttons, links, or text in the logo's #3f8f2f.
- **Don't** use gradient text or glow effects; green emphasis in a heading is a flat green-ink span.
- **Don't** put kickers, eyebrows, or uppercase tags above headings.
- **Don't** show invented stats, revenue, or testimonials; use real examples or labeled demo data.
- **Don't** set headings, labels, or body in Geist Mono.
- **Don't** use borders heavier than 1px or hard offset shadows.
- **Don't** tint cards, grounds, or bands green, and don't paint the app sidebar a different color from the canvas.
- **Don't** use a journey hue where its step isn't the subject, or put white text on honey.
- **Don't** use pure black as a dark ground.
