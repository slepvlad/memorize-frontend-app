import { useState, useEffect, useCallback } from 'react';
import { phrasesApi, PhraseResponse } from '../api/phrases';
import { QuizQuestion, QuizResult } from './types';

function getDuePhrases(phrases: PhraseResponse[]): PhraseResponse[] {
  const now = new Date();
  return phrases.filter((p) => new Date(p.next_review_date) <= now);
}

export function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function buildQuestions(duePhrases: PhraseResponse[], allPhrases: PhraseResponse[]): QuizQuestion[] {
  return duePhrases.map((phrase) => {
    const validExamples = phrase.examples.filter((e) => e.original && e.translation);
    const useType = validExamples.length > 0 && Math.random() < 0.5;

    if (useType) {
      const example = validExamples[Math.floor(Math.random() * validExamples.length)];
      return {
        type: 'type' as const,
        phraseId: phrase.id,
        question: example.translation,
        exampleTranslation: example.translation,
        correctAnswer: example.original,
      };
    }

    const distractors = allPhrases
      .filter((p) => p.id !== phrase.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((p) => p.translatedWord);

    const allOptions = [...distractors, phrase.translatedWord].sort(() => Math.random() - 0.5);
    const correctIndex = allOptions.indexOf(phrase.translatedWord);

    return {
      type: 'select' as const,
      phraseId: phrase.id,
      question: phrase.originalWord,
      options: allOptions,
      correctIndex,
    };
  });
}

export function useQuizSession(phraseIds: string | undefined) {
  const [isLearnSession, setIsLearnSession] = useState(!!phraseIds);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [results, setResults] = useState<QuizResult[]>([]);
  const [finished, setFinished] = useState(false);
  const [dueCount, setDueCount] = useState(0);

  // silent=true skips the full-screen loading spinner (used for pull-to-refresh)
  const loadQuiz = useCallback(async (targetIds?: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const page = await phrasesApi.getAll(0, 200);
      const all = page.content;

      let target: PhraseResponse[];
      if (targetIds) {
        const ids = new Set(targetIds.split(','));
        target = all.filter((p) => ids.has(p.id));
      } else {
        const due = getDuePhrases(all);
        setDueCount(due.length);
        target = due;
      }

      const qs = all.length >= 4 ? buildQuestions(target, all) : [];
      setQuestions(qs);
      setCurrentQ(0);
      setSelected(null);
      setTypedAnswer('');
      setResults([]);
      setFinished(false);
      setAnswered(false);
    } catch {
      // errors handled globally by axios interceptor (toast)
    } finally {
      if (!silent) setLoading(false);
    }
  }, []); // stable — no external deps, targetIds passed explicitly

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadQuiz(undefined, true);
    setRefreshing(false);
  }, [loadQuiz]);

  useEffect(() => {
    void loadQuiz(phraseIds);
  }, [loadQuiz, phraseIds]);

  const handleNewSession = () => {
    setIsLearnSession(false);
    void loadQuiz(); // fresh fetch, due-phrases mode — drops stale param context
  };

  const handleSelect = async (index: number) => {
    if (answered || questions.length === 0) return;
    const q = questions[currentQ];
    if (q.type !== 'select') return;
    const correct = index === q.correctIndex;
    setSelected(index);
    setAnswered(true);
    setResults((prev) => [...prev, { phraseId: q.phraseId, question: q.question, correct }]);
    try {
      await phrasesApi.review(q.phraseId, correct);
    } catch {
      // review errors are handled globally
    }
  };

  const handleSubmitType = async () => {
    if (answered || questions.length === 0) return;
    const q = questions[currentQ];
    if (q.type !== 'type') return;
    const correct = normalize(typedAnswer) === normalize(q.correctAnswer);
    setAnswered(true);
    setResults((prev) => [...prev, { phraseId: q.phraseId, question: q.question, correct }]);
    try {
      await phrasesApi.review(q.phraseId, correct);
    } catch {
      // review errors are handled globally
    }
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelected(null);
      setTypedAnswer('');
      setAnswered(false);
    } else {
      setFinished(true);
    }
  };

  return {
    loading,
    refreshing,
    questions,
    currentQ,
    selected,
    answered,
    typedAnswer,
    setTypedAnswer,
    results,
    finished,
    dueCount,
    isLearnSession,
    handleNewSession,
    handleRefresh,
    handleSelect,
    handleSubmitType,
    handleNext,
  };
}
