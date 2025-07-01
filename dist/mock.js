import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { Readable } from 'stream';
// 配置环境变量
dotenv.config();
const app = express();
const port = process.env.MOCK_PORT || 3001;
// 中间件
app.use(express.json());
app.use(cors());
// 模拟数据
const mockDocuments = [
    {
        id: 'doc-1',
        text: '人工智能（Artificial Intelligence），缩写为AI。它是研究、开发用于模拟、延伸和扩展人的智能的理论、方法、技术及应用系统的一门新的技术科学。',
        relevance_score: 0.95
    },
    {
        id: 'doc-2',
        text: '机器学习是人工智能的核心，它使计算机具有智能的根本途径，其应用遍及人工智能的各个领域，它主要使用归纳、综合而不是演绎。',
        relevance_score: 0.88
    },
    {
        id: 'doc-3',
        text: '自然语言处理（NLP）是人工智能的一个子领域，研究计算机与人类语言之间的交互，特别是如何让计算机理解、分析和生成自然语言。',
        relevance_score: 0.82
    },
    {
        id: 'doc-4',
        text: '深度学习是机器学习的一种形式，它使用多层神经网络来学习数据的表示，已在图像识别、语音识别和自然语言处理等领域取得了显著成果。',
        relevance_score: 0.76
    },
    {
        id: 'doc-5',
        text: '大语言模型（LLM）是一种基于深度学习的自然语言处理模型，能够理解和生成人类语言，如GPT系列、LLaMA等。',
        relevance_score: 0.71
    }
];
// 模拟流式响应
function createStreamResponse(content) {
    const stream = new Readable();
    stream._read = () => { }; // 不需要读取操作
    // 分块发送内容，模拟流式响应
    const chunks = content.split(' ');
    let i = 0;
    const interval = setInterval(() => {
        if (i < chunks.length) {
            const chunk = chunks[i] + (i < chunks.length - 1 ? ' ' : '');
            stream.push(`data: ${JSON.stringify({ content: chunk })}\n\n`);
            i++;
        }
        else {
            clearInterval(interval);
            stream.push(null); // 结束流
        }
    }, 100); // 每100毫秒发送一个块
    return stream;
}
// 模拟搜索API
app.post('/search', (req, res) => {
    const { query, isKnowledge } = req.body;
    console.log(`收到搜索请求: ${query}, isKnowledge: ${isKnowledge}`);
    // 设置流式响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    try {
        let responseContent = '';
        if (isKnowledge === 'true') {
            // 模拟知识库搜索
            responseContent = `基于知识库搜索结果，你的问题"${query}"的答案是：\n\n`;
            // 模拟文档内容
            const relevantDocs = mockDocuments.slice(0, 3);
            responseContent += `找到相关文档：\n${relevantDocs.map(doc => `- ${doc.text}`).join('\n')}\n\n`;
            // 模拟生成回答
            responseContent += `根据上述文档，问题"${query}"的答案是：人工智能是研究、开发用于模拟、延伸和扩展人的智能的技术科学，其核心包括机器学习和深度学习等技术。`;
        }
        else {
            // 模拟直接生成回答
            responseContent = `直接回答你的问题"${query}"：人工智能（AI）是一门旨在创造智能机器的科学，尤其是那些能够执行通常需要人类智能才能完成的任务的机器。`;
        }
        // 返回流式响应
        const stream = createStreamResponse(responseContent);
        stream.pipe(res);
    }
    catch (error) {
        console.error('模拟搜索出错:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: '模拟搜索服务出错' });
        }
    }
});
// 模拟重排序API
app.post('/rerank', (req, res) => {
    const { query, documents } = req.body;
    console.log(`收到重排序请求: ${query}, 文档数量: ${documents.length}`);
    // 模拟重排序结果
    const rerankedResults = mockDocuments.map((doc, index) => ({
        document: {
            id: doc.id,
            text: doc.text
        },
        relevance_score: doc.relevance_score - index * 0.05 // 模拟排序
    }));
    res.status(200).json({
        id: 'mock-rerank-id',
        status_code: 200,
        status_msg: '重排序成功',
        request_id: 'req-' + Date.now(),
        result: {
            documents: rerankedResults
        }
    });
});
// 模拟向量搜索API
app.post('/vector-search', (req, res) => {
    const { query } = req.body;
    console.log(`收到向量搜索请求: ${query}`);
    // 模拟向量搜索结果
    res.status(200).json({
        results: mockDocuments.map(doc => ({
            id: doc.id,
            score: doc.relevance_score,
            payload: { text: doc.text }
        }))
    });
});
// 启动服务器
app.listen(port, () => {
    console.log(`模拟服务器启动成功，监听端口: ${port}`);
    console.log('可用API:');
    console.log('- POST /search - 模拟搜索和回答生成');
    console.log('- POST /rerank - 模拟文档重排序');
    console.log('- POST /vector-search - 模拟向量搜索');
});
