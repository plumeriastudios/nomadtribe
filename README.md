```markdown
# WanderWithMe — Static Site with Responsive Carousel

What's included
- index.html — main page with the carousel wired to local responsive images.
- styles.css — styles (uses the color mapping you provided).
- script.js — carousel interaction and indicators.
- package.json + scripts/build-images.js — small Node script (sharp) to generate JPEG + WebP responsive sizes.
- images/ (not included) — you will add originals to images/originals/.

Quick start (local images)
1. Clone or copy these files into a folder.
2. Add your high-resolution originals to images/originals/.
   - Recommended filenames: anything.jpg (the build script will enumerate them and output photo1-*.jpg, photo2-*.jpg...).
   - Prefer larger originals (2000–4000 px) for best quality when resizing.
3. Install dependencies:
   - Ensure Node.js (>=14) is installed.
   - Run: npm install
4. Build responsive images:
   - Run: npm run build-images
   - This creates images/photo1-400.jpg, photo1-800.jpg, photo1-1600.jpg and matching .webp files for each original.
5. Preview:
   - Open index.html in your browser, or run a simple static server:
     - Python: python -m http.server 8000
     - Node (npm): npx serve .
     - Or use VSCode Live Server extension.

Notes & tips
- If you have many images or high traffic, consider hosting images on a CDN (Cloudinary, S3 + CloudFront, Imgix) and update the src/srcset URLs in index.html accordingly.
- The build script names outputs photo1, photo2... depending on the order of files in images/originals/. If you want specific ordering, prefix filenames with numbers: 01-beach.jpg, 02-balloon.jpg, etc.
- For best results: remove EXIF if not needed and verify orientation. The script uses sharp().rotate() to honor orientation metadata.
- If you use GitHub, avoid committing large images directly. Use Git LFS for many/big images, or host them externally.

If you'd like, I can:
- Swap the carousel to read images dynamically (generate carousel HTML automatically) — I can provide a small script to inject <picture> entries into index.html based on the generated files.
- Add autoplay with accessible pause/resume controls.
- Convert this into an Eleventy/Hugo/Jekyll template if you want blog pages and templates wired up.

```