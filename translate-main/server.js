import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/translate", async (req, res) => {
  try {
    const { text, target } = req.body;
    console.log("Gelen body:", req.body); // Debug için
    const r = await fetch("https://libretranslate.com/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, source: "auto", target, format: "text" })
    });
    const data = await r.json();
    console.log("API cevabı:", data); // Debug için
    res.json(data); // direk API cevabını dön
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Translation failed" });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));