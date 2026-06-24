import { mkdir, readFile, writeFile } from 'node:fs/promises'

const slidesPath = new URL('../slides.md', import.meta.url)
const distPath = new URL('../dist/', import.meta.url)
const basePath = `${process.env.BASE_PATH || '/'}`.replace(/\/?$/, '/')

const slides = await readFile(slidesPath, 'utf8')
const markerCount = slides
  .split(/\r?\n/)
  .filter((line) => line.trim() === '---').length
const slideCount = Math.floor(markerCount / 2)

if (slideCount < 1) {
  throw new Error(`Could not infer slide count from ${slidesPath.pathname}`)
}

for (let slide = 1; slide <= slideCount; slide += 1) {
  const dir = new URL(`${slide}/`, distPath)
  const target = `${basePath}#/${slide}`
  await mkdir(dir, { recursive: true })
  await writeFile(
    new URL('index.html', dir),
    `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=${target}">
<title>Redirecting...</title>
<script>
location.replace(new URL('${target}', location.href).href)
</script>
</head>
<body>
<a href="${target}">Redirecting to slide ${slide}</a>
</body>
</html>
`,
  )
}

console.log(`Created ${slideCount} slide redirect routes.`)
