import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { hybridSearch, rerankDocuments, generateMessage } from "./services/index.js";
import { vectorFormat, rerankedFormat } from './utils/common.js';
dotenv.config();
const app = express();
app.use(express.json());
app.use(cors()); // 允许跨域
app.post('/search', async (req, res) => {
    const { query, isKnowledge } = req.body;
    console.log(query, isKnowledge);
    // 设置流式响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    try {
        // 是否为知识库查询
        if (isKnowledge === 'true') {
            // 混合查询
            const docs = await hybridSearch(query);
            // 重新排序
            const rerankedDocuments = await rerankDocuments(query, vectorFormat(docs));
            // 生成消息
            const messages = await generateMessage(query, rerankedFormat(rerankedDocuments));
            // 流式传输响应
            for await (const chunk of messages) {
                const content = chunk.choices[0]?.delta?.content || '';
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
            res.end();
        }
        else {
            // 生成消息
            const messages = await generateMessage(query);
            // 流式传输响应
            for await (const chunk of messages) {
                const content = chunk.choices[0]?.delta?.content || '';
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
            res.end();
        }
    }
    catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ error: 'API Error' });
        }
    }
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log('服务器启动成功，监听端口： 3000...');
});
