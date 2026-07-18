const fs = require("fs");
const path = require("path");
const https = require("https");

const LOGOS_DIR = path.join(__dirname, "..", "assets", "logos");

if (!fs.existsSync(LOGOS_DIR)) {
  fs.mkdirSync(LOGOS_DIR, { recursive: true });
}

const downloads = [
  { name: "instagram.png", url: "https://cdn.allmylinks.com/prod/Site/favicon/d/a/h/8zpFXbrlvkEUUsBQsfgjvXMl1ceLaS9q.png" },
  { name: "linkedin.png", url: "https://cdn.allmylinks.com/prod/Site/favicon/s/D/f/fEp4_oUv2v1nyiXdJacIHUZWAwj2q8m_.png" },
  { name: "spotify.png", url: "https://cdn.allmylinks.com/prod/Site/favicon/s/U/f/i6zozoGAIgWKSwNhRj4k7gjKRVd72uFF.png" },
  { name: "github.png", url: "https://cdn.allmylinks.com/prod/Site/favicon/n/Q/6/1UJt1xN8u7tm3saw7lYflki4aJkyoCta.png" },
  { name: "beli.ico", url: "https://cdn.allmylinks.com/prod/Site/favicon/6/B/t/JBUMgOh2t8Zs_cg0Qz5DHeYwVd0N_kN3.ico" },
  { name: "letterboxd.png", url: "https://cdn.allmylinks.com/prod/Site/favicon/S/H/g/QW8csXOMwhfxgwj9Irq5p6cCPJqg0-yD.png" },
  { name: "clashroyale.png", url: "https://cdn.allmylinks.com/prod/Site/favicon/O/1/0/OC6UeIEsJ-j8DyxaVHillDCSn3N9l5b8.png" },
  { name: "brawlstars.png", url: "https://cdn.allmylinks.com/prod/Site/favicon/7/R/m/rRUW5dllwYuyFz11bLOLKQorJThhfhly.png" },
  { name: "chess.png", url: "https://cdn.allmylinks.com/prod/Site/favicon/A/8/Y/lfadNtfk8uwkDentTq7EQ5fWXS8a6ZcP.png" }
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download: ${res.statusCode}`));
        return;
      }
      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);
      fileStream.on("finish", () => {
        fileStream.close();
        resolve();
      });
    }).on("error", reject);
  });
}

async function run() {
  // Copy Goodreads
  const brainGoodreads = "C:/Users/yash/.gemini/antigravity-ide/brain/41925876-6571-4b05-9fad-ff9c315f76b9/media__1784406206221.png";
  const destGoodreads = path.join(LOGOS_DIR, "goodreads.png");
  if (fs.existsSync(brainGoodreads)) {
    fs.copyFileSync(brainGoodreads, destGoodreads);
    console.log("Goodreads logo copied successfully.");
  } else {
    console.warn("WARNING: Goodreads logo source not found in brain folder.");
  }

  // Copy Substack
  const brainSubstack = "C:/Users/yash/.gemini/antigravity-ide/brain/41925876-6571-4b05-9fad-ff9c315f76b9/media__1784407503527.png";
  const destSubstack = path.join(LOGOS_DIR, "substack.png");
  if (fs.existsSync(brainSubstack)) {
    fs.copyFileSync(brainSubstack, destSubstack);
    console.log("Substack logo copied successfully.");
  } else {
    console.warn("WARNING: Substack logo source not found in brain folder.");
  }

  // Copy MyAnimeList
  const brainMAL = "C:/Users/yash/.gemini/antigravity-ide/brain/41925876-6571-4b05-9fad-ff9c315f76b9/media__1784407532439.png";
  const destMAL = path.join(LOGOS_DIR, "myanimelist.png");
  if (fs.existsSync(brainMAL)) {
    fs.copyFileSync(brainMAL, destMAL);
    console.log("MyAnimeList logo copied successfully.");
  } else {
    console.warn("WARNING: MyAnimeList logo source not found in brain folder.");
  }

  // Copy Airbuds
  const brainAirbuds = "C:/Users/yash/.gemini/antigravity-ide/brain/41925876-6571-4b05-9fad-ff9c315f76b9/media__1784407543897.png";
  const destAirbuds = path.join(LOGOS_DIR, "airbuds.png");
  if (fs.existsSync(brainAirbuds)) {
    fs.copyFileSync(brainAirbuds, destAirbuds);
    console.log("Airbuds logo copied successfully.");
  } else {
    console.warn("WARNING: Airbuds logo source not found in brain folder.");
  }

  // Copy Discord
  const brainDiscord = "C:/Users/yash/.gemini/antigravity-ide/brain/41925876-6571-4b05-9fad-ff9c315f76b9/media__1784407565211.png";
  const destDiscord = path.join(LOGOS_DIR, "discord.png");
  if (fs.existsSync(brainDiscord)) {
    fs.copyFileSync(brainDiscord, destDiscord);
    console.log("Discord logo copied successfully.");
  } else {
    console.warn("WARNING: Discord logo source not found in brain folder.");
  }

  for (const item of downloads) {
    const dest = path.join(LOGOS_DIR, item.name);
    try {
      console.log(`Downloading ${item.name}...`);
      await download(item.url, dest);
      console.log(`Saved ${item.name}`);
    } catch (err) {
      console.error(`Error downloading ${item.name}: ${err.message}`);
    }
  }
  console.log("Download task complete!");
}

run();
