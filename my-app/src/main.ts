document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <h1>フランス語の学習</h1>
  <div class="container">
    <div class="japanese-side">
      <p class="language-label">日本語</p>
      <textarea type="text" id="japanese"></textarea>
      <button id="clear_button">×</button>
    </div>

    <div>
      <p class="language-label">→</p>
      <button id="translation">翻訳</button>
    </div>
    <div class="france-side">
      <p class="language-label">フランス語</p>
      <textarea type="text" id="francais"></textarea>
    </div>
    <div class="right">
      <button id="speak-input-button">🔊 読み上げ</button>
      <button id="keep-button">☆</button>
    </div>
  </div>
  <ul id="translation-list"></ul>`

  const japanese = document.querySelector<HTMLTextAreaElement>('#japanese')!;
  const francais = document.querySelector<HTMLTextAreaElement>('#francais')!;
  const keepButton = document.querySelector<HTMLButtonElement>('#keep-button')!;
  const translationList = document.querySelector<HTMLUListElement>('#translation-list')!;
  const speakInputButton = document.querySelector<HTMLButtonElement>('#speak-input-button')!;
  const translateButton = document.querySelector<HTMLButtonElement>('#translation')!;
  const clearButton = document.querySelector<HTMLButtonElement>('#clear_button')!;

  type Keeplist = {
    japaneseText: string;
    francaisText: string;
  };
  const keeplist:Keeplist[] = [];

  const savedData = localStorage.getItem('keeping');

  if(savedData){
    const currentSetting:Keeplist[] = JSON.parse(savedData);

    currentSetting.forEach(element => {
      keeplist.push(element);
      showKeep(element);
    });
  };

  clearButton.addEventListener('click', () => {
    francais.value = '';
    japanese.value = '';
  });

  translateButton.addEventListener('click', async () => {
    const text = japanese.value.trim();

    if(!text) {
      return;
    };

    translateButton.disabled = true;

      try {
    const response = await fetch('http://localhost:3001/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error);
    }

    francais.value = data.translation;
  } catch (error) {
    alert(error instanceof Error ? error.message : '翻訳に失敗しました。');
  } finally {
    translateButton.disabled = false;
  }

  });

  function showKeep(item: Keeplist) {
  const listItem = document.createElement('li');
  listItem.append(`${item.japaneseText} → ${item.francaisText} `);

  const speakButton = document.createElement('button');
  speakButton.textContent = '🔊';

  speakButton.addEventListener('click', () => {
    const utterance = new SpeechSynthesisUtterance(item.francaisText);
    utterance.lang = 'fr-FR';
    speechSynthesis.speak(utterance);
  });

  const deleteButton = document.createElement('button');
  deleteButton.textContent = '消す';

  deleteButton.addEventListener('click', () => {
    const index = keeplist.indexOf(item);

    if (index !== -1) {
      keeplist.splice(index, 1);
      localStorage.setItem('keeping', JSON.stringify(keeplist));
      listItem.remove();
    }
  });

  listItem.appendChild(speakButton);
  listItem.appendChild(deleteButton);
  translationList.appendChild(listItem);
}

  speakInputButton.addEventListener('click', () => {
  const utterance = new SpeechSynthesisUtterance(francais.value);
  utterance.lang = 'fr-FR';
  speechSynthesis.speak(utterance);
});

  keep();


  function keep(){
    keepButton.addEventListener('click', () => {
      const japaneseValue:string = japanese.value.trim();
      const francaisValue:string = francais.value.trim();
      
      if (japaneseValue && francaisValue) {

        const newKeep:Keeplist = {
          japaneseText:japaneseValue,
          francaisText:francaisValue,
        };

        keeplist.push(newKeep);
        showKeep(newKeep);
        localStorage.setItem('keeping', JSON.stringify(keeplist));
      }
    });
  }
