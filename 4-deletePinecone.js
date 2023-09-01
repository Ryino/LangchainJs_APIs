// Load environment variables from .env file

export const deletePinecone = async (indexName, docs, userId, client) => {
  const index = client.Index(indexName);

  try {
    // Delete specific vectors
    const resp = await index.delete1({
      ids: [
        `${userId}`,
      ],
      
    });
    console.log(resp, "deleted");
  } catch (error) {
    console.error("Error deleting vector:", error);
  }
};
