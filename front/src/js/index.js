const matchStatus = document.querySelector('.match-status');
const letterButtons = document.querySelectorAll('.letter-button');
const wordList = document.querySelector('.word-list');
const wordInsertForm = document.querySelector('.word-insert-form');
const othersLetters = ['a'];
const myLetters = [];
const myWords = [];

letterButtons.forEach(btn => {
  btn.addEventListener('click', e => {
    const letter = e.target.id.slice(-1).toLowerCase();
    addToMyLetters(letter, myLetters);
    upDateSelectionView();
  });
});

wordInsertForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = wordInsertForm.querySelector('input');
  addToMyWords(input.value, myWords);
  upDateWordsView();
  input.value = '';
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
  if (isValidWord(word, selectedLetters)) {
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