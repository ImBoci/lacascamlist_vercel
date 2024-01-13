import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import moment from "moment";

import {} from "dotenv/config";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL + "?sslmode=require",
});

pool.connect((err) => {
  if (err) throw err;
  console.log("Sikeresen csatlakozva az adatbázishoz!");
});

const app = express();
const port = 3000;

// const db = new pg.Client({
//   user: process.env.USERNAME,
//   host: process.env.HOSTNAME,
//   database: process.env.DATABASE_NAME,
//   password: process.env.PASSWORD,
//   port: 5432,
// });
// db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function checkScams() {
  const result = await pool.query(
    "SELECT id, scam_name, scam_description, TO_CHAR(scam_time:: DATE, 'YYYY Month DD') AS scam_time FROM scamlist ORDER BY id ASC"
  );
  let scams = result.rows;
  console.log(result.rows);
  return scams;
}

function firstDigit(num) {
  const len = String(Math.abs(num)).length;
  const divisor = 10 ** (len - 1);
  return Math.trunc(num / divisor);
}

async function checkAchievements() {
  const result = await pool.query("SELECT * FROM achievements");
  let achievements = result.rows;
  console.log(achievements);
  return achievements;
}

async function checkIfAcExists() {
  const result = await pool.query(
    "SELECT EXISTS(SELECT 1 FROM achievements WHERE ac_name = '10 scams achieved')"
  );
  let acExists = result.rows;
  console.log(acExists);
  return acExists;
}

app.get("/", async (req, res) => {
  const scams = await checkScams();
  const acExists = await checkIfAcExists();

  let id = [];
  scams.forEach((scam) => {
    id.push(scam.id);
  });

  const id_len = id.length;

  if (id.length % 10 === 0) {
    await pool.query(
      "INSERT INTO achievements(ac_name) SELECT ($1::VARCHAR || ' scams achieved') WHERE NOT EXISTS(SELECT ac_name FROM achievements WHERE ac_name = ($1 || ' scams achieved'))",
      [id_len]
    );
  }

  const progressLengthPercent = id.length * 10;
  const progressLength =
    progressLengthPercent - firstDigit(progressLengthPercent) * 100;
  console.log(progressLength);

  res.render("index.ejs", {
    scams: scams,
    progressLength: progressLengthPercent,
    reset: progressLength,
    id_len: id_len,
    acExists: acExists,
  });
});

app.get("/newscam", (req, res) => {
  res.render("newscam.ejs");
});

app.post("/newscam", async (req, res) => {
  const title = req.body.newScamTitle;
  const description = req.body.newScamDescription;
  const date = req.body.newScamDate;
  await console.log(date);

  try {
    if (typeof date === "undefined" || date == null || date === "") {
      await pool.query(
        "INSERT INTO scamlist (scam_name, scam_description) VALUES ($1, $2)",
        [title, description]
      );
    } else {
      await pool.query(
        "INSERT INTO scamlist (scam_name, scam_description, scam_time) VALUES ($1, $2, $3)",
        [title, description, date]
      );
    }
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
});

app.post("/editScam", async (req, res) => {
  const title = req.body.updatedItemTitle;
  const description = req.body.updatedItemDescripton;
  const id = req.body.updatedItemId;

  try {
    await pool.query(
      "UPDATE scamlist SET scam_name = ($1), scam_description = ($2) WHERE id = $3",
      [title, description, id]
    );
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});

app.post("/deleteScam", async (req, res) => {
  const id = req.body.deleteItemId;
  try {
    await pool.query("DELETE FROM scamlist WHERE id = $1", [id]);
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});

app.get("/achievements", async (req, res) => {
  const achievements = await checkAchievements();
  res.render("achievements.ejs", { achievements: achievements });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
