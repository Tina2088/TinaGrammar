import React, { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  RefreshCcw, 
  Filter, 
  GraduationCap, 
  Sparkles,
  Info,
  Trophy,
  History,
  ArrowRightCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { ENCOURAGEMENT_PHRASES } from './constants';
import { Difficulty, GrammarPoint, Question, UserAnswer } from './types';
import { getDeepExplanation, generateQuestions } from './geminiService';

const QUESTIONS_PER_SESSION = 5;

const App: React.FC = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'All'>('All');
  const [filterCategory, setFilterCategory] = useState<GrammarPoint | 'All'>('All');
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);

  const fetchBatch = useCallback(async (difficulty: string, category: string) => {
    setLoadingQuestions(true);
    setError(null);
    try {
      const questions = await generateQuestions(difficulty, category, QUESTIONS_PER_SESSION);
      if (questions && questions.length > 0) {
        setSessionQuestions(questions);
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setSubmitted(false);
        setUserAnswers([]);
        setShowResult(false);
        setAiExplanation(null);
      } else {
        throw new Error("No questions returned from AI.");
      }
    } catch (err) {
      console.error("Failed to fetch questions", err);
      setError("AI 老师出题失败了，请检查网络或刷新重试。");
    } finally {
      setLoadingQuestions(false);
    }
  }, []);

  // Fetch when filters change
  useEffect(() => {
    fetchBatch(filterDifficulty, filterCategory);
  }, [filterDifficulty, filterCategory, fetchBatch]);

  const currentQuestion = sessionQuestions[currentQuestionIndex];

  const handleOptionClick = (option: string) => {
    if (submitted) return;
    setSelectedOption(option);
  };

  const handleSubmit = async () => {
    if (!selectedOption || !currentQuestion) return;

    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    const answer: UserAnswer = {
      questionId: currentQuestion.id,
      selectedOption,
      isCorrect,
      timestamp: Date.now()
    };

    setUserAnswers([...userAnswers, answer]);
    setSubmitted(true);

    if (!isCorrect) {
      setLoadingAi(true);
      const fullSentence = `${currentQuestion.sentenceBefore} [___] ${currentQuestion.sentenceAfter}`;
      const explanation = await getDeepExplanation(fullSentence, selectedOption, currentQuestion.correctAnswer);
      setAiExplanation(explanation);
      setLoadingAi(false);
    }
  };

  const handleNext = () => {
    const nextIndex = currentQuestionIndex + 1;
    const isEndOfSession = nextIndex % QUESTIONS_PER_SESSION === 0;
    
    if (isEndOfSession || nextIndex >= sessionQuestions.length) {
      setShowResult(true);
    } else {
      setCurrentQuestionIndex(nextIndex);
      setSelectedOption(null);
      setSubmitted(false);
      setAiExplanation(null);
    }
  };

  const difficultyTranslations: Record<string, string> = {
    [Difficulty.BEGINNER]: '初级',
    [Difficulty.INTERMEDIATE]: '中级',
    [Difficulty.ADVANCED]: '高级',
    'All': '全部难度'
  };

  const categoryTranslations: Record<string, string> = {
    [GrammarPoint.NON_FINITE]: '非谓语动词',
    [GrammarPoint.RELATIVE_CLAUSE]: '定语从句',
    [GrammarPoint.ADVERBIAL_CLAUSE]: '状语从句',
    [GrammarPoint.INVERSION]: '倒装句',
    [GrammarPoint.SUBJUNCTIVE]: '虚拟语气',
    [GrammarPoint.CONJUNCTIONS]: '连词',
    'All': '全部类别'
  };

  // 1. Error State
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-sm max-w-md w-full border border-slate-100">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">出错了 / Oops!</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button 
            onClick={() => fetchBatch(filterDifficulty, filterCategory)}
            className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" /> Try Again / 重试
          </button>
        </div>
      </div>
    );
  }

  // 2. Loading Questions State
  if (loadingQuestions) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="text-center p-12 bg-white rounded-3xl shadow-sm max-w-md w-full border border-slate-100 flex flex-col items-center">
          <div className="relative mb-6">
            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
            <Sparkles className="w-6 h-6 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-slate-800">Generating Questions...</h2>
          <p className="text-slate-500 mb-2">AI 老师正在为你组题...</p>
        </div>
      </div>
    );
  }

  // 3. Results State
  if (showResult) {
    const accuracy = Math.round((userAnswers.filter(a => a.isCorrect).length / (userAnswers.length || 1)) * 100);
    const encouragement = ENCOURAGEMENT_PHRASES[Math.min(Math.floor(accuracy / 100 * (ENCOURAGEMENT_PHRASES.length - 1)), ENCOURAGEMENT_PHRASES.length - 1)];
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-indigo-600 p-8 text-center text-white">
            <Trophy className="w-16 h-16 mx-auto mb-4 animate-bounce" />
            <h1 className="text-3xl font-bold mb-2">Practice Done! / 练习完成！</h1>
            <p className="opacity-90">{encouragement}</p>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 p-4 rounded-2xl text-center">
                <p className="text-sm text-slate-500 mb-1">Score / 得分</p>
                <p className="text-3xl font-bold text-indigo-600">{userAnswers.filter(a => a.isCorrect).length} / {userAnswers.length}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl text-center">
                <p className="text-sm text-slate-500 mb-1">Accuracy / 正确率</p>
                <p className="text-3xl font-bold text-indigo-600">{accuracy}%</p>
              </div>
            </div>
            <button 
              onClick={() => fetchBatch(filterDifficulty, filterCategory)}
              className="w-full py-4 px-6 bg-indigo-600 text-white font-semibold rounded-2xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              Start New Batch / 开始下一组 <ArrowRightCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Safety: Wait for first question to load
  if (!currentQuestion) {
    return null;
  }

  const sessionProgressPercent = ((currentQuestionIndex + 1) / QUESTIONS_PER_SESSION) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 md:px-8 py-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">TinaGrammar</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">AI Powered / 智能出题</p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            <div className="flex items-center gap-2 mr-4 text-sm font-medium">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                value={filterDifficulty} 
                onChange={(e) => setFilterDifficulty(e.target.value as Difficulty)}
                className="bg-slate-50 border-none rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 text-slate-600 outline-none text-xs"
              >
                <option value="All">All Levels / 全部难度</option>
                {Object.values(Difficulty).map(d => <option key={d} value={d}>{d} / {difficultyTranslations[d]}</option>)}
              </select>
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value as GrammarPoint)}
                className="bg-slate-50 border-none rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 text-slate-600 outline-none text-xs"
              >
                <option value="All">All Categories / 全部类别</option>
                {Object.values(GrammarPoint).map(c => <option key={c} value={c}>{c} / {categoryTranslations[c]}</option>)}
              </select>
            </div>
            <div className="flex-1 h-2 bg-slate-100 rounded-full min-w-[100px] relative">
              <div 
                className="absolute left-0 top-0 h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${sessionProgressPercent}%` }}
              />
            </div>
            <span className="text-sm font-bold text-slate-400 ml-2 whitespace-nowrap">
              {currentQuestionIndex + 1} / {QUESTIONS_PER_SESSION}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 md:p-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    currentQuestion.difficulty === Difficulty.BEGINNER ? 'bg-emerald-100 text-emerald-700' :
                    currentQuestion.difficulty === Difficulty.INTERMEDIATE ? 'bg-amber-100 text-amber-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {difficultyTranslations[currentQuestion.difficulty] || currentQuestion.difficulty}
                  </span>
                  <span className="text-slate-400 px-3 py-1 bg-slate-50 rounded-full text-xs font-bold">
                    {categoryTranslations[currentQuestion.category] || currentQuestion.category}
                  </span>
                </div>
              </div>

              <div className="english-text text-2xl md:text-3xl leading-relaxed text-slate-800 mb-10">
                {currentQuestion.sentenceBefore && <span>{currentQuestion.sentenceBefore} </span>}
                <span className={`inline-block px-6 py-1 border-b-4 mx-1 transition-all min-w-[120px] text-center ${
                  submitted 
                    ? selectedOption === currentQuestion.correctAnswer 
                      ? 'border-emerald-500 text-emerald-600 bg-emerald-50' 
                      : 'border-rose-500 text-rose-600 bg-rose-50'
                    : selectedOption 
                      ? 'border-indigo-500 text-indigo-600 bg-indigo-50' 
                      : 'border-slate-300'
                }`}>
                  {selectedOption || '________'}
                </span>
                {currentQuestion.sentenceAfter && <span> {currentQuestion.sentenceAfter}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option}
                    disabled={submitted}
                    onClick={() => handleOptionClick(option)}
                    className={`group relative p-4 rounded-2xl border-2 text-lg font-medium transition-all duration-200 flex items-center justify-between ${
                      submitted
                        ? option === currentQuestion.correctAnswer
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : option === selectedOption
                            ? 'border-rose-500 bg-rose-50 text-rose-700'
                            : 'border-slate-100 text-slate-400 opacity-50'
                        : selectedOption === option
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 scale-[1.02] shadow-md'
                          : 'border-slate-100 bg-white hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <span>{option}</span>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-opacity ${
                      submitted
                        ? option === currentQuestion.correctAnswer
                          ? 'bg-emerald-500 text-white opacity-100'
                          : option === selectedOption
                            ? 'bg-rose-500 text-white opacity-100'
                            : 'opacity-0'
                        : selectedOption === option
                          ? 'bg-indigo-500 text-white opacity-100'
                          : 'bg-slate-200 opacity-0 group-hover:opacity-100'
                    }`}>
                      {submitted ? (
                        option === currentQuestion.correctAnswer ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />
                      ) : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-50 flex items-center justify-between">
              <div className="text-slate-400 text-sm font-semibold flex items-center gap-1">
                <Info className="w-4 h-4" /> 选择最佳答案
              </div>
              <div className="flex gap-3">
                {!submitted ? (
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedOption}
                    className="py-3 px-10 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all active:scale-95 text-sm"
                  >
                    Submit / 提交
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="py-3 px-10 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg transition-all active:scale-95 flex items-center gap-2 text-sm"
                  >
                    Next / 下一题 <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {submitted && selectedOption !== currentQuestion.correctAnswer && (
            <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 mb-3 text-amber-800 font-bold">
                <Sparkles className="w-5 h-5" />
                <span>AI Tutor Insights / AI 点评</span>
              </div>
              <div className="text-amber-900 leading-relaxed text-sm md:text-base">
                {loadingAi ? "Analyzing... / 正在分析..." : aiExplanation}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-fit sticky top-28">
            <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold border-b border-slate-100 pb-4">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <h3>Grammar Guide / 语法指南</h3>
            </div>
            {submitted ? (
              <div className="space-y-6">
                <section>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Core Rule / 核心规则</h4>
                  <p className="text-slate-700 text-sm leading-relaxed">{currentQuestion.explanation.rule}</p>
                </section>
                <section>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Examples / 例句</h4>
                  <ul className="space-y-2">
                    {currentQuestion.explanation.examples.map((ex, i) => (
                      <li key={i} className="text-sm bg-indigo-50 p-3 rounded-xl text-indigo-900 italic border-l-4 border-indigo-200">"{ex}"</li>
                    ))}
                  </ul>
                </section>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                <History className="w-8 h-8 opacity-20 mb-4" />
                <p className="text-sm">提交答案后查看解析</p>
              </div>
            )}
          </div>
        </aside>
      </main>

      <footer className="p-6 text-center text-slate-400 text-xs border-t border-slate-200 bg-white">
        © 2026 TinaGrammar • AI 实时生成题库
      </footer>
    </div>
  );
};

export default App;