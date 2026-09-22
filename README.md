# Handball Coachboard

A free digital coachboard for handball trainers: draw a play, share it as a link or QR code, and the whole team has it on their phone.

Static site built with [Astro](https://astro.build) 7 and hosted on Cloudflare Pages at handballcoachboard.com (not live yet).

## Development

Requires Node 22.12 or newer.

```sh
npm install
npm run dev      # http://localhost:4321/en/
npm run verify   # type check, tests, build and link check, the same as CI
```

Conventions for routing, SEO, text, styling, the board and the tactics content are in [AGENTS.md](AGENTS.md).
