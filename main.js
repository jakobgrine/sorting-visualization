const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

const logSlider = (position, minp, maxp, minv, maxv) => {
    minv = Math.log(minv);
    maxv = Math.log(maxv);
    let scale = (maxv - minv) / (maxp - minp);
    return Math.exp(minv + scale * (position - minp));
};

const body = document.getElementById("body");
const aside = document.getElementById("aside");

const optionDelay = document.getElementById("optionDelay");
const getDelay = () => logSlider(optionDelay.value, 1, 100, 1, 1001) - 1;

const optionArraySize = document.getElementById("optionArraySize");
const getArraySize = () => optionArraySize.value;

const optionAlgorithm = document.getElementById("optionAlgorithm");
const getAlgorithm = () => optionAlgorithm.value;

const optionCompareAlgorithm = document.getElementById("optionCompareAlgorithm");
const getCompareAlgorithm = () => optionCompareAlgorithm.value;

const getInputValue = (elementId) =>
    document.getElementById(elementId).value;
const updateInputValueDisplay = (elementId, value) =>
    document.getElementById(elementId + "Value").innerHTML = value;

const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
canvas.width = body.offsetWidth - aside.offsetWidth - 16;
canvas.height = body.offsetHeight - 4 - 16;

const numberOfArrays = 2;
let arrays = Array(numberOfArrays, []);
let comparisonCounts = Array(numberOfArrays, 0);
let swapCounts = Array(numberOfArrays, 0);

const generateArrays = () => {
    // Generate the first array with ascending elements
    arrays[0] = Array.from(
        { length: getArraySize() },
        (_, i) => i + 1);
    // Copy the array
    for (let i = 1; i < numberOfArrays; i++) {
        arrays[i] = Array.from(arrays[0]);
    }
};
// Initially generate the arrays
generateArrays();

const renderArray = (arrayIndex, redHightlights = [], greenHightlights = []) => {
    const array = arrays[arrayIndex];

    const numberOfCompares = getCompareAlgorithm() !== "none" ? 2 : 1;
    // Return if this array is not supposed to be drawn
    if (arrayIndex >= numberOfCompares) {
        return;
    }

    const {
        width: canvasWidth,
        height: canvasHeight,
    } = context.canvas;
    const canvasPadding = 16;
    const barWidth = (canvasWidth - 2 * canvasPadding) / (1.25 * array.length - 0.25);
    const barHeightMax = (canvasHeight - (numberOfCompares + 1) * canvasPadding) / numberOfCompares;
    const barMargin = 0.25 * barWidth;

    // Clear the previous render of this array
    context.clearRect(
        0,
        canvasHeight / numberOfCompares * arrayIndex,
        canvasWidth,
        canvasHeight / numberOfCompares * (arrayIndex + 1));

    // Render this array
    for (let i = 0; i < array.length; i++) {
        const barHeight = array[i] / array.length * barHeightMax;

        context.fillStyle = greenHightlights.includes(i)
            ? "green"
            : redHightlights.includes(i)
            ? "red"
            : "white";
        context.fillRect(
            canvasPadding + i * (barWidth + barMargin),
            canvasPadding + (barHeightMax - barHeight) + arrayIndex * (barHeightMax + canvasPadding),
            barWidth,
            barHeight);
    }
};

const renderArrays = () => {
    for (let i = 0; i < numberOfArrays; i++) {
        renderArray(i);
    }
};
// Initially render the arrays
renderArrays();

const swapElements = (arrayIndex, i, j) => {
    const array = arrays[arrayIndex];
    [array[i], array[j]] = [array[j], array[i]];

    swapCounts[arrayIndex]++;
    updateInputValueDisplay(`swapCount${arrayIndex + 1}`, swapCounts[arrayIndex]);
};

const shuffleArrays = () => {
    stop();
    // Shuffle the first array
    const array = arrays[0];
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    for (let i = 0; i < numberOfArrays; i++) {
        // Copy the shuffled array
        arrays[i] = Array.from(arrays[0]);
        // Rerender the array
        renderArray(i);
    }
};

let stopped, paused;
let resolveWaits = Array(numberOfArrays, []);
// Returns when the algorithm should continue or terminate.
const waitForContinue = (arrayIndex) => new Promise((resolve, reject) => {
    // Returns false if the algorithm should stop executing
    if (stopped) {
        resolve(false);
    }
    resolveWaits[arrayIndex] = resolve;
    if (!paused) {
        if (getDelay() > 0) {
            // Continue executing the algorithm after the user-specified delay
            setTimeout(() => resolve(true), getDelay());
        } else {
            // Directly continue executing the algorithm if the delay is zero
            resolve(true);
        }
    }
});

