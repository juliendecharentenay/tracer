export function cropImage(base64, { x, y, width, height }) {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, -x, -y)
      resolve(canvas.toDataURL())
    }
    img.onerror = reject
    img.src = base64
  })
}
