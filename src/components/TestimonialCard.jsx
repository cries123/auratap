export function TestimonialCard({ testimonial }) {
  const initials = testimonial.author
    .split(' ')
    .map((part) => part[0])
    .join('')

  return (
    <figure className="testimonial-card">
      <blockquote>“{testimonial.text}”</blockquote>
      <figcaption>
        <span className="testimonial-avatar" aria-hidden="true">{initials}</span>
        <span>
          <strong>{testimonial.author}</strong>
          <span>{testimonial.role}, {testimonial.company}</span>
        </span>
      </figcaption>
    </figure>
  )
}
