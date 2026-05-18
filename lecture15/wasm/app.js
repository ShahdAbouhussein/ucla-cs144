const express = require('express');
const app = express();
const port = 1919;

app.use((req, res, next) => {
  if (req.path.endsWith('.wasm')) {
    res.type('application/wasm');
  }
  next();
});

app.use(express.static('./', { index: false }));

const boxes = {
  js: {
    class: 'js-box',
    title: 'JavaScript',
    id: 'js',
  },
  c: {
    class: 'c-box',
    title: 'C WebAssembly',
    id: 'c',
  },
  rust: {
    class: 'rust-box',
    title: 'Rust WebAssembly',
    id: 'rust',
  },
  as: {
    class: 'as-box',
    title: 'AssemblyScript',
    id: 'as',
  },
};

function boxHTML(b) {
  const disabled = b.id === 'js' ? '' : ' disabled';
  return `
    <div class="experiment-box ${b.class}">
      <h2>${b.title}</h2>
      <div class="input-group">
        <label for="${b.id}-points">Number of Points:</label>
        <input type="number" id="${b.id}-points" value="100000000" min="1000" step="1000">
      </div>
      <button id="${b.id}-start"${disabled}>Calculate &pi;</button>
      <div class="loader" id="${b.id}-loader"></div>
      <div class="result-area">
        <div>Result: <span class="result-value" id="${b.id}-result">-</span></div>
        <div>Time: <span class="time-value" id="${b.id}-time">-</span></div>
      </div>
    </div>`;
}

const jsScript = `
<script>
  function approximatePiJS(numPoints) {
    let pointsInCircle = 0;
    for (let i = 0; i < numPoints; i++) {
      const x = 2.0 * Math.random() - 1.0;
      const y = 2.0 * Math.random() - 1.0;
      if (x*x + y*y <= 1.0) pointsInCircle++;
    }
    return 4.0 * pointsInCircle / numPoints;
  }

  document.getElementById('js-start').addEventListener('click', async function() {
    const numPoints = parseInt(document.getElementById('js-points').value);
    const resultElement = document.getElementById('js-result');
    const timeElement = document.getElementById('js-time');
    const loader = document.getElementById('js-loader');
    const button = this;
    resultElement.textContent = '-';
    timeElement.textContent = '-';
    button.disabled = true;
    loader.style.display = 'block';
    await new Promise(resolve => setTimeout(resolve, 50));
    const startTime = performance.now();
    const result = approximatePiJS(numPoints);
    const endTime = performance.now();
    const executionTime = ((endTime - startTime) / 1000).toFixed(4);
    resultElement.textContent = result.toFixed(8);
    timeElement.textContent = executionTime + ' seconds';
    loader.style.display = 'none';
    button.disabled = false;
  });
</script>`;

const cScript = `
<script>
  (async function loadCWasmModule() {
    try {
      const { instance } = await WebAssembly.instantiateStreaming(
        fetch('./dist/c-pi.wasm'));
      window.cWasmModule = instance;
      document.getElementById('c-start').disabled = false;
      console.log('C WebAssembly module loaded successfully');
    } catch (error) {
      console.error('Failed to load C WebAssembly module:', error);
      document.getElementById('c-result').textContent = 'Module loading error';
    }
  })();

  document.getElementById('c-start').addEventListener('click', async function() {
    if (!window.cWasmModule) {
      document.getElementById('c-result').textContent = 'Module not loaded';
      return;
    }
    const numPoints = parseInt(document.getElementById('c-points').value);
    const resultElement = document.getElementById('c-result');
    const timeElement = document.getElementById('c-time');
    const loader = document.getElementById('c-loader');
    const button = this;
    resultElement.textContent = '-';
    timeElement.textContent = '-';
    button.disabled = true;
    loader.style.display = 'block';
    await new Promise(resolve => setTimeout(resolve, 50));
    const startTime = performance.now();
    const result = window.cWasmModule.exports.approximate_pi(numPoints, Date.now());
    const endTime = performance.now();
    const executionTime = ((endTime - startTime) / 1000).toFixed(4);
    resultElement.textContent = result.toFixed(8);
    timeElement.textContent = executionTime + ' seconds';
    loader.style.display = 'none';
    button.disabled = false;
  });
</script>`;

const rustScript = `
<script type="module">
  import init, { approximate_pi } from './dist/rust-pi.js';

  async function run() {
    await init();
    document.getElementById('rust-start').disabled = false;
    console.log('Rust WebAssembly module loaded successfully');

    document.getElementById('rust-start').addEventListener('click', async function () {
      const numPoints = parseInt(document.getElementById('rust-points').value, 10);
      const resultElement = document.getElementById('rust-result');
      const timeElement = document.getElementById('rust-time');
      const loader = document.getElementById('rust-loader');
      const button = this;
      resultElement.textContent = '-';
      timeElement.textContent = '-';
      button.disabled = true;
      loader.style.display = 'block';
      await new Promise(resolve => setTimeout(resolve, 50));
      const startTime = performance.now();
      const result = approximate_pi(numPoints);
      const endTime = performance.now();
      const executionTime = ((endTime - startTime) / 1000).toFixed(4);
      resultElement.textContent = result.toFixed(8);
      timeElement.textContent = \`\${executionTime} seconds\`;
      loader.style.display = 'none';
      button.disabled = false;
    });
  }

  run();
</script>`;

