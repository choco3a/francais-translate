require('dotenv').config();
const express = require('express');


const app = express();
app.use(express.json());

app.post('/api/translate', async (req, res) => {
  try {
    const japaneseText = req.body.text?.trim();

    if (!japaneseText) {
      return res.status(400).json({ error: '日本語を入力してください。' });
    }

    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${process.env.DEEPL_AUTH_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [japaneseText],
        source_lang: 'JA',
        target_lang: 'FR',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: 'DeepLへの翻訳依頼に失敗しました。' });
    }

    res.json({ translation: data.translations[0].text });
  } catch {
    res.status(500).json({ error: 'サーバーでエラーが起きました。' });
  }
});

app.listen(3001, () => {
  console.log('翻訳サーバーを http://localhost:3001 で起動しました');
});