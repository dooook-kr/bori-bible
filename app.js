let bibleData = null;
let currentFontSize = parseInt(localStorage.getItem('bible_fontSize')) || 24;
let isDarkMode = localStorage.getItem('bible_theme') !== 'light';

const selectBook = document.getElementById('select-book');
const selectChapter = document.getElementById('select-chapter');
const selectBookRead = document.getElementById('select-book-read');
const selectChapterRead = document.getElementById('select-chapter-read');
const bibleContent = document.getElementById('bible-content');
const errorMsg = document.getElementById('error-msg');
const btnThemeToggle = document.getElementById('btn-theme-toggle');

const BIBLE_ORDER = [
  "창세기", "출애굽기", "레위기", "민수기", "신명기", "여호수아", "사사기", "룻기", 
  "사무엘상", "사무엘하", "열왕기상", "열왕기하", "역대상", "역대하", "에스라", "느헤미야", "에스더", 
  "욥기", "시편", "잠언", "전도서", "아가", "이사야", "예레미야", "예레미야애가", "에스겔", "다니엘", 
  "호세아", "요엘", "아모스", "오바댜", "요나", "미가", "나훔", "하박국", "스바냐", "학개", "스가랴", "말라기",
  "마태복음", "마가복음", "누가복음", "요한복음", "사도행전", "로마서", "고린도전서", "고린도후서", 
  "갈라디아서", "에베소서", "빌립보서", "골로새서", "데살로니가전서", "데살로니가후서", 
  "디모데전서", "디모데후서", "디도서", "빌레몬서", "히브리서", "야고보서", 
  "베드로전서", "베드로후서", "요한일서", "요한이서", "요한삼서", "유다서", "요한계시록"
];

async function init() {
  applyFontSize();
  applyTheme();
  try {
    const response = await fetch('./data/bible.json');
    if (!response.ok) throw new Error("데이터 로드 실패");
    bibleData = await response.json();
    populateBooks();
    updateBookmarkUI();
  } catch (e) {
    alert("데이터 파일을 찾을 수 없습니다.");
  }
}

function applyTheme() {
  if (isDarkMode) {
    document.body.classList.remove('light-mode');
    document.body.classList.add('dark-mode');
    btnThemeToggle.textContent = "밝은 모드로";
    btnThemeToggle.className = "theme-btn to-light";
  } else {
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
    btnThemeToggle.textContent = "어두운 모드로";
    btnThemeToggle.className = "theme-btn to-dark";
  }
}

btnThemeToggle.onclick = () => {
  isDarkMode = !isDarkMode;
  localStorage.setItem('bible_theme', isDarkMode ? 'dark' : 'light');
  applyTheme();
};

function populateBooks() {
  const availableBooks = Object.keys(bibleData['kor']);
  const sortedBooks = availableBooks.sort((a, b) => {
    const idxA = BIBLE_ORDER.indexOf(a.normalize('NFC'));
    const idxB = BIBLE_ORDER.indexOf(b.normalize('NFC'));
    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
  });

  selectBook.innerHTML = '<option value="">성경책 선택</option>';
  selectBookRead.innerHTML = '';
  
  sortedBooks.forEach(book => {
    const opt1 = document.createElement('option');
    opt1.value = book; opt1.textContent = book.normalize('NFC');
    selectBook.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = book; opt2.textContent = book.normalize('NFC');
    selectBookRead.appendChild(opt2);
  });
}

function populateChapters(bookValue, targetSelect, isReadMode = false) {
  targetSelect.innerHTML = isReadMode ? '' : '<option value="">성경책부터 선택하세요</option>';
  if (!bookValue) return;
  const chapters = Object.keys(bibleData['kor'][bookValue]).sort((a, b) => parseInt(a) - parseInt(b));
  chapters.forEach(ch => {
    const opt = document.createElement('option');
    opt.value = ch; opt.textContent = ch + "장";
    targetSelect.appendChild(opt);
  });
}

selectBook.onchange = () => populateChapters(selectBook.value, selectChapter);
selectBookRead.onchange = () => populateChapters(selectBookRead.value, selectChapterRead, true);
selectChapterRead.onchange = () => {
  if (selectBookRead.value && selectChapterRead.value) {
    render('kor', selectBookRead.value, selectChapterRead.value);
  }
};

