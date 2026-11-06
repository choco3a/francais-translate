function getElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if(!element){
    throw new Error(`${selector}が見つかりません`);
  }

  return element;
};




const app = getElement<HTMLDivElement>('#app');


app.innerHTML = `
  <h1>フランス語の学習</h1>
  <main>
    <div class="container">
      <div class="japanese-side">
        <p class="language-label">日本語</p>
        <textarea id="japanese"></textarea>
      </div>

      <div>
        <p class="language-label">→</p>
        <button id="translation">翻訳</button>
      </div>
      <div class="france-side">
        <p class="language-label">フランス語</p>
        <textarea id="francais"></textarea>
      </div>
      <div class="right">
      <button id="clear-button" class='three-button'>×</button>
        <button id="speak-input-button" class='three-button'>🔊</button>
        <button id="keep-button" class='three-button'>☆</button>
      </div>
    </div>
    <ul id="translation-list"></ul>
  </main>`

  const japanese = getElement<HTMLTextAreaElement>('#japanese');
  const francais = getElement<HTMLTextAreaElement>('#francais');
  const keepButton = getElement<HTMLButtonElement>('#keep-button');
  const translationList = getElement<HTMLUListElement>('#translation-list');
  const speakInputButton = getElement<HTMLButtonElement>('#speak-input-button');
  const translateButton = getElement<HTMLButtonElement>('#translation');
  const clearButton = getElement<HTMLButtonElement>('#clear-button');

  type KeepItem = {
    japaneseText: string;
    francaisText: string;
  };
  const keeplist: KeepItem[] = [];

  let draggedItem: HTMLLIElement | null = null;
  const itemByElement = new WeakMap<HTMLLIElement, KeepItem>();

  const savedData = localStorage.getItem('keeping');

  if(savedData){
    try {
      const parsedData: unknown = JSON.parse(savedData);

    if(!Array.isArray(parsedData)){
      throw new Error('保存データが配列ではありません');
    }

    for (const item of parsedData){
      if(
        typeof item !== 'object' || 
        item === null ||
        !('japaneseText' in item) ||
        !('francaisText' in item) ||
        typeof item.japaneseText !== 'string' ||
        typeof item.francaisText !== 'string'
      ){
        continue;
      }

      const keepItem: KeepItem = {
        japaneseText: item.japaneseText,
        francaisText: item.francaisText,
      };  
      keeplist.push(keepItem);
      showKeep(keepItem);
    }
      localStorage.setItem('keeping', JSON.stringify(keeplist));
    }catch {
      localStorage.removeItem('keeping');
      keeplist.length = 0;
    }
    
  }
    
    

    

  japanese.addEventListener('keydown', (event) => {
    if(event.key === 'Enter' && !event.isComposing){
      event.preventDefault();
      translateButton.click();
    };
    
  });

  clearButton.addEventListener('click', () => {
    francais.value = '';
    japanese.value = '';
  });

  translateButton.addEventListener('click', async () => {
    const text = japanese.value.trim();

    if(!text) return;

    translateButton.disabled = true;
    japanese.disabled = true;

      try {

        type TranslationResponse = {
          translation: unknown;
          error?: unknown;
        };

    const response = await fetch('http://localhost:3001/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    const data: TranslationResponse = await response.json();

    if (!response.ok) {
      throw new Error(
        typeof data.error === 'string' ? data.error : '翻訳に失敗しました。',
      );
    }

    if(typeof data.translation !== 'string'){
      throw new Error('翻訳結果を取得できませんでした。');
    }

    francais.value = data.translation;
  } catch (error) {
    alert(error instanceof Error ? error.message : '翻訳に失敗しました。');
  } finally {
    translateButton.disabled = false;
    japanese.disabled = false;
  }

  });

  function showKeep(item: KeepItem) {
  const listItem = document.createElement('li');
  itemByElement.set(listItem, item);
  listItem.append(`${item.japaneseText} → ${item.francaisText} `);

  const speakButton = document.createElement('button');
  speakButton.textContent = '🔊';

  speakButton.addEventListener('click', () => {
    const text = item.francaisText.trim();
    if(!text || speakButton.disabled)return;

    
    speakButton.disabled = true;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';

    let resetTimer: number;

    const reset = () => {
      clearTimeout(resetTimer);
      speakButton.disabled = false;
    };

    resetTimer = window.setTimeout(reset, 30_000);

    utterance.onend = reset;
    utterance.onerror = reset;

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

  const dragHandle = document.createElement('span');
  dragHandle.textContent = '＝';
  dragHandle.className = 'drag-handle';
  dragHandle.title = '掴んで並べかえ';

  dragHandle.draggable = true;

  dragHandle.addEventListener('dragstart', () => {
    draggedItem = listItem;
    listItem.classList.add('dragging');
  });

  dragHandle.addEventListener('dragend', () => {
    listItem.classList.remove('dragging');
    draggedItem = null;
  });


  listItem.appendChild(speakButton);
  listItem.appendChild(deleteButton);
  listItem.appendChild(dragHandle);
  translationList.appendChild(listItem);
}

  speakInputButton.addEventListener('click', () => {
    const text = francais.value.trim();

    if(!text || speakInputButton.disabled)return;

    speakInputButton.disabled = true;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fr-FR';

  let resetTimer: number;

  const reset = () => {
    clearTimeout(resetTimer);
    speakInputButton.disabled = false;
  };

  resetTimer = window.setTimeout(reset, 30_000);

  utterance.onend = reset;
  utterance.onerror = reset;

  speechSynthesis.speak(utterance);
});

translationList.addEventListener('dragover', (event) => {

  

  event.preventDefault();

  if (!draggedItem) return;

  const target = (event.target as HTMLElement).closest('li');

  if (!target || target === draggedItem) return;

  const rect = target.getBoundingClientRect();
  const dropAfter = event.clientY > rect.top + rect.height / 2;

  translationList.insertBefore(
    draggedItem,
    dropAfter ? target.nextSibling : target,
  );
});

translationList.addEventListener('drop', (event) => {
  event.preventDefault();

  const newOrder = Array.from(translationList.children)
    .map((element) => itemByElement.get(element as HTMLLIElement))
    .filter((item): item is KeepItem => item !== undefined);

  keeplist.splice(0, keeplist.length, ...newOrder);
  localStorage.setItem('keeping', JSON.stringify(keeplist));
});

  // keep();


  // function keep(){
    keepButton.addEventListener('click', () => {
      const japaneseValue:string = japanese.value.trim();
      const francaisValue:string = francais.value.trim();

      if(!japaneseValue || !francaisValue)return;

      const alreadySaved = keeplist.some((item) =>
        item.japaneseText === japaneseValue &&
        item.francaisText === francaisValue);
      
        if(alreadySaved){
          console.log('保存済み');
          alert('この翻訳は保存済み');
          return;
        };

        const newKeep:KeepItem = {
          japaneseText:japaneseValue,
          francaisText:francaisValue,
        };

        keeplist.push(newKeep);
        showKeep(newKeep);
        localStorage.setItem('keeping', JSON.stringify(keeplist));
    });
  // }