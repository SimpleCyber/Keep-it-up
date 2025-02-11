const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

app.use(cors({
    origin: ['http://localhost:3000', 'https://keepitup.vercel.app'], // Corrected array format
    methods: ['GET', 'POST', 'DELETE', 'PUT']
}));
app.use(express.json());

let sites = [];


// Test API endpoint
app.get("/", (req, res) => {

    const routes = app._router.stack
      .filter((r) => r.route) // Only consider routes
      .map((r) => ({
        method: Object.keys(r.route.methods)[0].toUpperCase(),
        path: r.route.path,
      }));

    res.json({
        message: "Hello from Node.js backend!",
        Developer: "Satyam Babu",
        status: "success",
        message: "Hello from Node.js backend!",
        timestamp: new Date(),
        serverInfo: {
          port: PORT,
          environment: process.env.NODE_ENV || "development",
        },

        availableRoutes: routes
      });



      
  
    res.json({  });

});

// Add immediate URL check
async function wakeUpUrl(url) {
    try {
        const startTime = Date.now();
        await axios.get(url, { timeout: 8000 });
        return {
            responseTime: Date.now() - startTime,
            status: 'up'
        };
    } catch (error) {
        return {
            status: 'down',
            error: error.message
        };
    }
}

// Add status record with timestamp
function addStatusRecord(site, status) {
    if (!site.statusHistory) {
        site.statusHistory = [];
    }
    site.statusHistory.unshift({
        status,
        timestamp: new Date().toISOString()
    });
    site.statusHistory = site.statusHistory.slice(0, 10);
}

// Update site order
app.put('/api/sites/order', (req, res) => {
    const { siteOrder } = req.body;
    sites = siteOrder.map(orderedSite => {
        const site = sites.find(s => s.id === orderedSite.id);
        return { ...site, order: orderedSite.order };
    });
    res.json({ message: 'Order updated successfully' });
});

app.post('/api/add-site', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        try {
            new URL(url);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        // Immediate wake-up call
        console.log('Waking up URL:', url);
        const initialStatus = await wakeUpUrl(url);

        const newSite = {
            id: Date.now(),
            url,
            status: initialStatus.status,
            lastChecked: new Date().toISOString(),
            responseTime: initialStatus.responseTime,
            error: initialStatus.error,
            statusHistory: [],
            order: sites.length // Add order property
        };

        addStatusRecord(newSite, initialStatus.status);
        sites.push(newSite);
        res.json(newSite);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add site: ' + error.message });
    }
});

app.delete('/api/sites/:id', (req, res) => {
    const id = parseInt(req.params.id);
    sites = sites.filter(site => site.id !== id);
    res.json({ message: 'Site deleted successfully' });
});

app.get('/api/sites', (req, res) => {
    const sortedSites = [...sites].sort((a, b) => a.order - b.order);
    res.json(sortedSites);
});

async function checkSiteStatus(site) {
    const status = await wakeUpUrl(site.url);
    site.status = status.status;
    site.responseTime = status.responseTime;
    site.lastChecked = new Date().toISOString();
    site.error = status.error;
    addStatusRecord(site, status.status);
    return site;
}

// Check all sites every 30 seconds
const checkInterval = setInterval(async () => {
    for (const site of sites) {
        await checkSiteStatus(site);
    }
}, 30000);

process.on('SIGTERM', () => {
    clearInterval(checkInterval);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 