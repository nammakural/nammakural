import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { TreePine, Check } from 'lucide-react'
import { useApp, type AppLanguage } from '@/contexts/AppContext'
import { cn } from '@/utils'

export function WelcomePage() {
  const { t } = useTranslation()
  const { languageChosen, citizen, setLanguage, language } = useApp()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<AppLanguage | null>(
    languageChosen ? language : null,
  )
  const [error, setError] = useState('')

  if (languageChosen && citizen) {
    return <Navigate to="/" replace />
  }
  if (languageChosen && !citizen) {
    return <Navigate to="/login" replace />
  }

  const onContinue = () => {
    if (!selected) {
      setError(t('welcome.mustSelect'))
      return
    }
    setLanguage(selected, true)
    navigate('/login')
  }

  return (
    <div className="min-h-dvh relative flex flex-col overflow-hidden">
      <img
        src="/welcome-village.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/70 via-emerald-900/55 to-emerald-950/90" />

      <div className="relative z-10 flex-1 flex flex-col justify-end px-5 pb-10 pt-16 max-w-lg mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg mb-5">
            <TreePine className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-3">
            {t('brand')}
          </h1>
          <p className="text-emerald-50/95 text-base sm:text-lg leading-relaxed max-w-sm mx-auto">
            {t('welcome.tagline')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="rounded-3xl bg-white p-5 sm:p-6 shadow-2xl"
        >
          <p className="text-center text-sm font-semibold text-emerald-900 mb-4">
            {t('welcome.chooseLanguage')}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-5">
            {(
              [
                { code: 'en' as const, flag: '🇬🇧', label: t('welcome.english') },
                { code: 'ta' as const, flag: '🇮🇳', label: t('welcome.tamil') },
              ] as const
            ).map((opt) => {
              const active = selected === opt.code
              return (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => {
                    setSelected(opt.code)
                    setError('')
                    void setLanguage(opt.code, false)
                  }}
                  className={cn(
                    'relative flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-5 transition min-h-[108px]',
                    active
                      ? 'border-emerald-600 bg-emerald-50 shadow-sm'
                      : 'border-emerald-100 bg-white hover:border-emerald-300',
                  )}
                >
                  {active ? (
                    <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  ) : null}
                  <span className="text-3xl" aria-hidden>
                    {opt.flag}
                  </span>
                  <span className="font-semibold text-emerald-950 text-sm">{opt.label}</span>
                </button>
              )
            })}
          </div>

          {error ? <p className="text-center text-sm text-red-600 mb-3">{error}</p> : null}

          <button
            type="button"
            onClick={onContinue}
            className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-lg py-4 shadow-lg shadow-emerald-600/25 transition"
          >
            {t('welcome.continue')}
          </button>
        </motion.div>
      </div>
    </div>
  )
}
