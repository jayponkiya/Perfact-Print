# Fonts

The site currently loads **Sora** (headings, 600–800) and **Inter** (body, 400–700)
from Google Fonts — see the `<link>` in each page's `<head>`.

To self-host instead (faster, no third-party request):

1. Download WOFF2 files for both families (e.g. via https://gwfh.mranftl.com/fonts).
2. Put them in this folder.
3. Add `@font-face` rules at the top of `css/variables.css`.
4. Remove the Google Fonts `<link>` and `preconnect` tags from every HTML page.

The family names in `--font-display` / `--font-body` don't need to change.
