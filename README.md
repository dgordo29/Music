# Suno Studio

A single-page web app for the [SunoAPI](https://docs.sunoapi.org). Users bring their own API key
(get one at <https://sunoapi.org/api-key>) and can:

- **Create** songs in Simple mode (describe it, optional style + image/audio/video references) or
  Custom mode (title, style with one-click "Boost", exact lyrics, target length, excluded styles,
  vocal gender, style adherence, weirdness, audio weight, variety, personas).
- **Pick a model** — V6, V6 Wild, V6 Mini, plus legacy V4 – V5.5.
- **Write lyrics** with AI and send them straight into a song.
- **Remix** uploaded audio: cover, extend, add vocals, add instrumental, mashup, split stems.
- **Generate sounds** (loops/effects with BPM and key).
- **Library power tools** per track: extend, replace a section, stems → MIDI, WAV, music video,
  cover art, karaoke (word-synced lyrics), personas, recover expired links, import by task ID.
- Light, dark, and system themes.

## Deploy (Netlify)

No build step. Connect the repo to Netlify with the defaults — `netlify.toml` publishes the repo
root, proxies `/suno-api/*` → `api.sunoapi.org` and `/suno-upload/*` → the SunoAPI file-upload
host (avoids browser CORS), and ships a tiny function at `/.netlify/functions/suno-callback`
that acknowledges SunoAPI's required webhook (the app polls for results).

## Local development

```sh
npx netlify-cli dev   # serves the app with the proxy + function
```

Opening `index.html` directly also works if the API allows direct browser calls; the app falls
back to calling the API directly when the proxy isn't available.

## Privacy

The API key is stored only in the browser (localStorage when "Remember" is checked, otherwise
sessionStorage) and is sent only to SunoAPI via the proxy. The library, personas and queue live
in localStorage.
