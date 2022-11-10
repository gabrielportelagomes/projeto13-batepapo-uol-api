import express, { json } from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs";

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

  const newParticipant = {
    name,
    lastStatus: Date.now(),
  };

  console.log(newParticipant.lastStatus);

  const loginStatus = {
    from: newParticipant.name,
    to: "Todos",
    text: "entra na sala...",
    type: "status",
    time: dayjs(newParticipant.lastStatus).format("HH:mm:ss"),
  };

  try {
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

  const newMessage = {
    from,
    to,
    text,
    type,
    time: dayjs(Date.now()).format("HH:mm:ss"),
  };

  try {
    await db.collection("messages").insertOne(newMessage);
    res.sendStatus(201);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.get("/messages", async (req, res) => {
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

  try {
    await db
      .collection("participants")
      .updateOne({ name }, { $set: { lastStatus: Date.now() } });
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.listen(5000, () => {
  console.log(`Server running in port: ${5000}`);
});
