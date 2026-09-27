// Crops a photo to a centered square and shrinks it to `size` pixels, returning a JPEG data URL.
// Phone photos are several MB; this keeps profile photos around 20–60KB.
export async function resizeImageToDataUrl(file, size = 400, quality = 0.85) {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()

    const side = Math.min(image.naturalWidth, image.naturalHeight)
    const sx = (image.naturalWidth - side) / 2
    const sy = (image.naturalHeight - side) / 2
    const output = Math.min(size, side)

    const canvas = document.createElement('canvas')
    canvas.width = output
    canvas.height = output
    const context = canvas.getContext('2d')
    // JPEG has no transparency, so give transparent PNGs a white background.
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, output, output)
    context.drawImage(image, sx, sy, side, side, 0, 0, output, output)
    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    URL.revokeObjectURL(url)
  }
}
