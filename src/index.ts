import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.post('/api/translate', async (req, res) => {
  try {
    const japaneseText = req.body.text?.trim();

    if (!japaneseText) {
      res.status(400).json({ error: '日本語を入力してください。' });
      return;
    }

    const apiKey = process.env.DEEPL_AUTH_KEY;

    if (!apiKey) {
      res.status(500).json({ error: 'APIキーが設定されていません。' });
      return;
    }

    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
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
      res.status(response.status).json({ error: 'DeepLで翻訳できませんでした。' });
      return;
    }

    res.json({ translation: data.translations[0].text });
  } catch {
    res.status(500).json({ error: 'サーバーでエラーが起きました。' });
  }
});

app.listen(3001, () => {
  console.log('翻訳サーバーを http://localhost:3001 で起動しました');
});