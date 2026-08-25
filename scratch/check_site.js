async function main() {
  try {
    const res = await fetch('https://carryint.com/carryint-shipment-tracking/');
    const html = await res.text();
    console.log('HTML fetched successfully. Length:', html.length);
    
    // Check if there is handleCarryintTrack or similar
    const idx = html.indexOf('handleCarryintTrack');
    if (idx !== -1) {
      console.log('Found handleCarryintTrack at', idx);
      console.log(html.substring(idx - 100, idx + 1200));
    } else {
      console.log('handleCarryintTrack NOT found. Checking for ci-');
      const ciIdx = html.indexOf('carryint-tracking-widget');
      if (ciIdx !== -1) {
        console.log('Found widget at', ciIdx);
        console.log(html.substring(ciIdx, ciIdx + 1500));
      } else {
        console.log('Neither found in raw HTML. It might be loaded dynamically or in an iframe.');
      }
    }
  } catch (e) {
    console.error('Fetch error:', e);
  }
}

main();
