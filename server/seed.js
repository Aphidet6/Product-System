const { db, ready } = require('./products.db');
const { nanoid } = require('nanoid');

async function seed() {
  await ready;
  const existing = db.data && db.data.products ? db.data.products : [];
  const toAdd = [
    { name: 'Brass Pocket Watch', number: 'ANT-001', description: 'A 19th-century brass pocket watch once carried by a railway conductor; precision-crafted escapement and engraved case tell the story of early industrial timekeeping.', image: 'https://via.placeholder.com/300x200?text=Brass+Pocket+Watch' },
    { name: 'Victorian Writing Desk', number: 'ANT-002', description: 'An elegant Victorian-era writing desk with inlaid mahogany and a secret compartment used by a local author; it reflects the domestic craftsmanship of the period.', image: 'https://via.placeholder.com/300x200?text=Victorian+Writing+Desk' },
    { name: 'Porcelain Tea Set', number: 'ANT-003', description: 'A hand-painted porcelain tea set from the late 1800s, featuring floral motifs; tea drinking rituals became fashionable across classes during the era.', image: 'https://via.placeholder.com/300x200?text=Porcelain+Tea+Set' }
  ];

  toAdd.forEach(p => {
    if (!existing.find(e => e.number === p.number)) {
      existing.push({ id: nanoid(), ...p });
    }
  });

  db.data = { products: existing };
  await db.write();
  console.log('Seeded additional products.');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1) });
