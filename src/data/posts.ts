export type Post = {
  id: number;
  tag: string;
  title: string;
  excerpt: string;
  author: string;
  time: string;
  votes: number;
  comments: number;
  image: boolean;
  top: boolean;

  isVerified?: boolean;
  verificationNumber?: number;
  verifiedAt?: string;
};

export const posts: Post[] = [
  {
    id: 1,
    tag: "UFO SIGHTING",
    title: "Three unidentified lights recorded over the Pacific coastline",
    excerpt:
      "The objects remained stationary for several minutes before moving apart at different speeds. No aircraft were visible in the area.",
    author: "Skywatch_523",
    time: "18 min ago",
    votes: 523,
    comments: 84,
    image: true,
    top: true,

    isVerified: true,
    verificationNumber: 1,
    verifiedAt: "2026-07-25T18:30:00+09:00",
  },
  {
    id: 2,
    tag: "GOVERNMENT",
    title:
      "Newly released documents reference an unidentified aerospace program",
    excerpt:
      "Several pages contain heavily redacted references to retrieval procedures and classified aerospace materials.",
    author: "ArchiveSeeker",
    time: "42 min ago",
    votes: 281,
    comments: 63,
    image: false,
    top: true,
  },
  {
    id: 3,
    tag: "DISCUSSION",
    title:
      "Why do sightings from different decades describe the same objects?",
    excerpt:
      "Cigar-shaped craft, silent triangles, and metallic spheres continue to appear across reports separated by decades.",
    author: "ObserverNine",
    time: "1 hr ago",
    votes: 148,
    comments: 97,
    image: false,
    top: false,
  },
  {
    id: 4,
    tag: "VIDEO",
    title: "Black sphere filmed moving against strong wind conditions",
    excerpt:
      "The witness recorded the object for approximately ninety seconds before it disappeared behind cloud cover.",
    author: "SignalLost",
    time: "2 hr ago",
    votes: 94,
    comments: 31,
    image: true,
    top: false,
  },
];