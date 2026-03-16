---
name: presentation-master
description: "AI-powered reveal.js presentation management — create, generate, edit, list, style, and export presentations. Use this skill whenever the user mentions anything about presentations, slides, PPT, or slide decks. This includes creating new presentations, generating slides from outlines, editing existing slides, listing slide structure, changing styles/themes, exporting to PPTX, or asking for help with the presentation workflow. Trigger on phrases like: 'create a presentation', 'new PPT', 'generate slides', 'build my slides', 'edit slide 3', 'change the title', 'add a slide', 'delete slide', 'list slides', 'show me the structure', 'what styles are available', 'change to minimalist style', 'export to pptx', 'convert to pptx', '导出PPTX', '转换成PPTX', 'PPT help', '创建PPT', '新建PPT', '生成幻灯片', '帮我做PPT', '改一下PPT', '把第N页改成', '加一页幻灯片', '删掉第N页', '换个风格', '看看PPT结构', '有哪些幻灯片', '有什么样式', '重新生成一下', '出一版PPT', '调整PPT', 'PPT怎么用'. Even if the user doesn't explicitly say 'presentation' or 'PPT', trigger this skill when the context clearly involves slide editing, outline-to-slides conversion, presentation theming, or PPTX export within this workspace."
---

# Presentation Master Skill

Unified skill for managing reveal.js presentations. Detect the user's intent and execute the appropriate operation.

## Intent Detection

Read the user's message and determine which operation to perform:

| Intent | Trigger signals |
|--------|----------------|
| **create** | "create", "new", "start", "scaffold", "initialize" a presentation/PPT/talk |
| **generate** | "generate", "build", "render", "produce", "make" slides from an outline; or the user just wrote an `init.md` and wants slides |
| **edit** | "change", "modify", "update", "fix", "add", "delete", "move", "restyle" specific slides or content |
| **list** | "list", "show", "view", "check", "review" the slide structure or outline |
| **styles** | "what styles", "show styles", "available themes", "有什么风格" |
| **export** | "export", "convert", "transfer", "download" to PPTX/PowerPoint; "导出", "转换", "转成PPTX" |
| **help** | "help", "how do I", "怎么用", asking about the workflow |

If the intent is ambiguous, ask the user to clarify.

---

## Operation: Create

Scaffold a new presentation project.

### Steps

1. Extract the project name from the user's message. The name should be lowercase with hyphens (e.g., `my-talk`). If no name is given, ask for one.

2. Check if the user specified a style (e.g., "with minimalist style", "--style vibrant", "用极简风格"). If so, verify `styles/<name>.md` exists; if not, warn and list available styles from `styles/`.

3. Run the scaffolding script:
   ```bash
   npm run new -- <project-name>
   ```

4. If a style was specified, prepend YAML frontmatter to `projects/<project-name>/init.md`:
   ```
   ---
   style: <name>
   ---
   ```

5. List files created in `projects/<project-name>/` to confirm.

6. Tell the user:
   - The project path: `projects/<project-name>/`
   - Next steps: write an outline in `init.md`, then ask to generate slides
   - If a style was applied, mention it
   - Available styles can be viewed by asking "有什么样式" or "what styles are available"

---

## Operation: Generate

Generate or regenerate slides from an `init.md` outline.

### Steps

1. Determine the project:
   - If the working directory is inside `projects/<name>/`, use that.
   - Otherwise, ask which project to work on.

2. Read `init.md` from the project directory.

3. **Resolve the style:**
   - If the user specified a style in their message (e.g., "generate with vibrant style"), use that.
   - Else if `init.md` has YAML frontmatter with `style: <name>`, use that.
   - Else fall back to `default`.
   - Read `styles/<name>.md`. If not found, warn and fall back to `default`.

4. **Detect rich content needs:** Scan `init.md` for keywords and patterns to determine which integrations to include:
   - **Math/KaTeX:** keywords "math", "formula", "equation", or `$...$` / `$$...$$` syntax → include KaTeX CSS, `RevealMath.KaTeX` plugin
   - **Mermaid:** keywords "mermaid", "flowchart", "sequence diagram", "gantt", or `mermaid` code blocks → include Mermaid CDN ESM script
   - **Chart.js:** keywords "chart", "bar chart", "pie chart", "line chart", "graph" → include `/node_modules/chart.js/dist/chart.umd.js`
   - **PlantUML:** keywords "plantuml", "uml" → embed as `<img>` from plantuml.com
   - **Excalidraw:** keywords "excalidraw", "hand-drawn" → embed exported SVG as `<img>`
   Only include scripts for integrations actually used. See `CLAUDE.md` "Rich Content Integrations" for exact patterns.

5. Read the current `index.html` (if exists) and `template/index.html`.

6. **Invoke the `frontend-design` skill for design guidance.** Before writing any HTML/CSS, follow the frontend-design skill's aesthetics guidelines to ensure the generated presentation is visually distinctive and production-grade — not generic AI slop. Specifically:
   - Apply its **Design Thinking** process: choose a bold, intentional aesthetic direction that fits the presentation's topic and audience.
   - Follow its **Frontend Aesthetics Guidelines**: use distinctive typography (avoid generic fonts like Inter/Arial/Roboto), commit to a cohesive color palette with sharp accents, add meaningful motion/animations, and create atmosphere with backgrounds and visual details.
   - Avoid the "generic AI look": no overused font families, no cliched purple-gradient-on-white schemes, no cookie-cutter layouts.
   - Match implementation complexity to the aesthetic vision — maximalist styles need elaborate effects, minimalist styles need precision and restraint.

