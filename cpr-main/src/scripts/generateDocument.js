export const loadFile = async (url) => {
    const response = await fetch(url);
    const template = await response.blob();
    return template;
};


export function saveFile(filename, blob) {
    const blobUrl = URL.createObjectURL(blob);

    let link = document.createElement("a");
    link.download = filename;
    link.href = blobUrl;

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
        link = null;
    }, 0);
}