function updateBookmarkUI() {
  const section = document.getElementById('bookmark-section');
  const book = localStorage.getItem('bible_last_book');
  const chapter = localStorage.getItem('bible_last_chapter');
  const verseNum = localStorage.getItem('bible_last_verse');

  if (book && chapter) {
    const cleanBook = book.normalize('NFC');
    section.innerHTML = `
      <button class="del-bookmark" onclick="deleteBookmark()">×</button>
      <div style="margin-bottom: 10px; font-size: 1.1rem; text-align: center; padding-top:15px; color: var(--text-color);">
        <b>${cleanBook} ${chapter}장 ${verseNum && verseNum !== 'null' ? verseNum + '절' : ''}</b>
      </div>
      <button class="btn-bookmark-go" onclick="render('kor', '${book}', '${chapter}', '${verseNum}')">
        이어서 읽기
      </button>
    `;
  } else {
    section.innerHTML = `
      <div style="color: #888; font-size: 0.95rem; line-height: 1.6; text-align: center; padding: 20px 0;">
        읽으시던 구절을 누르시면 책갈피가 끼워집니다.
      </div>
    `;
  }
}

function deleteBookmark() {
  if (confirm("책갈피를 삭제하시겠어요?")) {
    localStorage.removeItem('bible_last_book');
    localStorage.removeItem('bible_last_chapter');
    localStorage.removeItem('bible_last_verse');
    updateBookmarkUI();
  }
}

function render(version, book, chapter, highlightVerse = null) {
  if (!bibleData['kor'][book] || !bibleData['kor'][book][chapter]) return;
  
  errorMsg.style.display = 'none';
  const data = bibleData[version][book][chapter];
  const cleanBook = book.normalize('NFC');
  
  bibleContent.innerHTML = '';
  selectBookRead.value = book;
  populateChapters(book, selectChapterRead, true);
  selectChapterRead.value = chapter;

  data.forEach(v => {
    const div = document.createElement('div');
    div.className = 'verse';
    if (v.num && String(v.num) === String(highlightVerse)) {
      div.style.backgroundColor = isDarkMode ? '#222' : '#e0e0e0';
      div.style.borderLeft = '4px solid var(--bookmark-color)';
    }
    
    div.onclick = () => {
      if(!v.num) return;
      localStorage.setItem('bible_last_book', book);
      localStorage.setItem('bible_last_chapter', chapter);
      localStorage.setItem('bible_last_verse', v.num);
      alert(`책갈피를 끼웠어요\n[ ${cleanBook} | ${chapter}장 ${v.num}절 ]`);
      updateBookmarkUI();
      render(version, book, chapter, v.num);
    };

    const numSpan = v.num ? `<span class="verse-num">${v.num}</span>` : '';
    div.innerHTML = `${numSpan}<div>${v.text}</div>`;
    bibleContent.appendChild(div);

    if (v.num && String(v.num) === String(highlightVerse)) {
      setTimeout(() => div.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }
  });

  updateBottomNav(book, chapter);
  document.getElementById('search-page').classList.remove('active');
  document.getElementById('read-page').classList.add('active');
  if (!highlightVerse) window.scrollTo(0, 0);
}

function updateBottomNav(book, chapter) {
  const chapters = Object.keys(bibleData['kor'][book]).sort((a,b) => parseInt(a) - parseInt(b));
  const currentIndex = chapters.indexOf(chapter);
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');

  btnPrev.style.display = (currentIndex > 0) ? 'block' : 'none';
  if (currentIndex > 0) btnPrev.onclick = () => render('kor', book, chapters[currentIndex - 1]);

  btnNext.style.display = (currentIndex < chapters.length - 1) ? 'block' : 'none';
  if (currentIndex < chapters.length - 1) btnNext.onclick = () => render('kor', book, chapters[currentIndex + 1]);
}

document.getElementById('btn-open').onclick = () => {
  const b = selectBook.value; const c = selectChapter.value;
  if (b && c) render('kor', b, c);
  else errorMsg.style.display = 'block';
};

document.getElementById('btn-home').onclick = () => {
  document.getElementById('read-page').classList.remove('active');
  document.getElementById('search-page').classList.add('active');
  updateBookmarkUI();
};

function applyFontSize() {
  document.documentElement.style.setProperty('--base-font-size', currentFontSize + 'px');
  localStorage.setItem('bible_fontSize', currentFontSize);
}

document.getElementById('btn-zoom-in').onclick = () => { currentFontSize += 4; applyFontSize(); };
document.getElementById('btn-zoom-out').onclick = () => { if(currentFontSize > 16) currentFontSize -= 4; applyFontSize(); };

window.onload = init;