const express = require("express");
const cors = require("cors");
const path = require("path");
const scraperRoute = require("./routes/scraper");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/assets", express.static(path.join(__dirname, "scraped_assets")));
app.use(scraperRoute);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
