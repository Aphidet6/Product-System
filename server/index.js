const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { db, ready } = require('./products.db');
const productsRouter = require('./products.router');
const auth = require('./auth');

const app = express();
app.use(cors());
app.use(express.json());
// Simple request logger to help debug mobile/LAN requests
app.use((req, res, next) => {
	try {
		const ip = req.ip || req.connection && req.connection.remoteAddress || req.socket && req.socket.remoteAddress || 'unknown'
		console.log(`[${new Date().toISOString()}] ${ip} ${req.method} ${req.url}`)
	} catch (e) {}
	next()
})
// serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve built client (if present) so the app can be accessed from other devices on the LAN.
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
	app.use(express.static(clientDist));
	// For SPA client routes (anything not starting with /api) return index.html
	app.get(/^\/(?!api).*/, (req, res) => {
		res.sendFile(path.join(clientDist, 'index.html'));
	});
}

app.get('/', (req, res) => res.json({ ok: true, msg: 'Product API' }));

const port = process.env.PORT || 4000;

ready.then(async () => {
	// Mount router after DB is initialized
	app.use('/api/auth', auth.router);
	app.use('/api/products', productsRouter);
	// users management (master-only for changes)
	const usersRouter = require('./users.router')
	app.use('/api/users', usersRouter)

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
