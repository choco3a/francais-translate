document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <h1>フランス語の学習</h1>
  <main>
    <div class="container">
      <div class="japanese-side">
        <p class="language-label">日本語</p>
        <textarea type="text" id="japanese"></textarea>
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
      <button id="clear-button" class='three-button'>×</button>
        <button id="speak-input-button" class='three-button'>🔊</button>
        <button id="keep-button" class='three-button'>☆</button>
      </div>
    </div>
    <ul id="translation-list"></ul>
  </main>`

  const japanese = document.querySelector<HTMLTextAreaElement>('#japanese')!;
  const francais = document.querySelector<HTMLTextAreaElement>('#francais')!;
  const keepButton = document.querySelector<HTMLButtonElement>('#keep-button')!;
  const translationList = document.querySelector<HTMLUListElement>('#translation-list')!;
  const speakInputButton = document.querySelector<HTMLButtonElement>('#speak-input-button')!;
  const translateButton = document.querySelector<HTMLButtonElement>('#translation')!;
  const clearButton = document.querySelector<HTMLButtonElement>('#clear-button')!;

  type Keeplist = {
    japaneseText: string;
    francaisText: string;
  };
  const keeplist:Keeplist[] = [];

  let draggedItem: HTMLLIElement | null = null;
  const itemByElement = new WeakMap<HTMLLIElement, Keeplist>();

  const savedData = localStorage.getItem('keeping');

  if(savedData){
    const currentSetting:Keeplist[] = JSON.parse(savedData);

    currentSetting.forEach(element => {
      keeplist.push(element);
      showKeep(element);
    });
  };

  japanese.addEventListener('keydown', (event) => {
    if(event.key === 'Enter'){
      translateButton.focus();
    };
    
  });

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
  itemByElement.set(listItem, item);
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
  const utterance = new SpeechSynthesisUtterance(francais.value);
  utterance.lang = 'fr-FR';
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
    .filter((item): item is Keeplist => item !== undefined);

  keeplist.splice(0, keeplist.length, ...newOrder);
  localStorage.setItem('keeping', JSON.stringify(keeplist));
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