// Compares two elements in an array and waits.
// - returns  1 if a[i] > a[j]
// - returns -1 if a[i] <= a[j]
// - returns  0 if the algorithm should terminate
const compareElements = async (arrayIndex, i, j) => {
    comparisonCounts[arrayIndex]++;
    updateInputValueDisplay(`comparisonCount${arrayIndex + 1}`, comparisonCounts[arrayIndex]);

    const array = arrays[arrayIndex];
    const result = await waitForContinue(arrayIndex);
    return !result
        ? 0
        : (array[i] > array[j])
        ? 1
        : -1;
};

const algorithms = {
    bubbleSort: async (arrayIndex) => {
        const array = arrays[arrayIndex];
        let n = array.length;
        while (n > 1) {
            let newn = 0;
            for (let i = 1; i <= n - 1; i++) {
                renderArray(arrayIndex, [i - 1, i]);
                let res = await compareElements(arrayIndex, i - 1, i);
                if (res > 0) {
                    swapElements(arrayIndex, i - 1, i);
                    newn = i;
                } else if (res == 0) {
                    return;
                }
            }
            n = newn;
        }
    },
    selectionSort: async (arrayIndex) => {
        const array = arrays[arrayIndex];
        for (let i = 0; i < array.length - 1; i++) {
            let jmin = i;
            for (let j = i + 1; j < array.length; j++) {
                renderArray(arrayIndex, [j, i]);
                let res = await compareElements(arrayIndex, jmin, j);
                if (res > 0) {
                    jmin = j;
                } else if (res == 0) {
                    return;
                }
            }
            if (jmin != i) {
                swapElements(arrayIndex, jmin, i);
            }
        }
    },
    insertionSort: async (arrayIndex) => {
        const array = arrays[arrayIndex];
        for (let i = 1; i < array.length; i++) {
            for (let j = i; j > 0; j--) {
                renderArray(arrayIndex, [j - 1, j]);
                let res = await compareElements(arrayIndex, j - 1, j);
                if (res > 0) {
                    swapElements(arrayIndex, j - 1, j);
                } else if (res == 0) {
                    return;
                }
            }
        }
    },
    quickSort: async (arrayIndex, left, right) => {
        const array = arrays[arrayIndex];
        if (typeof left === "undefined") {
            left = 0;
        }
        if (typeof right === "undefined") {
            right = array.length - 1;
        }

        if (left < right) {
            let i = left;
            for (let j = left; j < right; j++) {
                renderArray(arrayIndex, [j, right], [left, right]);
                let res = await compareElements(arrayIndex, j, right);
                if (res < 0) {
                    swapElements(arrayIndex, i, j);
                    i++;
                } else if (res == 0) {
                    renderArray(arrayIndex);
                    return;
                }
            }
            swapElements(arrayIndex, i, right);
            pivot = i;

            await algorithms.quickSort(arrayIndex, left, pivot - 1);
            await algorithms.quickSort(arrayIndex, pivot + 1, right);
        }
    },
};

const runAlgorithms = async () => {
    (async () => {
        await algorithms[getAlgorithm()](0)
        renderArray(0);
    })();
    (async () => {
        await algorithms[getCompareAlgorithm()](1)
        renderArray(1);
    })();
};

const start = async () => {
    for (let i = 0; i < numberOfArrays; i++) {
        comparisonCounts[i] = 0;
        swapCounts[i] = 0;
    }
    paused = false;
    stopped = false;
    runAlgorithms();
};
const stop = () => {
    paused = false;
    stopped = true;
};
const pauseResume = () => {
    if (!paused) {
        paused = true;
    } else {
        paused = false;
        for (let i = 0; i < numberOfArrays; i++) {
            resolveWaits[i](true);
        }
    }
};
const stepForward = async () => {
    if (paused) {
        for (let i = 0; i < numberOfArrays; i++) {
            resolveWaits[i](true);
        }
    } else {
        for (let i = 0; i < numberOfArrays; i++) {
            comparisonCounts[i] = 0;
            swapCounts[i] = 0;
        }
        paused = true;
        stopped = false;
        runAlgorithms();
    }
};
