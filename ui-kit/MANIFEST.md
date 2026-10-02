# Šargija UI Button Kit — Manifest

All PNGs are RGBA, exported at 2× logical size. Corner radius 2 px / border 2 px (export) = 1 px logical, matching `border-radius:1px` in index.html. Faces are fully opaque; only the 4 rounded corner pixels per corner are transparent.

Nine-slice insets are given as export px (logical in parentheses) in the order left / top / right / bottom. The larger left/top values keep the PRESSED inset shadow inside the fixed slices. Because each family's height is fixed, a horizontal 3-slice using the left/right insets is enough in most cases.

Hero sheet (`shargija_ui_kit_hero_sheet.png`, 2592×1080, #0a0908): rows from top to bottom are menu_primary, menu_quiet, action_primary, action_secondary, card_play, card_demo, back, settings_chip, song_option_chip. Columns are NORMAL, HIGHLIGHTED, PRESSED, SELECTED, DISABLED. Assets are shown unmodified at export scale.

| File | Export px | Logical px | 9-slice L/T/R/B | Usage |
|---|---|---|---|---|
| `shargija_menu_primary_normal.png` | 640×80 | 320×40 | 16/16/6/6 (8/8/3/3) | Main menu rows: songs, practice, free play, instructions, settings (left label + right status). |
| `shargija_menu_primary_highlighted.png` | 640×80 | 320×40 | 16/16/6/6 (8/8/3/3) | Main menu rows: songs, practice, free play, instructions, settings (left label + right status). |
| `shargija_menu_primary_pressed.png` | 640×80 | 320×40 | 16/16/6/6 (8/8/3/3) | Main menu rows: songs, practice, free play, instructions, settings (left label + right status). |
| `shargija_menu_quiet_normal.png` | 640×80 | 320×40 | 16/16/6/6 (8/8/3/3) | Secondary / quiet menu rows. |
| `shargija_menu_quiet_highlighted.png` | 640×80 | 320×40 | 16/16/6/6 (8/8/3/3) | Secondary / quiet menu rows. |
| `shargija_menu_quiet_pressed.png` | 640×80 | 320×40 | 16/16/6/6 (8/8/3/3) | Secondary / quiet menu rows. |
| `shargija_action_primary_normal.png` | 640×72 | 320×36 | 15/15/6/6 (7.5/7.5/3/3) | Primary wide actions: replay, repeat song, repeat verse, practise weak passages. |
| `shargija_action_primary_highlighted.png` | 640×72 | 320×36 | 15/15/6/6 (7.5/7.5/3/3) | Primary wide actions: replay, repeat song, repeat verse, practise weak passages. |
| `shargija_action_primary_pressed.png` | 640×72 | 320×36 | 15/15/6/6 (7.5/7.5/3/3) | Primary wide actions: replay, repeat song, repeat verse, practise weak passages. |
| `shargija_action_secondary_normal.png` | 640×72 | 320×36 | 15/15/6/6 (7.5/7.5/3/3) | Secondary wide actions on result screens and navigation. |
| `shargija_action_secondary_highlighted.png` | 640×72 | 320×36 | 15/15/6/6 (7.5/7.5/3/3) | Secondary wide actions on result screens and navigation. |
| `shargija_action_secondary_pressed.png` | 640×72 | 320×36 | 15/15/6/6 (7.5/7.5/3/3) | Secondary wide actions on result screens and navigation. |
| `shargija_card_play_normal.png` | 224×64 | 112×32 | 13/13/6/6 (6.5/6.5/3/3) | Song-card PLAY button. |
| `shargija_card_play_highlighted.png` | 224×64 | 112×32 | 13/13/6/6 (6.5/6.5/3/3) | Song-card PLAY button. |
| `shargija_card_play_pressed.png` | 224×64 | 112×32 | 13/13/6/6 (6.5/6.5/3/3) | Song-card PLAY button. |
| `shargija_card_demo_normal.png` | 80×64 | 40×32 | 13/13/6/6 (6.5/6.5/3/3) | Song-card DEMO / listen button (icon added in HTML). |
| `shargija_card_demo_highlighted.png` | 80×64 | 40×32 | 13/13/6/6 (6.5/6.5/3/3) | Song-card DEMO / listen button (icon added in HTML). |
| `shargija_card_demo_pressed.png` | 80×64 | 40×32 | 13/13/6/6 (6.5/6.5/3/3) | Song-card DEMO / listen button (icon added in HTML). |
| `shargija_back_normal.png` | 160×56 | 80×28 | 11/11/6/6 (5.5/5.5/3/3) | BACK / MENU button for subscreens and in-play menu. |
| `shargija_back_highlighted.png` | 160×56 | 80×28 | 11/11/6/6 (5.5/5.5/3/3) | BACK / MENU button for subscreens and in-play menu. |
| `shargija_back_pressed.png` | 160×56 | 80×28 | 11/11/6/6 (5.5/5.5/3/3) | BACK / MENU button for subscreens and in-play menu. |
| `shargija_settings_chip_normal.png` | 192×96 | 96×48 | 19/19/6/6 (9.5/9.5/3/3) | Settings / language chips: difficulty, instrument, sound colour, effects, language (title + subtitle). |
| `shargija_settings_chip_highlighted.png` | 192×96 | 96×48 | 19/19/6/6 (9.5/9.5/3/3) | Settings / language chips: difficulty, instrument, sound colour, effects, language (title + subtitle). |
| `shargija_settings_chip_pressed.png` | 192×96 | 96×48 | 19/19/6/6 (9.5/9.5/3/3) | Settings / language chips: difficulty, instrument, sound colour, effects, language (title + subtitle). |
| `shargija_settings_chip_selected.png` | 192×96 | 96×48 | 19/19/6/6 (9.5/9.5/3/3) | Settings / language chips: difficulty, instrument, sound colour, effects, language (title + subtitle). |
| `shargija_settings_chip_disabled.png` | 192×96 | 96×48 | 19/19/6/6 (9.5/9.5/3/3) | Settings / language chips: difficulty, instrument, sound colour, effects, language (title + subtitle). |
| `shargija_song_option_chip_normal.png` | 96×48 | 48×24 | 10/10/6/6 (5/5/3/3) | Compact song option chips inside song cards. |
| `shargija_song_option_chip_highlighted.png` | 96×48 | 48×24 | 10/10/6/6 (5/5/3/3) | Compact song option chips inside song cards. |
| `shargija_song_option_chip_pressed.png` | 96×48 | 48×24 | 10/10/6/6 (5/5/3/3) | Compact song option chips inside song cards. |
| `shargija_song_option_chip_selected.png` | 96×48 | 48×24 | 10/10/6/6 (5/5/3/3) | Compact song option chips inside song cards. |
| `shargija_song_option_chip_disabled.png` | 96×48 | 48×24 | 10/10/6/6 (5/5/3/3) | Compact song option chips inside song cards. |
