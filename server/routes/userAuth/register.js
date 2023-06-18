import express from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import Users from "../../models/Users.js";
const router = express.Router();

dotenv.config();
const jwt_secret = process.env.JWT_SECRET;

router.post("/", async (req, res) => {
  const { username, email, name, password, token = null } = req.body;

  try {
    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const newUser = await Users.create({
      username,
      email,
      password: hashedPassword,
      name,
      token,
    });

    const savedUser = await newUser.save();

    jwt.sign(
      {
        id: savedUser._id,
        username: savedUser.username,
      },
      jwt_secret,
      { expiresIn: 18000 },
      (error, token) => {
        if (error) {
          return res.status(500).json(error);
        }
        newUser.token = token;
        newUser.save();

        res
          .cookie("token", token)
          .status(200)
          .json({
            token,
            user: {
              id: savedUser._id,
              username: savedUser.username,
              email: savedUser.email,
            },
          });
      }
    );
  } catch (error) {
    res.status(500).json({
      error: error,
    });
  }
});

export default router;
