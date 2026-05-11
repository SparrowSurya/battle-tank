
function rgba(rgba = {}) {
    const { r = 255, g = 255, b = 255, a = 1.0 } = rgba;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function hex(rgb = {}) {
    let { r = 255, g = 255, b = 255 } = rgb;
    r = r.toString(16).padStart(2, '0');
    g = g.toString(16).padStart(2, '0');
    b = b.toString(16).padStart(2, '0');
    return `0x${r}${g}${b}`;
}
