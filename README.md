# The Automaton — A Thinking Engine, Anno 1920

A chat platform with a mechanical mind that has read only what was printed up to the close of 1919, and so believes it is 1920, a year after the Great War.

Live: https://kampfguy.github.io/automaton/

## How it works
- **Frontend** (this repo root, GitHub Pages): newspaper/telegram styled chat, conversations kept in `localStorage`, PWA.
- **Backend** (`worker/`): Cloudflare Worker `automaton-api` calling free OpenRouter models with a detailed 1919 persona prompt, a "date guard" (today's month/day, year 1920), and a leak guard that regenerates once if an answer mentions post-1919 matters.
- **Grounding** (`corpus/build.py` → `worker/corpus.json`): ~860 passages from 19 public-domain Project Gutenberg works published 1836–1919 (Keynes, Wilson's addresses, Babbage, Empey, Wells, Buchan, McCrae, Mr. Punch's History of the Great War, Encyclopaedia Britannica 11th ed., Heroes of the Telegraph, wireless and invention handbooks, Poe's *Maelzel's Chess-Player*), searched by a small keyword index; the top passages are injected into each prompt.

No model was actually trained on period text; the effect is achieved by prompting and retrieval.
