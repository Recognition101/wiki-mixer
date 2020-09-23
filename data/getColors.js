const fs = require('fs');
//@ts-ignore
const jpegJs = require('jpeg-js');
//@ts-ignore
const pngJs = require('pngjs');
const path = require('path');


/**
 * Given a list of P points and C centroids (each point of size `size`), find
 * the closest centroid to each point and store the centroid's index in
 * `labels` (also storing the squared distance between the point and the
 * centroid in `distances`).
 * @param {number[]} points a list of P points (length = P * `size`)
 * @param {number[]} centers a list of C centroids (length = C * `size`)
 * @param {number} size the number of components in each point (and centroid)
 * @param {number[]} labels write a `centers` index per `point` (length = P)
 * @param {number[]} distances write a distance per `point` (length = P)
 */
const labelPoints = (points, centers, size, labels, distances) => {
    for(let lIndex = 0; lIndex < labels.length; lIndex += 1) {
        const vIndex = lIndex * size;
        distances[lIndex] = Infinity;
        labels[lIndex] = -1;

        for(let cIndex = 0; cIndex < centers.length; cIndex += size) {
            let distanceSum = 0;
            for(let subIndex = 0; subIndex < size; subIndex += 1) {
                const vOffset = vIndex + subIndex;
                const cOffset = cIndex + subIndex;
                const diff = points[vOffset] - centers[cOffset];
                distanceSum += Math.pow(diff, 2);
            }

            if (distanceSum < distances[lIndex]) {
                distances[lIndex] = distanceSum;
                labels[lIndex] = cIndex;
            }
        }
    }
};

/**
 * @typedef {Object} LabelledPoints the labels for P points (each of size S)
 * @prop {number[]} labels one `centroids` index per input point (length = P)
 * @prop {number[]} distances one squared distance per input point (length = P)
 * @prop {number[]} centroids the k centroids (each of size S, length = S * k)
 *
 * Label P input points with `k` centroids using naive k-means.
 * @param {number[]} points the list of points to label (length = P * `size`)
 * @param {number} size the number of component parts per point
 * @param {number} k the number of centroids to label points with
 * @param {number} [maxIteration] the maximum iterations that can run
 * @return {LabelledPoints} the label metadata for the centroids
 */
const kMeans = (points, size, k, maxIteration = 100) => {
    const pointCount = points.length / size;
    const centerLength = size * k;

    const origin = /** @type {number[]} */(new Array(size)).fill(0);
    const labels = /** @type {number[]} */(new Array(pointCount)).fill(0);
    const distances= /** @type {number[]} */(new Array(pointCount)).fill(0);
    let curCenters = /** @type {number[]} */(new Array(centerLength)).fill(0);
    let oldCenters = /** @type {number[]} */(new Array(centerLength)).fill(0);

    for(let cIndex = 0; cIndex < curCenters.length; cIndex += size) {
        const pIndex = Math.floor(Math.random() * pointCount) * size;
        for(let subIndex = 0; subIndex < size; subIndex += 1) {
            curCenters[cIndex + subIndex] = points[pIndex + subIndex];
        }
    }

    for(let i = 0, isDiff = true; i < maxIteration && isDiff; i += 1) {
        const swapCenters = oldCenters;
        oldCenters = curCenters;

        // label points
        labelPoints(points, curCenters, size, labels, distances);

        // move centroids
        curCenters = swapCenters;
        for(let cIndex = 0; cIndex < centerLength; cIndex += size) {
            let filteredCount = 0;
            for(let subIndex = 0; subIndex < size; subIndex += 1) {
                curCenters[cIndex + subIndex] = 0;
            }

            for(let lIndex = 0; lIndex < pointCount; lIndex += 1) {
                if (labels[lIndex] === cIndex) {
                    const pIndex = lIndex * size;
                    for(let subIndex = 0; subIndex < size; subIndex += 1) {
                        const vOffset = pIndex + subIndex;
                        curCenters[cIndex + subIndex] += points[vOffset];
                    }
                    filteredCount += 1;
                }
            }

            for(let subIndex = 0; subIndex < size; subIndex += 1) {
                curCenters[cIndex + subIndex] /= filteredCount;
            }

            if (filteredCount === 0) {
                const pIndex = Math.floor(Math.random() * pointCount) * size;
                for(let subIndex = 0; subIndex < size; subIndex += 1) {
                    curCenters[cIndex + subIndex] = points[pIndex + subIndex];
                }
            }
        }

        // compute isDiff
        isDiff = false;
        for(let cIndex = 0; cIndex < centerLength && !isDiff; cIndex += 1) {
            isDiff = curCenters[cIndex] !== oldCenters[cIndex];
        }
    }

    labelPoints(points, curCenters, size, labels, distances);

    return { labels, distances, centroids: curCenters };
};

