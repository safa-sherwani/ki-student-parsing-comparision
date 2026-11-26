# KIS Textbook Parsing Comparison

Compare Gemini 3.1 Flash Lite v2 and Gemini 3.8 Flash with the original Grade 12 textbook scans. The catalog contains 882 PDF pages across four books. Fifty pages have a test record, and 49 have readable output from both models.

| Book | PDF pages | Test records |
| --- | ---: | ---: |
| Biology · Bahdini | 216 | 12 |
| Mathematics · Sorani | 240 | 13 |
| Sunrise · English | 120 | 12 |
| Physics · Arabic | 306 | 13 |

Select a book and PDF page, or filter to pages with test results. Page links preserve the selected book, page and filter. The phone layout offers an original-page view and three output views.

## Serve the app

Run `python -m http.server 8000 --directory docs` from the repository root and open `http://localhost:8000`. On GitHub Pages, use the `main` branch and `/docs` folder as the publishing source.

The scan packs store the original WebP images from the lightweight comparison archive. The catalog records byte offsets and lengths. The browser retrieves one pack at a time, and fetches model text only for pages with test records. No build step or API credentials are required.

## Design references

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [SawabS Halo design skill](https://github.com/SawabS/halo-design-skill)

## Verification

All 882 scan files were checked against the source archive byte for byte. The 50 test records were checked for matching PDF pages and preserved output text. Chromium testing covered keyboard navigation, touch controls, deep links, the scan viewer, difference highlighting, both reading directions, and eleven viewport widths from 320 to 1440 pixels. axe-core checks passed in light and dark themes on laptop and in the phone layout.
