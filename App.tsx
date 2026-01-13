import React, { useState, useEffect } from 'react';
import { AppScreen, SummaryData, QuizState, FileData } from './types';
import { generateSummary, generateQuiz } from './services/geminiService';
import { apiService, User, SummaryRecord, QuizRecord } from './services/apiService';
import ProfileSelector from './components/ProfileSelector';
import ReactMarkdown from 'react-markdown';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
import Mascot from './components/Mascot';
import Button from './components/Button';
import { ChatBot } from './components/ChatBot';

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
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    currentQuestionIndex: 0,
    score: 0,
    selectedOption: null,
    showExplanation: false,
    attempts: 0,
    userAnswers: []
  });
  const [loadingMessage, setLoadingMessage] = useState('');
  const [reviewData, setReviewData] = useState<QuizRecord | null>(null);

  // User & Data State
  const [user, setUser] = useState<User | null>(null);
  const [savedSummaries, setSavedSummaries] = useState<SummaryRecord[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizRecord[]>([]);
  const [viewMode, setViewMode] = useState<'create' | 'saved' | 'history'>('create');

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    try {
      const summaries = await apiService.getSummaries(user.id);
      setSavedSummaries(summaries);
      const history = await apiService.getQuizHistory(user.id);
      setQuizHistory(history);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSaveSummary = async () => {
    if (!user || !summary) return;
    try {
      setLoadingMessage('กำลังบันทึก...');
      await apiService.saveSummary(user.id, summary.originalTopic, summary);
      alert('บันทึกบทเรียนเรียบร้อยจ้า! 💾');
      loadUserData();
    } catch (error) {
      alert('บันทึกไม่สำเร็จ T_T');
    } finally {
      setLoadingMessage('');
    }
  };

  const handleLoadSummary = (record: SummaryRecord) => {
    setSummary(record.content);
    setScreen(AppScreen.SUMMARY);
    // Reset quiz state when loading a summary
    setQuizState({
      questions: [],
      currentQuestionIndex: 0,
      score: 0,
      selectedOption: null,
      showExplanation: false,
      attempts: 0,
      userAnswers: []
    });
  };

  const handleGoToQuiz = async () => {
    if (quizState.questions.length > 0) {
      setScreen(AppScreen.QUIZ);
      return;
    }

    if (!summary) return;

    setScreen(AppScreen.PROCESSING);
    setLoadingMessage('กำลังเตรียมแบบทดสอบสนุกๆ...');
    try {
      const quizQuestions = await generateQuiz(summary);
      setQuizState({
        questions: quizQuestions,
        currentQuestionIndex: 0,
        score: 0,
        selectedOption: null,
        showExplanation: false,
        attempts: 0,
        userAnswers: new Array(quizQuestions.length).fill(null)
      });
      setScreen(AppScreen.QUIZ);
    } catch (error) {
      console.error(error);
      alert('สร้างแบบทดสอบไม่สำเร็จ T_T');
      setScreen(AppScreen.SUMMARY);
    } finally {
      setLoadingMessage('');
    }
  };

  if (!user) {
    return <ProfileSelector onUserSelected={setUser} />;
  }

  // Handle File Input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 50MB)
    if (file.size > MAX_FILE_SIZE) {
      alert('ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 50MB)');
      return;
    }

    setFileName(file.name);

    if (file.type === 'text/plain') {
      // Text files - read as text
      const reader = new FileReader();
      reader.onload = (event) => {
        setInputText(event.target?.result as string);
        setFileData(null);
      };
      reader.readAsText(file);
    } else if (
      file.type === 'application/pdf' ||
      file.type.startsWith('image/')
    ) {
      // PDF and images - convert to base64 for Gemini Vision
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        setFileData({
          base64,
          mimeType: file.type,
          fileName: file.name
        });
        setInputText('');
      };
      reader.readAsDataURL(file);
    } else {
      // Other files (DOCX, PPTX) - use filename only
      setInputText('');
      setFileData(null);
    }
  };

  // Start Processing
  const handleProcess = async () => {
    if (!inputText && !fileName && !fileData) {
      alert("กรุณาใส่เนื้อหาหรืออัปโหลดไฟล์ก่อนนะเด็กๆ");
      return;
    }

    setScreen(AppScreen.PROCESSING);
    setLoadingMessage(fileData ? 'ครู AI กำลังอ่านไฟล์อยู่จ้า...' : 'ครู AI กำลังอ่านเนื้อหาอยู่จ้า...');

    try {
      const summaryResult = await generateSummary(inputText, fileName, fileData, user?.summary_style);
      setSummary(summaryResult);

      setLoadingMessage('กำลังเตรียมแบบทดสอบสนุกๆ...');
      const quizQuestions = await generateQuiz(summaryResult);

      setQuizState({
        questions: quizQuestions,
        currentQuestionIndex: 0,
        score: 0,
        selectedOption: null,
        showExplanation: false,
        attempts: 0,
        userAnswers: []
      });

      setScreen(AppScreen.SUMMARY);
    } catch (error) {
      alert("เกิดข้อผิดพลาด: " + (error instanceof Error ? error.message : "Unknown error"));
      setScreen(AppScreen.UPLOAD);
    }
  };

  // Quiz Logic
  const handleAnswer = (optionIndex: number) => {
    if (quizState.selectedOption !== null && quizState.showExplanation) return; // Prevent clicking after correctly answering or max attempts

    const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
    const isCorrect = optionIndex === currentQuestion.correctAnswerIndex;

    if (isCorrect) {
      // User answered correctly
      setQuizState(prev => {
        const newUserAnswers = [...prev.userAnswers];
        newUserAnswers[prev.currentQuestionIndex] = optionIndex; // Track answer
        return {
          ...prev,
          selectedOption: optionIndex,
          score: prev.score + 1,
          showExplanation: true,
          attempts: 0,
          userAnswers: newUserAnswers
        };
      });
    } else {
      // User answered incorrectly
      const newAttempts = quizState.attempts + 1;

      if (newAttempts >= 3) {
        // Max attempts reached
        setQuizState(prev => {
          const newUserAnswers = [...prev.userAnswers];
          // If they failed, we might want to record their last wrong answer or null (failed).
          // Let's record the last selected option (which was wrong) 
          newUserAnswers[prev.currentQuestionIndex] = optionIndex;
          return {
            ...prev,
            selectedOption: optionIndex,
            showExplanation: true,
            attempts: newAttempts,
            userAnswers: newUserAnswers
          };
        });
      } else {
        // Retry logic - don't record final answer yet?
        // Actually we only want to record the "final" decision or the "first" attempt?
        // Requirement says "see items they got wrong".
        // Usually we record the *submitted* answer. 
        // If we allow retries, what is the "answer"? 
        // Let's assume the answer that triggered the "next" or "completion" is the one.
        // But here we just update state for visual feedback.
        // We will update the userAnswers ONLY when we move to the next state or finish the question.
        // Actually, let's just track the *last selected* option for the question index.
        setQuizState(prev => {
          // Don't update userAnswers array yet if we are allowing retry? 
          // If we want to show they got it wrong, we should maybe record it.
          // However, if they eventually get it right, does it count as wrong?
          // The score logic (isCorrect) increments score only if they get it right.
          // If they run out of attempts, they don't get score.
          // So `userAnswers` should reflect their final committed answer for that question.
          return {
            ...prev,
            selectedOption: optionIndex,
            attempts: newAttempts
            // userAnswers NOT updated here, wait until completed?
            // Actually, for the "failed" case above, we updated it.
          };
        });
      }
    }
  };

  const nextQuestion = () => {
    if (quizState.currentQuestionIndex >= quizState.questions.length - 1) {
      // Finished
      if (user) {
        // Ensure the last question's answer is recorded if it wasn't already 
        // (handleAnswer updates it for success/fail cases).

        apiService.saveQuizResult(
          user.id,
          quizState.score,
          quizState.questions.length,
          {
            topic: summary?.originalTopic,
            questions: quizState.questions, // Save full questions
            userAnswers: quizState.userAnswers // Save user answers
          }
        ).then(() => loadUserData());
      }
      setScreen(AppScreen.RESULT);
    } else {
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        selectedOption: null,
        showExplanation: false,
        attempts: 0
      }));
    }
  };

  // --- Render Views ---

  // ... (renderUpload and renderProcessing match original) ...

  const renderUpload = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 max-w-4xl mx-auto py-10">

      {/* Header Profile */}
      <div className="w-full flex justify-between items-center mb-10 bg-white p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
            🧒
          </div>
          <div>
            <h3 className="font-bold text-slate-700">น้อง{user.nickname} ({user.grade})</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500">รูปแบบการสอน:</span>
              <button
                onClick={async () => {
                  try {
                    const newStyle = user.summary_style === 'SHORT' ? 'DETAILED' : 'SHORT';
                    const updatedUser = await apiService.updateUser(user.id, newStyle);
                    setUser(updatedUser);
                  } catch (e) {
                    alert('ไม่สามารถเปลี่ยนรูปแบบได้');
                  }
                }}
                className={`text-xs px-2 py-0.5 rounded-full font-bold border transition-all ${user.summary_style === 'SHORT'
                  ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                  : 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200'
                  }`}
              >
                {user.summary_style === 'SHORT' ? '⚡️ แบบสั้น (เปลี่ยน)' : '📚 แบบละเอียด (เปลี่ยน)'}
              </button>
            </div>
          </div>
        </div>
        <button onClick={() => setUser(null)} className="text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-bold">
          ออก
        </button>
      </div>

      <Mascot emotion="happy" className="w-32 h-32 md:w-48 md:h-48 mb-8 animate-bounce-slow" />

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 bg-white p-2 rounded-xl shadow-sm">
        <button
          onClick={() => setViewMode('create')}
          className={`px-6 py-2 rounded-lg transition-all font-bold ${viewMode === 'create' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          🚀 บทเรียนใหม่
        </button>
        <button
          onClick={() => setViewMode('saved')}
          className={`px-6 py-2 rounded-lg transition-all font-bold ${viewMode === 'saved' ? 'bg-purple-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          📚 บทเรียนที่บันทึก ({savedSummaries.length})
        </button>
        <button
          onClick={() => setViewMode('history')}
          className={`px-6 py-2 rounded-lg transition-all font-bold ${viewMode === 'history' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          🏆 ผลสอบ ({quizHistory.length})
        </button>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-xl w-full border-4 border-blue-100 min-h-[400px]">

        {viewMode === 'create' && (
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-3xl font-bold text-center text-blue-600 mb-2">ห้องเรียนอัจฉริยะ</h1>
            <p className="text-center text-slate-500 mb-8 fun-font text-lg">
              อัปโหลดเอกสารการเรียน หรือวางเนื้อหาที่นี่ ให้ครู AI ช่วยสรุปและติวสอบให้!
            </p>

            {/* File Dropzone */}
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-blue-300 border-dashed rounded-2xl cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadIcon />
                <p className="mb-2 text-sm text-slate-600 fun-font"><span className="font-semibold">คลิกเพื่อเลือกไฟล์</span> (PDF, รูปภาพ, TXT)</p>
                <p className="text-xs text-slate-400">หรือลากไฟล์มาวางที่นี่</p>
              </div>
              <input type="file" className="hidden" accept=".txt,.pdf,.docx,.pptx,.jpg,.jpeg,.png,.gif,.webp" onChange={handleFileUpload} />
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
        )}

        {viewMode === 'saved' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold text-purple-700 mb-6">บทเรียนของฉัน</h2>
            {savedSummaries.length === 0 ? (
              <p className="text-center text-slate-400 custom-bounce py-10">ยังไม่มีบทเรียนที่บันทึกไว้จ้า 😅</p>
            ) : (
              <div className="grid gap-4">
                {savedSummaries.map((record) => (
                  <div key={record.id} className="border-2 border-purple-100 rounded-xl p-4 hover:border-purple-300 transition-all flex justify-between items-center group">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 group-hover:text-purple-700">{record.title}</h3>
                      <p className="text-sm text-slate-400">{new Date(record.created_at).toLocaleString('th-TH')}</p>
                    </div>
                    <button
                      onClick={() => handleLoadSummary(record)}
                      className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-bold"
                    >
                      อ่านทบทวน 📖
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === 'history' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold text-amber-700 mb-6">ประวัติการสอบ</h2>
            {quizHistory.length === 0 ? (
              <p className="text-center text-slate-400 custom-bounce py-10">ยังไม่เคยทำแบบทดสอบเลย มาลองทำกันเถอะ! 📝</p>
            ) : (
              <div className="grid gap-4">
                {quizHistory.map((record) => (
                  <div
                    key={record.id}
                    onClick={() => {
                      if (record.details?.questions) {
                        setReviewData(record);
                        setScreen(AppScreen.REVIEW);
                      } else {
                        alert('ขออภัย ข้อมูลเฉลยของชุดนี้ไม่ได้ถูกบันทึกไว้ (อาจเป็นข้อมูลเก่า)');
                      }
                    }}
                    className="border-2 border-amber-100 rounded-xl p-4 hover:border-amber-300 transition-all flex justify-between items-center bg-amber-50 cursor-pointer hover:shadow-md"
                  >
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{record.details?.topic || 'แบบทดสอบ'}</h3>
                      <p className="text-sm text-slate-400">{new Date(record.timestamp).toLocaleString('th-TH')}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-2xl font-bold ${record.score / record.total_questions >= 0.8 ? 'text-green-600' : record.score / record.total_questions >= 0.5 ? 'text-amber-600' : 'text-red-500'}`}>
                        {record.score}/{record.total_questions}
                      </span>
                      <p className="text-xs text-slate-500">คะแนน (คลิกเพื่อดูเฉลย)</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <Mascot emotion="thinking" className="w-32 h-32 md:w-48 md:h-48 animate-pulse mb-8" />
      <h2 className="text-2xl font-bold text-slate-700 fun-font animate-pulse">{loadingMessage}</h2>
      <div className="mt-8 w-64 h-4 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 animate-[width_2s_ease-in-out_infinite] w-[80%]"></div>
      </div>
    </div>
  );

  const renderSummary = () => {
    if (!summary) return null;
    return (
      <div className="max-w-4xl mx-auto pb-20 px-4 pt-8">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => setScreen(AppScreen.UPLOAD)}>← หน้าแรก</Button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveSummary}
              className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-full shadow-sm font-bold flex items-center gap-2 transition-all"
            >
              💾 บันทึกไว้อ่าน
            </button>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
              <span className="text-2xl">📚</span>
              <span className="font-bold text-blue-600 fun-font">เนื้อหาบทเรียน</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-yellow-100">
          <div className="bg-yellow-300 p-6 flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-yellow-900">{summary.originalTopic}</h1>
            <Mascot emotion="happy" className="w-16 h-16 md:w-20 md:h-20" />
          </div>

          <div className="p-6 md:p-10 space-y-6">
            {/* บทนำ */}
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
              <h3 className="text-xl font-bold text-blue-700 mb-4 fun-font">📖 บทนำ</h3>
              <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{summary.introduction}</p>
            </div>

            {/* หัวข้อย่อย */}
            {summary.sections.map((section, idx) => (
              <div key={idx} className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                <h3 className="text-xl font-bold text-purple-700 mb-4 fun-font">
                  <span className="inline-flex items-center justify-center w-8 h-8 mr-2 text-sm font-bold text-white bg-purple-500 rounded-full">
                    {idx + 1}
                  </span>
                  {section.title}
                </h3>
                <ReactMarkdown
                  components={{
                    strong: ({ node, ...props }) => <span className="bg-yellow-200 text-yellow-900 px-1 rounded mx-0.5 font-bold shadow-sm" {...props} />,
                    p: ({ node, ...props }) => <p className="mb-4 text-slate-700 leading-relaxed text-lg" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-2 mb-4 ml-4" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-2 mb-4 ml-4" {...props} />,
                    li: ({ node, ...props }) => <li className="text-slate-700" {...props} />,
                  }}
                >
                  {section.content}
                </ReactMarkdown>
              </div>
            ))}

            {/* ตัวอย่างในชีวิตจริง */}
            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
              <h3 className="text-xl font-bold text-orange-700 mb-4 fun-font">💡 ตัวอย่างในชีวิตจริง</h3>
              <ul className="space-y-3">
                {summary.examples.map((example, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-orange-500 mr-3 text-xl">•</span>
                    <span className="text-slate-700">{example}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Infographic */}
            {summary.infographicSvg && (
              <div className="bg-pink-50 p-6 rounded-2xl border border-pink-100 overflow-hidden">
                <h3 className="text-xl font-bold text-pink-700 mb-4 fun-font">🎨 แผนภาพช่วยจำ (Infographic)</h3>
                <div
                  className="w-full bg-white rounded-xl shadow-inner p-4 flex justify-center overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: summary.infographicSvg }}
                />
              </div>
            )}

            {/* สรุปประเด็นสำคัญ */}
            <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
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

            {/* Chat with Teacher */}
            <ChatBot summary={summary} />
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center sticky bottom-0 z-10">
            <Button variant="success" className="text-xl px-12 py-4 shadow-xl" onClick={handleGoToQuiz}>
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

    // Determine current state logic
    const isCompleted = quizState.showExplanation; // True if answered correctly OR max attempts reached
    const isWrong = !isCompleted && quizState.attempts > 0; // True if currently in retry mode

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

        <div className={`bg-white rounded-3xl shadow-xl overflow-hidden border-b-8 transition-colors duration-500 ${isWrong ? 'border-orange-200' : 'border-blue-200'}`}>
          <div className="p-8 md:p-10">
            {/* Mascot & Question Header */}
            <div className="flex items-center gap-4 mb-6">
              <Mascot
                emotion={isCompleted ? 'excited' : isWrong ? 'sad' : 'thinking'}
                className="w-20 h-20 flex-shrink-0"
              />
              <div>
                {isWrong && (
                  <div className="text-orange-500 font-bold mb-1 animate-pulse">
                    ฮึบๆ อีกนิดเดียว! (ลองผิดไป {quizState.attempts} ครั้ง)
                  </div>
                )}
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 leading-snug">
                  {question.question}
                </h2>
              </div>
            </div>

            {/* Options */}
            <div className="grid gap-4">
              {question.options.map((option, idx) => {
                let btnClass = "bg-slate-50 border-2 border-slate-200 hover:border-blue-300";

                // Visual Logic
                if (quizState.selectedOption === idx) {
                  // This option was selected
                  if (isCompleted) {
                    // If round is over, check correctness
                    if (idx === question.correctAnswerIndex) btnClass = "bg-green-100 border-green-500 text-green-800";
                    else btnClass = "bg-red-100 border-red-500 text-red-800";
                  } else if (isWrong) {
                    // Currently trying, and this was the last wrong pick
                    btnClass = "bg-red-50 border-red-300 text-red-500";
                  }
                } else if (isCompleted && idx === question.correctAnswerIndex) {
                  // Show correct answer even if not selected
                  btnClass = "bg-green-100 border-green-500 text-green-800 ring-2 ring-green-200";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={isCompleted} // Disable only when round is fully over
                    className={`text-left p-5 rounded-xl text-lg transition-all fun-font ${btnClass}`}
                  >
                    <span className="font-bold mr-3 opacity-60">{['ก', 'ข', 'ค', 'ง'][idx]}.</span>
                    {option}
                  </button>
                );
              })}
            </div>

            {/* Hint Section (Show when wrong but not yet max attempts) */}
            {isWrong && question.hint && (
              <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-200 animate-slide-up">
                <div className="flex items-center gap-2 text-orange-700">
                  <span className="text-2xl">💡</span>
                  <span className="font-bold">คำใบ้จ้า:</span>
                  <span>{question.hint}</span>
                </div>
              </div>
            )}

            {/* Explanation Section (Show when completed) */}
            {quizState.showExplanation && (
              <div className={`mt-8 p-4 rounded-xl border animate-fade-in ${quizState.selectedOption === question.correctAnswerIndex ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start gap-3">
                  <Mascot emotion={quizState.selectedOption === question.correctAnswerIndex ? 'excited' : 'neutral'} className="w-12 h-12 flex-shrink-0" />
                  <div>
                    <h4 className={`font-bold mb-1 ${quizState.selectedOption === question.correctAnswerIndex ? 'text-green-800' : 'text-red-800'}`}>
                      {quizState.selectedOption === question.correctAnswerIndex ? 'เก่งมาก!' : 'เฉลย:'}
                    </h4>
                    <p className="text-slate-800">{question.explanation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 flex justify-end">
            <Button
              onClick={nextQuestion}
              disabled={!isCompleted} // Only can go next if round is over
              className="px-8"
            >
              {quizState.currentQuestionIndex === quizState.questions.length - 1 ? 'ดูผลสอบ 🏆' : 'ข้อต่อไป ➡️'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderReview = () => {
    if (!reviewData || !reviewData.details?.questions) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <p>ไม่พบข้อมูลการสอบนี้ (อาจจะเป็นข้อมูลเก่า)</p>
          <Button onClick={() => setScreen(AppScreen.UPLOAD)}>กลับ</Button>
        </div>
      );
    }

    const { questions, userAnswers } = reviewData.details;

    return (
      <div className="max-w-4xl mx-auto pb-20 px-4 pt-8">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => setScreen(AppScreen.UPLOAD)}>← กลับหน้าแรก</Button>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm font-bold text-amber-600">
            เฉลยข้อสอบ 📝
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-amber-100 p-6 md:p-10 space-y-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800">{reviewData.details.topic || 'แบบทดสอบ'}</h2>
            <p className="text-slate-500">
              คะแนนของคุณ: {reviewData.score} / {reviewData.total_questions}
            </p>
          </div>

          {questions.map((q: any, idx: number) => {
            const userAnswerIdx = userAnswers ? userAnswers[idx] : null;
            const isCorrect = userAnswerIdx === q.correctAnswerIndex;

            return (
              <div key={idx} className={`border-2 rounded-2xl p-6 ${isCorrect ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'}`}>
                <div className="flex gap-3 mb-4">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold flex-shrink-0 ${isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {idx + 1}
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">{q.question}</h3>
                </div>

                <div className="grid gap-2 ml-11 mb-4">
                  {q.options.map((opt: string, optIdx: number) => {
                    let optionClass = "p-3 rounded-lg border ";
                    if (optIdx === q.correctAnswerIndex) {
                      optionClass += "bg-green-200 border-green-400 text-green-900 font-bold"; // Correct answer always green
                    } else if (optIdx === userAnswerIdx && !isCorrect) {
                      optionClass += "bg-red-200 border-red-400 text-red-900 font-bold"; // Wrong User Selection
                    } else {
                      optionClass += "bg-white border-slate-200 text-slate-500";
                    }

                    return (
                      <div key={optIdx} className={optionClass}>
                        {['ก', 'ข', 'ค', 'ง'][optIdx]}. {opt}
                        {optIdx === q.correctAnswerIndex && " ✅"}
                        {optIdx === userAnswerIdx && !isCorrect && " ❌ (ตอบพลาดยังไงล่ะ)"}
                        {optIdx === userAnswerIdx && isCorrect && " (ตอบถูกจ้า)"}
                      </div>
                    );
                  })}
                </div>

                <div className="ml-11 bg-white p-4 rounded-xl border border-slate-200">
                  <p className="text-sm font-bold text-slate-500 mb-1">คำอธิบาย:</p>
                  <p className="text-slate-700">{q.explanation}</p>
                </div>
              </div>
            );
          })}
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
              setQuizState(prev => ({ ...prev, currentQuestionIndex: 0, score: 0, selectedOption: null, showExplanation: false, userAnswers: [], attempts: 0 }));
            }}>
              📖 ทบทวนบทเรียนอีกครั้ง
            </Button>
            <Button fullWidth variant="secondary" onClick={() => {
              setScreen(AppScreen.UPLOAD);
              setSummary(null);
              setInputText('');
              setFileName(undefined);
              setFileData(null);
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
      {screen === AppScreen.REVIEW && renderReview()}
    </div>
  );
};

export default App;
