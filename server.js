require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(bodyParser.json());

// Webhookエンドポイント
app.post('/webhook', async (req, res) => {
    const events = req.body.events;
    for (let event of events) {
        if (event.type === 'message' && event.message.type === 'text') {
            const userMessage = event.message.text;
            const replyToken = event.replyToken;

            // ChatGPTに問い合わせ
            const chatGptReply = await askChatGPT(userMessage);

            // LINEに返信
            await replyToLine(replyToken, chatGptReply);
        }
    }
    res.sendStatus(200);
});

// ChatGPTに問い合わせる関数
async function askChatGPT(message) {
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4',
            messages: [{ role: 'system', content: 'あなたは優秀な占い師です。' },
                       { role: 'user', content: message }]
        }, {
            headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` }
        });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error(error);
        return '申し訳ありませんが、占いができませんでした。';
    }
}

// LINEに返信する関数
async function replyToLine(replyToken, message) {
    try {
        await axios.post('https://api.line.me/v2/bot/message/reply', {
            replyToken: replyToken,
            messages: [{ type: 'text', text: message }]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
            }
        });
    } catch (error) {
        console.error(error);
    }
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
