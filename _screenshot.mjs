import { chromium } from 'playwright-chromium'

// Check every slide by default, or a comma-separated subset via SLIDES=9,16,25.
const slides = process.env.SLIDES
  ? process.env.SLIDES.split(',').map(Number)
  : Array.from({ length: 53 }, (_, i) => i + 1)
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
const page = await ctx.newPage()

const overflows = []
for (const n of slides) {
  try {
    await page.goto(`http://localhost:3030/${n}?t=${Date.now()}`, { waitUntil: 'networkidle', timeout: 20000 })
  } catch {
    console.log(`skip ${n} (timeout)`)
    continue
  }
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `/tmp/slide-${String(n).padStart(2, '0')}.png`, fullPage: false })
  const probe = await page.evaluate(() => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const issues = []
    document.querySelectorAll('.slidev-layout *, .slidev-page *').forEach((el) => {
      const er = el.getBoundingClientRect()
      if (er.width < 5 || er.height < 5) return
      if (el.closest('.slidev-code-copy')) return
      const overBottom = er.bottom > vh + 4
      const overRight = er.right > vw + 4
      const overTop = er.top < -4
      const overLeft = er.left < -4
      if (overBottom || overRight || overTop || overLeft) {
        const t = (el.textContent || '').trim().slice(0, 50).replace(/\s+/g, ' ')
        if (!t) return
        const dirs = (overBottom ? 'B' : '') + (overRight ? 'R' : '') + (overTop ? 'T' : '') + (overLeft ? 'L' : '')
        issues.push(`${dirs} R${Math.round(er.right)}/B${Math.round(er.bottom)}: ${t}`)
      }
    })
    return { vw, vh, issues: issues.slice(0, 3) }
  })
  if (probe.issues && probe.issues.length) {
    overflows.push({ n, issues: probe.issues })
    console.log(`OVERFLOW slide ${n}: ${probe.issues.length}`)
  } else {
    console.log(`ok ${n}`)
  }
}
console.log('---SUMMARY---')
console.log(JSON.stringify(overflows, null, 2))
await browser.close()
