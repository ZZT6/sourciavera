# SourciaVera Fact Library

**Internal only. Never publish, link, or serve anything from `/content/facts/`
on the live site.** This folder is the single source of truth that Case
Studies, Factory Stories, blog posts, social content, and GEO/AI-search
content should be drafted *from* — not itself a page.

`robots.txt` disallows `/content/` for crawlers as a second layer of
protection, on top of nothing here ever being linked from the site.

## Rule

A sentence can go into public content only if it's under **Confirmed
Facts** in the relevant file below. If it's under **Not Confirmed**, it
stays out — no plausible-sounding filler, no rounding a vague number into
a specific one, no inferring a country from a region. When a fact is
missing, published content says nothing about it, or says "not
disclosed" — it does not guess.

## Per-case file template

```
## Case Name

### Confirmed Facts
Customer region:
Product:
Problem:
SourciaVera involvement:
Finding:
Result:

### Not Confirmed
(explicit list of what we don't know — names, dates, amounts, etc.)

### Content Usage
Allowed: [which formats, and what they may say]
Not Allowed: [specific claims this case must never make until confirmed]

### Source
(where the Confirmed Facts come from — a live page, a testimonial, a
founder interview — so anyone can re-check them)
```

## Files in this folder

| File | Status |
|---|---|
| `byd-seagull-wheels.md` | Confirmed facts sufficient for the published case study |
| `mexico-expandable-house.md` | Confirmed facts sufficient for the published Factory Story; not yet enough for a full Case Study |
| `guatemala-expandable-house.md` | **No confirmed facts yet** — nothing has been published or shared about this case |
| `h2o2-alibaba-verification.md` | Confirmed facts sufficient for the existing blog section; not yet enough for a Case Study (result unknown) |
| `badges-medals-sourcing.md` | Confirmed facts sufficient for a Factory Story; not yet enough for a full Case Study (findings, supplier detail missing) |

## How to add a new case

1. Copy the template above into a new `<slug>.md` file here.
2. Fill in **Confirmed Facts** only from something checkable — a page
   already live on the site, or a direct statement from the founder that
   you can attribute and would stand behind if a client saw it.
3. List everything else explicitly under **Not Confirmed**, even if it
   seems minor. If a field isn't listed as confirmed or unconfirmed, that
   itself is a gap — go back and check.
4. Only after that: draft the public page from `/case-studies/_template.html`
   or `/factory-stories/_template.html`, using nothing beyond what this
   file confirms.
