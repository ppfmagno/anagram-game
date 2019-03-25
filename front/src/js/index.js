import io from 'socket.io-client';

const socket = io('localhost:3000');
const matchLogger = document.querySelector('.match-logger');
const letterButtons = document.querySelectorAll('.letter-button');
const wordList = document.querySelector('.word-list');
const wordInsertForm = document.querySelector('.word-insert-form');
const matchStatus = {
  waiting: 'waiting',
  ready: 'ready',
  locked: 'locked',
  start: 'start',
  stop: 'stop',
  checking: 'checking',
  finished: 'finished',
  now: undefined
};
let playerId;
let othersLetters = [];
let myLetters = [];
let myWords = [];

letterButtons.forEach(btn => {
  btn.addEventListener('click', e => {
    if (matchStatus.now === matchStatus.waiting || matchStatus.now === matchStatus.ready) {
      const letter = e.target.id.slice(-1).toLowerCase();
      addToMyLetters(letter, myLetters);
      sendLetters(myLetters);
      upDateSelectionView();
    }
  });
});

wordInsertForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (matchStatus.now === matchStatus.start) {
    const input = wordInsertForm.querySelector('input');
    addToMyWords(input.value, myWords);
    upDateWordsView();
    input.value = '';
  }
});

const addToMyLetters = (letter, myLetters) => {
  if (!myLetters.includes(letter) && !othersLetters.includes(letter)) {
    myLetters.push(letter);
  }
  if (myLetters.length > 2) {
    myLetters.shift();
  }
}

const addToMyWords = (word, myWords) => {
  const selectedLetters = [...myLetters, ...othersLetters];
  word = word.toLowerCase();
  if (isValidWord(word, selectedLetters) && !myWords.includes(word)) {
    myWords.push(word);
  }
  console.log(myWords);
}

const isValidWord = (word, selectedLetters) => {
  if (selectedLetters.includes('a')) {
    selectedLetters = [...selectedLetters, 'á', 'â', 'ã'];
  }
  if (selectedLetters.includes('e')) {
    selectedLetters = [...selectedLetters, 'é', 'ê'];
  }
  if (selectedLetters.includes('i')) {
    selectedLetters = [...selectedLetters, 'í'];
  }
  if (selectedLetters.includes('o')) {
    selectedLetters = [...selectedLetters, 'ó', 'ô', 'õ'];
  }
  if (selectedLetters.includes('u')) {
    selectedLetters = [...selectedLetters, 'ú'];
  }
  if (selectedLetters.includes('c')) {
    selectedLetters = [...selectedLetters, 'ç'];
  }
  let isValid = true;
  for (let i = 0; i < word.length; i++) {
    if (!selectedLetters.includes(word[i])) {
      isValid = false;
      return isValid;
    }
  }
  return isValid;
}

const upDateSelectionView = () => {
  letterButtons.forEach(btn => {
    const btnLetter = btn.id.slice(-1).toLowerCase();
    const isOnMyLetters = myLetters.includes(btnLetter);
    const isOnOtherLetters = othersLetters.includes(btnLetter);
    if (isOnMyLetters && !btn.className.includes('selected')) {
      btn.classList.add('selected-by-me');
    } else if (!isOnMyLetters) {
      btn.classList.remove('selected-by-me');
    }
    if (isOnOtherLetters && !btn.className.includes('selected')) {
      btn.classList.add('selected-by-others');
    } else if (!isOnOtherLetters) {
      btn.classList.remove('selected-by-others');
    }
  });
}

const upDateWordsView = () => {
  wordList.querySelector('span').innerHTML = myWords.join(', ');
}

const sendLetters = (letters) => {
  const newLetters = [];
  letters.forEach(letter => newLetters.push({ playerId, letter }));
  socket.emit('set letters', newLetters);
}

const countToStart = () => {
  const end = new Date();
  end.setSeconds(end.getSeconds() + 5);
  const timer = setInterval(() => {
    const now = new Date().getTime();
    const difference = end - now;
    const seconds = Math.floor((difference % (1000 * 60) / 1000));
    const milliseconds = Math.floor(difference % 100);

    matchLogger.innerHTML = `${('0' + seconds).slice(-2)}:${('0' + milliseconds).slice(-2)} para o início da partida!`;

    if (difference < 0) {
      clearInterval(timer);
      countToStop();
    }
  }, 1);
}

const countToStop = () => {
  const end = new Date();
  end.setSeconds(end.getSeconds() + 10);
  const timer = setInterval(() => {
    const now = new Date().getTime();
    const difference = end - now;
    const seconds = Math.floor((difference % (1000 * 60) / 1000));
    const milliseconds = Math.floor(difference % 100);

    matchLogger.innerHTML = `Escreva suas palavras!!</br>${('0' + seconds).slice(-2)}:${('0' + milliseconds).slice(-2)}`;

    if (difference < 0) {
      clearInterval(timer);
      matchLogger.innerHTML = 'Contando pontos...';
    }
  }, 1);
}

socket.on('connect', () => {
  playerId = socket.id;
  matchStatus.now = matchStatus.waiting;
  matchLogger.innerHTML = 'Aguardando jogadores...';
  myWords = [];
  upDateWordsView();
});

socket.on('set letters', letters => {
  othersLetters = letters.map(letter => {
    if (letter.playerId !== playerId) return letter.letter;
  });
  myLetters = letters.map(letter => {
    if (letter.playerId === playerId) return letter.letter;
  });
  myLetters = myLetters.filter(letter => letter !== undefined);
  upDateSelectionView();
});

socket.on('ready', () => {
  matchStatus.now = matchStatus.ready;
  countToStart();
});

socket.on('locked', () => {
  matchStatus.now = matchStatus.locked;
  console.log('start in 2"');
});

socket.on('start', () => {
  matchStatus.now = matchStatus.start;
  wordInsertForm.querySelector('input').focus();
  console.log('started!');
});

socket.on('stop', () => {
  const wordsToSend = { id: playerId, words: [... new Set([...myWords])] }
  matchStatus.now = matchStatus.stop;
  socket.emit('set words', wordsToSend);
});

socket.on('checking', () => {
  matchStatus.now = matchStatus.checking;
});
