export interface RadarItem {
  id: string;
  type: string;
  subtype: string | null;
  artistId: string;
  artistName: string;
  title: string;
  description: string;
  publishedAt: string;
  eventDate: string | null;
  city: string | null;
  venue: string | null;
  sourceName: string;
  sourceType: string;
  sourceUrl: string | null;
  credibilityScore: number;
  score: number;
  reasons: string[];
}

export interface RadarSections {
  justReleased: RadarItem[];
  upcoming: RadarItem[];
  liveNearYou: RadarItem[];
  tours: RadarItem[];
  presales: RadarItem[];
  videos: RadarItem[];
  interviews: RadarItem[];
  collaborations: RadarItem[];
  facts: RadarItem[];
  discovery: RadarItem[];
  blogNews: RadarItem[];
}

export interface RadarResult {
  generatedAt: string;
  userId: string;
  city: string | null;
  concertRadiusKm: number;
  items: RadarItem[];
  sections: RadarSections;
}
