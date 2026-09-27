import { CheckIcon } from './Icons'

export function SubpageHero({
  eyebrow,
  title,
  subtitle,
  chips = [],
  mediaText = '',
  mediaImageSrc,
  mediaImageAlt = '',
}) {
  return (
    <section className={`page-hero${mediaImageSrc ? ' has-media' : ''}`}>
      <div className="container page-hero-grid">
        <div className="page-hero-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lead">{subtitle}</p>
          {chips.length > 0 && (
            <ul className="hero-assurances">
              {chips.map((chip) => (
                <li key={chip}><CheckIcon /> {chip}</li>
              ))}
            </ul>
          )}
        </div>
        {mediaImageSrc ? (
          <figure className="page-hero-media">
            <img src={mediaImageSrc} alt={mediaImageAlt} />
            {mediaText ? <figcaption>{mediaText}</figcaption> : null}
          </figure>
        ) : null}
      </div>
    </section>
  )
}
