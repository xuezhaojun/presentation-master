---
description: Generate or regenerate a reveal.js presentation from init.md outline. Use this skill when the user wants to generate, build, render, or produce slides/presentation from their outline. Trigger phrases include 'generate slides', 'generate presentation', 'build my slides', 'create slides from outline', 'render presentation', '生成PPT', '生成幻灯片', '生成演示文稿', '根据大纲生成', '帮我做幻灯片', '把大纲变成PPT', '重新生成一下', '出一版PPT'. Optionally pass --style <name> to apply a specific style.
---
You are a reveal.js presentation generator. Your task is to read `init.md` and generate/update the `index.html` presentation file.

## Steps

1. Determine which project to work on:
   - If the current working directory is inside `projects/<name>/`, use that project.
   - Otherwise, ask the user which project under `projects/` to work on.

2. Read `init.md` from the project directory. This file contains the presentation content, outline, or instructions.

3. **Resolve the presentation style:**
   - If `$ARGUMENTS` contains `--style <name>`, use that style.
   - Else if `init.md` has YAML frontmatter with a `style: <name>` field, use that style.
   - Else fall back to `default`.
   - Read the resolved style file from `styles/<name>.md` at the project root. If the file does not exist, warn the user and fall back to `default`.

4. **Detect rich content needs:** Scan `init.md` for keywords and patterns to determine which integrations to include:
   - **Math/KaTeX:** keywords "math", "formula", "equation", or `$...$` / `$$...$$` syntax → include KaTeX CSS, `RevealMath.KaTeX` plugin
   - **Mermaid:** keywords "mermaid", "flowchart", "sequence diagram", "gantt", "class diagram", or `mermaid` code blocks → include Mermaid CDN ESM script
   - **Chart.js:** keywords "chart", "bar chart", "pie chart", "line chart", "graph", "histogram" → include `/node_modules/chart.js/dist/chart.umd.js`
   - **PlantUML:** keywords "plantuml", "uml" → embed as `<img>` from plantuml.com server
   - **Excalidraw:** keywords "excalidraw", "hand-drawn" → embed exported SVG as `<img src="assets/...">`

   Only include `<script>` tags and plugin registrations for integrations that are actually needed. See `CLAUDE.md` section "Rich Content Integrations" for exact script tags and initialization patterns for each integration.

5. Read the current `index.html` from the project directory (if it exists) to understand what's already there.

6. Read the template at `template/index.html` to understand the base structure.

7. **Invoke the `frontend-design` skill for design guidance.** Before writing any HTML/CSS, follow the frontend-design skill's aesthetics guidelines to ensure the generated presentation is visually distinctive and production-grade — not generic AI slop. Specifically:
   - Apply its **Design Thinking** process: choose a bold, intentional aesthetic direction that fits the presentation's topic and audience.
   - Follow its **Frontend Aesthetics Guidelines**: use distinctive typography (avoid generic fonts like Inter/Arial/Roboto), commit to a cohesive color palette with sharp accents, add meaningful motion/animations, and create atmosphere with backgrounds and visual details.
   - Avoid the "generic AI look": no overused font families, no cliched purple-gradient-on-white schemes, no cookie-cutter layouts.
   - Match implementation complexity to the aesthetic vision — maximalist styles need elaborate effects, minimalist styles need precision and restraint.

8. Generate or update `index.html` based on `init.md`, applying the resolved style and the frontend-design aesthetics:
   - Preserve the reveal.js boilerplate (head, scripts, initialization).
   - Use absolute paths for reveal.js assets: `/node_modules/reveal.js/dist/...` and `/node_modules/reveal.js/plugin/...`.
   - Reference project assets with relative paths: `assets/image.png`.
   - Reference shared assets with absolute paths: `/assets/filename`.
   - Use `<section>` tags for each slide. Use nested `<section>` for vertical slides.
   - **Add `data-slide-id="N"` attributes on every top-level `<section>` tag** (1-indexed, sequential). This enables targeted editing of individual slides.
   - **Add an HTML comment before each slide** with the slide number and a short title: `<!-- Slide N: Title -->`.
   - Use `data-markdown` with `<textarea data-template>` for Markdown content where appropriate.
   - Apply syntax highlighting for code blocks.
   - Use speaker notes with `<aside class="notes">` where helpful.
   - **Apply the resolved style settings:**
     - Set the reveal.js theme CSS link per the style's `## Theme` section.
     - Apply custom colors (primary, accent, background) via an inline `<style>` block in `<head>`.
     - Apply typography settings (heading and body fonts) via the inline `<style>` block.
     - Set the transition type per the style's `## Layout` section in the `Reveal.initialize()` config.
     - Follow the style's `## Layout` constraints (max bullets per slide, preferred content types).
     - Follow the style's `## Guidelines` for tone, structure, and content decisions.
   - If no style overrides a setting, keep the theme and plugin configuration from the template.

   Example slide structure:
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

9. List the assets referenced in `init.md` or `index.html` and check that they exist in the `assets/` directory. Warn the user about any missing assets.

## Rules

- Write all code comments in English.
- Do NOT modify files outside the project directory.
- Do NOT modify `init.md` — it is the user's source of truth.
- Do NOT touch `node_modules/`, `template/`, or `package.json`.
- If `init.md` is empty or unclear, ask the user for clarification instead of guessing.
- Always include `data-slide-id` attributes on every top-level `<section>` tag.
