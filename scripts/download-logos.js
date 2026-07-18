const fs = require("fs");
const path = require("path");
const https = require("https");

const LOGOS_DIR = path.join(__dirname, "..", "assets", "logos");

if (!fs.existsSync(LOGOS_DIR)) {
  fs.mkdirSync(LOGOS_DIR, { recursive: true });
}

const downloads = [
  { name: "instagram.svg", url: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/instagram.svg" },
  { name: "linkedin.svg", url: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/linkedin.svg" },
  { name: "substack.svg", url: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/substack.svg" },
  { name: "spotify.svg", url: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/spotify.svg" },
  { name: "airbuds.png", url: "https://cdn.allmylinks.com/prod/Site/favicon/f/b/Z/brB03rHvZxppdjfDv4slbkpBXdtIN3dE.png" },
  { name: "github.svg", url: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/github.svg" },
  { name: "beli.ico", url: "https://cdn.allmylinks.com/prod/Site/favicon/6/B/t/JBUMgOh2t8Zs_cg0Qz5DHeYwVd0N_kN3.ico" },
  { name: "letterboxd.svg", url: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/letterboxd.svg" },
  { name: "clashroyale.png", url: "https://cdn.allmylinks.com/prod/Site/favicon/O/1/0/OC6UeIEsJ-j8DyxaVHillDCSn3N9l5b8.png" },
  { name: "brawlstars.png", url: "https://cdn.allmylinks.com/prod/Site/favicon/7/R/m/rRUW5dllwYuyFz11bLOLKQorJThhfhly.png" },
  { name: "chess.svg", url: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/chessdotcom.svg" },
  { name: "myanimelist.svg", url: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/myanimelist.svg" },
  { name: "discord.svg", url: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/discord.svg" }
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
