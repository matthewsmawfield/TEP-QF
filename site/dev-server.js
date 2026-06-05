#!/usr/bin/env node
const chokidar = require('chokidar');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { buildStaticSite } = require('./build.js');
const { HTMLToMarkdownConverter } = require('./html-to-markdown.js');

class DevServer {
    constructor() {
        this.isBuilding = false;
        this.buildQueue = false;
        this.server = null;
        this.port = 51805; // Unique port for TEP-QF
    }

    async startLiveServer() {
        console.log('🚀 Starting static server...');
        if (this.server) this.server.close();
        this.server = http.createServer((req, res) => {
            const filePath = path.join(__dirname, 'dist', req.url === '/' ? 'index.html' : req.url);
            const ext = path.extname(filePath);
            const mime = {
                '.html': 'text/html', '.js': 'application/javascript',
                '.css': 'text/css', '.json': 'application/json',
                '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
                '.pdf': 'application/pdf'
            };
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.writeHead(404); res.end('Not found');
                } else {
                    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
                    res.end(data);
                }
            });
        });
        this.server.listen(this.port, () => {
            console.log(`📡 Static server running at http://localhost:${this.port}`);
        }).on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ Port ${this.port} is already in use. Please stop the other server or change the port.`);
                process.exit(1);
            } else {
                console.error('❌ Server error:', err.message);
                process.exit(1);
            }
        });
    }

    async build() {
        if (this.isBuilding) { this.buildQueue = true; return; }
        this.isBuilding = true;
        console.log('\n🔄 Rebuilding site...');
        try {
            await buildStaticSite();
            console.log('📝 Generating markdown...');
            const converter = new HTMLToMarkdownConverter();
            await converter.convertSiteToMarkdown();
            console.log('✅ Build & Markdown complete!');
            if (this.buildQueue) {
                this.buildQueue = false;
                setTimeout(() => { this.isBuilding = false; this.build(); }, 100);
                return;
            }
        } catch (e) { console.error('❌ Build failed:', e.message); }
        this.isBuilding = false;
    }

    async start() {
        console.log('🎯 TEP-QF Development Server');
        const distDir = path.join(__dirname, 'dist');
        if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
        await this.build();
        await this.startLiveServer();
        
        const watcher = chokidar.watch([
            path.join(__dirname, 'components'),
            path.join(__dirname, 'index.html'),
            path.join(__dirname, 'manifest.json'),
            path.join(__dirname, 'figures')
        ], { ignored: ['dist/**'], persistent: true, ignoreInitial: true });

        watcher.on('change', () => this.build());
        watcher.on('add', () => this.build());
        console.log(`\n🌐 Server running at: http://localhost:${this.port}`);
    }
}

if (require.main === module) { const s = new DevServer(); s.start(); }
module.exports = DevServer;
