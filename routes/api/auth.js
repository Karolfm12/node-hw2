// const express = require("express");
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");
// const User = require("../../models/user");
// const { authenticate } = require("../../middlewares/authenticate");
// const Joi = require("joi");
// const nanoid = require("nanoid");
// const formData = require("form-data");
// const Mailgun = require("mailgun.js");
import gravatar from "gravatar";

import bcrypt from "bcryptjs";
import express from "express";
import formData from "form-data";
import Joi from "joi";
import jwt from "jsonwebtoken";
import Mailgun from "mailgun.js";
import { nanoid } from "nanoid";
import { authenticate } from "../../middlewares/authenticate.js";
import User from "../../models/user.js";
// const multer = require("multer");
import multer from "multer";
// const path = require("path");
import path from "path";
// const Jimp = require("jimp");
import Jimp from "jimp";
// const fs = require("fs/promises");
import fs from "fs/promises";

const router = express.Router();

const { JWT_SECRET, MAILGUN_API_KEY, MAILGUN_DOMAIN } = process.env;

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "api",
  key: MAILGUN_API_KEY,
});

const validateUser = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });
  return schema.validate(data);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../tmp"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.post("/signup", async (req, res, next) => {
  try {
    const { error } = validateUser(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email in use" });
    }

    const avatarURL = gravatar.url(email, { s: "250" });
    const verificationToken = nanoid();
    const user = new User({ email, password, avatarURL, verificationToken });
    await user.save();

    const verificationLink = `http://localhost:3000/api/users/verify/${verificationToken}`;

    const data = {
      from: `Excited User <mailgun@${MAILGUN_DOMAIN}>`,
      to: [email],
      subject: "Email Verification",
      text: `Please verify your email by clicking the following link: ${verificationLink}`,
      html: `<h1>Please verify your email by clicking the following link:</h1><a href="${verificationLink}">${verificationLink}</a>`,
    };

    mg.messages
      .create(MAILGUN_DOMAIN, data)
      .then((msg) => console.log(msg))
      .catch((err) => console.log(err));

    res.status(201).json({
      user: {
        email: user.email,
        subscription: user.subscription,
        avatarURL: user.avatarURL,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/verify/:verificationToken", async (req, res, next) => {
  try {
    const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.verify = true;
    user.verificationToken = null;
    await user.save();

    res.status(200).json({ message: "Verification successful" });
  } catch (error) {
    next(error);
  }
});

router.post("/verify", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "missing required field email" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verify) {
      return res
        .status(400)
        .json({ message: "Verification has already been passed" });
    }

    const verificationLink = `http://localhost:3000/api/users/verify/${user.verificationToken}`;

    const data = {
      from: `Excited User <mailgun@${MAILGUN_DOMAIN}>`,
      to: [email],
      subject: "Email Verification",
      text: `Please verify your email by clicking the following link: ${verificationLink}`,
      html: `<h1>Please verify your email by clicking the following link:</h1><a href="${verificationLink}">${verificationLink}</a>`,
    };

    mg.messages
      .create(MAILGUN_DOMAIN, data)
      .then((msg) => console.log(msg))
      .catch((err) => console.log(err));

    res.status(200).json({ message: "Verification email sent" });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { error } = validateUser(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }

    const payload = { id: user._id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
    user.token = token;
    await user.save();

    res.status(200).json({
      token,
      user: {
        email: user.email,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/logout", authenticate, async (req, res, next) => {
  try {
    req.user.token = null;
    await req.user.save();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/current", authenticate, async (req, res) => {
  res.status(200).json({
    email: req.user.email,
    subscription: req.user.subscription,
  });
});

router.patch(
  "/avatars",
  authenticate,
  upload.single("avatar"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "File not provided" });
      }

      const { path: tempPath, filename } = req.file;
      const avatarPath = path.join(__dirname, "../../public/avatars", filename);
      try {
        const avatar = await Jimp.read(tempPath);
        await avatar.resize(250, 250).writeAsync(avatarPath);
        await fs.unlink(tempPath);
      } catch (err) {
        throw new Error("Failed to process image");
      }

      req.user.avatarURL = `/public/avatars/${filename}`;
      await req.user.save();

      res.status(200).json({ avatarURL: req.user.avatarURL });
    } catch (error) {
      next(error);
    }
  }
);

// module.exports = router;
export default router;
