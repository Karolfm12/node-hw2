import cors from "cors";
import express from "express";
import logger from "morgan";
import path from "path";
// import { fileURLToPath } from 'url';
import "dotenv/config";
import { fileURLToPath } from "url";
import connectDB from "./db.js";
import authRouter from "./routes/api/auth.js";
import contactsRouter from "./routes/api/contacts.js";
// require("dotenv").config();
// const express = require("express");
// const logger = require("morgan");
// const cors = require("cors");
// const path = require("path");

// const contactsRouter = require("./routes/api/contacts");
// const authRouter = require("./routes/api/auth");

// const connectDB = require("./db");

const app = express();

connectDB();

const formatsLogger = app.get("env") === "development" ? "dev" : "short";

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/api/contacts", contactsRouter);
app.use("/api/users", authRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

// module.exports = app;
export default app;
