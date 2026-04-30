let bibleData = null;

// 🌟 1. 상태(State) 중앙 관리 변수: localStorage에서 마지막 기억을 꺼내옵니다.
let currentVersion = localStorage.getItem('bible_version') || 'basic';
let currentBook = localStorage.getItem('bible_book') || '';
let currentChapter = localStorage.getItem('bible_chapter') || '';
let currentFontSize = parseInt(localStorage.getItem('bible_fontSize')) || 24;
let isDarkMode = localStorage.getItem('bible_theme') !== 'light';

// 요소 가져오기
const selectBook = document.getElementById('select-book');
const selectChapter = document.getElementById('select-chapter');
const selectBookRead = document.getElementById('select-book-read');
const selectChapterRead = document.getElementById('select-chapter-read');
const selectVersionRead = document.getElementById('select-version-read');
const bibleContent = document.getElementById('bible-content');
const errorMsg = document.getElementById('error-msg');
const btnThemeToggle = document.getElementById('btn-theme-toggle');
const versionRadios = document.querySelectorAll('input[name="bible-version"]');

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

// 앱 시작 시 실행
async function init() {
  applyFontSize();
  applyTheme();
  // 저장된 상태를 바탕으로 데이터 로드 및 UI 세팅
  await updateState(currentVersion, currentBook, currentChapter);
  updateBookmarkUI();
}

// 🌟 2. 완벽한 중앙 통제 센터 (상태 변경, 저장, 통신, UI 동기화 전담)
async function updateState(newVersion, newBook, newChapter) {
  const versionChanged = (newVersion !== currentVersion);
  const bookChanged = (newBook !== currentBook);

  // 상태 업데이트 및 자동 저장
  currentVersion = newVersion;
  currentBook = newBook;
  currentChapter = newChapter;
  
  localStorage.setItem('bible_version', currentVersion);
  localStorage.setItem('bible_book', currentBook);
  localStorage.setItem('bible_chapter', currentChapter);

  // 방어벽 1: 버전이 바뀌었거나 데이터가 없을 때만 새로 다운로드
  if (versionChanged || !bibleData) {
    try {
      const fileName = currentVersion === 'basic' ? 'bible-basic.json' : 'bible-story.json';
      const response = await fetch(`./data/${fileName}`);
      if (!response.ok) throw new Error("데이터 로드 실패");
      bibleData = await response.json();
      populateBooks(); // 책 목록 갱신
    } catch (e) {
      alert("⚠️ 데이터를 불러올 수 없습니다.\n\n컴퓨터 폴더에서 직접 index.html을 실행하면 브라우저 보안 정책(CORS) 때문에 데이터를 읽지 못합니다. 로컬 웹 서버를 사용하시거나 Github에 올려서 확인해 주세요!");
      return;
    }
  }

  // 방어벽 2: 조건 없이 덮어쓰기만 수행하여 무한 루프(메아리) 원천 차단
  const radio = document.querySelector(`input[name="bible-version"][value="${currentVersion}"]`);
  if (radio) radio.checked = true;
  selectVersionRead.value = currentVersion;

  selectBook.value = currentBook;
  selectBookRead.value = currentBook;

  // 책이 바뀌었거나 버전을 바꿨을 때만 장(Chapter) 목록 갱신
  if (versionChanged || bookChanged || selectChapter.options.length <= 1) {
    populateChapters(currentBook, selectChapter, false);
    populateChapters(currentBook, selectChapterRead, true);
  }

  selectChapter.value = currentChapter;
  selectChapterRead.value = currentChapter;
}

// 🌟 3. 이벤트 리스너들: 자신의 변화만 updateState에 보고함
versionRadios.forEach(radio => {
  radio.addEventListener('change', async (e) => {
    await updateState(e.target.value, currentBook, currentChapter);
  });
});

selectVersionRead.addEventListener('change', async (e) => {
  await updateState(e.target.value, currentBook, currentChapter);
  if (currentBook && currentChapter) render(currentBook, currentChapter); // 읽기 화면 즉시 갱신
});

selectBook.addEventListener('change', async (e) => {
  // 메인에서 성경책을 바꾸면 장(Chapter)은 리셋
  await updateState(currentVersion, e.target.value, '');
});

selectChapter.addEventListener('change', async (e) => {
  await updateState(currentVersion, currentBook, e.target.value);
});

selectBookRead.addEventListener('change', async (e) => {
  // 읽기 화면에서 성경책을 바꾸면 무조건 1장으로 자동 이동
  await updateState(currentVersion, e.target.value, '1');
  render(currentBook, '1');
});

selectChapterRead.addEventListener('change', async (e) => {
  await updateState(currentVersion, currentBook, e.target.value);
  render(currentBook, currentChapter);
});

// 나머지 일반 기능들
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
  if (!bibleData) return;
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
  if (!bookValue || !bibleData || !bibleData['kor'][bookValue]) return;
  const chapters = Object.keys(bibleData['kor'][bookValue]).sort((a, b) => parseInt(a) - parseInt(b));
  chapters.forEach(ch => {
    const opt = document.createElement('option');
    opt.value = ch; opt.textContent = ch + "장";
    targetSelect.appendChild(opt);
  });
}

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
      <button class="btn-bookmark-go" onclick="render('${book}', '${chapter}', '${verseNum}')">
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

// 🌟 4. 데이터 렌더링 함수 (호출 시 무조건 최신 상태로 맞춘 뒤 화면을 그립니다)
async function render(book, chapter, highlightVerse = null) {
  // 렌더링 전, 책갈피 등의 요인으로 값이 바뀌었을 수 있으므로 상태 강제 갱신
  await updateState(currentVersion, book, chapter);

  if (!bibleData || !bibleData['kor'][book] || !bibleData['kor'][book][chapter]) return;
  
  errorMsg.style.display = 'none';
  const data = bibleData['kor'][book][chapter];
  const cleanBook = book.normalize('NFC');
  
  bibleContent.innerHTML = '';

  data.forEach(v => {
    const div = document.createElement('div');
    div.className = 'verse';
    if (v.num && String(v.num) === String(highlightVerse)) {
      div.style.backgroundColor = isDarkMode ? '#222' : '#e0e0e0';
      div.style.borderLeft = '4px solid var(--bookmark-color)';
    }
    
    div.onclick = () => {
      if(!v.num) return;
      // 책갈피용 저장소는 별도로 관리 (드롭다운과 분리)
      localStorage.setItem('bible_last_book', book);
      localStorage.setItem('bible_last_chapter', chapter);
      localStorage.setItem('bible_last_verse', v.num);
      alert(`책갈피를 끼웠어요\n[ ${cleanBook} | ${chapter}장 ${v.num}절 ]`);
      updateBookmarkUI();
      render(book, chapter, v.num);
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
  if (currentIndex > 0) btnPrev.onclick = () => render(book, chapters[currentIndex - 1]);

  btnNext.style.display = (currentIndex < chapters.length - 1) ? 'block' : 'none';
  if (currentIndex < chapters.length - 1) btnNext.onclick = () => render(book, chapters[currentIndex + 1]);
}

document.getElementById('btn-open').onclick = () => {
  if (currentBook && currentChapter) {
    render(currentBook, currentChapter);
  } else {
    errorMsg.style.display = 'block';
  }
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