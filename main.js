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

const getAlgorithm = (index) => document.getElementById(`optionAlgorithm${index}`).value;

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

const renderArray = (index, redHightlights = [], greenHightlights = []) => {
    const array = arrays[index];

    const numberOfCompares = getAlgorithm(1) !== "none" ? 2 : 1;
    // Return if this array is not supposed to be drawn
    if (index >= numberOfCompares) {
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
        canvasHeight / numberOfCompares * index,
        canvasWidth,
        canvasHeight / numberOfCompares * (index + 1));

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
            canvasPadding + (barHeightMax - barHeight) + index * (barHeightMax + canvasPadding),
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

const swapElements = (index, i, j) => {
    const array = arrays[index];
    [array[i], array[j]] = [array[j], array[i]];

    swapCounts[index]++;
    updateInputValueDisplay(`swapCount${index + 1}`, swapCounts[index]);
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
const waitForContinue = (index) => new Promise((resolve, reject) => {
    // Returns false if the algorithm should stop executing
    if (stopped) {
        resolve(false);
    }
    resolveWaits[index] = resolve;
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
const compareElements = async (index, i, j) => {
    comparisonCounts[index]++;
    updateInputValueDisplay(`comparisonCount${index + 1}`, comparisonCounts[index]);

    const array = arrays[index];
    const result = await waitForContinue(index);
    return !result
        ? 0
        : (array[i] > array[j])
        ? 1
        : -1;
};

const algorithms = {
    bubbleSort: async (index) => {
        const array = arrays[index];
        let n = array.length;
        while (n > 1) {
            let newn = 0;
            for (let i = 1; i <= n - 1; i++) {
                renderArray(index, [i - 1, i]);
                let res = await compareElements(index, i - 1, i);
                if (res > 0) {
                    swapElements(index, i - 1, i);
                    newn = i;
                } else if (res == 0) {
                    return;
                }
            }
            n = newn;
        }
    },
    selectionSort: async (index) => {
        const array = arrays[index];
        for (let i = 0; i < array.length - 1; i++) {
            let jmin = i;
            for (let j = i + 1; j < array.length; j++) {
                renderArray(index, [j, i]);
                let res = await compareElements(index, jmin, j);
                if (res > 0) {
                    jmin = j;
                } else if (res == 0) {
                    return;
                }
            }
            if (jmin != i) {
                swapElements(index, jmin, i);
            }
        }
    },
    insertionSort: async (index) => {
        const array = arrays[index];
        for (let i = 1; i < array.length; i++) {
            for (let j = i; j > 0; j--) {
                renderArray(index, [j - 1, j]);
                let res = await compareElements(index, j - 1, j);
                if (res > 0) {
                    swapElements(index, j - 1, j);
                } else if (res == 0) {
                    return;
                }
            }
        }
    },
    quickSort: async (index, left, right) => {
        const array = arrays[index];
        if (typeof left === "undefined") {
            left = 0;
        }
        if (typeof right === "undefined") {
            right = array.length - 1;
        }

        if (left < right) {
            let i = left;
            for (let j = left; j < right; j++) {
                renderArray(index, [j, right], [left, right]);
                let res = await compareElements(index, j, right);
                if (res < 0) {
                    swapElements(index, i, j);
                    i++;
                } else if (res == 0) {
                    renderArray(index);
                    return;
                }
            }
            swapElements(index, i, right);
            pivot = i;

            await algorithms.quickSort(index, left, pivot - 1);
            await algorithms.quickSort(index, pivot + 1, right);
        }
    },
};

const runAlgorithms = async () => {
    (async () => {
        await algorithms[getAlgorithm(0)](0)
        renderArray(0);
    })();
    (async () => {
        await algorithms[getAlgorithm(1)](1)
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

const complexities = {
    bubbleSort: "n2",
    selectionSort: "n2",
    insertionSort: "n2",
    quickSort: "nlogn",
};
const updateComplexityDisplay = (index) => {
    const complexity = complexities[getAlgorithm(index)];
    const element = document.getElementById(`complexity${index}`);
    element.src = `images/o_${complexity}.svg`;
};
// Initially display the correct complexities
for (let i = 0; i < numberOfArrays; i++) {
    updateComplexityDisplay(i);
}
