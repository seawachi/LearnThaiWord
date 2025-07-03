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
  const [wrongList, setWrongList] = useState([]);
  const [mode, setMode] = useState(1);
  const inputRef = useRef(null);

  // โหลดคำจาก localStorage
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

  // เก็บคำไป localStorage
  useEffect(() => {
    if (words.length > 0) localStorage.setItem('thaiWords', JSON.stringify(words));
    else localStorage.removeItem('thaiWords');
  }, [words]);

  // focus & เล่นเสียงในโหมด 2
  useEffect(() => {
    inputRef.current?.focus();
    if (mode === 2 && words[currentIndex]) speakThai(words[currentIndex]);
  }, [currentIndex, mode, words]);

  const currentWord = words[currentIndex] || '';
  const correctCount = Object.values(statuses).filter(Boolean).length;

  const handleKeyPress = e => {
  if (e.key === 'Enter' && currentWord) {
    const isCorrect = input.trim() === currentWord;
    const firstAttempt = !(currentIndex in statuses);

    // บันทึกเฉพาะถ้าถูกต้อง หรือ ผิดครั้งแรก
    if (isCorrect || firstAttempt) {
      const entry = { time: getTimestamp(), word: currentWord, correct: isCorrect };
      setLog(prev => [entry, ...prev]);
      console.log(
        `${entry.time} — “${entry.word}” — ${isCorrect ? 'Correct' : 'Incorrect'}`
      );
    }

    // รักษาสถานะครั้งแรกไว้
    if (firstAttempt) {
      setStatuses(s => ({ ...s, [currentIndex]: isCorrect }));
      if (!isCorrect) {
        setWrongList(prev => [ currentWord,...prev]);
      }
    }

    // ถ้าถูกต้อง ให้ไปคำถัดไป
    if (isCorrect) {
      setCurrentIndex(i => i + 1);
      setInput('');
    }
  }
};


  const handleAddWords = () => {
    const text = prompt('พิมพ์คำใหม่ (หนึ่งคำต่อบรรทัด):', '');
    if (!text) return;
    const newWs = text.split('\n').map(w => w.trim()).filter(Boolean);
    setWords(w => [...w, ...newWs]);
  };

  const handleShuffle = () => {
    if (words.length < 2) return;
    setWords(w => shuffleArray(w));
    handleResetProgress();
  };

  const handleResetProgress = () => {
    setCurrentIndex(0);
    setInput('');
    setStatuses({});
    setLog([]);
    setWrongList([]);
  };

  const handleReset = () => {
    handleResetProgress();
  };

  const handleDeleteAll = () => {
    if (confirm('ลบคำศัพท์ทั้งหมดหรือไม่?')) {
      setWords([]);
      handleResetProgress();
    }
  };

  const handleCopyWrong = () => {
    if (!wrongList.length) return;
    navigator.clipboard.writeText(wrongList.join('\n'));
    alert('คัดลอกรายการคำผิดเรียบร้อย');
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-100 p-4" lang="th">
      <div className="bg-white shadow-xl rounded-lg w-full h-full max-w-4xl flex flex-col">
        {/* Mode Tabs */}
        <div className="flex">
          <button
            className={`flex-1 py-3 ${mode===1?'bg-blue-500 text-white':'bg-gray-200'}`}
            onClick={()=>setMode(1)}
          >Mode 1: พิมพ์จากคำ</button>
          <button
            className={`flex-1 py-3 ${mode===2?'bg-blue-500 text-white':'bg-gray-200'}`}
            onClick={()=>setMode(2)}
          >Mode 2: ฟังเสียง</button>
        </div>

        {/* Header */}
        <div className="p-6 text-center">
          <h1 className="text-3xl font-bold">ฝึกพิมพ์ตามคำบอก</h1>
          <p className="text-gray-600 mt-1">คำทั้งหมด: {words.length} | ถูกต้อง: {correctCount}</p>
        </div>

        {/* Content & Log Side by Side */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            {currentWord ? (
              <>
                {mode===1 && <div className="text-5xl font-bold mb-6">{currentWord}</div>}
                {mode===2 && (
                  <button
                    onClick={()=>speakThai(currentWord)}
                    className="mb-6 p-4 bg-green-500 hover:bg-green-600 text-white rounded-full text-2xl"
                  >ฟังอีกครั้ง</button>
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e=>setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="พิมพ์แล้วกด Enter"
                  className={`w-full max-w-lg text-2xl p-4 border rounded-lg transition-all ${
                    statuses[currentIndex]===false
                      ? 'border-red-500'
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {statuses[currentIndex]===false && (
                  <div className="mt-4 text-red-600 font-semibold">คำผิด ลองใหม่</div>
                )}
              </>
            ) : (
              <div className="text-green-600 text-2xl font-semibold">พิมพ์ครบทุกคำแล้ว</div>
            )}

            {/* Controls */}
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button onClick={handleAddWords} className="bg-teal-500 px-5 py-2 rounded text-white">เพิ่มคำ</button>
              <button onClick={handleShuffle} className="bg-purple-500 px-5 py-2 rounded text-white">สลับคำ</button>
              <button onClick={handleReset} className="bg-indigo-500 px-5 py-2 rounded text-white">เริ่มใหม่</button>
              <button onClick={handleDeleteAll} className="bg-pink-500 px-5 py-2 rounded text-white">ลบทั้งหมด</button>
            </div>
          </div>

          {/* Log Panel */}
          <div className="w-80 bg-gray-50 border-l p-4 overflow-y-auto">
            {/* Wrong List */}
            {wrongList.length > 0 && (
              <div className="mb-4">
                <h2 className="font-semibold mb-2">คำที่ผิดครั้งแรก</h2>
                <ul className="space-y-1 text-red-600 mb-2 max-h-[300px] overflow-y-auto">
                  {wrongList.map((w,i)=><li key={i}>{w}</li>)}
                </ul>
                <button onClick={handleCopyWrong} className="bg-yellow-500 px-3 py-1 rounded text-white">คัดลอก</button>
              </div>
            )}

            {/* Log */}
            <h2 className="font-semibold mb-2">บันทึกผลลัพธ์</h2>
            {log.length === 0 ? (
              <p className="text-gray-500">ยังไม่มีข้อมูล</p>
            ) : (
              <ul className="space-y-2 text-sm max-h-[300px] overflow-y-auto">
                {log.map((e,i)=>(
                  <li key={i} className="flex flex-col">
                    <span className="text-gray-600">{e.time}</span>
                    <span>“{e.word}” — <strong className={e.correct?'text-green-600':'text-red-600'}>{e.correct?'ถูกต้อง':'ผิด'}</strong></span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
