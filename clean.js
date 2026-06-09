const fs = require('fs');
let html = fs.readFileSync('stitch_landing.html', 'utf8');
html = html.replace(/src="data:image\/[^"]+"/g, 'src=""');
fs.writeFileSync('stitch_landing_clean.html', html);