/**
 * Converts an RGB value into an HSV value.
 * @param {number} r red, represented from [0, 1]
 * @param {number} g green, represented from [0, 1]
 * @param {number} b blue, represented from [0, 1]
 * @return {number[]} HSV values, with all three components in [0, 1]
 */
const rgbToHsv = (r, g, b) => {
    const v = Math.max(r, g, b);
    const range = v - Math.min(r, g, b);
    const h =
        range === 0 ? 0 :
        v === r ? (g - b) / range :
        v === g ? 2 + (b - r) / range :
        4 + (r - g) / range;

    return [ h / 6 + (h < 0 ? 1 : 0), range === 0 ? 0 : range / v, v ];
};

/**
 * Converts an HSV value into an RGB value.
 * @param {number} h hue in [0, 1]
 * @param {number} s saturation in [0, 1]
 * @param {number} v value in [0, 1]
 * @return {number[]} the [R, G, B], with all three components in [0, 255]
 */
const hsvToRgb = (h, s, v) => {
    const rK = (5 + h * 6) % 6;
    const gK = (3 + h * 6) % 6;
    const bK = (1 + h * 6) % 6;
    return [
        (v - v * s * Math.max(Math.min(rK, 4 - rK, 1), 0)) * 255,
        (v - v * s * Math.max(Math.min(gK, 4 - gK, 1), 0)) * 255,
        (v - v * s * Math.max(Math.min(bK, 4 - bK, 1), 0)) * 255
    ];
};

/**
 * Gets a few theme colors from an image and return them.
 * @param {string} filePath the path to the input PNG or JPG file
 * @return {number[][]|null} a list of [R, G, B] tuples containing theme colors
 */
module.exports.getColors = (filePath, debugOutput=false) => {
    const isPng = /\.png$/i.test(filePath);
    const isJpg = /\.jpe?g$/i.test(filePath);
    if (!isPng && !isJpg) {
        return null;
    }

    const fileData = fs.readFileSync(filePath);

    /** @type {{width: number, height: number, data: number[]}} */
    const { width, height, data } = isPng
        ? pngJs.PNG.sync.read(fileData)
        : jpegJs.decode(fileData, { useTArray: true });

    const k = 4;
    const size = 4;
    const hsvData = /** @type {number[]} */([]);
    const hueData = /** @type {number[]} */([]);

    for(let i = 0; i < data.length; i += size) {
        const r = data[i + 0];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        const [ h, s, v ] = rgbToHsv(r / 255, g / 255, b / 255);
        hsvData[i + 0] = h * 100;
        hsvData[i + 1] = s;
        hsvData[i + 2] = v;
        hsvData[i + 3] = a / 255;
        hueData[i / size] = h;
    }

    const result = kMeans(hsvData, size, k);

    if (debugOutput) {
        const outDirectory = path.dirname(filePath);
        const outName = '_debug_' + path.basename(filePath) + '.png';
        const outPath = path.join(outDirectory, outName);
        const outPng = new pngJs.PNG({ width, height });
        const outData = outPng.data || [ ];
        result.labels.forEach((label, i) => {
            const [lR, lG, lB] = hsvToRgb(label / (size * k), 1, 1);
            outData[i * 4 + 0] = lR;
            outData[i * 4 + 1] = lG;
            outData[i * 4 + 2] = lB;
            outData[i * 4 + 3] = 255;
        });
        // @ts-ignore
        outPng.pack().pipe(fs.createWriteStream(outPath));
    }

    const colors = /** @type {number[][]} */([]);
    for(let cIndex = 0; cIndex < result.centroids.length; cIndex += size) {
        const h = result.centroids[cIndex + 0] / 100;
        const s = result.centroids[cIndex + 1];
        const v = result.centroids[cIndex + 2];
        const [r, g, b] = hsvToRgb(h, s, v);
        colors.push([ Math.round(r), Math.round(g), Math.round(b) ]);
    }

    return colors;
};
