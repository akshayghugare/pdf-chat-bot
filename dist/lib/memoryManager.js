import chalk from 'chalk';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import fs from 'fs/promises';
import path from 'path';
// import { stdout as output } from 'node:process';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { Document } from 'langchain/document';
import { BufferWindowMemory } from 'langchain/memory';
import { getProjectRoot } from '../config/index.js';
const projectRootDir = getProjectRoot();
const memoryDirectory = path.join(projectRootDir, process.env.MEMORY_VECTOR_STORE_DIR || 'memory');
let memoryVectorStore;
try {
    memoryVectorStore = await HNSWLib.load(memoryDirectory, new OpenAIEmbeddings());
}
catch {
    // output.write(`${chalk.blue(`Creating a new memory vector store index in the ${memoryDirectory} directory`)}\n`);
    memoryVectorStore = new HNSWLib(new OpenAIEmbeddings(), {
        space: 'cosine',
        numDimensions: 1536,
    });
}
const bufferWindowMemory = new BufferWindowMemory({
    returnMessages: false,
    memoryKey: 'immediate_history',
    inputKey: 'input',
    k: 2,
});
const memoryWrapper = {
    vectorStoreInstance: memoryVectorStore,
};
async function getMemoryVectorStore() {
    return memoryWrapper.vectorStoreInstance;
}
function getBufferWindowMemory() {
    return bufferWindowMemory;
}
async function saveMemoryVectorStore() {
    await memoryWrapper.vectorStoreInstance.save(memoryDirectory);
}
async function addDocumentsToMemoryVectorStore(documents) {
    const formattedDocuments = documents.map((doc) => new Document({ pageContent: doc.content, metadata: { type: doc.metadataType } }));
    await memoryWrapper.vectorStoreInstance.addDocuments(formattedDocuments);
    await saveMemoryVectorStore();
}
function resetBufferWindowMemory() {
    bufferWindowMemory.clear();
}
async function deleteMemoryDirectory() {
    try {
        const files = await fs.readdir(memoryDirectory);
        const deletePromises = files.map((file) => fs.unlink(path.join(memoryDirectory, file)));
        await Promise.all(deletePromises);
        return `All files in the memory directory have been deleted.`;
    }
    catch (error) {
        if (error instanceof Error) {
            return chalk.red(`All files in the memory directory have been deleted: ${error.message}`);
        }
        return chalk.red(`All files in the memory directory have been deleted: ${error}`);
    }
}
async function resetMemoryVectorStore(onReset) {
    const newMemoryVectorStore = new HNSWLib(new OpenAIEmbeddings(), {
        space: 'cosine',
        numDimensions: 1536,
    });
    await deleteMemoryDirectory();
    onReset(newMemoryVectorStore);
}
function setMemoryVectorStore(newMemoryVectorStore) {
    memoryWrapper.vectorStoreInstance = newMemoryVectorStore;
}
export { getMemoryVectorStore, setMemoryVectorStore, addDocumentsToMemoryVectorStore, resetMemoryVectorStore, getBufferWindowMemory, resetBufferWindowMemory, };
//# sourceMappingURL=memoryManager.js.map