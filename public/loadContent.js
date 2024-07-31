for (const item of document.querySelectorAll("[data-file-src]")) item.src = item.getAttribute("data-file-src");
new Promise(async (resolve) => {
    const base64Content = JSON.parse(document.getElementById("base64").textContent);
    for (const item of document.querySelectorAll("[data-file-base64src]")) {
        item[item instanceof HTMLAnchorElement ? "href" : "src"] = base64Content[item.getAttribute("data-file-base64src")];
        if (item instanceof HTMLAnchorElement) item.download = item.getAttribute("data-file-base64src");
    }
    resolve();
})