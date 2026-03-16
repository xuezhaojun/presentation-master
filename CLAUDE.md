# Presentation Master

AI-powered reveal.js presentation workspace.

## Project Structure

```
presentation-master/
├── CLAUDE.md                  # This file
├── .gitignore
├── package.json               # Shared deps (reveal.js, browser-sync)
├── assets/                    # Shared assets (logos, common images)
├── styles/                    # Global presentation styles
│   ├── default.md             # Clean, balanced, professional
│   ├── minimalist.md          # Sparse, whitespace-heavy
│   └── vibrant.md             # Colorful, icon-rich, energetic
├── template/
│   └── index.html             # Base template for new projects
├── scripts/
│   ├── new-project.sh         # Script to scaffold new projects
│   └── export-pptx.js         # Export presentation to PPTX (Puppeteer + PptxGenJS)
├── .claude/
│   ├── skills/
│   │   └── presentation-master/
│   │       └── SKILL.md              # Unified skill (natural language trigger)
│   └── commands/
│       ├── presentation-create.md    # /presentation:create command
│       ├── presentation-generate.md  # /presentation:generate command
│       ├── presentation-edit.md      # /presentation:edit command
│       ├── presentation-list.md      # /presentation:list command
│       ├── presentation-styles.md    # /presentation:styles command
│       └── presentation-help.md      # /presentation:help command
└── projects/
    └── <project-name>/
        ├── init.md            # Outline / instructions (user-maintained)
        ├── index.html         # Reveal.js presentation (AI-generated)
        └── assets/            # Project-specific images, files, etc.
```

## Workflow

All operations support natural language — no slash commands required. Just describe what you want.

1. Create a new project: "帮我建一个PPT叫 demo" or `/presentation:create <name>`
2. Browse styles: "有什么样式" or `/presentation:styles`
3. Start dev server: `npm start` (serves at http://localhost:8000)
4. Write an outline in `projects/<name>/init.md` (optionally add `style: <name>` to frontmatter)
5. Generate slides: "生成幻灯片" or `/presentation:generate`
6. View at `http://localhost:8000/projects/<name>/`
7. List slides: "看看PPT结构" or `/presentation:list`
8. Edit iteratively: "把第3页标题改成 Foo" or `/presentation:edit <instruction>`
9. Repeat 7-8 as needed

## Rules for AI

- Only modify files inside `projects/<name>/` when working on a project.
- Never modify `init.md` — it is the user's source of truth.
- Never modify `node_modules/`, `template/`, or root config files unless explicitly asked.
- In `index.html`, use absolute paths for reveal.js: `/node_modules/reveal.js/dist/...`
- Reference project assets with relative paths: `assets/image.png`
- Reference shared assets with absolute paths: `/assets/filename`
- Write all code comments in English.
- When generating slides, resolve and apply the style from `--style` argument, `init.md` frontmatter, or `styles/default.md` (in that priority order).
- Styles are global — they live in the root `styles/` directory, not per-project.
- When generating slides, follow the structure and instructions in `init.md`.
- Check that referenced assets exist in `assets/` and warn if missing.
- When editing slides, use the Edit tool for targeted changes — never rewrite the entire `index.html`.
- Always add `data-slide-id` attributes on every top-level `<section>` tag when generating or inserting slides (1-indexed, sequential).
- Always set `width: 960, height: 540` in `Reveal.initialize()` to enforce 16:9 aspect ratio matching Google Slides (10" x 5.625"). Never use the reveal.js default (960x700).
- When updating or adding commands in `.claude/commands/`, always update `presentation-help.md` to reflect the current set of available commands.

## Dependencies

After cloning, run `npm install` to install all dependencies:

| Package | Type | Purpose |
|---------|------|---------|
| `reveal.js` | runtime | Presentation framework |
| `browser-sync` | dev | Local dev server with hot reload (`npm start`) |
| `puppeteer` | dev | Headless browser for PPTX export (screenshots each slide) |
| `pptxgenjs` | dev | Generate PPTX files with images + clickable hyperlink overlays |
| `sharp` | dev | Image processing (resize, DPI metadata) for export |
| `adm-zip` | dev | Post-process PPTX XML (remove noChangeAspect lock) |

**Quick setup:**
```bash
npm install                          # Install all dependencies
npx puppeteer browsers install chrome  # Download Chrome for PPTX export
npm start                           # Start dev server at http://localhost:8000
```

**PPTX export** requires the dev server to be running:
```bash
npm run export -- <project-name>   # Export to projects/<name>/<name>.pptx
```