const asScript = `
<script type="module">
  let computePi;

  async function run() {
    try {
      const { instance } = await WebAssembly.instantiateStreaming(
        fetch('./dist/as-pi.wasm')
      );
      computePi = instance.exports.compute_pi;
      document.getElementById('as-start').disabled = false;
      console.log('AssemblyScript WebAssembly module loaded successfully');

      document.getElementById('as-start').addEventListener('click', async function () {
        const numPoints = parseInt(document.getElementById('as-points').value, 10);
        const resultElement = document.getElementById('as-result');
        const timeElement = document.getElementById('as-time');
        const loader = document.getElementById('as-loader');
        const button = this;
        resultElement.textContent = '-';
        timeElement.textContent = '-';
        button.disabled = true;
        loader.style.display = 'block';
        await new Promise(resolve => setTimeout(resolve, 50));
        const startTime = performance.now();
        const result = computePi(numPoints, Date.now());
        const endTime = performance.now();
        const executionTime = ((endTime - startTime) / 1000).toFixed(4);
        resultElement.textContent = result.toFixed(8);
        timeElement.textContent = \`\${executionTime} seconds\`;
        loader.style.display = 'none';
        button.disabled = false;
      });
    } catch (err) {
      console.error('Failed to load AssemblyScript module:', err);
      document.getElementById('as-result').textContent = 'Module loading error';
    }
  }

  run();
</script>`;

const scripts = { js: jsScript, c: cScript, rust: rustScript, as: asScript };

function generatePage(langs) {
  const names = langs.map(l => boxes[l].title);
  const title = names.join(' vs. ');

  const boxesHTML = langs.map(l => boxHTML(boxes[l])).join('\n');
  const scriptsHTML = langs.map(l => scripts[l]).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
        }
        h1 {
            text-align: center;
            margin-bottom: 40px;
            color: #2c3e50;
        }
        .experiment-container {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            justify-content: center;
        }
        .experiment-box {
            border-radius: 12px;
            padding: 20px;
            width: 300px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            transition: transform 0.3s;
        }
        .experiment-box:hover {
            transform: translateY(-5px);
        }
        .js-box {
            background-color: #a8e6cf;
            border: 2px solid #69d1a6;
        }
        .c-box {
            background-color: #ffd3b6;
            border: 2px solid #ffaa80;
        }
        .rust-box {
            background-color: #ffaaa5;
            border: 2px solid #ff8a80;
        }
        .as-box {
            background-color: #d4a5ff;
            border: 2px solid #b380e0;
        }
        h2 {
            text-align: center;
            margin-top: 0;
            color: #2c3e50;
        }
        .input-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
        }
        button {
            width: 100%;
            padding: 10px;
            background-color: #2c3e50;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        button:hover {
            background-color: #1a2530;
        }
        button:disabled {
            background-color: #95a5a6;
            cursor: not-allowed;
        }
        .result-area {
            margin-top: 15px;
            background-color: rgba(255, 255, 255, 0.7);
            padding: 10px;
            border-radius: 4px;
            min-height: 80px;
        }
        .result-value, .time-value {
            font-weight: bold;
            font-size: 18px;
        }
        .loader {
            display: none;
            margin: 10px auto;
            border: 5px solid #f3f3f3;
            border-top: 5px solid #3498db;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .run-all-container {
            text-align: center;
            margin-bottom: 30px;
        }
        .run-all-btn {
            width: auto;
            padding: 12px 40px;
            font-size: 18px;
            background-color: #e74c3c;
        }
        .run-all-btn:hover {
            background-color: #c0392b;
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div class="run-all-container">
        <button class="run-all-btn" id="run-all">Run All</button>
    </div>
    <div class="experiment-container">
${boxesHTML}
    </div>
${scriptsHTML}
<script>
  document.getElementById('run-all').addEventListener('click', function() {
    const ids = ${JSON.stringify(langs.map(l => l + '-start'))};
    ids.forEach(id => {
      const btn = document.getElementById(id);
      if (btn && !btn.disabled) btn.click();
    });
  });
</script>
</body>
</html>`;
}

app.get('/', (req, res) => {
  res.send(generatePage(['js', 'c', 'rust', 'as']));
});

app.get('/c', (req, res) => {
  res.send(generatePage(['js', 'c']));
});

app.get('/rust', (req, res) => {
  res.send(generatePage(['js', 'rust']));
});

app.get('/asm', (req, res) => {
  res.send(generatePage(['js', 'as']));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
