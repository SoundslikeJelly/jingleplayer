const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname.startsWith('/play/')) {
    const naam = path.basename(decodeURIComponent(url.pathname.slice(6)));
    console.log('play', naam, '- verbonden toestellen:', wss.clients.size);
    wss.clients.forEach(c => {
      if (c.readyState === 1) c.send(naam);
    });
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok: ' + naam + ' (' + wss.clients.size + ' toestellen verbonden)');

  } else if (url.pathname.startsWith('/jingles/')) {
    const naam = path.basename(decodeURIComponent(url.pathname.slice(9)));
    const bestand = path.join(__dirname, 'jingles', naam);
    if (fs.existsSync(bestand)) {
      res.writeHead(200, { 'Content-Type': 'audio/mpeg' });
      fs.createReadStream(bestand).pipe(res);
    } else {
      res.writeHead(404);
      res.end();
    }

  } else if (url.pathname === '/lijst') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(
      fs.readdirSync(path.join(__dirname, 'jingles')).filter(f => f.toLowerCase().endsWith('.mp3'))
    ));

  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(path.join(__dirname, 'index.html')).pipe(res);
  }
});

const wss = new WebSocketServer({ server });

wss.on('connection', ws => {
  console.log('toestel verbonden - totaal:', wss.clients.size);
  ws.on('close', () => console.log('toestel weg - totaal:', wss.clients.size));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log('Klaar op poort ' + PORT));

// Houdt verbindingen open op online diensten
setInterval(() => wss.clients.forEach(c => c.ping()), 30000);
