import express from "express";
import path from "path";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in environment variables.");
    }
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return ai;
}

// Fallback movie list when API key is missing or calls fail
const FALLBACK_MOVIES = [
  {
    id: 101,
    title: "Dune: Part Two",
    release_date: "2024-03-01",
    vote_average: 8.3,
    overview: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.",
    poster_path: "https://images.unsplash.com/photo-1547483238-2cbf88bd24ee?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1509316975850-ff9c5edd0cd9?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 102,
    title: "Oppenheimer",
    release_date: "2023-07-21",
    vote_average: 8.1,
    overview: "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II, tracking his journey from brilliant physicist to conflicted scientific director.",
    poster_path: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 103,
    title: "Interstellar",
    release_date: "2014-11-07",
    vote_average: 8.4,
    overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
    poster_path: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 104,
    title: "Spider-Man: Across the Spider-Verse",
    release_date: "2023-06-02",
    vote_average: 8.4,
    overview: "After reuniting with Gwen Stacy, Brooklyn’s full-time, friendly neighborhood Spider-Man is catapulted across the Multiverse, where he encounters the Spider-Society, a team of Spider-People charged with protecting its very existence.",
    poster_path: "https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 105,
    title: "Everything Everywhere All at Once",
    release_date: "2022-03-24",
    vote_average: 7.8,
    overview: "An aging Chinese immigrant is swept up in an insane adventure, where she alone can save the world by exploring other universes connecting with the lives she could have led.",
    poster_path: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 106,
    title: "The Dark Knight",
    release_date: "2008-07-18",
    vote_average: 8.5,
    overview: "Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.",
    poster_path: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 107,
    title: "Inception",
    release_date: "2010-07-16",
    vote_average: 8.4,
    overview: "Cobb, a skilled thief who is absolute best in the dangerous art of extraction, steals valuable secrets from deep within the subconscious during the dream state.",
    poster_path: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 108,
    title: "Parasite",
    release_date: "2019-05-30",
    vote_average: 8.5,
    overview: "All unemployed, Ki-taek's family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled in an unexpected incident.",
    poster_path: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 109,
    title: "Whiplash",
    release_date: "2014-10-10",
    vote_average: 8.4,
    overview: "Under the direction of a ruthless instructor, a talented young drummer begins to pursue perfection at any cost, even his humanity.",
    poster_path: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 110,
    title: "Spirited Away",
    release_date: "2001-07-20",
    vote_average: 8.5,
    overview: "A young girl, Chihiro, wanders into a world ruled by gods, witches, and spirits, and where humans are changed into beasts.",
    poster_path: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 111,
    title: "The Matrix",
    release_date: "1999-03-31",
    vote_average: 8.2,
    overview: "Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the vast and powerful computers who now rule the earth.",
    poster_path: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 112,
    title: "Django Unchained",
    release_date: "2012-12-25",
    vote_average: 8.2,
    overview: "With the help of a German bounty hunter, a freed slave sets out to rescue his wife from a brutal Mississippi plantation owner.",
    poster_path: "https://images.unsplash.com/photo-1533240332313-0db49b439ad3?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1488330890490-c291ecf62719?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 113,
    title: "La La Land",
    release_date: "2016-12-09",
    vote_average: 7.9,
    overview: "While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.",
    poster_path: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 114,
    title: "Knives Out",
    release_date: "2019-11-27",
    vote_average: 7.9,
    overview: "When renowned crime novelist Harlan Thrombey is found dead at his estate just after his 85th birthday, the inquisitive and debonair Detective Benoit Blanc is mysteriously enlisted to investigate.",
    poster_path: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 115,
    title: "Blade Runner 2049",
    release_date: "2017-10-06",
    vote_average: 7.5,
    overview: "Thirty years after the events of the first film, a new blade runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what's left of society into chaos.",
    poster_path: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 116,
    title: "The Truman Show",
    release_date: "1998-06-04",
    vote_average: 8.1,
    overview: "An insurance salesman discovers his whole life is actually a reality TV show.",
    poster_path: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1473116763269-255ea742f5f1?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 117,
    title: "Spider-Man: Into the Spider-Verse",
    release_date: "2018-12-14",
    vote_average: 8.4,
    overview: "Teen Miles Morales becomes the Spider-Man of his universe, and must join with five spider-powered individuals from other dimensions to stop a threat for all realities.",
    poster_path: "https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 118,
    title: "Top Gun: Maverick",
    release_date: "2022-05-27",
    vote_average: 8.3,
    overview: "After more than thirty years of service as one of the Navy's top aviators, Pete Mitchell is where he belongs, pushing the envelope as a courageous test pilot.",
    poster_path: "https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 119,
    title: "The Grand Budapest Hotel",
    release_date: "2014-03-07",
    vote_average: 8.0,
    overview: "A writer relates his adventures at a renowned resort hotel in the Republic of Zubrowka between the first and second World Wars.",
    poster_path: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 120,
    title: "Your Name.",
    release_date: "2016-08-26",
    vote_average: 8.5,
    overview: "High schoolers Mitsuha and Taki are complete strangers living separate lives. But one night, they suddenly switch places.",
    poster_path: "https://images.unsplash.com/photo-1536746803623-cef87080bfc8?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1200&q=80"
  },
  // Adding 20 more to reach 40+ for excellent infinite scrolling fallback
  {
    id: 121,
    title: "WALL·E",
    release_date: "2008-06-27",
    vote_average: 8.1,
    overview: "In the distant future, a small waste-collecting robot inadvertently embarks on a space journey that will ultimately decide the fate of mankind.",
    poster_path: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 122,
    title: "Gladiator",
    release_date: "2000-05-05",
    vote_average: 8.2,
    overview: "A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery.",
    poster_path: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 123,
    title: "Inglourious Basterds",
    release_date: "2009-08-21",
    vote_average: 8.2,
    overview: "In Nazi-occupied France during World War II, a plan to assassinate Nazi leaders by a group of Jewish U.S. soldiers coincides with a theatre owner's vengeful plans for the same.",
    poster_path: "https://images.unsplash.com/photo-1531244048425-8663ad1c4494?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 124,
    title: "The Shawshank Redemption",
    release_date: "1994-09-23",
    vote_average: 8.7,
    overview: "Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison.",
    poster_path: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 125,
    title: "Pulp Fiction",
    release_date: "1994-10-14",
    vote_average: 8.5,
    overview: "A burger-loving hitman, his philosophical partner, a drug-addled gangster's moll, and a washed-up boxer converge in this sprawling comedic crime anthology.",
    poster_path: "https://images.unsplash.com/photo-1501139083538-0139583c060f?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 126,
    title: "The Godfather",
    release_date: "1972-03-24",
    vote_average: 8.7,
    overview: "Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family. When organized crime family patriarch, Vito Corleone, survives an attempt on his life, his youngest son, Michael, steps in.",
    poster_path: "https://images.unsplash.com/photo-1554188248-986adbb73be4?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 127,
    title: "Fight Club",
    release_date: "1999-10-15",
    vote_average: 8.4,
    overview: "An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into much more.",
    poster_path: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 128,
    title: "Good Will Hunting",
    release_date: "1997-12-05",
    vote_average: 8.1,
    overview: "Will Hunting, a janitor at MIT, has a gift for mathematics, but needs help from a psychologist in order to find direction in his life.",
    poster_path: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 129,
    title: "The Lord of the Rings: The Fellowship of the Ring",
    release_date: "2001-12-19",
    vote_average: 8.4,
    overview: "Young hobbit Frodo Baggins, after inheriting a mysterious ring from his uncle Bilbo, must leave his home and travel to Mount Doom to destroy it.",
    poster_path: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 130,
    title: "Forrest Gump",
    release_date: "1994-07-06",
    vote_average: 8.5,
    overview: "A man with a low IQ has accomplished great things in his life and been present during significant historic events.",
    poster_path: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 131,
    title: "Coco",
    release_date: "2017-11-22",
    vote_average: 8.2,
    overview: "Aspiring musician Miguel, confronted with his family's ancestral ban on music, enters the Land of the Dead to find his great-great-grandfather, a legendary singer.",
    poster_path: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 132,
    title: "Avengers: Endgame",
    release_date: "2019-04-26",
    vote_average: 8.3,
    overview: "After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more to reverse Thanos' actions.",
    poster_path: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 133,
    title: "The Prestige",
    release_date: "2006-10-20",
    vote_average: 8.2,
    overview: "After a tragic accident, two stage magicians in 1890s London engage in a battle to create the ultimate illusion while sacrificing everything they have.",
    poster_path: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1516307361183-f3dc10b0b2e8?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 134,
    title: "Spider-Man: No Way Home",
    release_date: "2021-12-17",
    vote_average: 8.0,
    overview: "With Spider-Man's identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds start to appear.",
    poster_path: "https://images.unsplash.com/photo-1604076913837-52ab5629fba9?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 135,
    title: "Ratatouille",
    release_date: "2007-06-29",
    vote_average: 7.8,
    overview: "A rat who can cook makes an unusual alliance with a young kitchen worker at a famous Paris restaurant.",
    poster_path: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 136,
    title: "Arrival",
    release_date: "2016-11-11",
    vote_average: 7.6,
    overview: "A linguist works with the military to communicate with alien lifeporms after twelve mysterious spacecraft appear around the world.",
    poster_path: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 137,
    title: "The Social Network",
    release_date: "2010-10-01",
    vote_average: 7.7,
    overview: "As Harvard student Mark Zuckerberg creates the social networking site that would become known as Facebook, he is sued by the twins who claimed he stole their idea.",
    poster_path: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 138,
    title: "Zootopia",
    release_date: "2016-03-04",
    vote_average: 7.7,
    overview: "In a city of anthropomorphic animals, a rookie bunny cop and a cynical con artist fox must work together to uncover a conspiracy.",
    poster_path: "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 139,
    title: "No Country for Old Men",
    release_date: "2007-11-09",
    vote_average: 7.9,
    overview: "Violence and mayhem ensue after a hunter stumbles upon a drug deal gone wrong and more than two million dollars in cash near the Rio Grande.",
    poster_path: "https://images.unsplash.com/photo-1509316975850-ff9c5edd0cd9?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1533240332313-0db49b439ad3?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 140,
    title: "Kimi no Na wa (Your Name)",
    release_date: "2016-08-26",
    vote_average: 8.5,
    overview: "Two strangers find themselves linked in a bizarre way. When a connection is formed, will distance be the only thing to keep them apart?",
    poster_path: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=600&q=80",
    backdrop_path: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1200&q=80"
  }
];

