# Mahir Jawad — portfolio

Personal site for Md Mahir Jawad (Machine Learning Engineer, NLP researcher).
Live: https://portfolio-new-taupe-mu-41.vercel.app

Plain HTML, CSS and JavaScript — no framework and no build step. Vercel serves the folder as-is.

```
index.html               all page content
assets/css/styles.css    layout + light/dark theme tokens
assets/js/main.js        theme toggle, mobile menu, active nav, scroll reveal, copy email
assets/img/              portrait, social preview image, favicon
assets/Mahir_Jawad_CV.pdf  file behind every "Download CV" button
```

## Updating content

- Text lives directly in `index.html`, one `<section>` per nav item.
- To refresh the CV, replace `assets/Mahir_Jawad_CV.pdf` (keep the file name).
- A new publication is a copy of an existing `<article class="card pub">` block inside the right year.

## Preview locally

```
python -m http.server 8000
```

then open http://localhost:8000.
