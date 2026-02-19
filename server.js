const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.json': 'application/json'
};

const server = http.createServer((req, res) => {
    let urlPath = req.url === '/' ? '/index.html' : req.url;
    let filePath = path.join(__dirname, 'public', urlPath);

    // Safety check for directory traversal
    if (!filePath.startsWith(path.join(__dirname, 'public'))) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    const checkAndServe = (p, isFallback = false) => {
        fs.stat(p, (err, stats) => {
            if (err || !stats.isFile()) {
                // If the path isn't a file (like /catalog), serve the root index.html for SPA
                return serveFile(path.join(__dirname, 'public', 'index.html'));
            } else {
                serveFile(p);
            }
        });
    };

    const serveFile = (p) => {
        const ext = path.extname(p).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        fs.readFile(p, (error, content) => {
            if (error) {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    };

    checkAndServe(filePath);
});

server.listen(PORT, () => {
    console.log(`
    ================================================
    🚀 Aquaterra E-commerce Prototype is running!
    🔗 URL: http://localhost:${PORT}
    🏠 Mode: Native Node Server (No dependencies)
    ================================================
    `);
});
