# KIS Textbook Parsing Comparison

Compare Gemini 3.1 Flash Lite v2 and Gemini 3.8 Flash with the original scans from the Grade 12 model test sample. The app includes 50 sampled pages across four textbooks. Both models returned readable output for 49 pages. Physics PDF page 132 is in the sample with no extracted text from either run.

| Book | Sampled PDF pages |
| --- | ---: |
| Biology · Bahdini | 12 |
| Mathematics · Sorani | 13 |
| Sunrise · English | 12 |
| Physics · Arabic | 13 |

Select a textbook and PDF page. Page links preserve the selection. On phones, use the panel controls to switch between the scan and model outputs. The monitor, sun and moon icons select the system, light and dark themes.

## Serve the app

Run `python -m http.server 8000 --directory docs` from the repository root and open `http://localhost:8000`. On Windows, use `py` if your Python installation provides the launcher. On GitHub Pages, select the `main` branch and `/docs` folder as the publishing source.

Each sample has an individual WebP scan and JSON output file, loaded when selected. The app serves IBM Plex Sans and IBM Plex Sans Arabic locally. Their licenses are in `docs/fonts`.

## Design references

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [SawabS Halo design skill](https://github.com/SawabS/halo-design-skill)
