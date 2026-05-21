use wasm_bindgen::prelude::*;

static mut SEED: u32 = 42;

fn random_double() -> f64 {
    unsafe {
        SEED = (1664525u32.wrapping_mul(SEED)).wrapping_add(1013904223);
        SEED as f64 / 4294967296.0
    }
}

#[wasm_bindgen]
pub fn approximate_pi(num_samples: u32) -> f64 {
    let now = js_sys::Date::now() as u32;
    unsafe { SEED = now; }

    let mut points_in_circle: u32 = 0;

    for _ in 0..num_samples {
        let x: f64 = 2.0 * random_double() - 1.0;
        let y: f64 = 2.0 * random_double() - 1.0;

        if x * x + y * y <= 1.0 {
            points_in_circle += 1;
        }
    }

    4.0 * (points_in_circle as f64) / (num_samples as f64)
}
