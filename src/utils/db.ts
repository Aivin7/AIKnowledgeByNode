import { QdrantClient } from'@qdrant/qdrant-js'
import dotenv from'dotenv';
dotenv.config();

// 向量数据库配置
const qdrant = new QdrantClient({ url: process.env.QDRANT_API_URL });

let init = false;
// 初始化知识库集合
async function initQdrant () {
if (init) return qdrant;
// 知识库集合名称
const collectionName = "knowledge-base";
try {
    // 检查集合是否存在
    const { exists } = await qdrant.collectionExists(collectionName);
    
    if (!exists) {
      // 创建知识库集合
      await qdrant.createCollection(collectionName,{
        vectors: {
          size: 1024, // 这里使用的是 multimodal-embedding-v1 模型，所以向量维度为 1024，向量维度需和模型对齐
          distance: 'Cosine'// 相似度算法（可选 Cosine/Euclidean/Dot/Manhattan）
        }
      });
      console.log("知识库集合创建成功.");
    } else {
      console.log("知识库集合已存在.");
    }
  } catch (error) {
    console.error("初始化知识库集合失败:", error);
  }
  init = true;
return qdrant;
}

export default initQdrant;