// Get popular movies
app.get("/api/movies/popular", async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const apiKey = process.env.TMDB_API_KEY;
  const itemsPerPage = 12;
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const totalPages = Math.ceil(FALLBACK_MOVIES.length / itemsPerPage);

  const getLocalFallback = () => {
    if (startIndex >= FALLBACK_MOVIES.length) {
      return {
        page: page,
        results: [],
        total_pages: totalPages,
        total_results: FALLBACK_MOVIES.length,
      };
    }
    const results = FALLBACK_MOVIES.slice(startIndex, endIndex);
    return {
      page: page,
      results: results,
      total_pages: totalPages,
      total_results: FALLBACK_MOVIES.length,
    };
  };

  try {
    if (apiKey && apiKey !== "MY_TMDB_API_KEY" && apiKey !== "") {
      const response = await axios.get("https://api.themoviedb.org/3/movie/popular", {
        params: {
          api_key: apiKey,
          page: page,
        },
        timeout: 4000,
      });
      return res.json(response.data);
    } else {
      return res.json(getLocalFallback());
    }
  } catch (error: any) {
    console.warn("TMDB popular fetch failed, falling back to local database:", error?.message);
    return res.json(getLocalFallback());
  }
});

// Search movies
app.get("/api/movies/search", async (req, res) => {
  const query = (req.query.query as string) || "";
  const page = parseInt(req.query.page as string) || 1;
  const apiKey = process.env.TMDB_API_KEY;

  const getLocalSearch = () => {
    if (!query.trim()) {
      return { page: 1, results: [], total_pages: 1, total_results: 0 };
    }
    const filtered = FALLBACK_MOVIES.filter(
      (m) =>
        m.title.toLowerCase().includes(query.toLowerCase()) ||
        m.overview.toLowerCase().includes(query.toLowerCase())
    );

    const itemsPerPage = 12;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    const results = filtered.slice(startIndex, endIndex);
    return {
      page: page,
      results: results,
      total_pages: totalPages,
      total_results: filtered.length,
    };
  };

  try {
    if (!query.trim()) {
      return res.json({ page: 1, results: [], total_pages: 1, total_results: 0 });
    }

    if (apiKey && apiKey !== "MY_TMDB_API_KEY" && apiKey !== "") {
      const response = await axios.get("https://api.themoviedb.org/3/search/movie", {
        params: {
          api_key: apiKey,
          query: query,
          page: page,
        },
        timeout: 4000,
      });
      return res.json(response.data);
    } else {
      return res.json(getLocalSearch());
    }
  } catch (error: any) {
    console.warn("TMDB search failed, falling back to local database:", error?.message);
    return res.json(getLocalSearch());
  }
});

