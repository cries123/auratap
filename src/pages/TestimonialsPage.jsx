import { usePageMeta } from '../hooks/usePageMeta'
import { TESTIMONIALS } from '../data/content'
import { TestimonialCard } from '../components/TestimonialCard'
import { SubpageHero } from '../components/SubpageHero'

export function TestimonialsPage() {
  usePageMeta(
    'Customer Reviews',
    'Read what realtors, contractors, photographers, and teams say about using Aura Tap NFC cards and wristbands.',
  )
  return (
    <>
      <SubpageHero
        eyebrow="Testimonials"
        title="Client Testimonials"
        subtitle="Verified feedback from professionals, teams, and businesses nationwide using Aura Tap in daily operations."
        chips={['180+ clients served', 'Real customer stories', 'Nationwide service']}
        mediaImageSrc="/images/product-test.webp"
        mediaImageAlt="Aura Tap products used by real clients"
      />

      <section className="page-section">
        <div className="testimonial-grid">
          {TESTIMONIALS.map((testimonial) => (
            <TestimonialCard key={testimonial.author} testimonial={testimonial} />
          ))}
        </div>
      </section>
    </>
  )
}
