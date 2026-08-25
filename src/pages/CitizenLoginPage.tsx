import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, MessageSquare, Smartphone, TreePine, UserRound } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { VILLAGE_AREAS } from '@/constants'
import {
  clearCitizenOtp,
  profileToCitizenUser,
  saveCitizenProfile,
  sendCitizenOtp,
  verifyCitizenOtp,
} from '@/services/citizenAuth'

type Step = 'mobile' | 'otp' | 'profile'

interface MobileForm {
  mobile: string
}

interface OtpForm {
  otp: string
}

interface ProfileForm {
  fullName: string
  areaId: string
}

function otpErrorMessage(code: string, t: (k: string) => string): string {
  switch (code) {
    case 'OTP_EXPIRED':
      return t('login.otpExpired')
    case 'OTP_TOO_MANY':
      return t('login.otpTooMany')
    case 'OTP_NOT_FOUND':
      return t('login.otpNotFound')
    case 'OTP_INVALID':
      return t('login.otpInvalid')
    case 'INVALID_MOBILE':
      return t('login.mobileInvalid')
    default:
      return t('login.otpSendFailed')
  }
}

export function CitizenLoginPage() {
  const { t, i18n } = useTranslation()
  const { languageChosen, citizen, loginCitizen, resetLanguageChoice } = useApp()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('mobile')
  const [mobile, setMobile] = useState('')
  const [demoCode, setDemoCode] = useState('')
  const [formError, setFormError] = useState('')
  const [sending, setSending] = useState(false)

  const mobileForm = useForm<MobileForm>({ defaultValues: { mobile: '' } })
  const otpForm = useForm<OtpForm>({ defaultValues: { otp: '' } })
  const profileForm = useForm<ProfileForm>({ defaultValues: { fullName: '', areaId: '' } })

  const stepMeta = useMemo(() => {
    if (step === 'mobile') {
      return { title: t('login.title'), subtitle: t('login.subtitleMobile') }
    }
    if (step === 'otp') {
      return { title: t('login.verifyTitle'), subtitle: t('login.subtitleOtp', { mobile }) }
    }
    return { title: t('login.profileTitle'), subtitle: t('login.subtitleProfile') }
  }, [step, t, mobile])

  if (!languageChosen) return <Navigate to="/welcome" replace />
  if (citizen) return <Navigate to="/" replace />

  const goBack = () => {
    setFormError('')
    if (step === 'otp') {
      clearCitizenOtp()
      setDemoCode('')
      otpForm.reset()
      setStep('mobile')
      return
    }
    if (step === 'profile') {
      // Stay signed-out; go back to mobile entry
      profileForm.reset()
      setStep('mobile')
      setMobile('')
      return
    }
    resetLanguageChoice()
    navigate('/welcome')
  }

  const onSendOtp = mobileForm.handleSubmit(async (data) => {
    setFormError('')
    setSending(true)
    try {
      const result = await sendCitizenOtp(data.mobile)
      setMobile(result.mobile)
      setDemoCode(result.demoCode)
      otpForm.reset({ otp: '' })
      setStep('otp')
    } catch (e) {
      const code = e instanceof Error ? e.message : 'SEND_FAILED'
      setFormError(otpErrorMessage(code, t))
    } finally {
      setSending(false)
    }
  })

  const onResendOtp = async () => {
    setFormError('')
    setSending(true)
    try {
      const result = await sendCitizenOtp(mobile)
      setDemoCode(result.demoCode)
      otpForm.reset({ otp: '' })
    } catch (e) {
      const code = e instanceof Error ? e.message : 'SEND_FAILED'
      setFormError(otpErrorMessage(code, t))
    } finally {
      setSending(false)
    }
  }

  const onVerifyOtp = otpForm.handleSubmit((data) => {
    setFormError('')
    try {
      const result = verifyCitizenOtp(mobile, data.otp)
      if (result.isNewUser || !result.profile) {
        if (result.profile?.fullName) {
          profileForm.setValue('fullName', result.profile.fullName)
        }
        if (result.profile?.areaId) {
          profileForm.setValue('areaId', result.profile.areaId)
        }
        setStep('profile')
        return
      }
      loginCitizen(profileToCitizenUser(result.profile))
      navigate('/')
    } catch (e) {
      const code = e instanceof Error ? e.message : 'OTP_INVALID'
      setFormError(otpErrorMessage(code, t))
    }
  })

  const onSaveProfile = profileForm.handleSubmit((data) => {
    setFormError('')
    const area = VILLAGE_AREAS.find((a) => a.id === data.areaId)
    if (!area) {
      setFormError(t('login.areaRequired'))
      return
    }
    const areaName = i18n.language === 'ta' ? area.nameTa : area.name
    const profile = saveCitizenProfile({
      fullName: data.fullName,
      mobile,
      areaId: area.id,
      areaName,
    })
    loginCitizen(profileToCitizenUser(profile))
    navigate('/')
  })

  return (
    <div className="min-h-dvh bg-emerald-50 flex flex-col">
      <div className="h-44 sm:h-52 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1000&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-emerald-900/55" />
        <button
          type="button"
          onClick={goBack}
          className="absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-3 py-2 text-sm text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {step === 'mobile' ? t('login.back') : t('common.back')}
        </button>
        <div className="absolute bottom-5 left-0 right-0 px-5 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white mb-2">
            {step === 'mobile' ? (
              <Smartphone className="h-6 w-6 text-emerald-600" />
            ) : step === 'otp' ? (
              <MessageSquare className="h-6 w-6 text-emerald-600" />
            ) : (
              <UserRound className="h-6 w-6 text-emerald-600" />
            )}
          </div>
          <h1 className="font-display text-2xl font-bold text-white">{stepMeta.title}</h1>
          <p className="text-emerald-50 text-sm mt-1">{stepMeta.subtitle}</p>
        </div>
      </div>

      <div className="flex-1 -mt-4 rounded-t-3xl bg-white px-5 pt-8 pb-10 max-w-lg mx-auto w-full shadow-[0_-8px_30px_rgba(6,78,59,0.08)]">
        <div className="flex items-center justify-center gap-2 mb-6">
          {(['mobile', 'otp', 'profile'] as Step[]).map((s, i) => (
            <span
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                step === s
                  ? 'w-8 bg-emerald-600'
                  : (['mobile', 'otp', 'profile'].indexOf(step) > i
                    ? 'w-4 bg-emerald-300'
                    : 'w-4 bg-emerald-100')
              }`}
            />
          ))}
        </div>

        {step === 'mobile' ? (
          <form onSubmit={onSendOtp} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-emerald-950 mb-2">
                {t('login.mobile')} <span className="text-red-500">*</span>
              </label>
              <div className="flex rounded-2xl border-2 border-emerald-100 bg-emerald-50/50 overflow-hidden focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/15">
                <span className="inline-flex items-center px-4 text-emerald-800/70 font-medium text-sm border-r border-emerald-100">
                  +91
                </span>
                <input
                  {...mobileForm.register('mobile', {
                    required: t('login.mobileRequired'),
                    validate: (v) => {
                      const digits = v.replace(/\D/g, '')
                      return (
                        (/^[6-9]\d{9}$/.test(digits) && digits.length === 10) ||
                        t('login.mobileInvalid')
                      )
                    },
                  })}
                  inputMode="numeric"
                  maxLength={14}
                  className="flex-1 bg-transparent px-4 py-3.5 text-base text-emerald-950 placeholder:text-emerald-700/40 focus:outline-none"
                  placeholder={t('login.mobilePlaceholder')}
                  autoComplete="tel"
                />
              </div>
              {mobileForm.formState.errors.mobile ? (
                <p className="text-sm text-red-600 mt-1.5">
                  {mobileForm.formState.errors.mobile.message}
                </p>
              ) : null}
            </div>

            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg py-4 mt-2 shadow-lg shadow-emerald-600/25 transition disabled:opacity-60"
            >
              {sending ? t('login.sendingOtp') : t('login.sendOtp')}
            </button>
            <p className="text-xs text-center text-emerald-700/60">{t('login.otpHint')}</p>
          </form>
        ) : null}

        {step === 'otp' ? (
          <form onSubmit={onVerifyOtp} className="space-y-5">
            {demoCode ? (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
                <p className="font-semibold">{t('login.demoOtpTitle')}</p>
                <p className="mt-1 tracking-widest text-lg font-mono font-bold">{demoCode}</p>
                <p className="text-xs mt-1 text-amber-800/80">{t('login.demoOtpNote')}</p>
              </div>
            ) : null}

            <div>
              <label className="block text-sm font-semibold text-emerald-950 mb-2">
                {t('login.otp')} <span className="text-red-500">*</span>
              </label>
              <input
                {...otpForm.register('otp', {
                  required: t('login.otpRequired'),
                  validate: (v) =>
                    /^\d{6}$/.test(v.replace(/\D/g, '')) || t('login.otpInvalid'),
                })}
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                className="w-full rounded-2xl border-2 border-emerald-100 bg-emerald-50/50 px-4 py-3.5 text-center text-2xl tracking-[0.4em] font-mono text-emerald-950 placeholder:text-emerald-700/40 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
                placeholder="••••••"
              />
              {otpForm.formState.errors.otp ? (
                <p className="text-sm text-red-600 mt-1.5">{otpForm.formState.errors.otp.message}</p>
              ) : null}
            </div>

            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

            <button
              type="submit"
              className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg py-4 shadow-lg shadow-emerald-600/25 transition"
            >
              {t('login.verifyOtp')}
            </button>

            <button
              type="button"
              onClick={() => void onResendOtp()}
              disabled={sending}
              className="w-full text-sm font-semibold text-emerald-700 hover:text-emerald-900 disabled:opacity-60"
            >
              {sending ? t('login.sendingOtp') : t('login.resendOtp')}
            </button>
          </form>
        ) : null}

        {step === 'profile' ? (
          <form onSubmit={onSaveProfile} className="space-y-5">
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
              <TreePine className="h-4 w-4 shrink-0" />
              <span>
                {t('login.verifiedMobile')}: <strong>+91 {mobile}</strong>
              </span>
            </div>

            <div>
              <label className="block text-sm font-semibold text-emerald-950 mb-2">
                {t('login.fullName')} <span className="text-red-500">*</span>
              </label>
              <input
                {...profileForm.register('fullName', {
                  required: t('login.nameRequired'),
                  minLength: { value: 2, message: t('login.nameRequired') },
                })}
                className="w-full rounded-2xl border-2 border-emerald-100 bg-emerald-50/50 px-4 py-3.5 text-base text-emerald-950 placeholder:text-emerald-700/40 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
                placeholder={t('login.fullNamePlaceholder')}
                autoComplete="name"
              />
              {profileForm.formState.errors.fullName ? (
                <p className="text-sm text-red-600 mt-1.5">
                  {profileForm.formState.errors.fullName.message}
                </p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-semibold text-emerald-950 mb-2">
                {t('login.area')} <span className="text-red-500">*</span>
              </label>
              <select
                {...profileForm.register('areaId', {
                  required: t('login.areaRequired'),
                })}
                className="w-full rounded-2xl border-2 border-emerald-100 bg-emerald-50/50 px-4 py-3.5 text-base text-emerald-950 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
              >
                <option value="">{t('login.areaPlaceholder')}</option>
                {VILLAGE_AREAS.map((area) => (
                  <option key={area.id} value={area.id}>
                    {i18n.language === 'ta' ? area.nameTa : area.name}
                  </option>
                ))}
              </select>
              {profileForm.formState.errors.areaId ? (
                <p className="text-sm text-red-600 mt-1.5">
                  {profileForm.formState.errors.areaId.message}
                </p>
              ) : null}
            </div>

            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

            <button
              type="submit"
              className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg py-4 shadow-lg shadow-emerald-600/25 transition"
            >
              {t('login.finishProfile')}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  )
}
