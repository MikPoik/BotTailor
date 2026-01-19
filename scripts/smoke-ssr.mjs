import fetch from 'node-fetch';

const url = process.env.URL || 'http://localhost:5000/pricing';

(async () => {
  try {
    const res = await fetch(url);
    const text = await res.text();

    const ok = text.includes('<div id="root">') && /Pricing|pricing/i.test(text);

    if (ok) {
      console.log('✅ OK: SSR output looks valid for', url);
      process.exit(0);
    } else {
      console.error('❌ FAIL: SSR output missing expected content for', url);
      console.log('--- head of response ---');
      console.log(text.slice(0, 1000));
      process.exit(2);
    }
  } catch (err) {
    console.error('❌ ERROR: Request failed', err);
    process.exit(3);
  }
})();