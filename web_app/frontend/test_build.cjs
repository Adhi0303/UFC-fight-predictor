const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const distPath = path.join(__dirname, 'dist');
const htmlPath = path.join(distPath, 'index.html');

if (!fs.existsSync(htmlPath)) {
    console.error("No dist/index.html found!");
    process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');

const dom = new JSDOM(html, {
    url: "http://localhost:3000/",
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
    beforeParse(window) {
        // Intercept console errors
        window.console.error = function(...args) {
            console.log("[JSDOM ERROR]", ...args);
        };
        // Intercept uncaught exceptions
        window.addEventListener('error', (event) => {
            console.log("[JSDOM UNCAUGHT]", event.error.message);
            console.log(event.error.stack);
            
            // Try to map it using source-map
            const stack = event.error.stack;
            // We'll parse this stack trace locally if needed
        });
        
        // Mock fetch
        window.fetch = async () => ({
            json: async () => ({ fighters: [], status: 'success' }),
            ok: true
        });
    }
});

// Since the JS files are local, JSDOM needs to be able to read them from the filesystem.
// JSDOM resources="usable" handles <script src="..."> if the URL is mapped correctly,
// but usually it requires a local server or file:// URL.
// Let's manually inject the compiled JS!

setTimeout(() => {
    const jsFiles = fs.readdirSync(path.join(distPath, 'assets')).filter(f => f.endsWith('.js'));
    for (const file of jsFiles) {
        const js = fs.readFileSync(path.join(distPath, 'assets', file), 'utf8');
        const script = dom.window.document.createElement("script");
        script.type = "module";
        script.textContent = js;
        dom.window.document.body.appendChild(script);
    }
}, 500);

setTimeout(() => {
    console.log("Done waiting.");
    process.exit(0);
}, 3000);
