// 定义Qdrant查询结果类型
interface QdrantResult {
  id: string;
  score: number;
  payload?: {
    text?: string;
    [key: string]: any;
  };
  vector?: number[];
}

// 定义Reranked查询结果类型
interface RerankedResult {
  document: {
    id: string;
    text?: string;
  };
  relevance_score: number;
}
// qdrant查询的向量转换成文本格式
export function vectorFormat(docments: QdrantResult[]):string[] {
const arr = docments.map(docment => {
    if (docment.payload && docment.payload.text) {
      return docment.payload.text as string
    }
    return""
  })
return arr
}
// reranked查询结果进行转换
export function rerankedFormat(docments: RerankedResult[]):string[] {
const arr = docments.map(docment => {
    if (docment.document && docment.document.text) {
      return docment.document.text as string
    }
    return""
  })
return arr
}