import { useState, useEffect } from 'react'

const DISMISSED_KEY = 'sakay_a2hs_dismissed'

export function useInstallPrompt() {
  const [prompt, setPrompt] = useState(null)
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === '1'
  )

  useEffect(() => {
    const handler = e => { e.preventDefault(); setPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setPrompt(null)
  }

  const dismiss = () => {
    setDismissed(true)
    localStorage.setItem(DISMISSED_KEY, '1')
  }

  return { isInstallable: !!prompt && !dismissed, install, dismiss }
}
