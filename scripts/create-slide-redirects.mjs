import { copyFile, mkdir, readFile } from 'node:fs/promises'

const slidesPath = new URL('../slides.md', import.meta.url)
const distPath = new URL('../dist/', import.meta.url)
const indexPath = new URL('index.html', distPath)

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
  await mkdir(dir, { recursive: true })
  await copyFile(indexPath, new URL('index.html', dir))
}

console.log(`Created ${slideCount} slide routes.`)
