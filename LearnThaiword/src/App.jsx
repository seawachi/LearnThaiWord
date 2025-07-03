import React, { useState, useRef, useEffect } from 'react';

function getTimestamp() {
  return new Date().toISOString().replace('T', ' ').split('.')[0];
}

function speakThai(text) {
  if (!window.speechSynthesis) return;
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'th-TH';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utt);
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function App() {
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [statuses, setStatuses] = useState({});
  const [log, setLog] = useState([]);
  const [mode, setMode] = useState(1);
  const inputRef = useRef(null);

  // Load saved words on mount
  useEffect(() => {
    const saved = localStorage.getItem('thaiWords');
    if (saved) {
      try {
        setWords(JSON.parse(saved));
      } catch {
        localStorage.removeItem('thaiWords');
      }
    }
  }, []);

  // Persist or remove based on words.length
  useEffect(() => {
    if (words.length > 0) {
      localStorage.setItem('thaiWords', JSON.stringify(words));
    } else {
      localStorage.removeItem('thaiWords');
    }
  }, [words]);

  // focus & auto-play
  useEffect(() => {
    inputRef.current?.focus();
    if (mode === 2 && words[currentIndex]) {
      speakThai(words[currentIndex]);
    }
  }, [currentIndex, mode, words]);

  const currentWord = words[currentIndex] || '';
  const correctCount = Object.values(statuses).filter(Boolean).length;

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && currentWord) {
      const isCorrect = input.trim() === currentWord;
      const entry = { time: getTimestamp(), word: currentWord, correct: isCorrect };
      setLog((prev) => [entry, ...prev]);
      setStatuses((s) => ({ ...s, [currentIndex]: isCorrect }));
      console.log(`${entry.time} — “${entry.word}” — ${isCorrect ? 'Correct' : 'Incorrect'}`);
      if (isCorrect) {
        setCurrentIndex((i) => i + 1);
        setInput('');
      }
    }
  };

  const handleAddWords = () => {
    const text = prompt('พิมพ์คำใหม่ (หนึ่งคำต่อบรรทัด):', '');
    if (!text) return;
    const newWs = text.split('\n').map((w) => w.trim()).filter(Boolean);
    setWords((w) => [...w, ...newWs]);
  };

  const handleShuffle = () => {
    if (words.length < 2) return;
    setWords((w) => shuffleArray(w));
    setCurrentIndex(0);
    setInput('');
    setStatuses({});
    setLog([]);
  };

  const handleReset = () => {
    // keep words, just clear progress and log
    setCurrentIndex(0);
    setInput('');
    setStatuses({});
    setLog([]);
  };

  const handleDeleteAll = () => {
    if (confirm('ลบคำศัพท์ทั้งหมดหรือไม่?')) {
      setWords([]);    // this will also clear localStorage
      setCurrentIndex(0);
      setInput('');
      setStatuses({});
      setLog([]);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-100 p-4" lang="th">
      <div className="bg-white shadow-xl rounded-lg w-full h-full max-w-2xl flex flex-col">
        {/* Mode Tabs */}
        <div className="flex">
          <button
            className={`flex-1 py-3 ${mode === 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setMode(1)}
          >
            Mode 1: พิมพ์จากคำ
          </button>
          <button
            className={`flex-1 py-3 ${mode === 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setMode(2)}
          >
            Mode 2: ฟังเสียง
          </button>
        </div>

        {/* Header */}
        <div className="p-6 text-center">
          <h1 className="text-3xl font-bold">ฝึกพิมพ์ภาษาไทย</h1>
          <p className="text-gray-600 mt-1">จำนวนคำทั้งหมด: {words.length}</p>
          <p className="text-gray-600">จำนวนที่ถูกต้อง: {correctCount}</p>
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {currentWord ? (
            <>
              {mode === 1 && (
                <div className="text-5xl font-bold text-gray-800 mb-6">{currentWord}</div>
              )}
              {mode === 2 && (
                <button
                  onClick={() => speakThai(currentWord)}
                  className="mb-6 p-4 bg-green-500 hover:bg-green-600 text-white rounded-full text-2xl"
                >
                  ฟังอีกครั้ง
                </button>
              )}
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="พิมพ์ที่นี่แล้วกด Enter"
                className={`w-full text-2xl p-4 border rounded-lg transition-all ${
                  statuses[currentIndex] === false
                    ? 'border-red-500'
                    : 'border-gray-300 focus:border-blue-500'
                }`}
              />
              {statuses[currentIndex] === false && (
                <div className="mt-4 text-red-600 font-semibold text-xl">
                  คำผิด ลองใหม่
                </div>
              )}
            </>
          ) : (
            <div className="text-green-600 text-2xl font-semibold">
              พิมพ์ครบทุกคำแล้ว
            </div>
          )}
        </div>

        {/* Controls & Log */}
        <div className="p-6 border-t overflow-auto max-h-72">
          <div className="flex flex-wrap justify-center gap-4 mb-6">  
            <button
              onClick={handleAddWords}
              className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-2 rounded"
            >
              เพิ่มคำ
            </button>
            <button
              onClick={handleShuffle}
              className="bg-purple-500 hover:bg-purple-600 text-white px-5 py-2 rounded"
            >
              สลับคำ
            </button>
            <button
              onClick={handleReset}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded"
            >
              เริ่มใหม่
            </button>
            <button
              onClick={handleDeleteAll}
              className="bg-pink-500 hover:bg-pink-600 text-white px-5 py-2 rounded"
            >
              ลบทั้งหมด
            </button>
          </div>

          <h2 className="text-xl font-semibold text-center mb-3">บันทึกผลลัพธ์</h2>
          {log.length === 0 ? (
            <p className="text-gray-500 text-center">ยังไม่มีข้อมูล</p>
          ) : (
            <ul className="space-y-2 text-base overflow-auto max-h-[200px]">
              {log.map((e, i) => (
                <li key={i} className="flex justify-center items-center gap-6">
                  <span className="text-gray-600">{e.time}</span>
                  <span className="text-gray-800">“{e.word}”</span>
                  <span
                    className={e.correct ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}
                  >
                    {e.correct ? 'ถูกต้อง' : 'ผิด'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
