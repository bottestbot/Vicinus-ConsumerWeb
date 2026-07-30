'use client'

// The /vibe quiz flow (NEIGHBOURHOOD_VIBE_CHECK_PRD.md §4-§5, §9). Landing
// screen -> 11 single-select questions, one per screen, with a progress bar
// and back support -> submit -> redirect to the shareable result page.
//
// Step-state pattern (a single component owning `step` + collected answers,
// with per-step sub-components) mirrors OnboardingWizard.tsx, this repo's
// existing multi-step wizard precedent — but the visual tone here is the
// playful BuzzFeed-quiz language established on VibeCheckResultCard (lime
// accent, rounded-full "gumdrop" buttons, tilted highlight marks), not the
// settings-form look of onboarding.
import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, Sparkles, RefreshCw } from 'lucide-react'
import Logo from '@/components/brand/Logo'
import { getAnswerIcon } from './answer-icons'
import { getOrCreateVibeSessionId } from '@/lib/vibe-check/session'
import { FALLBACK_QUIZ_QUESTIONS } from '@/lib/vibe-check/quiz-fallback'
import { getVibeCheckQuestions, submitVibeCheck, type VibeCheckQuestion } from '@/lib/api/vibe-check'
import { capture } from '@/lib/analytics/capture'

// ─── Progress bar ───────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
            i < step ? 'bg-[#A3E635]' : 'bg-[#E8E6E1]'
          }`}
        />
      ))}
    </div>
  )
}

// ─── Answer card ────────────────────────────────────────────────────────────

// `props.icon` is rendered via member-expression JSX (not destructured to a
// bare capitalized local) — the lucide icon component varies per option, and
// binding it to a local `const Icon = ...` trips the "components created
// during render" lint rule. See src/components/property/PropertyStats.tsx's
// `<item.icon .../>` for the same pattern already used in this codebase.
function AnswerCard(props: {
  text: string
  optionId: string
  selected: boolean
  onClick: () => void
}) {
  const { text, optionId, selected, onClick } = props
  const iconLookup = { icon: getAnswerIcon(optionId) }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all duration-150 ${
        selected
          ? 'border-[#1C3829] bg-[#1C3829]/5 ring-2 ring-[#1C3829]/20'
          : 'border-[#E8E6E1] bg-white hover:-translate-y-0.5 hover:border-[#1C3829]/40 hover:shadow-md'
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
          selected ? 'bg-[#1C3829] text-white' : 'bg-[#FAF9F6] text-[#1C3829]'
        }`}
      >
        <iconLookup.icon size={20} strokeWidth={2.25} />
      </span>
      <span className={`text-base font-medium leading-snug ${selected ? 'text-[#1C3829]' : 'text-[#111111]'}`}>
        {text}
      </span>
    </button>
  )
}

// ─── Screen shell ───────────────────────────────────────────────────────────

function ScreenShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-[#FAF9F6] px-4 py-8 font-ui">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  )
}

// ─── Landing ────────────────────────────────────────────────────────────────

function Landing({ onStart, loading }: { onStart: () => void; loading: boolean }) {
  return (
    <ScreenShell>
      <div className="flex justify-center pt-6">
        <Logo href="/" className="text-2xl" />
      </div>
      <div className="mt-14 flex flex-col items-center text-center">
        <span className="rounded-full bg-[#EDF6DD] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#1C3829]">
          90-second quiz
        </span>
        <h1 className="mt-5 font-heading text-4xl font-bold leading-tight text-[#111111] sm:text-5xl">
          What&apos;s your{' '}
          <mark className="inline-block -rotate-1 rounded bg-[#A3E635] px-2 text-[#111111]">
            neighbourhood vibe
          </mark>
          ?
        </h1>
        <p className="mt-5 max-w-sm text-base leading-relaxed text-[#6B6B6B]">
          Answer 11 fun questions about your ideal Friday night, Sunday morning, and everything in
          between. We&apos;ll match you with a real Metro Vancouver neighbourhood — backed by
          actual data, not vibes alone.
        </p>
        <button
          type="button"
          onClick={onStart}
          disabled={loading}
          className="mt-9 flex items-center gap-2 rounded-full bg-[#A3E635] px-8 py-4 text-base font-bold text-[#1C3829] shadow-[0_4px_0_0_#7BB324] transition-all hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#7BB324] active:translate-y-1 active:shadow-[0_1px_0_0_#7BB324] disabled:cursor-wait disabled:opacity-70"
        >
          <Sparkles size={18} strokeWidth={2.5} />
          {loading ? 'Loading quiz…' : 'Take the quiz'}
        </button>
        <p className="mt-4 text-xs text-[#9B9B9B]">No login required</p>
      </div>
    </ScreenShell>
  )
}

// ─── Question screen ────────────────────────────────────────────────────────

function QuestionScreen({
  question,
  index,
  total,
  selectedOptionId,
  onSelect,
  onBack,
}: {
  question: VibeCheckQuestion
  index: number
  total: number
  selectedOptionId?: string
  onSelect: (optionId: string) => void
  onBack: () => void
}) {
  return (
    <ScreenShell>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E8E6E1] bg-white text-[#6B6B6B] transition-colors hover:border-[#1C3829]/40 hover:text-[#1C3829]"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B]">
            Question {index + 1} of {total}
          </p>
          <ProgressBar step={index + 1} total={total} />
        </div>
      </div>

      <h2 className="mt-8 font-heading text-2xl font-bold leading-snug text-[#111111] sm:text-3xl">
        {question.text}
      </h2>

      <div className="mt-6 flex flex-col gap-3">
        {question.options.map((option) => (
          <AnswerCard
            key={option.id}
            optionId={option.id}
            text={option.text}
            selected={selectedOptionId === option.id}
            onClick={() => onSelect(option.id)}
          />
        ))}
      </div>
    </ScreenShell>
  )
}