7. Generate or update `index.html` based on `init.md`, applying the resolved style and the frontend-design aesthetics:
   - Use absolute paths for reveal.js: `/node_modules/reveal.js/dist/...`
   - Project assets: relative paths (`assets/image.png`)
   - Shared assets: absolute paths (`/assets/filename`)
   - Add `data-slide-id="N"` on every top-level `<section>` (1-indexed, sequential)
   - Add `<!-- Slide N: Title -->` comments before each slide
   - Use `data-markdown` with `<textarea data-template>` where appropriate
   - Apply syntax highlighting for code blocks
   - Use speaker notes with `<aside class="notes">` where helpful
   - **Apply style settings:**
     - Theme CSS link per `## Theme`
     - Custom colors and typography via inline `<style>` in `<head>`
     - Transition type in `Reveal.initialize()` per `## Layout`
     - Follow `## Layout` constraints (max bullets, preferred content types)
     - Follow `## Guidelines` for tone and structure

   Example:
   ```html
   <!-- Slide 1: Title Slide -->
   <section data-slide-id="1">
     <h1>My Talk</h1>
   </section>

   <!-- Slide 2: Introduction -->
   <section data-slide-id="2">
     ...
   </section>
   ```

8. Check that referenced assets exist in `assets/`. Warn about missing ones.

---

## Operation: Edit

Make targeted edits to an existing presentation.

### Steps

1. Determine the project (same as Generate).

2. Read the current `index.html`.

3. Parse the user's instruction. Supported operations include:
   - "change slide 3's title to Foo"
   - "add a new slide after slide 5 about security"
   - "delete slide 4"
   - "move slide 6 before slide 2"
   - "add speaker notes to slide 3"
   - "change the theme to white"
   - "add a code example to slide 2"

4. **Style changes:** If the user asks to change the style (e.g., "换成 vibrant 风格", "make it minimalist"), read `styles/<name>.md` and apply its visual settings:
   - Update theme CSS link
   - Update inline `<style>` block (colors, typography)
   - Update transition in `Reveal.initialize()`

5. Use the **Edit tool** for targeted changes — never rewrite the entire file:
   - Locate slides by `data-slide-id` attributes and HTML comments
   - For small changes: edit only affected lines
   - For new slides: insert `<section data-slide-id="N">` at the right position
   - For deletions: remove the `<section>` block and its comment
   - For moves: remove from old position, insert at new position

6. After structural changes, renumber all `data-slide-id` attributes sequentially.

7. Report what was changed.

---

## Operation: List

Show the slide structure of the current presentation.

### Steps

1. Determine the project.

2. Read `index.html`. If it doesn't exist, tell the user to generate slides first.

3. Find all top-level `<section>` elements within `<div class="slides">`.

4. For each slide, extract:
   - Slide number (from `data-slide-id` or position)
   - Title (from heading or HTML comment)
   - Brief content summary

5. Output:
   ```
   Slides in projects/<name>/:

     Slide 1: Title Slide — "My Talk Title / Subtitle"
     Slide 2: Introduction — "Point A, Point B"
     ...

   Total: N slides
   ```

---

## Operation: Styles

List available presentation styles.

### Steps

1. Read all `.md` files in `styles/` at the project root.

2. For each style, extract the name, description, theme, and key guidelines.

3. Present them clearly, and explain usage:
   - In `init.md` frontmatter: `style: <name>`
   - When generating: "生成PPT用minimalist风格" or specify `--style <name>`
   - When creating: "创建PPT用vibrant风格"

---

## Operation: Export

Export a reveal.js presentation to PPTX format using Pandoc.

### Steps

1. **Check Pandoc installation:**
   ```bash
   which pandoc
   ```
   - If not installed, install via `brew install pandoc`.
   - If `brew` is not available, tell the user to install Pandoc manually and stop.

2. **Determine the project:**
   - If the user specified a project name, use it.
   - Otherwise, list all projects under `projects/` and:
     - If exactly one project exists, use it automatically.
     - If multiple, ask the user which one.
   - Verify `projects/<project-name>/index.html` exists. If not, tell the user to generate slides first.

3. **Export to PPTX:**
   ```bash
   pandoc projects/<project-name>/index.html \
     -f html \
     -t pptx \
     -o projects/<project-name>/<project-name>.pptx
   ```

4. **Verify and report:**
   - Confirm the file was created and report its path and size.
   - Mention that complex reveal.js features (animations, fragments, custom CSS) may not transfer perfectly.

---

## Operation: Help

Show available operations and workflow.

### Steps

1. List all available operations with descriptions.

2. Show the typical workflow:
   1. Create a project (say "帮我建一个PPT叫 demo" or "创建PPT demo --style minimalist")
   2. Browse styles ("有什么样式")
   3. Start dev server: `npm start`
   4. Write outline in `projects/<name>/init.md`
   5. Generate slides ("帮我生成幻灯片" or "生成PPT")
   6. View at `http://localhost:8000/projects/<name>/`
   7. List slides ("看看PPT结构")
   8. Edit iteratively ("把第3页标题改成XXX" or "加一页关于安全的内容")

3. Mention that all operations can be triggered with natural language — no slash commands needed.

---

## Global Rules

- Write all code comments in English.
- Only modify files inside `projects/<name>/` when working on a project.
- Never modify `init.md` — it is the user's source of truth.
- Never modify `node_modules/`, `template/`, or root config files.
- In `index.html`, use absolute paths for reveal.js: `/node_modules/reveal.js/dist/...`
- Always add `data-slide-id` attributes on every top-level `<section>`.
- When editing, use the Edit tool for targeted changes — never rewrite the entire `index.html`.
- When generating, resolve style from user's message, `init.md` frontmatter, or `styles/default.md` (in that priority).
- Check that referenced assets exist in `assets/` and warn if missing.
