# WebAssembly Demo

Note that these directions are general for your own use. The project structure used here is different.

## C

First install emcc. The version in NPM is quite deprecated.

```
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```

Build the Monte Carlo calculation of Pi:

`emcc src/c/pi.c -o c-pi.js -s WASM=1 -s EXPORTED_FUNCTIONS="['_approximate_pi']" -s EXPORTED_RUNTIME_METHODS="['ccall', 'cwrap']"`

Or use `make c`.

You can also build all targets at once with `make all`, and clean build artifacts with `make clean`.

### Serve the C project

Create a `package.json` and install Express:

```
npm init -y
npm install express
```

Create `app.js`:

```js
const express = require('express');
const app = express();

app.use((req, res, next) => {
  if (req.path.endsWith('.wasm')) res.type('application/wasm');
  next();
});

app.use(express.static('./'));

app.listen(1919, () => console.log('http://localhost:1919'));
```

Create `index.html`:

```html
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>C Wasm Pi</title></head>
<body>
  <h1>Monte Carlo π (C WebAssembly)</h1>
  <button id="calculate">Calculate π</button>
  <div id="result"></div>
  <script>
    (async function () {
      const imports = { env: { emscripten_date_now: () => Date.now() } };
      const { instance } = await WebAssembly.instantiateStreaming(
        fetch('./c-pi.wasm'), imports
      );
      document.getElementById('calculate').addEventListener('click', () => {
        const pi = instance.exports.approximate_pi(1000000);
        document.getElementById('result').textContent = `π ≈ ${pi}`;
      });
    })();
  </script>
</body>
</html>
```

Run: `node app.js` and open `http://localhost:1919`.

For Rust, you can use the `make rust` target. If you want to explore on your own, follow these steps:


##  Rust

1. **Install Rust using Rustup**:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source "$HOME/.cargo/env"
   ```

   To make it permanent for future logins:

   ```bash
   echo 'source "$HOME/.cargo/env"' >> ~/.bashrc
   source ~/.bashrc
   ```

2. **Verify installation**

```
rustc --version
cargo --version
```

3. **Add WebAssembly Target**

`rustup target add wasm32-unknown-unknown`

4. **Install `wasm-pack` for Linux**

`curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh`

Verify installation:

`wasm-pack --version`

Steps 5-9 below walk through creating a Rust Wasm project from scratch. If you are running this repo as-is, skip to step 10. Note that in this repo, `make rust` outputs to `dist/` (not `pkg/`), so the import path in `index.html` is `'./dist/rust-pi.js'` rather than `'./pkg/my_wasm_project.js'`.

5. **Setup Rust Wasm Project**

```
cargo new --lib my-wasm-project
cd my-wasm-project
```

6. **Configure `Cargo.toml`**

```
[package]
name = "my-wasm-project"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2"
```

7. **Edit `src/lib.rs` with a simple example**

```
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = Math)]
    fn random() -> f64;
}

#[wasm_bindgen]
pub fn approximate_pi(num_samples: u32) -> f64 {
    let mut points_in_circle = 0;
    
    for _ in 0..num_samples {
        let x: f64 = 2.0 * random() - 1.0;
        let y: f64 = 2.0 * random() - 1.0;
        
        if x*x + y*y <= 1.0 {
            points_in_circle += 1;
        }
    }
    
    4.0 * (points_in_circle as f64) / (num_samples as f64)
}
```

8. **Build the Wasm module**

`wasm-pack build --target web`

9. **Create an HTML file**

```
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>WebAssembly Demo</title>
</head>
<body>
  <h1>WebAssembly Monte Carlo π Approximation</h1>
  <button id="calculate">Calculate π</button>
  <div id="result"></div>
  <script type="module">
    import init, { approximate_pi } from './pkg/my_wasm_project.js';
    
    async function run() {
      await init();
      
      document.getElementById('calculate').addEventListener('click', () => {
        const result = approximate_pi(1000000);
        document.getElementById('result').textContent = `π ≈ ${result}`;
      });
    }
    
    run();
  </script>
</body>
</html>
```

10. **Serve the project**

You need a server that sets the correct MIME type (`application/wasm`) for `.wasm` files, or `WebAssembly.instantiateStreaming()` will fail.

Create a `package.json` and install Express:

```
npm init -y
npm install express
```

Create `app.js`:

```js
const express = require('express');
const app = express();

app.use((req, res, next) => {
  if (req.path.endsWith('.wasm')) res.type('application/wasm');
  next();
});

app.use(express.static('./'));

app.listen(1919, () => console.log('http://localhost:1919'));
```

Run: `node app.js` and open `http://localhost:1919`.

### Typical Rust Wasm project structure

```
my-wasm-project/
├── Cargo.toml
├── src/
│   └── lib.rs
├── pkg/                  ← generated by wasm-pack build --target web
│   ├── my_wasm_project.js
│   ├── my_wasm_project_bg.wasm
│   ├── my_wasm_project.d.ts
│   └── package.json
├── index.html
├── app.js
├── package.json
└── node_modules/
```

## AssemblyScript

1. Setup your project directory:

```
project-root/
├── src/
│   └── assembly/
│       └── index.ts
├── index.html
├── index.js
├── asconfig.json
```

2. Install AssemblyScript

`npm install --save-dev assemblyscript`

3. Create an `asconfig.json` file.

```
{
  "targets": {
    "release": {
      "outFile": "build/optimized.wasm",
      "optimizeLevel": 3,
      "shrinkLevel": 1
    }
  },
  "entries": ["src/assembly/index.ts"]
}
```

4. Write your code under `src/assembly/index.ts`

4. Compile the Wasm

`npx asc src/assembly/index.ts -b dist/as-pi.wasm --runtime stub -O3`

Or use `make as`.

5. Add to a Web Page

`index.html`

```
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Monte Carlo π (AssemblyScript)</title>
</head>
<body>
  <h1>π Estimate: <span id="result">...</span></h1>
  <script type="module" src="index.js"></script>
</body>
</html>
```

`index.js`
```
const wasm = await WebAssembly.instantiateStreaming(
  fetch('./dist/as-pi.wasm')
);

const computePi = wasm.instance.exports.compute_pi;
const estimate = computePi(1000000, Date.now());

document.getElementById("result").textContent = estimate.toFixed(6);
```

6. **Serve the project**

You need a server that sets the correct MIME type (`application/wasm`) for `.wasm` files, or `WebAssembly.instantiateStreaming()` will fail.

```
npm init -y
npm install express
```

Create `app.js`:

```js
const express = require('express');
const app = express();

app.use((req, res, next) => {
  if (req.path.endsWith('.wasm')) res.type('application/wasm');
  next();
});

app.use(express.static('./'));

app.listen(1919, () => console.log('http://localhost:1919'));
```

Run: `node app.js` and open `http://localhost:1919`.


