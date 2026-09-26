import { useState, useEffect } from 'react'
import { APPROVED_IMAGES } from '../approved-images.js'

export default function Thumb({ src, alt, className }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    setFailed(false)
  }, [src])
  const url = !src || failed ? APPROVED_IMAGES.placeholder : src
  return (
    <img
      className={className}
      src={url}
      alt={alt || 'Recipe image'}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}
