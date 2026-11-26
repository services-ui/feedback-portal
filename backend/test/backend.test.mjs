/**
 * Backend logic tests — runs the real Code.gs against mocked Apps Script services.
 *   node --test backend/test/
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { createSandbox } from './gas-sandbox.mjs'

const valid = (over = {}) => ({
  submissionId: 'a1b2c3d4-0000-4000-8000-000000000001',
  clientName: 'Ananya Sharma',
  mobile: '98765 43210',
  advisory: { rating: 5, reasons: [], comment: '' },
  services: { rating: 4, reasons: [], comment: 'Quick responses' },
  product: { rating: 2, reasons: ['I wanted more product options'], comment: '' },
  meta: { hp: '', elapsedMs: 30000, client: 'test' },
  ...over,
})

test('setup creates a formatted Feedback sheet with A–M headers (+ hidden ID column)', () => {
  const sb = createSandbox()
  sb.context.setup()
  const rows = sb.feedbackRows()
  assert.deepEqual(rows[0].slice(0, 13), [
    'Timestamp', 'Client Name', 'Mobile Number',
    'Advisory Rating', 'Advisory Reason', 'Advisory Comments',
    'Services & Communication Rating', 'Services Reason', 'Services Comments',
    'Product Suitability Rating', 'Product Reason', 'Product Comments',
    'Overall Submission Status',
  ])
  assert.equal(rows[0][13], 'Submission ID')
  assert.ok(sb.spreadsheet.getSheetByName('Feedback').hidden.has(14))
})

test('GET is a health check', () => {
  assert.deepEqual(createSandbox().get().status, 'ready')
})

test('valid submission appends exactly one well-formed row', () => {
  const sb = createSandbox()
  sb.context.setup()
  const res = sb.post(valid())
  assert.equal(res.ok, true)
  assert.equal(res.status, 'success')
  const rows = sb.feedbackRows()
  assert.equal(rows.length, 2)
  const r = rows[1]
  assert.ok(r[0] instanceof Date || Object.prototype.toString.call(r[0]) === '[object Date]', 'server timestamp')
  assert.equal(r[1], 'Ananya Sharma')
  assert.equal(r[2], "'+919876543210", 'normalised mobile, forced to text')
  assert.equal(r[3], 5)
  assert.equal(r[4], '')
  assert.equal(r[6], 4)
  assert.equal(r[8], 'Quick responses')
  assert.equal(r[9], 2)
  assert.equal(r[10], 'I wanted more product options')
  assert.equal(r[12], 'Needs Follow-up')
  assert.equal(r[13], 'a1b2c3d4-0000-4000-8000-000000000001')
})

test('all ratings ≥ 4 → status Positive; empty mobile is allowed', () => {
  const sb = createSandbox()
  const res = sb.post(valid({ mobile: '', product: { rating: 4, reasons: [], comment: '' } }))
  assert.equal(res.ok, true)
  const r = sb.feedbackRows()[1]
  assert.equal(r[2], '')
  assert.equal(r[12], 'Positive')
})

test('reasons are dropped for ratings ≥ 4 even if sent', () => {
  const sb = createSandbox()
  sb.post(valid({ advisory: { rating: 5, reasons: ['Insufficient follow-up'], comment: '' } }))
  assert.equal(sb.feedbackRows()[1][4], '')
})

test('duplicate submissionId is acknowledged but not written twice (cache and sheet paths)', () => {
  const sb = createSandbox()
  assert.equal(sb.post(valid()).ok, true)
  const again = sb.post(valid())
  assert.equal(again.ok, true)
  assert.equal(again.duplicate, true)
  sb.clearCache() // e.g. cache evicted — the sheet lookup must still catch it
  assert.equal(sb.post(valid()).duplicate, true)
  assert.equal(sb.feedbackRows().length, 2)
})

test('rejects: missing name, bad mobile, non-integer rating, missing reason, unknown reason, Other without comment', () => {
  const sb = createSandbox()
  const cases = [
    [valid({ clientName: '   ' }), /name/i],
    [valid({ clientName: '=HYPERLINK("x")' }), /letters/i],
    [valid({ mobile: '12345' }), /mobile/i],
    [valid({ advisory: { rating: 4.5, reasons: [], comment: '' } }), /whole number/i],
    [valid({ advisory: { rating: 0, reasons: [], comment: '' } }), /whole number/i],
    [valid({ advisory: { rating: '5', reasons: [], comment: '' } }), /whole number/i],
    [valid({ services: { rating: 3, reasons: [], comment: '' } }), /select a reason/i],
    [valid({ services: { rating: 1, reasons: ['Made up'], comment: '' } }), /not recognised/i],
    [valid({ product: { rating: 2, reasons: ['Other'], comment: ' ' } }), /Other/],
    [valid({ product: undefined }), /rating is required/i],
    [valid({ submissionId: 'x' }), /submission reference/i],
  ]
  for (const [payload, re] of cases) {
    const res = sb.post(payload)
    assert.equal(res.ok, false, JSON.stringify(payload))
    assert.equal(res.code, 'VALIDATION_FAILED')
    assert.match(res.errors.join(' | '), re)
  }
  assert.equal(sb.feedbackRows().length <= 1, true, 'nothing written')
})

test('malformed bodies return structured errors', () => {
  const sb = createSandbox()
  assert.equal(sb.post('not json').code, 'BAD_JSON')
  assert.equal(sb.post('[]').code, 'BAD_JSON')
  assert.equal(sb.post('x'.repeat(25000)).code, 'TOO_LARGE')
  assert.equal(JSON.parse(sb.context.doPost({}).getContent()).code, 'EMPTY_BODY')
})

test('sanitises: control chars stripped, formula-leading comments neutralised, Other + comment accepted', () => {
  const sb = createSandbox()
  const res = sb.post(
    valid({
      clientName: '  Ravi\u0000   Kumar ',
      product: { rating: 1, reasons: ['Other', 'I wanted more product options'], comment: '=IMPORTXML("http://evil")\n\n\n\nmore' },
    }),
  )
  assert.equal(res.ok, true)
  const r = sb.feedbackRows()[1]
  assert.equal(r[1], 'Ravi Kumar')
  assert.equal(r[10], 'I wanted more product options; Other', 'canonical order')
  assert.ok(r[11].startsWith("'="), 'formula neutralised')
  assert.ok(!r[11].includes('\n\n\n'), 'newline runs collapsed')
})

test('honeypot submissions are acknowledged but not stored', () => {
  const sb = createSandbox()
  const res = sb.post(valid({ meta: { hp: 'http://spam', elapsedMs: 100 } }))
  assert.equal(res.ok, true)
  assert.equal(sb.feedbackRows().length, 0)
})
