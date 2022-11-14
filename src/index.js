import express, { json } from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs";
import joi from "joi";

const userSchema = joi.object({
  name: joi.string().trim().required(),
});

const messageSchema = joi.object({
  to: joi.string().required(),
  text: joi.string().required(),
  type: joi.valid("message", "private_message"),
});

const app = express();

dotenv.config();
app.use(cors());
app.use(json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

try {
  await mongoClient.connect();
  db = mongoClient.db("batePapoUol");
} catch (err) {
  console.log(err);
}

app.post("/participants", async (req, res) => {
  const { name } = req.body;

  const validation = userSchema.validate(req.body, { abortEarly: false });

  if (validation.error) {
    res.sendStatus(422);
    return;
  }

  const newParticipant = {
    name,
    lastStatus: Date.now(),
  };

  const loginStatus = {
    from: newParticipant.name,
    to: "Todos",
    text: "entra na sala...",
    type: "status",
    time: dayjs(newParticipant.lastStatus).format("HH:mm:ss"),
  };

  try {
    const resgisteredUser = await db
      .collection("participants")
      .findOne({ name });

    if (resgisteredUser) {
      res.sendStatus(409);
      return;
    }

    await db.collection("participants").insertOne(newParticipant);
    await db.collection("messages").insertOne(loginStatus);
    res.sendStatus(201);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.get("/participants", async (req, res) => {
  try {
    const participants = await db.collection("participants").find().toArray();
    res.send(participants);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.post("/messages", async (req, res) => {
  const { to, text, type } = req.body;
  const from = req.headers.user;

  const validation = messageSchema.validate(req.body, { abortEarly: false });

  if (validation.error) {
    res.sendStatus(422);
    return;
  }

  const newMessage = {
    from,
    to,
    text,
    type,
    time: dayjs(Date.now()).format("HH:mm:ss"),
  };

  try {
    const resgisteredUser = await db
      .collection("participants")
      .findOne({ from });

    if (!resgisteredUser) {
      res.sendStatus(422);
      return;
    }
    await db.collection("messages").insertOne(newMessage);
    res.sendStatus(201);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.get("/messages", async (req, res) => {
  const limit = Number(req.query.limit);
  const user = req.headers.user;

  try {
    const messages = await db.collection("messages").find().toArray();
    res.send(messages);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.post("/status", async (req, res) => {
  const name = req.headers.user;

  const resgisteredUser = await db.collection("participants").findOne({ name });

  if (!resgisteredUser) {
    res.sendStatus(404);
    return;
  }

  try {
    await db
      .collection("participants")
      .updateOne({ name }, { $set: { lastStatus: Date.now() } });
    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.listen(5000, () => {
  console.log(`Server running in port: ${5000}`);
});
