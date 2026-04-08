# Labrats — Phase 3 Deployment Guide

Same process as The Fuglys and Cats On Crack.

## Deploy Steps

```
cd C:\Users\chris\Downloads\labrats-phase3\labrats-build
npm install
copy .env.example .env
notepad .env
```

Add Sanity API token for project `o9qrmykx`:
https://www.sanity.io/manage/project/o9qrmykx → API → Tokens → Add (Editor)

```
npm run migrate
```

Verify at https://labrats.sanity.studio

```
git init
git add .
git commit -m "Phase 3: Full backend - Sanity CMS, Stripe, Printful, AEO/GEO"
git remote add origin https://github.com/TheMetavision/labrats.git
git branch -M main
git push -u origin main
```

Connect to Netlify → import env vars → deploy.

## Key Details

| Field | Value |
|---|---|
| Domain | labrats.uk |
| Sanity Project | o9qrmykx |
| Studio | labrats.sanity.studio |
| Characters | 4 (Rex, Zara, Blitz, Nova) |
| Blog | Rat Tales |
| Characters page | Meet The Rat Pack |
| Design | Black/teal/yellow, Bebas Neue + Barlow |
| Pages | 9 (Home, Rat Pack, Media, Merch, Rat Tales, Contact, Privacy, Terms, 404) |
