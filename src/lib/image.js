// Center-crops a photo to width x height and returns a JPEG data URL. Phone photos are several MB;
// this keeps profile photos around 20–60KB and banners around 60–120KB.
export async function resizeImage(file, { width, height, quality = 0.85 }) {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()

    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
    const sourceWidth = width / scale
    const sourceHeight = height / scale
    const sx = (image.naturalWidth - sourceWidth) / 2
    const sy = (image.naturalHeight - sourceHeight) / 2

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    // JPEG has no transparency, so give transparent PNGs a white background.
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
    context.drawImage(image, sx, sy, sourceWidth, sourceHeight, 0, 0, width, height)
    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export const resizeProfilePhoto = (file) => resizeImage(file, { width: 400, height: 400 })
export const resizeBanner = (file) => resizeImage(file, { width: 1200, height: 480, quality: 0.8 })
