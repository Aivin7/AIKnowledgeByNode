import { AxiosResponse } from "axios"
import axios from "../request/index.js"
interface RData {
  model: string;
  input: {
    query: string;
    documents: string[];
  };
  // 添加 parameters 属性
  parameters?: {
    return_documents: boolean;
    top_n: number;
  };
}
// 定义响应数据类型
interface RerankOutput {
  output: any;
  message: string;
  id: string;
  status_code: number;
  status_msg: string;
  request_id: string;
  result: {
    documents: {
      id: string;
      text: string;
      relevance_score: number;
    }[];
  };
}

// 文本排序模型
export function rerank (data:RData):Promise<AxiosResponse<RerankOutput, any>> {
   const apiPath = process.env.DASHSCOPE_API_RERANK_PATH as string;
  return  axios.post(apiPath, data);
}