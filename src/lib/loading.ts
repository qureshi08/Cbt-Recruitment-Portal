// Tiny global progress bar driver. Anywhere in the app can call startLoading()
// before kicking off an async operation and endLoading() when it's done. The
// <GlobalLoadingBar> component (mounted in the root layout) listens for these
// events and renders a thin animated bar at the top of the screen.
//
// Use withLoading() for the common case of wrapping a single async function so
// the bar always toggles off — even if the function throws.

let counter = 0;

export const startLoading = (): void => {
    if (typeof window === "undefined") return;
    counter += 1;
    window.dispatchEvent(new Event("cbt:loading:tick"));
};

export const endLoading = (): void => {
    if (typeof window === "undefined") return;
    counter = Math.max(0, counter - 1);
    window.dispatchEvent(new Event("cbt:loading:tick"));
};

export const getActiveLoaders = (): number => counter;

export async function withLoading<T>(fn: () => Promise<T>): Promise<T> {
    startLoading();
    try {
        return await fn();
    } finally {
        endLoading();
    }
}