// ─── Submitting / error screens ─────────────────────────────────────────────

function SubmittingScreen() {
  return (
    <ScreenShell>
      <div className="flex flex-col items-center justify-center pt-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF6DD]">
          <Sparkles size={24} className="animate-pulse text-[#1C3829]" strokeWidth={2.25} />
        </div>
        <h2 className="mt-6 font-heading text-2xl font-bold text-[#111111]">Finding your match…</h2>
        <p className="mt-2 text-sm text-[#6B6B6B]">Crunching your answers against real neighbourhood data.</p>
      </div>
    </ScreenShell>
  )
}

function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <ScreenShell>
      <div className="flex flex-col items-center justify-center pt-24 text-center">
        <h2 className="font-heading text-2xl font-bold text-[#111111]">Couldn&apos;t find your match</h2>
        <p className="mt-2 max-w-sm text-sm text-[#6B6B6B]">
          Something went wrong reaching the matching engine. Your answers are still saved — try again.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-7 flex items-center gap-2 rounded-full bg-[#1C3829] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#2D5A3D]"
        >
          <RefreshCw size={15} strokeWidth={2.5} />
          Try again
        </button>
      </div>
    </ScreenShell>
  )
}

// ─── Quiz ───────────────────────────────────────────────────────────────────

type Step = 'landing' | 'question' | 'submitting' | 'error'

// Selecting an answer highlights it briefly before auto-advancing — gives
// the tap visible feedback instead of jump-cutting straight to the next
// question (BuzzFeed-quiz feel per PRD §5 design note).
const AUTO_ADVANCE_MS = 300

export default function VibeCheckQuiz() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const referredByShortId = searchParams.get('ref') ?? undefined

  // Lazy initializer (not an effect + setState) so the id is ready on the very
  // first render, before the first question is ever answered. Runs once per
  // component instance; on the server `getOrCreateVibeSessionId()` returns ''
  // (no window), and the real client render computes/persists it fresh — safe
  // because sessionId is never rendered into visible DOM output, only read at
  // submit time, so there's nothing for hydration to mismatch on.
  const [sessionId] = useState(() => getOrCreateVibeSessionId())
  const [step, setStep] = useState<Step>('landing')
  const [questions, setQuestions] = useState<VibeCheckQuestion[] | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  async function loadQuestions() {
    try {
      const { data } = await getVibeCheckQuestions()
      setQuestions(Array.isArray(data) && data.length > 0 ? data : FALLBACK_QUIZ_QUESTIONS)
    } catch {
      // GET /vibe-check/questions isn't live yet (or errored) — fall back to
      // the local copy (id-for-id identical to the backend's question bank)
      // so the quiz still works rather than dead-ending on the landing screen.
      setQuestions(FALLBACK_QUIZ_QUESTIONS)
    }
  }

  const [loadingQuestions, setLoadingQuestions] = useState(false)

  async function handleStart() {
    // PRD §3/§9: quiz-starts-from-referral must be measurable in PostHog, not
    // just share-button clicks — so the ?ref= shortId (if present) rides along
    // on the start event itself.
    capture('vibe_check_started', { referredByShortId })
    setLoadingQuestions(true)
    await loadQuestions()
    setLoadingQuestions(false)
    setStep('question')
  }

  function handleBack() {
    if (questionIndex === 0) {
      setStep('landing')
      return
    }
    setQuestionIndex((i) => i - 1)
  }

  const [submitting, setSubmitting] = useState(false)

  async function handleSelect(question: VibeCheckQuestion, optionId: string) {
    const nextAnswers = { ...answers, [question.id]: optionId }
    setAnswers(nextAnswers)
    capture('vibe_check_question_answered', {
      questionId: question.id,
      answerId: optionId,
      questionIndex,
    })

    const total = questions?.length ?? 0
    const isLast = questionIndex === total - 1

    window.setTimeout(() => {
      if (isLast) {
        void handleSubmit(nextAnswers)
      } else {
        setQuestionIndex((i) => i + 1)
      }
    }, AUTO_ADVANCE_MS)
  }

  async function handleSubmit(finalAnswers: Record<string, string>) {
    if (!questions) return
    setStep('submitting')
    setSubmitting(true)
    try {
      const answerIds = questions.map((q) => finalAnswers[q.id]).filter((id): id is string => Boolean(id))
      const { data } = await submitVibeCheck({
        answerIds,
        sessionId: sessionId || getOrCreateVibeSessionId(),
        referredByShortId,
      })
      capture('vibe_check_completed', {
        archetypeKey: data.archetypeKey,
        matchedNeighbourhoodName: data.matchedNeighbourhood.name,
        matchPercent: data.matchPercent,
      })
      router.push(`/vibe/${data.shortId}`)
    } catch {
      setStep('error')
    } finally {
      setSubmitting(false)
    }
  }

  const currentQuestion = useMemo(() => questions?.[questionIndex], [questions, questionIndex])

  if (step === 'landing') return <Landing onStart={handleStart} loading={loadingQuestions} />
  if (step === 'submitting' || submitting) return <SubmittingScreen />
  if (step === 'error') return <ErrorScreen onRetry={() => handleSubmit(answers)} />

  if (!currentQuestion || !questions) return <SubmittingScreen />

  return (
    <QuestionScreen
      question={currentQuestion}
      index={questionIndex}
      total={questions.length}
      selectedOptionId={answers[currentQuestion.id]}
      onSelect={(optionId) => handleSelect(currentQuestion, optionId)}
      onBack={handleBack}
    />
  )
}
