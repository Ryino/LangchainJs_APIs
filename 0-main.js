import express from "express";
import { PineconeClient } from "@pinecone-database/pinecone";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import dotenv from "dotenv";
import { createPineconeIndex } from "./1-createPineconeIndex.js";
import { updatePinecone } from "./2-updatePinecone.js";
import { queryPineconeVectorStoreAndQueryLLM } from "./3-queryPineconeAndQueryGPT.js";
import { deletePinecone } from "./4-deletePinecone.js";
import { upload } from "./multer.middleware.js";
import * as fs from "fs";
import path from "path";

dotenv.config();

const uploadFile = upload.fields([{ name: "document", maxCount: 1 }]);

const app = express();
const port = process.env.PORT || 3000;

const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "public")));

const vectorDimension = 1536;
const indexName = "index_name";//index name 
let client;
let docs;

async function main() {
  // Initialize Pinecone client with API key and environment
  client = new PineconeClient();
  await client.init({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT,
  });

  app.listen(port, () => {
    console.log(`App listening on PORT ${port}`);
  });
}

app.get("/create", async (req, res) => {
  await createPineconeIndex(client, indexName, vectorDimension);
  res.send("Pinecone index created.");
});

app.get("/update", uploadFile, async (req, res) => {
  const userId = req.query.userId;
  const file = req.files?.document?.[0];
  const loader = new DirectoryLoader(`./${userId}documents`, {
    ".txt": (path) => new TextLoader(path),
    ".pdf": (path) => new PDFLoader(path),
  });

  docs = await loader.load();
  let fileData;
  let filePath = path.join(
    __dirname + `/${userId}documents/${file.originalname}`
  );
  console.log("PATH", filePath);
  fs.readFile(filePath, "utf8", async (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    fileData = data;
    await updatePinecone(client, indexName, docs, userId);
  });
  res.send(`Pinecone data for user ${userId} updated.`);
});


app.get("/query", async (req, res) => {
  const userId = req.query.userId;
  let question = req.query.question;

  const answer = await queryPineconeVectorStoreAndQueryLLM(
    client,
    indexName,
    userId,
    question
  );
  if (answer) {
    res.status(200).json({
      userId,
      answer,
      question,
    });
  } else {
    res.send("No matches!");
  }
});

// vector is deleted by vector id (not using metadata filter)
app.get("/delete", async (req, res) => {
  const userId = req.query.userId;
  await deletePinecone(indexName, docs, userId, client);
  res.send(`Pinecone data for user ${userId} deleted.`);
});

main().catch((error) => {
  console.error("Error:", error);
});
