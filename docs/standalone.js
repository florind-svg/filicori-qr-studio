(function () {
  const form = document.getElementById("qr-form");
  const status = document.getElementById("status");
  const qrPreview = document.getElementById("qr-preview");
  const brandPreview = document.getElementById("brand-preview");

  const downloadQrSvg = document.getElementById("download-qr-svg");
  const downloadQrPng = document.getElementById("download-qr-png");
  const downloadBrandSvg = document.getElementById("download-brand-svg");
  const downloadBrandPng = document.getElementById("download-brand-png");

  function setStatus(message, isError) {
    status.textContent = message;
    status.style.color = isError ? "#9a2d2d" : "";
  }

  function setLink(anchor, href, filename) {
    if (!href) {
      anchor.href = "#";
      anchor.removeAttribute("download");
      anchor.classList.add("disabled");
      return;
    }

    anchor.href = href;
    anchor.download = filename;
    anchor.classList.remove("disabled");
  }

  function makeQrSvg(url, cellSize) {
    const qr = qrcode(0, "M");
    qr.addData(url);
    qr.make();
    return qr.createSvgTag({
      scalable: true,
      cellSize,
      margin: 2
    });
  }

  function createBrandCardSvg(qrMarkup, title, subtitle, url) {
    const cleanTitle = escapeXml(title);
    const cleanSubtitle = escapeXml(subtitle);
    const cleanUrl = escapeXml(url);

    return [
      '<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1800" viewBox="0 0 1400 1800">',
      '<defs>',
      '<linearGradient id="paper" x1="0%" y1="0%" x2="100%" y2="100%">',
      '<stop offset="0%" stop-color="#f7f1e8"/>',
      '<stop offset="100%" stop-color="#efe1cd"/>',
      '</linearGradient>',
      '</defs>',
      '<rect width="1400" height="1800" fill="url(#paper)"/>',
      '<rect x="70" y="70" width="1260" height="1660" rx="48" fill="#fffaf4"/>',
      '<text x="700" y="220" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-size="32" letter-spacing="9" fill="#0e6a5b">FILICORI ZECCHINI</text>',
      `<text x="700" y="340" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-size="86" fill="#1e1711">${cleanTitle}</text>`,
      `<text x="700" y="408" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-size="34" fill="#64564a">${cleanSubtitle}</text>`,
      '<g transform="translate(250 500)">',
      qrMarkup,
      '</g>',
      '<text x="700" y="1455" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-size="28" fill="#64564a">Scanare rapida din meniuri, mese si materiale de print</text>',
      `<text x="700" y="1515" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-size="28" fill="#1e1711">${cleanUrl}</text>`,
      '<rect x="430" y="1585" width="540" height="86" rx="43" fill="#0e6a5b"/>',
      '<text x="700" y="1641" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="700" fill="#ffffff">SCANEAZA AICI</text>',
      '</svg>'
    ].join("");
  }

  function escapeXml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function svgToDataUrl(svgMarkup) {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgMarkup);
  }

  function svgToPngDataUrl(svgMarkup, width, height) {
    return new Promise(function (resolve, reject) {
      const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
      const blobUrl = URL.createObjectURL(blob);
      const image = new Image();

      image.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        URL.revokeObjectURL(blobUrl);
        resolve(canvas.toDataURL("image/png"));
      };

      image.onerror = function () {
        URL.revokeObjectURL(blobUrl);
        reject(new Error("Nu am putut converti SVG-ul in PNG."));
      };

      image.src = blobUrl;
    });
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    setStatus("Generez variantele...");

    try {
      const formData = new FormData(form);
      const url = String(formData.get("url") || "").trim();
      const title = String(formData.get("brandTitle") || "").trim();
      const subtitle = String(formData.get("brandSubtitle") || "").trim();
      const filename = String(formData.get("filename") || "filicori-menu-qr").trim() || "filicori-menu-qr";
      const cellSize = Number(formData.get("size") || 10);

      if (!/^https?:\/\//i.test(url)) {
        throw new Error("Linkul trebuie sa inceapa cu http:// sau https://");
      }

      const qrSvg = makeQrSvg(url, cellSize);
      const brandSvg = createBrandCardSvg(qrSvg, title, subtitle, url);

      qrPreview.classList.remove("empty");
      qrPreview.innerHTML = qrSvg;
      brandPreview.classList.remove("empty");
      brandPreview.innerHTML = brandSvg;

      const qrSvgUrl = svgToDataUrl(qrSvg);
      const brandSvgUrl = svgToDataUrl(brandSvg);
      const [qrPngUrl, brandPngUrl] = await Promise.all([
        svgToPngDataUrl(qrSvg, 1200, 1200),
        svgToPngDataUrl(brandSvg, 1400, 1800)
      ]);

      setLink(downloadQrSvg, qrSvgUrl, filename + ".svg");
      setLink(downloadQrPng, qrPngUrl, filename + ".png");
      setLink(downloadBrandSvg, brandSvgUrl, filename + "-card.svg");
      setLink(downloadBrandPng, brandPngUrl, filename + "-card.png");

      setStatus("Generatorul este gata. Poti descarca direct fisierele.");
    } catch (error) {
      qrPreview.classList.add("empty");
      brandPreview.classList.add("empty");
      qrPreview.innerHTML = "<p>Previzualizarea apare aici.</p>";
      brandPreview.innerHTML = "<p>Cardul branded apare aici.</p>";
      setLink(downloadQrSvg, null, "");
      setLink(downloadQrPng, null, "");
      setLink(downloadBrandSvg, null, "");
      setLink(downloadBrandPng, null, "");
      setStatus(error.message || "A aparut o eroare.", true);
    }
  });

  form.dispatchEvent(new Event("submit"));
})();
