const API_KEY = 'sb_publishable_Oco4p6m_Ap_trLAcNev_gQ_XfEW1-ys';
const BASE_URL = 'https://beqyvmcizjlcmkpqdkio.supabase.co/rest/v1/invoices';

const headers = {
  'apikey': API_KEY,
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal'
};

function generateCaryAwb(existingAwbs) {
  let awb;
  do {
    const num = Math.floor(100000000 + Math.random() * 900000000);
    awb = `CARY-${num}`;
  } while (existingAwbs.has(awb));
  existingAwbs.add(awb);
  return awb;
}

async function run() {
  console.log('Fetching all invoices from Supabase...');
  const res = await fetch(`${BASE_URL}?select=*`, { headers });
  const invoices = await res.json();
  console.log(`Found ${invoices.length} invoices to update with CARY-000000000 AWBs.`);

  const existingAwbs = new Set();
  let updatedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < invoices.length; i++) {
    const inv = invoices[i];
    let items = inv.items;
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch(e) {}
    }

    if (!Array.isArray(items) || items.length === 0) {
      items = [{
        description: 'Logistics Shipment & Freight Services',
        quantity: 1,
        price: inv.totalAmount || 0,
        vatPercent: 0
      }];
    }

    const currentLogistics = (items[0] && items[0]._logistics) ? items[0]._logistics : {};
    const newAwb = generateCaryAwb(existingAwbs);

    const updatedLogistics = {
      ...currentLogistics,
      awbNumber: newAwb,
      carrier: currentLogistics.carrier || 'DHL Express',
      carrierTrackingNumber: currentLogistics.carrierTrackingNumber || undefined,
      shipmentStatus: currentLogistics.shipmentStatus || 'BOOKED',
      trackingEvents: currentLogistics.trackingEvents || []
    };

    items[0]._logistics = updatedLogistics;

    try {
      const patchRes = await fetch(`${BASE_URL}?id=eq.${inv.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ items })
      });

      if (patchRes.ok) {
        updatedCount++;
        if (updatedCount % 20 === 0 || updatedCount === invoices.length) {
          console.log(`Progress: ${updatedCount}/${invoices.length} invoices updated.`);
        }
      } else {
        const errTxt = await patchRes.text();
        console.error(`Failed to update ${inv.id} (${inv.invoiceNumber}):`, errTxt);
        errorCount++;
      }
    } catch (err) {
      console.error(`Network error on ${inv.id}:`, err);
      errorCount++;
    }
  }

  console.log(`\n=== Migration Complete ===`);
  console.log(`Successfully updated: ${updatedCount}`);
  console.log(`Errors: ${errorCount}`);
}

run();
