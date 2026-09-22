import { makeReview, markdown } from "./review";

async function annotate(note, number) {
  const img = new Image();
  img.src = note.snapshot;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const radius = Math.max(18, canvas.width * 0.016);
  const x = note.x * canvas.width,
    y = note.y * canvas.height;
  // Keep the coordinate exact, including when the badge is partly outside an edge.
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#086aeb";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#fff";
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = `700 ${radius}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(number), x, y + 1);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Could not create a frame image.")),
      "image/png",
    ),
  );
}
export async function exportReview(meta, notes, progress) {
  if (!notes.length || notes.some((n) => !n.snapshot))
    throw new Error("Wait for the frame to load before exporting.");
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const review = makeReview(meta, notes);
  zip.file("review.json", JSON.stringify(review, null, 2));
  zip.file("review.md", markdown(review));
  for (let i = 0; i < notes.length; i++) {
    const blob = await annotate(notes[i], i + 1);
    zip.file(review.notes[i].image, await blob.arrayBuffer());
    progress(`Preparing frame ${i + 1} of ${notes.length}…`);
  }
  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 3 },
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "frame-notes-review.zip";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
