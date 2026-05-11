import { useForm } from 'react-hook-form'
import { useNavigate, Navigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Mail, Lock, AlertCircle } from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { Button, Input } from '../components/ui'

const TAGLINE = 'Coachez votre équipe.'
const TAGLINE_2 = 'Restez en mouvement.'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm()

  if (user) return <Navigate to="/dashboard" replace />

  async function onSubmit({ email, password }) {
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      setError('root', { message: 'Email ou mot de passe incorrect' })
    }
  }

  const stagger = reduced
    ? {}
    : {
        hidden:  { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
      }

  const item = reduced
    ? {}
    : {
        hidden:  { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 26 } },
      }

  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-2">
      {/* === Hero (mobile compact + desktop split-left) === */}
      <section
        className="relative h-60 overflow-hidden lg:h-auto"
        aria-hidden="true"
      >
        <picture>
          <source media="(min-width: 1024px)" srcSet="/images/login/hero-desktop.jpg" />
          <img
            src="/images/login/hero-mobile.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        </picture>
        <div className="absolute inset-0 bg-primary-800/60 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/40 via-transparent to-accent-400/20" />

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={reduced ? undefined : { opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex flex-col justify-end p-6 lg:items-start lg:justify-center lg:p-16"
        >
          <p className="hidden lg:block text-caption font-medium uppercase tracking-[0.18em] text-accent-200/90">
            Coaching App
          </p>
          <h1 className="mt-2 max-w-md font-display text-display-lg leading-tight tracking-tight text-white lg:text-display-xl-md">
            {TAGLINE}<br />
            <span className="text-accent-300">{TAGLINE_2}</span>
          </h1>
          <p className="mt-3 hidden max-w-md text-body-lg-md text-white/80 lg:block">
            L'app interne Wiicode pour réserver tes sessions, suivre ta progression et garder le rythme.
          </p>
        </motion.div>
      </section>

      {/* === Form panel === */}
      <section className="flex flex-1 items-center justify-center px-6 py-10 lg:px-12">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          <motion.div variants={item} className="flex items-center justify-center lg:justify-start">
            <img src="/brand/logo.png" alt="Wiicode" className="h-10 w-auto" />
          </motion.div>

          <motion.h2 variants={item} className="mt-6 text-center text-h1 font-heading font-semibold text-ink-900 lg:text-left lg:text-h1-md">
            Connexion
          </motion.h2>
          <motion.p variants={item} className="mt-1 text-center text-body-md text-ink-500 lg:text-left">
            Bon retour. Reprenons là où tu t'étais arrêté.
          </motion.p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-5">
            <motion.div variants={item}>
              <Input
                type="email"
                label="Email"
                placeholder="prenom.nom@wiicode.fr"
                autoComplete="email"
                leftIcon={<Mail className="h-4 w-4" strokeWidth={1.75} />}
                error={errors.email?.message}
                {...register('email', { required: 'Email requis' })}
              />
            </motion.div>

            <motion.div variants={item}>
              <Input
                type="password"
                label="Mot de passe"
                placeholder="••••••••"
                autoComplete="current-password"
                leftIcon={<Lock className="h-4 w-4" strokeWidth={1.75} />}
                error={errors.password?.message}
                {...register('password', { required: 'Mot de passe requis' })}
              />
            </motion.div>

            {errors.root && (
              <motion.div
                role="alert"
                initial={reduced ? false : { opacity: 0 }}
                animate={reduced ? undefined : { opacity: 1 }}
                className="flex items-start gap-2 rounded-xl border border-danger-500/40 bg-red-50 px-3.5 py-3 text-body text-danger-500 animate-shake"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span>{errors.root.message}</span>
              </motion.div>
            )}

            <motion.div variants={item}>
              <Button type="submit" variant="primary" size="lg" loading={isSubmitting} fullWidth>
                {isSubmitting ? 'Connexion…' : 'Se connecter'}
              </Button>
            </motion.div>

            <motion.p variants={item} className="text-center text-caption text-ink-500">
              Wiicode · {new Date().getFullYear()} — Tous droits réservés
            </motion.p>
          </form>
        </motion.div>
      </section>
    </div>
  )
}
