# AIKnowledgeByNode
NodeJS+LLM搭建一个属于自己的知识库
NodeJS+LLM搭建一个属于自己的知识库
知识库是如何使用NodeJS搭建的，使用NodeJS搭建一个知识库。文章内容选自前端大全，本人针对里面某些确实内容做更详细补充，如有雷同可联系删除

前置条件
Docker： 需要使用Docker安装Qdrant向量数据库
阿里云百炼：需要使用里面的向量模型、排序模型、文本生成模型（自己本地使用Ollama安装也行）OpenAI：使用OpenAI调用模型
Visual Studio Code：前端程序员都使用的编辑器

以下是整个项目的生命周期：


阿里百炼
这里是创建的入口


这里创建新的API-KEY


第二步 数据库安装

这里需要安装Qdrant数据库。Qdrant是一个开源的向量数据库，它可以存储和检索大量的向量，并提供高效的搜索和聚类功能。Qdrant支持多种数据类型，包括字符串、数字、日期、布尔值等。它还支持多种索引类型，包括基于LSH的索引、基于KD树的索引、基于哈希的索引等。
Qdrant数据库中的distance参数介绍：

本人使用1.14.1版本会比较适合

docker pull qdrant/qdrant:v1.14.1
AI写代码
javascript
运行
1
安装完成之后启动数据库

docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant:1.14.1
AI写代码
javascript
运行
1
第三步 服务端代码编写

项目初始化

这里就正式开始写代码了，首先开始写服务端的代码。打开本地工作区文件夹，然后新建一个文件夹server，然后初始化

npm init -y
npm install axios cors dotenv express openai @qdrant/qdrant-js 
npm install @types/cors @types/express @types/node rimraf ts-node typescript -D
AI写代码
javascript
运行
1
2
3
这里采用 express + typescript 编写服务器代码。根目录下面添加tsconfig.json文件并写入以下内容{

 "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "typeRoots": ["./types"],
    "baseUrl": "."
  },
"include": ["src/**/*", "types/**/*", "types/**.d.ts"],
"exclude": ["node_modules", "dist"]
}
AI写代码
javascript
运行

1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
根目录下面添加src文件夹、types文件夹、.env配置文件 然后在package.json中添加

{
  "scripts": {
    "clean": "rimraf dist",
    "build": "npm run clean && tsc",
    "start": "node dist/app.js"
  }
}
AI写代码
javascript
运行
1
2
3
4
5
6
7
这里使用dotenv管理配置，在.env配置文件中添加如下配置

# 服务器配置
PORT=3000
# 阿里云百炼
DASHSCOPE_API_KEY=这里替换成你自己的API-KEY
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DASHSCOPE_API_URL=https://dashscope.aliyuncs.com
DASHSCOPE_API_RERANK_PATH=/api/v1/services/rerank/text-rerank/text-rerank
# Qdrant 向量数据库
QDRANT_API_URL=http://localhost:6333
AI写代码
javascript
运行
1
2
3
4
5
6
7
8
9
然后在src文件夹中新建app.ts文件

import express from'express';
import dotenv from'dotenv'
import cors from'cors'

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors()); // 允许跨域

app.post('/search', async (req, res) => {
    res.send("Hello World!")
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
console.log('服务器启动成功，监听端口： 3000...');
});
AI写代码
javascript
运行

1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
运行 npm run build然后在运行npm run start，然后打开网页。在打开的网页中输入 http://localhost:3000，如果看到 'Hello World!'则代表服务器搭建成功.如果看不到hello world也不影响后面的操作步骤，可以继续进行往下走

初始化数据库
在/src/utils/db.ts中编写数据库初始化代码。dotenv是用来找到.env里面的配置项。

import { QdrantClient } from'@qdrant/qdrant-js'
import dotenv from'dotenv';
dotenv.config();

// 向量数据库配置
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
AI写代码
javascript
运行

1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
使用Axios请求接口
在/src/request/index.ts中编写代码，dotenv.config()只需要在入口文件中执行一次就行，所以这里不需要

import axios from "axios"

const instance = axios.create({
  baseURL: process.env.DASHSCOPE_API_URL,
  headers: {
    'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`
  }
});

