const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, ready } = require('./products.db');
const productsRouter = require('./products.router');

const app = express();
app.use(cors());
app.use(express.json());
// serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => res.json({ ok: true, msg: 'Product API' }));

const port = process.env.PORT || 4000;

ready.then(async () => {
	// Mount router after DB is initialized
	app.use('/api/products', productsRouter);

		// Start server on IPv4 any and log the actual address/port
		const server = app.listen(port, '0.0.0.0', () => {
			const addr = server.address();
			if (addr && typeof addr === 'object') {
				console.log(`Server listening on ${addr.address}:${addr.port}`);
			} else {
				console.log(`Server listening on ${port}`);
			}
		});
		server.on('error', (err) => {
			console.error('Server failed to start', err);
			process.exit(1);
		});

}).catch(err => {
	console.error('Failed to initialize DB', err);
	process.exit(1);
});
