// Bundled sample image metadata.
// Place actual X-ray sample images in public/samples/ directory.
// These are placeholder entries — replace src with real image paths.

export interface SampleImage {
  id: string;
  name: string;
  src: string;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  { id: "sample-1", name: "Bag Scan 001", src: "/samples/sample-01.png" },
  { id: "sample-2", name: "Bag Scan 002", src: "/samples/sample-02.png" },
  { id: "sample-3", name: "Bag Scan 003", src: "/samples/sample-03.png" },
  { id: "sample-4", name: "Bag Scan 004", src: "/samples/sample-04.png" },
  { id: "sample-5", name: "Bag Scan 005", src: "/samples/sample-05.png" },
  { id: "sample-6", name: "Bag Scan 006", src: "/samples/sample-06.png" },
];
