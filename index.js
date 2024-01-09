// import express from "express";
// import bodyParser from "body-parser";
const express = require("express");
const bodyParser = require("body-parser");
// import pg from "pg";

const postgre = require("./database");

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
  const result = await postgre.query("SELECT * FROM scamlist ORDER BY id ASC");
  let scams = result.rows;
  console.log(result.rows);
  return scams;
}

app.get("/", async (req, res) => {
  const scams = await checkScams();
  res.render("index.ejs", { scams: scams });
});

app.get("/newscam", (req, res) => {
  res.render("newscam.ejs");
});

app.post("/newscam", async (req, res) => {
  const title = req.body.newScamTitle;
  const description = req.body.newScamDescription;

  try {
    await postgre.query(
      "INSERT INTO scamlist (scam_name, scam_description) VALUES ($1, $2)",
      [title, description]
    );
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
    await postgre.query(
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
    await postgre.query("DELETE FROM scamlist WHERE id = $1", [id]);
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
