export interface BoatPreview {
  id:    string;
  name:  string;
  cover: string | null;
}

let _preview: BoatPreview | null = null;

export function setBoatPreview(p: BoatPreview) { _preview = p; }
export function getBoatPreview(id: string): BoatPreview | null {
  return _preview?.id === id ? _preview : null;
}