// Get movie recommendations
app.post("/api/recommend", async (req, res) => {
  const { description } = req.body;
  if (!description || !description.trim()) {
    return res.status(400).json({ error: "Please provide a movie description." });
  }

  let movieTitle = "";
  const geminiKey = process.env.GEMINI_API_KEY;

  const getLocalRecommendation = () => {
    const lowerDesc = description.toLowerCase();
    let matchedMovie = FALLBACK_MOVIES[0];

    if (lowerDesc.includes("emotional") || lowerDesc.includes("sad") || lowerDesc.includes("tears") || lowerDesc.includes("cry")) {
      matchedMovie = FALLBACK_MOVIES.find(m => m.title === "Good Will Hunting" || m.title === "Your Name." || m.title === "La La Land") || FALLBACK_MOVIES[13];
    } else if (lowerDesc.includes("action") || lowerDesc.includes("fight") || lowerDesc.includes("superhero") || lowerDesc.includes("batman")) {
      matchedMovie = FALLBACK_MOVIES.find(m => m.title === "The Dark Knight" || m.title === "Avengers: Endgame") || FALLBACK_MOVIES[5];
    } else if (lowerDesc.includes("space") || lowerDesc.includes("sci-fi") || lowerDesc.includes("future") || lowerDesc.includes("robot")) {
      matchedMovie = FALLBACK_MOVIES.find(m => m.title === "Interstellar" || m.title === "Blade Runner 2049" || m.title === "WALL·E") || FALLBACK_MOVIES[2];
    } else if (lowerDesc.includes("mind") || lowerDesc.includes("dream") || lowerDesc.includes("confused") || lowerDesc.includes("puzzle")) {
      matchedMovie = FALLBACK_MOVIES.find(m => m.title === "Inception" || m.title === "The Prestige" || m.title === "Everything Everywhere All at Once") || FALLBACK_MOVIES[6];
    } else if (lowerDesc.includes("animated") || lowerDesc.includes("cartoon") || lowerDesc.includes("kid") || lowerDesc.includes("cute")) {
      matchedMovie = FALLBACK_MOVIES.find(m => m.title === "Spirited Away" || m.title === "WALL·E" || m.title === "Coco" || m.title === "Ratatouille") || FALLBACK_MOVIES[9];
    } else if (lowerDesc.includes("funny") || lowerDesc.includes("laugh") || lowerDesc.includes("comedy")) {
      matchedMovie = FALLBACK_MOVIES.find(m => m.title === "The Grand Budapest Hotel" || m.title === "Pulp Fiction") || FALLBACK_MOVIES[18];
    } else {
      const randomIndex = Math.floor(Math.random() * FALLBACK_MOVIES.length);
      matchedMovie = FALLBACK_MOVIES[randomIndex];
    }
    return matchedMovie;
  };

  try {
    if (geminiKey && geminiKey !== "MY_GEMINI_API_KEY" && geminiKey !== "") {
      try {
        const gemini = getGeminiClient();
        const prompt = `The user is describing a movie or kind of movie they are looking for: "${description}".
Your goal is to suggest exactly ONE real, existing, well-known movie that perfectly matches this description.
Respond with ONLY the movie title itself. Do not include any quotes, markdown formatting, explanations, surrounding text, or introductory remarks.
For example, if the recommendation is The Dark Knight, output: The Dark Knight`;

        const geminiResponse = await gemini.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
        });

        const text = geminiResponse.text || "";
        movieTitle = text.replace(/^["'`\s]+|["'`\s]+$/g, "").trim();
      } catch (geminiError: any) {
        console.warn("Gemini call failed, falling back to local heuristic matching:", geminiError?.message);
        movieTitle = getLocalRecommendation().title;
      }
    } else {
      movieTitle = getLocalRecommendation().title;
    }

    if (!movieTitle) {
      movieTitle = getLocalRecommendation().title;
    }

    const apiKey = process.env.TMDB_API_KEY;
    let movieData: any = null;

    if (apiKey && apiKey !== "MY_TMDB_API_KEY" && apiKey !== "") {
      try {
        const searchRes = await axios.get("https://api.themoviedb.org/3/search/movie", {
          params: {
            api_key: apiKey,
            query: movieTitle,
            page: 1,
          },
          timeout: 4000,
        });
        const results = searchRes.data.results || [];
        if (results.length > 0) {
          movieData = results[0];
        }
      } catch (searchError: any) {
        console.warn("TMDB search failed for recommendation, using local match:", searchError?.message);
      }
    }

    if (!movieData) {
      const normalizedTitle = movieTitle.toLowerCase();
      movieData = FALLBACK_MOVIES.find(
        (m) =>
          m.title.toLowerCase() === normalizedTitle ||
          m.title.toLowerCase().includes(normalizedTitle) ||
          normalizedTitle.includes(m.title.toLowerCase())
      );
    }

    if (!movieData) {
      movieData = {
        id: Math.floor(Math.random() * 1000) + 1000,
        title: movieTitle,
        release_date: "Recommended Selection",
        vote_average: 8.4,
        overview: `You requested a movie based on: "${description}". This custom selection matches your preference beautifully!`,
        poster_path: null,
      };
    }

    return res.json({
      recommendation: movieTitle,
      movie: movieData,
    });
  } catch (error: any) {
    console.error("Error in /api/recommend:", error?.message);
    const fallbackMovie = getLocalRecommendation();
    return res.json({
      recommendation: fallbackMovie.title,
      movie: fallbackMovie,
    });
  }
});

// Start the server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled static production files from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CineStream server running on port ${PORT}`);
  });
}

startServer();
