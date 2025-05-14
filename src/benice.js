const WebSocket = require('ws');
const EventEmitter = require('events');

class BinanceManager extends EventEmitter {
    constructor() {
        super();
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 5000; // 5 seconds
        this.priceHistory = new Map(); // Store 24h price history
        
        // Updated symbols list to match exact pairs
        this.symbols = [
            'btcusdt',    // BTC/USDT
            'ethusdt',    // ETH/USDT
            'solusdt',    // SOL/USDT
            'bnbusdt',    // BNB/USDT
            'trxusdt',    // TRX/USDT
            'dogeusdt',   // DOGE/USDT
            'adausdt',    // ADA/USDT
            'xrpusdt',    // XRP/USDT
            'avaxusdt',   // AVAX/USDT
            'maticusdt',  // MATIC/USDT
            'dotusdt',    // DOT/USDT
            'shibusdt',   // SHIB/USDT
            'daiusdt',    // DAI/USDT
            'linkusdt',   // LINK/USDT
            'ltcusdt',    // LTC/USDT
            'uniusdt',    // UNI/USDT
            'bchusdt',    // BCH/USDT
            'xlmusdt'     // XLM/USDT
        ];
        
        this.connect();
    }

    connect() {
        // Create WebSocket connection to Binance using kline_1s stream
        const streams = this.symbols.map(symbol => `${symbol}@kline_1s`).join('/');
        this.ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

        this.ws.on('open', () => {
            console.log('Connected to Binance WebSocket');
            this.reconnectAttempts = 0;
        });

        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                if (message.data) {
                    const prices = this.processKlineUpdate(message.data);
                    if (prices) {
                        this.emit('priceUpdate', prices);
                    }
                }
            } catch (error) {
                console.error('Error processing Binance message:', error);
            }
        });

        this.ws.on('close', () => {
            console.log('Binance WebSocket connection closed');
            this.handleReconnect();
        });

        this.ws.on('error', (error) => {
            console.error('Binance WebSocket error:', error);
            this.handleReconnect();
        });
    }

    processKlineUpdate(data) {
        // Extract symbol without USDT suffix for consistency
        const symbol = data.s.replace('USDT', '').toUpperCase();
        
        // Only process if the candle is closed
        if (!data.k.x) return null;

        // Get or initialize price history for this symbol
        if (!this.priceHistory.has(symbol)) {
            this.priceHistory.set(symbol, {
                firstPrice: parseFloat(data.k.o),
                lastPrice: parseFloat(data.k.c),
                high: parseFloat(data.k.h),
                low: parseFloat(data.k.l),
                volume: parseFloat(data.k.v)
            });
        }

        const history = this.priceHistory.get(symbol);
        
        // Update price history
        history.lastPrice = parseFloat(data.k.c);
        history.high = Math.max(history.high, parseFloat(data.k.h));
        history.low = Math.min(history.low, parseFloat(data.k.l));
        history.volume += parseFloat(data.k.v);

        // Calculate price change and percentage
        const priceChange = history.lastPrice - history.firstPrice;
        const priceChangePercent = (priceChange / history.firstPrice) * 100;

        return {
            [symbol]: {
                price: history.lastPrice,
                priceChange: priceChange,
                priceChangePercent: priceChangePercent,
                high: history.high,
                low: history.low,
                volume: history.volume,
                timestamp: data.E
            }
        };
    }

    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => this.connect(), this.reconnectDelay);
        } else {
            console.error('Max reconnection attempts reached');
            // Implement additional error handling or notification here
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

const binanceSocket = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');

binanceSocket.on('open', () => {
  console.log('Connected to Binance WebSocket');
});

binanceSocket.on('message', (data) => {
  const trade = JSON.parse(data);
  console.log(`Price: ${trade.p}`);
});

binanceSocket.on('error', (err) => {
  console.error('Binance WebSocket error:', err);
});

binanceSocket.on('close', () => {
  console.log('Binance WebSocket closed');
});

module.exports = { BinanceManager }; 

module.exports = { BinanceManager }; 
