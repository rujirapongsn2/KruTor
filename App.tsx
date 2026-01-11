import React, { useState, useEffect } from 'react';
import { AppScreen, SummaryData, QuizState } from './types';
import { generateSummary, generateQuiz } from './services/geminiService';
import Mascot from './components/Mascot';
import Button from './components/Button';

// Icons
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12 mb-4 text-blue-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.UPLOAD);
  const [inputText, setInputText] = useState('');
  const [fileName, setFileName] = useState<string | undefined>(undefined);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    currentQuestionIndex: 0,
    score: 0,
    selectedOption: null,
    showExplanation: false
  });
  const [loadingMessage, setLoadingMessage] = useState('');

  // Handle File Input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (event) => {
        setInputText(event.target?.result as string);
      };
      reader.readAsText(file);
    } else {
      // For PDF/DOCX/PPTX in this demo environment, we use the filename as a topic trigger
      // Real implementation would require complex backend or heavy workers
      setInputText(''); // Clear text to force fallback to filename-based generation
      alert('สำหรับไฟล์ PDF/DOCX/PPTX ระบบจะใช้ "ชื่อไฟล์" ในการสร้างบทเรียนอัตโนมัตินะคะ!');
    }
  };

  // Start Processing
  const handleProcess = async () => {
    if (!inputText && !fileName) {
      alert("กรุณาใส่เนื้อหาหรืออัปโหลดไฟล์ก่อนนะเด็กๆ");
      return;
    }

    setScreen(AppScreen.PROCESSING);
    setLoadingMessage('ครู AI กำลังอ่านเนื้อหาอยู่จ้า...');

    try {
      const summaryResult = await generateSummary(inputText, fileName);
      setSummary(summaryResult);
      
      setLoadingMessage('กำลังเตรียมแบบทดสอบสนุกๆ...');
      const quizQuestions = await generateQuiz(summaryResult);
      
      setQuizState({
        questions: quizQuestions,
        currentQuestionIndex: 0,
        score: 0,
        selectedOption: null,
        showExplanation: false
      });

      setScreen(AppScreen.SUMMARY);
    } catch (error) {
      alert("เกิดข้อผิดพลาด: " + (error instanceof Error ? error.message : "Unknown error"));
      setScreen(AppScreen.UPLOAD);
    }
  };

  // Quiz Logic
  const handleAnswer = (optionIndex: number) => {
    if (quizState.selectedOption !== null) return; // Prevent double click

    const isCorrect = optionIndex === quizState.questions[quizState.currentQuestionIndex].correctAnswerIndex;
    setQuizState(prev => ({
      ...prev,
      selectedOption: optionIndex,
      score: isCorrect ? prev.score + 1 : prev.score,
      showExplanation: true
    }));
  };

  const nextQuestion = () => {
    if (quizState.currentQuestionIndex >= quizState.questions.length - 1) {
      setScreen(AppScreen.RESULT);
    } else {
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        selectedOption: null,
        showExplanation: false
      }));
    }
  };

  // --- Render Views ---

  const renderUpload = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 max-w-3xl mx-auto">
      <Mascot emotion="happy" className="mb-8 animate-bounce-slow" />
      
      <div className="bg-white rounded-3xl p-8 shadow-xl w-full border-4 border-blue-100">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-2">ห้องเรียนอัจฉริยะ</h1>
        <p className="text-center text-slate-500 mb-8 fun-font text-lg">
          อัปโหลดเอกสารการเรียน หรือวางเนื้อหาที่นี่ ให้ครู AI ช่วยสรุปและติวสอบให้!
        </p>

        <div className="space-y-6">
          {/* File Dropzone */}
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-blue-300 border-dashed rounded-2xl cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors group">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <UploadIcon />
              <p className="mb-2 text-sm text-slate-600 fun-font"><span className="font-semibold">คลิกเพื่อเลือกไฟล์</span> (PDF, DOCX, TXT)</p>
              <p className="text-xs text-slate-400">หรือลากไฟล์มาวางที่นี่</p>
            </div>
            <input type="file" className="hidden" accept=".txt,.pdf,.docx,.pptx" onChange={handleFileUpload} />
          </label>

          {fileName && (
            <div className="bg-green-100 p-3 rounded-xl flex items-center text-green-700">
              <span className="mr-2">📎</span>
              <span className="font-semibold truncate">{fileName}</span>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500 fun-font">หรือ พิมพ์เนื้อหา</span>
            </div>
          </div>

          <textarea
            className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-blue-400 focus:ring focus:ring-blue-200 transition-all min-h-[150px] resize-none fun-font"
            placeholder="วางเนื้อหาบทเรียนที่ต้องการสรุปที่นี่..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          ></textarea>

          <Button fullWidth onClick={handleProcess} disabled={!inputText && !fileName} className="text-xl py-4">
            🚀 เริ่มเรียนรู้กันเลย!
          </Button>
        </div>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <Mascot emotion="thinking" className="animate-pulse mb-8" />
      <h2 className="text-2xl font-bold text-slate-700 fun-font animate-pulse">{loadingMessage}</h2>
      <div className="mt-8 w-64 h-4 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 animate-[width_2s_ease-in-out_infinite]" style={{ width: '80%' }}></div>
      </div>
    </div>
  );

  const renderSummary = () => {
    if (!summary) return null;
    return (
      <div className="max-w-4xl mx-auto pb-20 px-4 pt-8">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => setScreen(AppScreen.UPLOAD)}>← หน้าแรก</Button>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
            <span className="text-2xl">📚</span>
            <span className="font-bold text-blue-600 fun-font">สรุปบทเรียน</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-yellow-100">
          <div className="bg-yellow-300 p-6 flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-yellow-900">{summary.originalTopic}</h1>
            <Mascot emotion="happy" className="w-16 h-16 md:w-20 md:h-20" />
          </div>
          
          <div className="p-6 md:p-10 space-y-8">
            <div className="prose prose-lg max-w-none">
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <h3 className="text-xl font-bold text-blue-700 mb-4 fun-font">📝 เนื้อหาสาระ</h3>
                <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{summary.summaryContent}</p>
              </div>

              <div className="bg-green-50 p-6 rounded-2xl border border-green-100 mt-6">
                <h3 className="text-xl font-bold text-green-700 mb-4 fun-font">🔑 จำให้แม่น (Key Points)</h3>
                <ul className="space-y-3">
                  {summary.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="inline-flex items-center justify-center w-6 h-6 mr-3 text-sm font-bold text-green-600 bg-green-200 rounded-full flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-slate-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center sticky bottom-0 z-10">
             <Button variant="success" className="text-xl px-12 py-4 shadow-xl" onClick={() => setScreen(AppScreen.QUIZ)}>
               📝 ไปทำแบบทดสอบ (10 ข้อ)
             </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderQuiz = () => {
    const question = quizState.questions[quizState.currentQuestionIndex];
    if (!question) return null;

    return (
      <div className="max-w-3xl mx-auto min-h-[90vh] flex flex-col justify-center px-4 py-8">
         <div className="flex justify-between items-center mb-6">
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm font-bold text-slate-600">
              ข้อที่ {quizState.currentQuestionIndex + 1} / {quizState.questions.length}
            </div>
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm font-bold text-blue-600">
              คะแนน: {quizState.score}
            </div>
         </div>

         <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-b-8 border-blue-200">
            <div className="p-8 md:p-10">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8 leading-snug">
                {question.question}
              </h2>

              <div className="grid gap-4">
                {question.options.map((option, idx) => {
                  let btnClass = "bg-slate-50 border-2 border-slate-200 hover:border-blue-300";
                  if (quizState.selectedOption !== null) {
                    if (idx === question.correctAnswerIndex) btnClass = "bg-green-100 border-green-500 text-green-800";
                    else if (idx === quizState.selectedOption) btnClass = "bg-red-100 border-red-500 text-red-800";
                    else btnClass = "opacity-50";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={quizState.selectedOption !== null}
                      className={`text-left p-5 rounded-xl text-lg transition-all fun-font ${btnClass}`}
                    >
                      <span className="font-bold mr-3 opacity-60">{['ก', 'ข', 'ค', 'ง'][idx]}.</span>
                      {option}
                    </button>
                  );
                })}
              </div>

              {quizState.showExplanation && (
                <div className="mt-8 p-4 bg-yellow-50 rounded-xl border border-yellow-200 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <Mascot emotion="happy" className="w-12 h-12 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-yellow-800 mb-1">เฉลย:</h4>
                      <p className="text-yellow-900">{question.explanation}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 flex justify-end">
              <Button 
                onClick={nextQuestion} 
                disabled={quizState.selectedOption === null}
                className="px-8"
              >
                {quizState.currentQuestionIndex === quizState.questions.length - 1 ? 'ดูผลสอบ 🏆' : 'ข้อต่อไป ➡️'}
              </Button>
            </div>
         </div>
      </div>
    );
  };

  const renderResult = () => {
    const percentage = (quizState.score / quizState.questions.length) * 100;
    let message = "";
    let emotion: 'happy' | 'excited' | 'thinking' | 'neutral' = 'happy';

    if (percentage >= 80) { message = "สุดยอดไปเลย! เก่งมากๆ"; emotion = 'excited'; }
    else if (percentage >= 50) { message = "ทำได้ดีมาก พยายามอีกนิดนะ"; emotion = 'happy'; }
    else { message = "ไม่เป็นไรนะ กลับไปทบทวนใหม่กันเถอะ"; emotion = 'thinking'; }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        {percentage >= 80 && (
           <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
             {[...Array(20)].map((_, i) => (
               <div key={i} className="absolute text-4xl animate-[spin_3s_linear_infinite]" 
                    style={{
                      left: `${Math.random() * 100}%`, 
                      top: `-10%`,
                      animationDuration: `${Math.random() * 3 + 2}s`,
                      animationDelay: `${Math.random() * 2}s`
                    }}>
                 🎉
               </div>
             ))}
           </div>
        )}
        
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center relative z-10 border-8 border-yellow-200">
          <Mascot emotion={emotion} className="w-32 h-32 mx-auto mb-6" />
          
          <h1 className="text-4xl font-bold text-slate-800 mb-2 fun-font">
            {quizState.score} / {quizState.questions.length}
          </h1>
          <p className="text-slate-500 mb-6 text-lg">คะแนนของคุณ</p>
          
          <div className="bg-slate-100 rounded-xl p-4 mb-8">
            <h3 className="text-xl font-bold text-blue-600 mb-2">{message}</h3>
            <div className="w-full bg-slate-300 rounded-full h-4 overflow-hidden">
              <div 
                className={`h-full ${percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-400' : 'bg-red-400'} transition-all duration-1000 ease-out`} 
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-3">
             <Button fullWidth onClick={() => {
               setScreen(AppScreen.SUMMARY);
               setQuizState(prev => ({ ...prev, currentQuestionIndex: 0, score: 0, selectedOption: null, showExplanation: false }));
             }}>
               📖 ทบทวนบทเรียนอีกครั้ง
             </Button>
             <Button fullWidth variant="secondary" onClick={() => {
               setScreen(AppScreen.UPLOAD);
               setSummary(null);
               setInputText('');
               setFileName(undefined);
             }}>
               🏠 เริ่มบทเรียนใหม่
             </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-sky-100 selection:bg-yellow-200">
      {screen === AppScreen.UPLOAD && renderUpload()}
      {screen === AppScreen.PROCESSING && renderProcessing()}
      {screen === AppScreen.SUMMARY && renderSummary()}
      {screen === AppScreen.QUIZ && renderQuiz()}
      {screen === AppScreen.RESULT && renderResult()}
    </div>
  );
};

export default App;
