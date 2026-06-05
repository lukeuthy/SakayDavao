import { useState, useEffect } from 'react'
import { isIos, isInStandaloneMode } from '../utils/platform.js'

const LS_KEY = 'sakay_install_dismissed'
const LS_IOS_KEY = 'sakay_ios_install_dismissed'

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isDismissed, setIsDismissed] = useState(
    () => localStorage.getItem(LS_KEY) === '1'
  )
  const [iosDismissed, setIosDismissed] = useState(
    () => localStorage.getItem(LS_IOS_KEY) === '1'
  )

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setIsDismissed(true)
    }
  }

  const dismiss = () => {
    localStorage.setItem(LS_KEY, '1')
    setIsDismissed(true)
  }

  const dismissIos = () => {
    localStorage.setItem(LS_IOS_KEY, '1')
    setIosDismissed(true)
  }

  return {
    // Android / Chromium prompt-based install
    isInstallable: !!deferredPrompt && !isDismissed,
    install,
    dismiss,
    // iOS manual Add-to-Home-Screen guide (no beforeinstallprompt on iOS)
    showIosGuide: isIos() && !isInStandaloneMode() && !iosDismissed,
    dismissIos,
  }
}
