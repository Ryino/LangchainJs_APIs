// Load environment variables from .env file

export const deletePinecone = async (indexName, docs, userId, client) => {
  const index = client.Index(indexName);

  try {
    // Delete specific vectors
    const resp = await index.delete1({
      ids: [
        `${userId}`,
        // 1,
        // '3_book_2',
        // "C:\\Users\\USER\\Downloads\\Get-Started-With-Langchain-and-Pinecone-in-Node.js-main\\Get-Started-With-Langchain-and-Pinecone-in-Node.js-main\\documents\\The Great Gatsby.txt_6",
      ],
      // deleteAll: true
    });
    console.log(resp, "deleted");
  } catch (error) {
    console.error("Error deleting vector:", error);
  }
};
