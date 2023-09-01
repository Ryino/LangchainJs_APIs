// 1. Import required modules
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
// 2. Export updatePinecone function
export const updatePinecone = async (client, indexName, docs, userId) => {
  console.log("Retrieving Pinecone index...");
  // 3. Retrieve Pinecone index
  const index = client.Index(indexName);
  // 4. Log the retrieved index name
  console.log(`Pinecone index retrieved with name: ${indexName}`);
  // 5. Process each document in the docs array
  for (const doc of docs) {
    console.log(`Processing document: ${doc.metadata.source}`);
    const txtPath = doc.metadata.source;

    const text = doc.pageContent;
    // 6. Create RecursiveCharacterTextSplitter instance
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    // console.log("TEXT",textSplitter)
    console.log("Splitting text into chunks...");
    // 7. Split text into chunks (documents)
    const chunks = await textSplitter.createDocuments([text]);
    console.log(`Text split into ${chunks.length} chunks`);
    console.log(
      `Calling OpenAI's Embedding endpoint documents with ${chunks.length} text chunks ...`
    );
    // 8. Create OpenAI embeddings for documents

    const embeddingsArrays = await new OpenAIEmbeddings().embedDocuments(
      chunks.map((chunk) => chunk.pageContent.replace(/\n/g, " "))
    );
    console.log(`Finished embedding documents(${doc.metadata.source})`);
    console.log(
      `Creating ${chunks.length} vectors array with id, values, and metadata...`
    );
    // 9. Create and upsert vectors in batches of 100
    const batchSize = 100;
    let batch = [];
    for (let idx = 0; idx < chunks.length; idx++) {
      const chunk = chunks[idx];
      // const id = `${userId}_${txtPath}_${idx}`;
      const id = `${userId}_book_${idx}`;
      console.log(id);
      const vector = {
        id: id,
        values: embeddingsArrays[idx], //order of embeddings is same as  id.
        metadata: {
          ...chunk.metadata,
          loc: JSON.stringify(chunk.metadata.loc),
          pageContent: chunk.pageContent,
          txtPath: txtPath,
          filter: userId,
          userId: userId,
        },
      };

      batch.push(vector);
      // When batch is full or it's the last item, upsert the vectors
      if (batch.length === batchSize || idx === chunks.length - 1) {
        await index.upsert({
          upsertRequest: {
            vectors: batch,
          },
        });
        // Empty the batch
        batch = [];
      }
    }
    // 10. Log the number of vectors updated
    console.log(`Pinecone index updated with ${chunks.length} vectors`);
  }
};
