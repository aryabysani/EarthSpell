export interface LetterImage {
  url: string;
  filename?: string;
  description?: string;
  location?: string;
  detailUrl?: string;
  lat?: number | null;
  lng?: number | null;
}

export interface LetterResult {
  char: string;
  image: LetterImage | null;
  variants?: LetterImage[];
}

export interface LettersApiResponse {
  results: LetterResult[];
}
