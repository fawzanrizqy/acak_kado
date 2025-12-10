const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 3000;

// ini link to json nya yang nyimpen data participant x gift
const DATA_PATH = path.join(__dirname, "data", "gift.json");

function loadParticipants() {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") {
      fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
      fs.writeFileSync(DATA_PATH, "[]", "utf8");
      return [];
    }
    console.error("Error reading gift.json:", err);
    return [];
  }
}

function saveParticipants(participants) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(participants, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing gift.json:", err);
  }
}

let participants = loadParticipants();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => res.redirect("/register"));

/* ========= REGISTER ========= */
app.get("/register", (req, res) => {
  const lastGift = participants.length
    ? Math.max(...participants.map((p) => p.gift))
    : null;

  res.render("register", {
    lastGift,
    error: null,
    lastName: "",
  });
});

app.post("/register", (req, res) => {
  const { name, gift } = req.body;

  const lastGift = participants.length
    ? Math.max(...participants.map((p) => p.gift))
    : null;

  if (!name || !gift) {
    return res.render("register", {
      lastGift,
      error: "Name and gift number are required.",
      lastName: name || "",
    });
  }

  const numericGift = Number(gift);

  const isGiftTaken = participants.some((p) => p.gift === numericGift);

  if (isGiftTaken) {
    return res.render("register", {
      lastGift,
      error: `Gift number ${numericGift} is already used.`,
      lastName: name,
    });
  }

  participants.push({
    name: name.trim(),
    gift: numericGift,
    get: null,
  });

  //write ke jsonnya
  saveParticipants(participants);

  res.redirect("/list");
});

/* ========= LIST ========= */
app.get("/list", (req, res) => {
  res.render("list", { participants });
});

/* ========= RESULT + SHUFFLE / RESET ========= */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

app.post("/shuffle", (req, res) => {
  if (!participants.length) {
    return res.json({ ok: false, message: "No participants" });
  }

  const gifts = participants.map((p) => p.gift);
  let shuffled;

  if (participants.length === 1) {
    shuffled = [...gifts];
  } else {
    do {
      shuffled = shuffleArray([...gifts]);
    } while (shuffled.some((g, i) => g === participants[i].gift));
  }

  participants.forEach((p, i) => {
    p.get = shuffled[i];
  });

  saveParticipants(participants);

  res.json({ ok: true, participants });
});

app.post("/reset", (req, res) => {
  participants.forEach((p) => {
    p.get = null;
  });

  saveParticipants(participants);

  res.json({ ok: true });
});

app.get("/result", (req, res) => {
  const shuffled = [...participants];

  // pake metode fisher yates
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  res.render("result", { participants: shuffled });
});

app.listen(port, () => {
  console.log(`Server running → http://localhost:${port}`);
});
