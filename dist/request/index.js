import axios from "axios";
const instance = axios.create({
    baseURL: process.env.DASHSCOPE_API_URL,
    headers: {
        'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`
    }
});
export default instance;
