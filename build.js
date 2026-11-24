// Genera index.html (un solo archivo, funciona sin internet) a partir de src/.
// Uso: npm install && npm run build
const fs=require('fs'), {execSync}=require('child_process'), K='node_modules/katex/dist/', S='src/';
const game=fs.readdirSync(S+'game').filter(f=>f.endsWith('.js')).sort().map(f=>fs.readFileSync(S+'game/'+f,'utf8')).join('\n');
const gameModule = (exports) => `\n/* ===== Juego: módulo aislado ===== */\nconst DefensaAlgebraica = (() => {\n${game}\nreturn { ${exports} };\n})();\n`;
const app=['expr.js','data-integral.js','data-fund.js','data-dif.js','data-dict.js','logic.js','lego.js'].map(f=>fs.readFileSync(S+f,'utf8')).join('\n')
  + gameModule('GameApp, TableroPiezas');
fs.writeFileSync('.tw-in.css',`@import "tailwindcss";\n@source "./src/shell.html";\n@source "./src/mockup/shell.html";\n@source "./src/**/*.js";\n@custom-variant dark (&:where(.dark, .dark *));\n`);
execSync('npx @tailwindcss/cli -i .tw-in.css -o .tw-out.css --minify',{stdio:'pipe'});
const tw=fs.readFileSync('.tw-out.css','utf8');
const kcss=fs.readFileSync(K+'katex.min.css','utf8').replace(/src:url\(fonts\/([^)]+)\.woff2\) format\("woff2"\)[^;}]*/g,
  (m,f)=>`src:url(data:font/woff2;base64,${fs.readFileSync(K+'fonts/'+f+'.woff2').toString('base64')}) format("woff2")`);
const vendor=`<style id="tailwind">\n${tw}\n</style>\n<style id="katex-css">\n${kcss}\n</style>\n<script id="katex-js">\n${fs.readFileSync(K+'katex.min.js','utf8')}\n</script>\n<script id="katex-auto-render">\n${fs.readFileSync(K+'contrib/auto-render.min.js','utf8')}\n</script>`;
let html=fs.readFileSync(S+'shell.html','utf8');
html=html.split('<!--@@VENDOR@@-->').join(vendor).split('<!--@@APP@@-->').join(app);
fs.writeFileSync('index.html',html);
console.log('OK',(html.length/1024|0)+' KB');

// Mockup visual del juego (no funcional): mockup-juego.html
const mock = fs.readFileSync(S+'mockup/shell.html','utf8').split('<!--@@VENDOR@@-->').join(vendor)
  .split('<!--@@APP@@-->').join(gameModule('Renderer, MUNDO, Base, ENEMIGOS, Soldado') + fs.readFileSync(S+'mockup/mockup.js','utf8'));
fs.writeFileSync('mockup-juego.html', mock);
console.log('OK mockup', (mock.length/1024|0)+' KB');
