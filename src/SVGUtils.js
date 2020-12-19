function curve(x1, y1, x2, y2) {
    let distance = Math.trunc(4 * Math.sqrt(Math.abs(x1 - x2)));
    return `M${x1},${y1} C${x1 + distance},${y1} ${x2 - distance},${y2} ${x2},${y2}`;
}

export {curve}