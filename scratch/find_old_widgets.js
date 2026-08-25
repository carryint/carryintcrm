async function main() {
  const res = await fetch('https://carryint.com/carryint-shipment-tracking/');
  const html = await res.text();
  
  const searchTerms = ['SHIPMENT QUERY', 'Carrier Logistics', 'Verified Shipment', 'Open Official Live Carrier Logistics Tracking'];
  for (const term of searchTerms) {
    const idx = html.indexOf(term);
    if (idx !== -1) {
      console.log(`Found "${term}" at index ${idx}`);
      console.log(html.substring(Math.max(0, idx - 200), Math.min(html.length, idx + 400)));
      console.log('-----------------------------------------');
    } else {
      console.log(`"${term}" NOT found in current live page source.`);
    }
  }
}
main();
