import axios from "../request/index.js";
// 文本排序模型
export function rerank(data) {
    const apiPath = process.env.DASHSCOPE_API_RERANK_PATH;
    return axios.post(apiPath, data);
}
