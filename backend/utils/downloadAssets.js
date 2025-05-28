// backend/utils/downloadAssets.js

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { URL } = require("url");

async function downloadAsset(assetUrl, outputDir) {
  try {
    const urlObj = new URL(assetUrl);
    const fileName = path.basename(urlObj.pathname.split("?")[0]); // removes query params
    const filePath = path.join(outputDir, fileName);

    const response = await axios({
      method: "GET",
      url: assetUrl,
      responseType: "stream",
      timeout: 20000,
    });

    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } catch (err) {
    console.error(`Failed to download ${assetUrl}:`, err.message);
  }
}

module.exports = { downloadAsset };
