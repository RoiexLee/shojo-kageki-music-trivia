# Shojo Kageki Music Trivia _(shojo-kageki-music-trivia)_

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

An unofficial local web music trivia game for *Revue Starlight*, under the project name `shojo-kageki-music-trivia`.

中文：[README.md](README.md)

Players can choose clip, lyric, reverse, or synchronized mix mode and identify the song from the available choices. Quiz generation, option selection, scoring, and judging are implemented as testable pure functions.

## Install

Requirements: Node.js 20.19+ (or 22.12+), npm, and `ffmpeg`/`ffprobe` available on `PATH`.

```bash
npm install
npm run assets
npm test
npm run build
```

`npm run assets` generates the local audio clips, covers, lyric JSON files, and `manifest.json` under `apps/web/public/assets/`. The generated asset directory can be rebuilt and should not be committed.

## Usage

Start the development server:

```bash
npm run dev
```

Build and preview the production bundle locally:

```bash
npm run build
npm run preview --workspace apps/web -- --host 127.0.0.1 --port 4173 --strictPort
```

Each quiz has 10 questions by default. The result page shows the seed, and `?seed=42` reproduces a quiz. To prepare one song or verify generated resources:

```bash
npm run assets -- --only <id>
npm run assets -- --verify
```

## Contributing

Questions and pull requests for code, tests, and documentation are welcome. Before submitting:

- Follow the planning, review, and commit workflow in [AGENTS.md](AGENTS.md).
- Keep quiz rules decoupled from React components and add Vitest coverage for non-trivial logic.
- Run `npm test`, `npm run build`, and `npm run assets -- --verify`.

## License

[MIT](LICENSE) © RoiexLee