export default instance;
AI写代码
javascript
运行

1
2
3
4
5
6
7
8
9
10
API接口
阿里云百炼中的rerank模型只能通过HTTPS请求调用，所以需要写一个接口调用的函数。/scr/api/index.ts中编写代码。

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
AI写代码
javascript
运行

1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
工具函数
由于各个模型之间需要的参数格式不一样，这边还需要两个对查询结果格式进行转换的函数。在/src/utils/common.ts中编写代码。

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
AI写代码
typescript
运行

1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
services函数
这里进行步骤拆分，分别编写输入结果转成向量、数据库搜索、 查询结果排序 、文本生成这4个步骤的函数。在/src/services/index.ts中编写代码。

import initQdrant from "../utils/db.js";
import { OpenAI } from "openai";
import { rerank } from "../api/index.js";

// 类型定义
interface QdrantResult {
  id: string;
  score: number;
  payload?: {
    text?: string;
    [key: string]: any;
  };
  vector?: number[];
}

const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: process.env.DASHSCOPE_BASE_URL,
});

// 单一搜索
export async function queryDocuments(query: string) {
  const qdrant = await initQdrant();
  const vector = await queryVector(query).catch(error => { 
    console.error(error);
    return []; 
  });
  const results = await qdrant.search("knowledge-base", {
    vector,
    limit: 10, // 最多返回10个结果
    with_payload: true // 包含payload
  });
  return results;
}

// 混合搜索
export async function hybridSearch(query: string): Promise<QdrantResult[]> {
  const qdrant = await initQdrant();
  // 获取多模态向量
  const vector = await queryVector(query);
  // 向量搜索
  const vectorResults = await qdrant.search("knowledge-base", {
    vector,
    limit: 10, // 最多返回10个结果
    with_payload: true // 包含payload
  });

  // 关键字搜索
  const keywordResults = await qdrant.search("knowledge-base", {
    vector,
    filter: {
      should: [
        { key: 'text', match: { text: query } }
      ]
    },
    limit: 10, // 最多返回10个结果
    with_payload: true // 包含payload
  });

  // 合并搜索结果（去重）
  const combineResults = Array.from(
    new Set([...vectorResults, ...keywordResults].map(item => JSON.stringify(item)))
  ).map(item => JSON.parse(item));
  return combineResults;
}

// 使用模型将查询文本转换为向量
export async function queryVector(query: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-v3",
    input: query
  });
  return response.data?.[0]?.embedding || [];
}

