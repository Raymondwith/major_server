const mysql = require('mysql2/promise');

class PriceManager {
    constructor() {
        this.prices = new Map();
        this.adjustments = new Map();
        this.dbConfig = {
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'trading_db'
        };
    }

    // ✅ Separate init method to ensure proper async flow
    async init() {
        try {
            this.connection = await mysql.createConnection(this.dbConfig);
            console.log('Database connected successfully');

            await this.fetchAdjustments(); // Only call this once DB is ready
            setInterval(() => this.fetchAdjustments(), 60000); // Then repeat
        } catch (error) {
            console.error('Error initializing PriceManager:', error);
        }
    }

    async fetchAdjustments() {
        try {
            const [rows] = await this.connection.execute(
                'SELECT coin_symbol, adjustment_amount FROM admin_adjustment'
            );

            this.adjustments.clear();
            rows.forEach(row => {
                this.adjustments.set(row.coin_symbol, parseFloat(row.adjustment_amount));
            });

            console.log('Adjustments updated:', this.adjustments);
        } catch (error) {
            console.error('Error fetching adjustments:', error);
        }
    }

    updatePrices(priceData) {
        const { symbol, price, priceChange, priceChangePercent, timestamp } = priceData;

        const adjustment = this.adjustments.get(symbol) || 0;
        const adjustedPrice = price + adjustment;
        const adjustedFirstPrice = price - priceChange;

        const adjustedPriceChange = adjustedPrice - adjustedFirstPrice;
        const adjustedPriceChangePercent = adjustedFirstPrice !== 0
            ? (adjustedPriceChange / adjustedFirstPrice) * 100
            : 0;

        this.prices.set(symbol, {
            basePrice: price,
            adjustedPrice: adjustedPrice,
            priceChange: adjustedPriceChange,
            priceChangePercent: adjustedPriceChangePercent,
            timestamp,
            adjustment
        });
    }

    getAllPrices() {
        const prices = {};
        this.prices.forEach((value, key) => {
            prices[key] = {
                price: value.adjustedPrice,
                basePrice: value.basePrice,
                priceChange: value.priceChange,
                priceChangePercent: value.priceChangePercent,
                adjustment: value.adjustment,
                timestamp: value.timestamp
            };
        });
        return prices;
    }

    getPrice(symbol) {
        return this.prices.get(symbol);
    }

    getAdjustedPrice(symbol) {
        const price = this.prices.get(symbol.toUpperCase());
        return price ? price.adjustedPrice : undefined;
    }

    getAllAdjustedPrices() {
        const adjusted = {};
        for (const [symbol, data] of this.prices.entries()) {
            adjusted[symbol] = data.adjustedPrice;
        }
        return adjusted;
    }

    async close() {
        if (this.connection) {
            await this.connection.end();
        }
    }
}

module.exports = { PriceManager };



/*


const mysql = require('mysql2/promise');

class PriceManager {
    constructor() {
        this.prices = new Map();
        this.adjustments = new Map();
        this.dbConfig = {
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'trading_db'
        };
        
        

        // Initialize database connection
        this.initDatabase();
        
        // Fetch adjustments periodically
        this.fetchAdjustments();
        setInterval(() => this.fetchAdjustments(), 60000); // Update every minute
    }

    async initDatabase() {
        try {
            this.connection = await mysql.createConnection(this.dbConfig);
            console.log('Database connected successfully');
        } catch (error) {
            console.error('Database connection error:', error);
        }
    }

    async fetchAdjustments() {
        try {
            const [rows] = await this.connection.execute(
                'SELECT coin_symbol, adjustment_amount FROM admin_adjustment'
            );
            
            // Update adjustments map
            this.adjustments.clear();
            rows.forEach(row => {
                this.adjustments.set(row.coin_symbol, parseFloat(row.adjustment_amount));
            });
            
            console.log('Adjustments updated:', this.adjustments);
        } catch (error) {
            console.error('Error fetching adjustments:', error);
        }
    }




 
      updatePrices(priceData) {
    const { symbol, price, priceChange, priceChangePercent, timestamp } = priceData;
    
    // Get adjustment for this symbol
    const adjustment = this.adjustments.get(symbol) || 0;

    // Calculate adjusted price
    const adjustedPrice = price + adjustment;
    const adjustedFirstPrice = price - priceChange; // Recalculate original first price before adjustment
    
    // Recalculate price change and percentage change after applying adjustment
    const adjustedPriceChange = adjustedPrice - adjustedFirstPrice;
    const adjustedPriceChangePercent = adjustedFirstPrice !== 0
        ? (adjustedPriceChange / adjustedFirstPrice) * 100
        : 0; // Avoid division by zero

    // Store adjusted price details
    this.prices.set(symbol, {
        basePrice: price, // Original price without adjustment
        adjustedPrice: adjustedPrice, // Price after adjustment
        priceChange: adjustedPriceChange,
        priceChangePercent: adjustedPriceChangePercent, // Adjusted percentage change
        timestamp,
        adjustment
    });
}
  

/*
    updatePrices(priceData) {
        const { symbol, price, priceChange, priceChangePercent, timestamp } = priceData;
        
        // Get adjustment for this symbol
        const adjustment = this.adjustments.get(symbol) || 0;
        
        // Store price with adjustment
        this.prices.set(symbol, {
            basePrice: price,
            adjustedPrice: price + adjustment,
            priceChange,
            priceChangePercent,
            timestamp,
            adjustment
        });
    }
        



    getAllPrices() {
        const prices = {};
        this.prices.forEach((value, key) => {
            prices[key] = {
                price: value.adjustedPrice,
                basePrice: value.basePrice,
                priceChange: value.priceChange,
                priceChangePercent: value.priceChangePercent,
                adjustment: value.adjustment,
                timestamp: value.timestamp
            };
        });
        return prices;
    }

    getPrice(symbol) {
        return this.prices.get(symbol);
    }

    async close() {
        if (this.connection) {
            await this.connection.end();
        }
    }

// i just add the below code
    getAdjustedPrice(symbol) {
    const price = this.prices.get(symbol.toLowerCase());
    return price ? price.adjustedPrice : undefined;
}

// Get all coin symbols and their adjusted prices
getAllAdjustedPrices() {
    const adjusted = {};
    for (const [symbol, data] of this.prices.entries()) {
        adjusted[symbol] = data.adjustedPrice;
    }
    return adjusted;
}
}

// i just add this code 
// Get only the adjusted price for a specific coin symbol




module.exports = { PriceManager }; 

*/