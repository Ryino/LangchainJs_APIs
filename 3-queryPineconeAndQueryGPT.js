import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { loadQAStuffChain } from "langchain/chains";
import { Document } from "langchain/document";

export const queryPineconeVectorStoreAndQueryLLM = async (
  client,
  indexName,
  userId,
  question
) => {
  // Start query process
  console.log("Querying Pinecone vector store for...", indexName);

  // Retrieve the Pinecone index
  const index = client.Index(indexName);

  // Create query embedding
  const queryEmbedding = await new OpenAIEmbeddings({}).embedQuery(question);

  // Query Pinecone index and return top 10 matches
  let queryResponse = await index.query({
    queryRequest: {
      topK: 5,
      vector: queryEmbedding,
      includeMetadata: true,
      includeValues: true,
      filter: {
        userId: { $eq: userId },
      },
    },
  });

  // Log the number of matches
  console.log(`Found ${queryResponse.matches.length} matches...`);

  // Log the question being asked
  console.log(`Asking question: ${question}...`);

  if (queryResponse.matches.length) {
    // Create an OpenAI instance and load the QAStuffChain
    const llm = new OpenAI({
      modelName: "gpt-3.5-turbo",// use davinci for better results ( line 44)
      // modelName: "text-davinci-002",
      temperature: 0,
    });
    const chain = loadQAStuffChain(llm);

    // Extract and concatenate page content from matched documents
    const concatenatedPageContent = queryResponse.matches
      .filter((match) => match.metadata.userId === userId)
      .map((match) => match.metadata.pageContent)
      .join(" ");

    // Execute the chain with input documents and question
    chain._chainType;
    const result = await chain.call({
      input_documents: [new Document({ pageContent: concatenatedPageContent })],
      question: question,
    });

    // Log the answer
    console.log(`Answer: ${result.text}`);
    return result.text;
  } else {
    // Log that there are no matches, so GPT-3 will not be queried
    console.log("Since there are no matches, GPT-3 will not be queried.");
  }
};
