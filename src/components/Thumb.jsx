import { useState } from 'react'
import { APPROVED_IMAGES } from '../approved-images.js'

export const PLACEHOLDER_IMAGE = APPROVED_IMAGES.placeholder

export default function Thumb({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false)
  const url = !failed && src ? src : PLACEHOLDER_IMAGE
  return (
    <img
      className={className}
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => { if (!failed) setFailed(true) }}
    />
  )
}
