const http = require('http');
const WebSocket = require('ws');
const { BinanceManager } = require('./src/benice');
const { PriceManager } = require('./src/priceManager');

(async () => {
    const priceManager = new PriceManager();
    await priceManager.init();

    const binanceManager = new BinanceManager();

    // Create HTTP server
    const server = http.createServer((req, res) => {
        const url = new URL(req.url, `http://${req.headers.host}`);

       if (req.method === 'GET' && url.pathname.startsWith('/price/')) {
    const symbol = url.pathname.split('/').pop().toLowerCase();

    // Hardcode stablecoin prices
        if (symbol === 'usdt' || symbol === 'dai') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', symbol, price: 1.00 }));
                return;
            }

            const price = priceManager.getAdjustedPrice(symbol);
            if (price !== undefined) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', symbol, price }));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: 'Symbol not found' }));
            }
        }


        else if (req.method === 'GET' && url.pathname === '/prices') {
            const prices = priceManager.getAllAdjustedPrices();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'success', prices }));
        }

        else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    });

    // Create WebSocket server
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        console.log('New client connected');

        // Send initial prices
        ws.send(JSON.stringify({
            type: 'initial_prices',
            data: priceManager.getAllPrices()
        }));

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                console.log('Received:', data);
            } catch (error) {
                console.error('Error processing message:', error);
            }
        });

        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });

    // Handle Binance price updates
    binanceManager.on('priceUpdate', (prices) => {
        for (const [symbol, priceData] of Object.entries(prices)) {
            priceManager.updatePrices({ symbol, ...priceData });
        }

        const updatedPrices = priceManager.getAllPrices();
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'price_update',
                    data: updatedPrices
                }));
            }
        });
    });

    server.listen(8080, () => {
        console.log('HTTP and WebSocket server running on port 8080');
    });

})();
