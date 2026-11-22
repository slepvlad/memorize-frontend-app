# Recallingo App Redesign — Site Style Bridge

Goal: restyle the Expo app so it reads as the same brand as recallingo.com, using the
site's visual language (cream / navy / burnt-orange, pill + 20px-card radii, heavy
display type) without bundling webfonts.

- **Source of truth:** `../memorize/src/main/resources/static/css/site.css` and
  `../memorize/src/main/resources/templates/index.html` (served at https://recallingo.com).
  Live reference captures: `.qwen/tmp/site/desktop-content.png`, `mobile-hero.png`.
- **Approved scope:** theme tokens + shared components, plus a targeted per-screen sweep
  where surfaces/semantics must flip. System fonts stay (no `@expo-google-fonts`).
  Semantic hues stay distinct but get retuned to sit on cream.
- **Companion:** interactive style guide artifact (token map, component specimens,
  before/after screen mockups) — see session link; regenerated from this plan.
- **No backend changes.** No test coupling to colors exists (`__tests__` never imports theme).

## 1. Design language extracted from the site

| Element | Site value |
| --- | --- |
| Page background | `--cream #FBF4EA` |
| Card / highlight fill | `--cream-card-1 #FBEADA`, `--cream-card-2 #F6EADA` |
| Ink + dark surfaces | `--navy #16233F` (footer, step-card.dark, CTA banner, phone shell) |
| Accent | `--orange #CE6A1B`; text-safe accent on cream `--orange-badge-text #9A4C10` |
| Borders | `rgba(22,35,63,.08)` / `.06`; muted text `rgba(22,35,63,.65)` |
| Radii | pill 999 · CTA banner 28 · cards 20 · options/inputs 14 · dark buttons 12 |
| Type | Bricolage Grotesque 800 display / DM Sans body → **approximated** with system font `fontWeight 800` + negative tracking |
| Motifs | uppercase orange eyebrows, segmented orange progress row, streak pill, white cards on cream, one navy accent block per view, chart bars gradient `#F0C793→#CE6A1B` with last two navy |

## 2. Target `src/theme.ts`

```ts
colors = {
  primary: '#CE6A1B', primaryDark: '#9A4C10', primaryLight: '#F6EADA',
  background: '#FBF4EA', surface: '#FBEADA', surfaceHover: '#F6EADA', card: '#FFFFFF',
  navy: '#16233F',
  text: '#16233F', textSecondary: 'rgba(22,35,63,0.65)', textTertiary: 'rgba(22,35,63,0.45)',
  textInverse: '#FFFFFF',
  border: 'rgba(22,35,63,0.08)', borderHover: 'rgba(22,35,63,0.15)',
  danger: '#B3372F', dangerLight: '#F7E6E2',
  warning: '#A87700', warningLight: '#F7EDD5',
  success: '#1F7A5C', successLight: '#E1EFE7',
  info: '#2F6FA8', infoLight: '#E3EDF6',
  chartGradientStart: '#F0C793',
}
radius = { sm: 10, md: 14, lg: 20, xl: 28, full: 9999 }
typography: h1 32/800/-1 · h2 24/800/-0.8 · h3 18/700/-0.2 · display 40/800/-1.5 ·
            eyebrow 12/700/ls .7 (uppercase at call site) · body/label/caption unchanged
spacing: unchanged + xxxxl: 48
```

Dropped keys: `coral`, `purple` (2 call sites, remapped in Phase 3). New key: `card`
(white) — the old `surface` grey becomes the cream highlight fill, so "card on cream"
needs its own token.

## 3. Phases

### Phase 1 — Tokens & app shell
1. `src/theme.ts` — full rewrite per §2.
2. `app.json` — `expo-splash-screen.backgroundColor #ffffff → #FBF4EA`;
   Android adaptive `backgroundColor #E6F4FE → #16233F`. (Icon *assets* untouched —
   the non-square `icon.png` is PRELAUNCH_PLAN.md's job; don't mix commits.)
3. `app/_layout.tsx` — injected web CSS `background-color: #F0EFEB → #FBF4EA`;
   scrollbar thumb `rgba(22,35,63,0.2)`.
4. `src/components/ui/WebContainer.tsx` — `#F0EFEB → colors.background`.
5. `src/context/ToastContext.tsx` — hard-coded `'#9a6400'` → `colors.warning`.

### Phase 2 — Shared components
- **Button**: `primary` = orange fill, white 700 label, **pill** radius, pressed → `primaryDark`;
  new `dark` variant = navy fill, radius `md` (site's App-Store button); `secondary` = white
  `card` + `border`, navy label, radius `md`; `ghost` = transparent, `primaryDark` label.
  ActivityIndicator color follows variant.
- **Input**: wrapper `card` white + 1px `border` (was grey fill, transparent border) so fields
  read on cream; focus → border `primary`; error → border/text `danger`; label `textSecondary`.
- **SpeakerButton**: white circular `card` + `border`, navy icon, pressed → `surface`.
- **Tab bar** (`app/(tabs)/_layout.tsx`): background `colors.background`, top hairline
  `colors.border`, active tint `colors.primary`, inactive `textTertiary`, label 11/600.
- **Toasts**: white `card` surface + `border` + semantic icon/text hues from §2.

### Phase 3 — Screen sweep (surface inversion + semantics)
Rule per view: page = `background` cream · content cards = `card` white, radius `lg`,
1px `border` · training/highlight cards = `surface` cream-card · **at most one** navy
accent block per screen (mirrors `step-card.dark`). ~18 `colors.surface` + ~24
`colors.background` call sites reviewed file-by-file (cream-on-cream is the failure mode):
`app/(tabs)/{index,learn,quiz,vocabulary,translator,progress}.tsx`, `app/profile.tsx`,
`app/(auth)/{index,login,register}.tsx`, `app/(onboarding)/language-setup.tsx`,
`src/quiz/{SelectOptions,TypeInput,QuizResults}.tsx`.

Targeted edits:
- `(tabs)/index.tsx:151` `colors.coral → colors.primary`; delete `coral`/`purple` from theme after.
- `(tabs)/progress.tsx:11` `STAT_COLORS → [primary, success, info, navy]`;
  `:12` `MASTERY_COLORS → [primary, warning, borderHover]`.
- Quiz options (`SelectOptions.tsx`, `quiz.tsx`): default = white `card` + `border`, radius `md`;
  **correct** = `surface` fill + border `primary` + label `primaryDark` + ✓ (site `.option.correct`);
  **wrong** = `dangerLight` + border `danger`.
- Progress charts: bars via `expo-linear-gradient` `chartGradientStart → primary`,
  last two bars `navy` (site `.chart-bars`).
- Pills/badges (streak, due-count, language tag): `surface`/`primaryLight` fill, `primaryDark`
  text, radius `full` (site `.streak`, `.badge-tag`).
- Auth + onboarding: cream page, white card, headings on new `typography.h1`.
- `profile.tsx`: top identity card goes navy with white text (mirrors `.cta-banner`);
  logout/danger-zone hues from §2.

### Phase 4 — Type ramp & eyebrows
- New shared `src/components/ui/Eyebrow.tsx` (12/700, ls 0.7, uppercase, `primaryDark`).
- Apply `typography.h1/h2` (800 + tracking) to screen headers: home greeting, progress,
  vocabulary, translator, auth titles; `Eyebrow` above home/progress/vocabulary headers.
- Big session/streak numbers use `typography.display`.

### Phase 5 — Optional, explicitly out of approved scope
- Mascot (`../memorize/.../static/images/mascot.png` → `assets/mascot.png`) on auth + empty states.
- Webfont bundling (declined this round), dark mode (deferred per App Store prelaunch decisions).

## 4. Accessibility & platform notes
- White on `#CE6A1B` ≈ 4.0:1 → only for bold ≥15px button labels. All small accent **text**
  on cream uses `primaryDark #9A4C10` (≈4.9:1); eyebrows included.
- Navy on cream ≈ 13.6:1; `textSecondary` ≈ 5.4:1 — both fine.
- `fontWeight '800'` renders Heavy on iOS SF but clamps to Bold (700) on Android Roboto —
  accepted; tracking carries the display feel there.
- Semantic hues stay green/red/amber/blue so quiz right–wrong stays instantly readable;
  only their values move toward the cream palette.

## 5. Verification
1. `npx tsc --noEmit` and `npx jest` (80% coverage gate; no test imports theme colors).
2. `npx expo start --web` pass over all 6 tabs + auth + onboarding + quiz flow + profile;
   check for cream-on-cream cards and orange-on-cream small text.
3. iOS simulator screenshots of Home/Quiz/Progress compared against the style-guide mockups.
4. Commit per phase (short feature-level messages, repo convention).
