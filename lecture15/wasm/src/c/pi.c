static unsigned int seed = 42;

static double random_double(void) {
    seed = 1664525u * seed + 1013904223u;
    return seed / 4294967296.0;
}

__attribute__((visibility("default")))
double approximate_pi(int num_samples, unsigned int initial_seed) {
    seed = initial_seed;

    int points_in_circle = 0;

    for (int i = 0; i < num_samples; i++) {
        double x = 2.0 * random_double() - 1.0;
        double y = 2.0 * random_double() - 1.0;

        if (x*x + y*y <= 1.0)
            points_in_circle++;
    }

    return 4.0 * (double)points_in_circle / num_samples;
}
