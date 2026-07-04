---
name: pptx
description: "Use this skill any time a .pptx file is involved — as input, output, or both. Includes: creating slide decks, pitch decks, or presentations; reading/parsing/extracting text from .pptx files; editing/modifying existing presentations; combining/splitting slide files; working with templates, layouts, speaker notes, or comments. Trigger when user mentions deck, slides, presentation, or references a .pptx filename."
license: Proprietary. LICENSE.txt has complete terms
---

# PPTX Skill

## Quick Reference

| Task | Guide |
|------|-------|
| Read/analyze content | `python -m markitdown presentation.pptx` |
| Edit or create from template | Read editing.md |
| Create from scratch | Read pptxgenjs.md |

## Reading Content

```bash
python -m markitdown presentation.pptx
python scripts/thumbnail.py presentation.pptx
python scripts/office/unpack.py presentation.pptx unpacked/
```

## Editing Workflow

1. Analyze template with `thumbnail.py`
2. Unpack -> manipulate slides -> edit content -> clean -> pack

## Creating from Scratch

Use pptxgenjs when no template or reference presentation is available.

## Design Ideas

- Pick a bold, content-informed color palette
- One color should dominate (60-70%), with 1-2 supporting tones
- Dark backgrounds for title + conclusion, light for content
- Commit to a visual motif and carry it across every slide
- Every slide needs a visual element - images, charts, icons, or shapes

### Color Palettes

| Theme | Primary | Secondary | Accent |
|-------|---------|-----------|--------|
| Midnight Executive | 1E2761 | CADCFC | FFFFFF |
| Forest & Moss | 2C5F2D | 97BC62 | F5F5F5 |
| Coral Energy | F96167 | F9E795 | 2F3C7E |
| Warm Terracotta | B85042 | E7E8D1 | A7BEAE |
| Charcoal Minimal | 36454F | F2F2F2 | 212121 |
| Teal Trust | 028090 | 00A896 | 02C39A |
| Berry & Cream | 6D2E46 | A26769 | ECE2D0 |
| Sage Calm | 84B59F | 69A297 | 50808E |

### Typography

| Element | Size |
|---------|------|
| Slide title | 36-44pt bold |
| Section header | 20-24pt bold |
| Body text | 14-16pt |
| Captions | 10-12pt muted |

## QA (Required)

Assume there are problems. Your first render is almost never correct.

1. Generate slides -> Convert to images -> Inspect
2. List issues found
3. Fix issues
4. Re-verify affected slides
5. Repeat until a full pass reveals no new issues

## Dependencies

- `pip install "markitdown[pptx]"` - text extraction
- `pip install Pillow` - thumbnail grids
- `npm install -g pptxgenjs` - creating from scratch
- LibreOffice (`soffice`) - PDF conversion
- Poppler (`pdftoppm`) - PDF to images