// 重排序文档
export async function rerankDocuments(query: string, documents: string[]) {
  try {
    const response = await rerank({
      model: "gte-rerank-v2",
      input: {
        query,
        documents
      },
      parameters: {
        return_documents: true, // 返回排序后的文档列表
        top_n: 5 // 最多返回5个结果
      }
    });
    
    if (response.status === 200 && response.data?.output?.results) {
      return response.data.output.results;
    } else {
      throw new Error(`Rerank failed: ${response.data?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error("rerank-api-error: ", error);
    throw error;
  }
}

// 生成聊天消息
export async function generateMessage(query: string, documents?: string[]) {
  let prompt = "";
  if (documents) {
    prompt = `
  请基于\`\`\`内的内容回答问题。
  \`\`\`
  ${documents.join('\n')}
  \`\`\`
  我的问题是：${query}。
`;
  } else {
    prompt = query;
  }

  const response = await openai.chat.completions.create({
    model: "qwen-plus",
    messages: [
      { role: "user", content: prompt }
    ],
    stream: true // 创建流式数据
  });
  return response;
}
AI写代码
javascript
运行

1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
43
44
45
46
47
48
49
50
51
52
53
54
55
56
57
58
59
60
61
62
63
64
65
66
67
68
69
70
71
72
73
74
75
76
77
78
79
80
81
82
83
84
85
86
87
88
89
90
91
92
93
94
95
96
97
98
99
100
101
102
103
104
105
106
107
108
109
110
111
112
113
114
115
116
117
118
119
120
121
122
123
124
125
以上代码中数据库搜索分为单一搜索和混合搜索，混合搜索可以提高准确性。

模型的使用
本转换向量：text-embedding-v3
重排序：gte-rerank-v2
文本生成：qwen-plus

入口函数代码编写
现在回到入口函数中，重新编写代码，/src/app.ts中编写代码，返回给前端的数据采用流式数据的形式返回。判断前端是否需要查询知识库中的内容如果是则进行混合查询对查询结果进行重新排序使用大模型生成文本返回前端

import express from'express';
import dotenv from'dotenv'
import cors from'cors'
import { hybridSearch, rerankDocuments, generateMessage } from"./services/index.js"
import { vectorFormat, rerankedFormat } from'./utils/common.js'
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors()); // 允许跨域


app.post('/search', async (req, res) => {
const { query, isKnowledge } = req.body;
console.log(query, isKnowledge)
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
     const rerankedDocuments  = await rerankDocuments(query, vectorFormat(docs));
     // 生成消息
     const messages = await generateMessage(query, rerankedFormat(rerankedDocuments));
     // 流式传输响应
     for await (const chunk of messages) {
       const content = chunk.choices[0]?.delta?.content || '';
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      res.end();
    } else {
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
catch (error:any) {
   if (!res.headersSent) {
      res.status(500).json({ error: 'API Error' });
    }
  }
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
console.log('服务器启动成功，监听端口： 3000...');
});
AI写代码
javascript
运行

1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
43
44
45
46
47
48
49
50
51
52
53
54
55
56
57
编写测试数据
由于数据库中没有数据，所以我们这里需要往数据库中添加一些测试数据进行测试。在/src/mack.ts中写入测试数据。

import initQdrant from"./utils/db.js";
import { queryVector } from"./services/index.js"
import dotenv from'dotenv'
dotenv.config();

// 生成测试数据
async function generateMockData() {
const qdrant = await initQdrant();
const mockData = [
    {
      id: 1,
      vector: await queryVector(
        "秦牧第一个在幽都出生的胎生生灵秦凤青被封印后身体产生的第二意识，后来与秦凤青分成两个不同的人物。幼年被司婆婆收养。本身是凡体，但被村长苏幕遮骗为霸体，开始了一段波澜壮阔的人生 [85]。秦牧走出大墟之后，成为天魔教教主 [126]。助江白圭平叛，开启了延康变法，后成为人皇，机缘巧合下遇到了生父，揭开了自己开皇帝族遗孤的身份 [250]，得成神法门，开启了新的道法神通改革的大世 [262]。其兄秦凤青破封，大闹佛界、悬空界；和初祖人皇等人一起带领诸神逃出毁灭的太皇天，入天阴界复活天阴娘娘 [382]；回百万年前，大闹天庭；于幽都见其母，与秦凤青合体在玉锁关大战幽都诸神；元界解封，见地母元君。昊天尊下界为斩杀地母元君，延康遭到连累，秦牧因此不得不帮助古神天帝、地母元君复活，一人对抗天庭的四位大帝时，舍弃自己的第三只眼，变作没有魂魄的人，后开天辟地赋神魂，获得新生。去往天庭引发瑶池事件，被派遣到太虚之中，意外成为造物主一族的圣婴，并因此促成造物主一族和无忧乡的和解。"
      ),
      payload: {
        text: "秦牧第一个在幽都出生的胎生生灵秦凤青被封印后身体产生的第二意识，后来与秦凤青分成两个不同的人物。幼年被司婆婆收养。本身是凡体，但被村长苏幕遮骗为霸体，开始了一段波澜壮阔的人生 [85]。秦牧走出大墟之后，成为天魔教教主 [126]。助江白圭平叛，开启了延康变法，后成为人皇，机缘巧合下遇到了生父，揭开了自己开皇帝族遗孤的身份 [250]，得成神法门，开启了新的道法神通改革的大世 [262]。其兄秦凤青破封，大闹佛界、悬空界；和初祖人皇等人一起带领诸神逃出毁灭的太皇天，入天阴界复活天阴娘娘 [382]；回百万年前，大闹天庭；于幽都见其母，与秦凤青合体在玉锁关大战幽都诸神；元界解封，见地母元君。昊天尊下界为斩杀地母元君，延康遭到连累，秦牧因此不得不帮助古神天帝、地母元君复活，一人对抗天庭的四位大帝时，舍弃自己的第三只眼，变作没有魂魄的人，后开天辟地赋神魂，获得新生。去往天庭引发瑶池事件，被派遣到太虚之中，意外成为造物主一族的圣婴，并因此促成造物主一族和无忧乡的和解。",
        source: "test.txt"
      },
    },
    {
      id: 2,
      vector: await queryVector(
        "秦凤青第一个在幽都出生的胎生生灵，被尊为幽都神子。出生便有凌霄战力，拥有古神、半神、后天生灵的优点，不受幽都大道规则控制，相当于一个不受限制的土伯，因作恶多端被土伯封印，身体孕育出了第二个意识：弟弟秦牧。原本同秦牧共用一个身体一个元神，后来因为秦牧要保护秦凤青，将自身与秦凤青分离开来。秦凤青是一个大头娃娃，原本被封印在秦字大陆，实力恐怖，凶悍但只是孩童心性，对他来说，除了娘亲珍王妃之外，世间万物，所有生灵，只有能吃的和不能吃的分别。他能掌控魔性，但对神通道法不感兴趣。由于他算是土伯的弟弟，故此别人也可以对着他立下小土伯之约，违约便会被他吃掉。幽都之战继承土伯的生死簿和部分力量。天庭和延康大战，土伯和虚天尊在幽都中陨落，继承幽都大道，成为新的土伯。最终成道，成为延康的领袖之一。"
      ),
      payload: {
        text: "秦凤青第一个在幽都出生的胎生生灵，被尊为幽都神子。出生便有凌霄战力，拥有古神、半神、后天生灵的优点，不受幽都大道规则控制，相当于一个不受限制的土伯，因作恶多端被土伯封印，身体孕育出了第二个意识：弟弟秦牧。原本同秦牧共用一个身体一个元神，后来因为秦牧要保护秦凤青，将自身与秦凤青分离开来。秦凤青是一个大头娃娃，原本被封印在秦字大陆，实力恐怖，凶悍但只是孩童心性，对他来说，除了娘亲珍王妃之外，世间万物，所有生灵，只有能吃的和不能吃的分别。他能掌控魔性，但对神通道法不感兴趣。由于他算是土伯的弟弟，故此别人也可以对着他立下小土伯之约，违约便会被他吃掉。幽都之战继承土伯的生死簿和部分力量。天庭和延康大战，土伯和虚天尊在幽都中陨落，继承幽都大道，成为新的土伯。最终成道，成为延康的领袖之一。",
        source: "test.txt"
      }
    },
    {
      id: 3,
      vector: await queryVector("灵毓秀是秦牧妻子。身份最初是延康七公主。最初她女扮男装跟随秦飞月将军来到大墟，因身材丰满被秦牧戏称其为肥七公子。与秦牧一同开创了元神引，由于一起修炼了元神引，故是彼此最为亲近的人，多次暗示秦牧奈何秦牧却是感情白痴，曾被瞎子强行拉着秦牧结婚。延康劫后因延丰帝入狱，灵毓秀登基被称为延秀帝，幽都之战后退位与秦牧成婚。与秦牧育有一女，名为秦灵筠。"),
      payload: {
        text: "灵毓秀是秦牧妻子。身份最初是延康七公主。最初她女扮男装跟随秦飞月将军来到大墟，因身材丰满被秦牧戏称其为肥七公子。与秦牧一同开创了元神引，由于一起修炼了元神引，故是彼此最为亲近的人，多次暗示秦牧奈何秦牧却是感情白痴，曾被瞎子强行拉着秦牧结婚。延康劫后因延丰帝入狱，灵毓秀登基被称为延秀帝，幽都之战后退位与秦牧成婚。与秦牧育有一女，名为秦灵筠。",
        source: "test.txt"
      }
    },
    {
      id: 4,
      vector: await queryVector("苏幕遮，残老村村长。坐着担架，无手无脚，为了继续维系残老村众人的关系，欺骗众人秦牧为霸体 [85]。真实身份是人皇，剑法通神，剑法为剑图。残老村第一高手。苏幕遮是秦牧上个时代最强的人，一口剑照耀了一个时代，与上苍诸神争斗，打遍上苍无敌手，最后被上苍背后的真神击败，砍去了手脚。出村后，一剑开皇血汪洋，指引国师剑法入道 [258]。迎战上苍之时，斩杀一尊神之后，与乔星君同归于尽 [647]，神魂被引入酆都 [292]，因吹嘘霸体以及历代人皇被秦牧殴打，经常被前代人皇围攻群殴。复活后修炼了无漏斗战神功后手脚亦重新生长出来。曾由于秦牧穿越时空，在过去留下了霸体传说，导致连苏幕遮也被自己骗了过去 [645]，但后来鬼船一事使得苏幕遮意识到了真相。苏幕遮见开皇之后便受困于心中神，剑斩开皇发丝一缕后，勘破心中神。最终成道。"),
      payload: {
        text: "苏幕遮，残老村村长。坐着担架，无手无脚，为了继续维系残老村众人的关系，欺骗众人秦牧为霸体 [85]。真实身份是人皇，剑法通神，剑法为剑图。残老村第一高手。苏幕遮是秦牧上个时代最强的人，一口剑照耀了一个时代，与上苍诸神争斗，打遍上苍无敌手，最后被上苍背后的真神击败，砍去了手脚。出村后，一剑开皇血汪洋，指引国师剑法入道 [258]。迎战上苍之时，斩杀一尊神之后，与乔星君同归于尽 [647]，神魂被引入酆都 [292]，因吹嘘霸体以及历代人皇被秦牧殴打，经常被前代人皇围攻群殴。复活后修炼了无漏斗战神功后手脚亦重新生长出来。曾由于秦牧穿越时空，在过去留下了霸体传说，导致连苏幕遮也被自己骗了过去 [645]，但后来鬼船一事使得苏幕遮意识到了真相。苏幕遮见开皇之后便受困于心中神，剑斩开皇发丝一缕后，勘破心中神。最终成道。",
        source: "test.txt"
      }
    },
    {
      id: 5,
      vector: await queryVector("司婆婆曾为天圣教圣女。天圣教教主厉天行被司幼幽迷住，想与司幼幽结婚。司幼幽在结婚当日杀掉了厉天行，但厉天行的意识也进入了她的身体。司幼幽化身为司婆婆，带走了有《大育天魔经》，来到了残老村。此后天圣教一直在寻找司幼幽。司婆婆不愿回教当教主，便和天圣教的少年祖师商量，让秦牧做少教主 [125]。之后，厉天行传位给秦牧以后，最后的羁绊褪去，一心一意只想占领司婆婆的身体，但被瞎子和马爷镇压了，最终二人达成协议，司婆婆白天出现，厉天行晚上出现 [646]。厉天行领悟“大育”之道后，为了救司幼幽，离开她的身体，附身到星犴上展开天魔解体而亡 [284]。司幼幽同文元祖师、幽溟太子研究出四天门境界，并因此在后世被称为天尊，并最终成道。"),
      payload: {
        text: "司婆婆曾为天圣教圣女。天圣教教主厉天行被司幼幽迷住，想与司幼幽结婚。司幼幽在结婚当日杀掉了厉天行，但厉天行的意识也进入了她的身体。司幼幽化身为司婆婆，带走了有《大育天魔经》，来到了残老村。此后天圣教一直在寻找司幼幽。司婆婆不愿回教当教主，便和天圣教的少年祖师商量，让秦牧做少教主 [125]。之后，厉天行传位给秦牧以后，最后的羁绊褪去，一心一意只想占领司婆婆的身体，但被瞎子和马爷镇压了，最终二人达成协议，司婆婆白天出现，厉天行晚上出现 [646]。厉天行领悟“大育”之道后，为了救司幼幽，离开她的身体，附身到星犴上展开天魔解体而亡 [284]。司幼幽同文元祖师、幽溟太子研究出四天门境界，并因此在后世被称为天尊，并最终成道。",
        source: "test.txt"
      }
    },
    {
      id: 6,
      vector: await queryVector("马爷在都护府做过几十年的捕快，后来到大理寺任职。破了一场大案之后，名动天下，于是大雷音寺寻到了他 [202]。后来，他因故被大雷音寺追杀，但靠神通打出去。等他有了妻儿，大雷音寺又找上门来，为了妻儿的安危甘愿自断一臂，还了大雷音寺的神通。但大雷音寺依旧追杀马爷，让他妻离子散，家破人亡 [111]。马爷是青龙灵体。他的拳突破声音的局限，突破空气的束缚，爆发出无以伦比的力量。一只手也可以练拳，一只手也是一千只手，一手也可以发出雷音雷霆。修习雷音八式中的千手佛陀。后被秦牧续上断臂。老如来退位，他前去坐镇大雷音寺，一步一阶梯，到了山顶勘破心魔，修成二十诸天，悟破大梵天境，自然而然的成了如来。在魔猿战空成长了起来后，他脱去袈裟，变回了马神捕。"),
      payload: {
        text: "马爷在都护府做过几十年的捕快，后来到大理寺任职。破了一场大案之后，名动天下，于是大雷音寺寻到了他 [202]。后来，他因故被大雷音寺追杀，但靠神通打出去。等他有了妻儿，大雷音寺又找上门来，为了妻儿的安危甘愿自断一臂，还了大雷音寺的神通。但大雷音寺依旧追杀马爷，让他妻离子散，家破人亡 [111]。马爷是青龙灵体。他的拳突破声音的局限，突破空气的束缚，爆发出无以伦比的力量。一只手也可以练拳，一只手也是一千只手，一手也可以发出雷音雷霆。修习雷音八式中的千手佛陀。后被秦牧续上断臂。老如来退位，他前去坐镇大雷音寺，一步一阶梯，到了山顶勘破心魔，修成二十诸天，悟破大梵天境，自然而然的成了如来。在魔猿战空成长了起来后，他脱去袈裟，变回了马神捕。",
        source: "test.txt"
      }
    },
  ];

// 将Mock数据插入Qdrant
await qdrant.upsert("knowledge-base", {
    points: mockData,
  });

console.log("测试数据插入成功！");
}

generateMockData();
AI写代码
javascript
运行

1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
43
44
45
46
47
48
49
50
51
52
53
54
55
56
57
58
59
60
61
62
63
64
65
66
67
68
69
70
71
72
以上代码写入了6条测试数据以提供给我们使用
插入测试数据首先在package.json文件中添加一行

{
  ...以前的代码不变
  "scripts": {
    ...以前的代码不变
    "mock": "node dist/mack.js"
  },
  ...以前的代码不变
}
AI写代码
javascript
运行
1
2
3
4
5
6
7
8
然后执行 npm run build之后再执行npm run mock，执行完成之后看到测试数据插入成功！则代表测试数据插入成功。可以打开网址http://localhost:6333/dashboard查看测试数据。


点击 knowledge-base可以看到以上内容。


第四步 客户端代码编写
以上的服务端代码编写完成之后，我们还需要写一个对应的客户端代码才行，这里采用Vite + React + tailwindcss + AntD 快速搭建一个客户端项目。项目初始化使用Vite快速搭建一个React项目

npm create vite@5.2.1
AI写代码
javascript
运行
1
创建完成之后进入项目目录安装需要的依赖

npm install antd react-router tailwindcss
npm install @tailwindcss/vite @types/node -D
AI写代码
javascript
运行
1
2
配置vite.config.ts

import { defineConfig } from'vite'
import react from'@vitejs/plugin-react-swc'
import tailwindcss from'@tailwindcss/vite'
import { resolve } from'path'


const pathResolve = (dir: string): string => {
return resolve(__dirname, '.', dir)
}

// https://vitejs.dev/config/
exportdefault defineConfig({
base: "/",
resolve: {
    alias: {
      '@': pathResolve('./src/'),
    }
  },
plugins: [
    react(),
    tailwindcss()
  ],
})
AI写代码
javascript
运行

1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
编写页面和接口调用函数在
/src/request/index.ts初始化fetch调用方法

const BASE_URL = 'http://localhost:3000';
interface Headers {
  [key: string]: string;
}

const formatParams = (params:Record<string, string>) => {
returnObject.keys(params).map(key => {
    returnencodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
  }).join('&');
}

const instance = {
get (url:string, params:Record<string, string>, headers:Headers) {
    return fetch(`${BASE_URL}${url}?${formatParams(params)}`, {
      method: 'GET',
      headers: Object.assign({
        'Content-Type': 'application/json'
      }, headers),
    })
  },
  post (url:string, data:Record<string, string>, headers:Headers) {
    return fetch(`${BASE_URL}${url}`, {
      method: 'POST',
      headers: Object.assign({
        'Content-Type': 'application/json'
        }, headers),
        body: JSON.stringify(data)
    })
  }
}

exportdefault instance;
AI写代码
javascript
运行

1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
在 /src/api/search.ts中编写接口调用函数，由于服务端使用了流式数据返回，所以客户端也需要使用流式数据接收。

import instance from "@/request/index"

export function search(data: Record<string, string>) {
  return instance.post('/search', data, {
    responseType: "stream"
  })
}
AI写代码
javascript
运行
1
2
3
4
5
6
7
在 /src/views/home/index.tsx中编写页面代码，页面是一个聊天窗口

import { useState, useRef, KeyboardEvent, useEffect } from'react';
import { Switch, Input } from'antd';
import { search } from'@/api/search'

exportfunction Home() {
const [messages, setMessages] = useState<Array<{text: string; isUser: boolean}>>([]);
const [inputValue, setInputValue] = useState('');
const [useKnowledgeBase, setUseKnowledgeBase] = useState(false);
const inputRef = useRef(null);
const messagesEndRef = useRef<HTMLDivElement>(null);

const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

const handleSendMessage = async () => {
    if (inputValue.trim()) {
      const oldMessage = [...messages, { text: inputValue, isUser: true }];
      setMessages([...oldMessage]);
      setInputValue('');
      const message = { text: "", isUser: false };
      const response = await search({ query: inputValue, isKnowledge: useKnowledgeBase + '' });
      // 流式读取数据
      const reader = response.body?.pipeThrough(new TextDecoderStream()).getReader();
      if (!reader) return;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        // 解析SSE数据块
        value.split("\n\n").forEach(chunk => {
          if (chunk.startsWith('data: ')) {
            const data = JSON.parse(chunk.replace("data: ", ""));
            message.text += data.content;
            setMessages([...oldMessage, message]);
          }
        })
      }
    }
  };

const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

return (
    <div className="w-4xl border-2 border-gray-200 rounded-md p-4 mx-auto mt-7 h-5/6 flex flex-col">
      <div className="flex-1 overflow-auto mb-4 space-y-2 scrollbar-thin">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`p-3 rounded-lg max-w-xl ${msg.isUser ? 'bg-blue-500 text-white' : 'bg-gray-200 mr-auto'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          <span className="mr-2">知识库</span>
          <Switch
            checked={useKnowledgeBase}
            onChange={setUseKnowledgeBase}
            checkedChildren="开"
            unCheckedChildren="关"
          />
        </div>
        <Input.TextArea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息..."
          autoSize={{ minRows: 1, maxRows: 4 }}
          className="flex-1"
        />
        <button
          onClick={handleSendMessage}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          发送
        </button>
      </div>
    </div>
  );
}
AI写代码
javascript
运行

1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
43
44
45
46
47
48
49
50
51
52
53
54
55
56
57
58
59
60
61
62
63
64
65
66
67
68
69
70
71
72
73
74
75
76
77
78
79
80
81
82
83
84
85
86
87
88
89
90
91
92
93
94
95
96
修改main.tsx文件，将里面的APP替换成自己的home文件下面的index文件


启动项目客户端根目录下使用命令行启动项目npm run dev


服务端根目录下使用命令行启动项目npm run start
这是客户端窗口：这是服务端窗口：


第五步 测试项目首先测试一下不使用知识库的情况：

返回的结果不是我们知识库里面的数据。打开知识库开关重新测试：返回的是知识库中的结果
————————————————

                            版权声明：本文为博主原创文章，遵循 CC 4.0 BY-SA 版权协议，转载请附上原文出处链接和本声明。
                        
原文链接：https://blog.csdn.net/weixin_44835783/article/details/148928735
