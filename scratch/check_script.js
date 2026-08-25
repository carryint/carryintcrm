async function main() {
  const res = await fetch('https://carryint.com/carryint-shipment-tracking/');
  const html = await res.text();
  const scriptIdx = html.indexOf('function handleCarryintTrack');
  if (scriptIdx !== -1) {
    console.log('--- ACTUAL JAVASCRIPT ON LIVE WEBSITE ---');
    console.log(html.substring(scriptIdx, scriptIdx + 4000));
  } else {
    console.log('function handleCarryintTrack not found');
  }
}
main();
