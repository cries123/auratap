import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const DEFAULT_TITLE = 'Aura Tap | NFC Cards and Wristbands for Modern Networking'

const DEFAULT_DESCRIPTION =
  'Aura Tap helps professionals and teams share contact info instantly with NFC cards and wristbands. Serving clients nationwide with setup and support.'

function setMetaContent(selector, content) {
  document.querySelector(selector)?.setAttribute('content', content)
}

// Keeps the tab title, description, canonical URL, and social tags in sync with the current page.
export function usePageMeta(title, description = DEFAULT_DESCRIPTION) {
  const { pathname } = useLocation()

  useEffect(() => {
    const fullTitle = title ? `${title} | Aura Tap` : DEFAULT_TITLE
    const url = `${window.location.origin}${pathname}`

    document.title = fullTitle
    setMetaContent('meta[name="description"]', description)
    setMetaContent('meta[property="og:title"]', fullTitle)
    setMetaContent('meta[property="og:description"]', description)
    setMetaContent('meta[property="og:url"]', url)
    setMetaContent('meta[name="twitter:title"]', fullTitle)
    setMetaContent('meta[name="twitter:description"]', description)
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', url)
  }, [title, description, pathname])
}
