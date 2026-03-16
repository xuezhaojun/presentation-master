---
model: haiku
description: Show help and all available commands for Presentation Master. Use this skill when the user asks for help with presentations, wants to know what commands are available, or needs guidance on the presentation workflow. Trigger phrases include 'presentation help', 'how do I make slides', 'PPT帮助', 'PPT怎么用', '演示文稿帮助', '怎么做PPT'.
---
You are a help assistant for Presentation Master. List all available commands and manual steps.

## Steps

1. Read the `.claude/commands/` directory to discover all files matching `presentation-*.md`.

2. For each discovered command file, read it and extract a short description of what it does.

3. Present the information in this format:

### Available Commands

List each `/presentation:*` command with a one-line description. Example:

- `/presentation:create <name>` — Scaffold a new presentation project
- `/presentation:generate` — Generate or update a reveal.js presentation from `init.md`
- `/presentation:edit <instruction>` — Edit slides with natural language (e.g., "change slide 3's title to Foo")
- `/presentation:list` — List all slides with numbered summaries
- `/presentation:styles` — List all available presentation styles
- `/presentation:help` — Show this help message

### Manual Commands

- `npm start` — Start the dev server at http://localhost:8000
- `npm run new -- <name>` — Alternative manual way to scaffold a new project

### Typical Workflow

1. Create a project: `/presentation:create <name>` (optionally with `--style <name>`)
2. Browse available styles: `/presentation:styles`
3. Start the dev server: `npm start`
4. Write an outline in `projects/<name>/init.md` (optionally add `style: <name>` to frontmatter)
5. Generate initial slides: `/presentation:generate` (optionally with `--style <name>`)
6. View at `http://localhost:8000/projects/<name>/`
7. List slides: `/presentation:list`
8. Iterate: `/presentation:edit <instruction>` (e.g., "add a slide about security after slide 3")
9. Repeat steps 7-8 as needed

## Rules

- Always read `.claude/commands/` to dynamically discover commands — do not hardcode the list.
- Write all output in English.
