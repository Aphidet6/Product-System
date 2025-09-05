const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');
const dbFile = path.join(__dirname, 'products.json');

const adapter = new JSONFile(dbFile);
const db = new Low(adapter);

async function init() {
  await db.read();
  // Only initialize and write the file if there's no data yet.
  if (!db.data) {
    db.data = { products: [
  { id: 'p1', name: 'Brass Pocket Watch', number: 'ANT-001', description: 'A 19th-century brass pocket watch once carried by a railway conductor; precision-crafted escapement and engraved case tell the story of early industrial timekeeping.', image: 'https://via.placeholder.com/300x200?text=Brass+Pocket+Watch', status: 'Available', price: 1200 },
  { id: 'p2', name: 'Victorian Writing Desk', number: 'ANT-002', description: 'An elegant Victorian-era writing desk with inlaid mahogany and a secret compartment used by a local author; it reflects the domestic craftsmanship of the period.', image: 'https://via.placeholder.com/300x200?text=Victorian+Writing+Desk', status: 'Available', price: 2500 },
  { id: 'p3', name: 'Porcelain Tea Set', number: 'ANT-003', description: 'A hand-painted porcelain tea set from the late 1800s, featuring floral motifs; tea drinking rituals became fashionable across classes during the era.', image: 'https://via.placeholder.com/300x200?text=Porcelain+Tea+Set', status: 'Available', price: 450 },
  { id: 'p4', name: 'Antique Sextant', number: 'ANT-004', description: 'A brass sextant used for navigation at sea during the Age of Sail; instruments like this enabled long voyages and global trade expansion.', image: 'https://via.placeholder.com/300x200?text=Antique+Sextant', status: 'Available', price: 800 },
  { id: 'p5', name: 'Edwardian Portrait Frame', number: 'ANT-005', description: 'A gilded Edwardian frame that once held a family portrait; frames of this style reflect late-Victorian decorative tastes and photography\'s rise.', image: 'https://via.placeholder.com/300x200?text=Edwardian+Frame', status: 'Available', price: 300 },
  { id: 'p6', name: 'Cast-Iron Boot Jack', number: 'ANT-006', description: 'A utilitarian cast-iron boot jack from a rural 19th-century household; simple tools like this reveal everyday life before mass convenience goods.', image: 'https://via.placeholder.com/300x200?text=Boot+Jack', status: 'Available', price: 75 },
  { id: 'p7', name: 'Art Nouveau Lamp', number: 'ANT-007', description: 'A decorative Art Nouveau lamp with flowing lines and colored glass; the lamp style represents the turn-of-the-century embrace of organic forms in design.', image: 'https://via.placeholder.com/300x200?text=Art+Nouveau+Lamp', status: 'Available', price: 420 },
  { id: 'p8', name: 'Leather-bound Atlas', number: 'ANT-008', description: 'A late-19th-century leather-bound atlas containing hand-drawn maps; atlases like this capture the contemporary understanding of geography and empire.', image: 'https://via.placeholder.com/300x200?text=Leather+Atlas', status: 'Available', price: 150 },
  { id: 'p9', name: 'Phonograph Cylinder', number: 'ANT-009', description: 'An early phonograph cylinder used to play recorded sound at the dawn of recorded music; such cylinders preserve the voices and songs of their time.', image: 'https://via.placeholder.com/300x200?text=Phonograph+Cylinder', status: 'Available', price: 95 },
  { id: 'p10', name: 'Hand-blown Glass Bottle', number: 'ANT-010', description: 'A 19th-century hand-blown bottle with pontil mark; bottles were commonly reused and offer insight into early glassmaking techniques.', image: 'https://via.placeholder.com/300x200?text=Glass+Bottle', status: 'Available', price: 60 }
    ] };
    await db.write();
  }
}

// Export a ready promise so callers can wait until DB is loaded.
const ready = init();

module.exports = { db, ready };
