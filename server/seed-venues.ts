import { db } from "./db";
import { venues, recurringEvents } from "@shared/schema";
import { count, eq } from "drizzle-orm";

const BARCELONA_VENUES = [
  { 
    name: "Arena Experience", 
    type: "Klub", 
    address: "Ronda Sant Pere 19-21, 08010 Barcelona", 
    city: "Barcelona", 
    district: "Eixample",
    lat: "41.3885", 
    lng: "2.1743",
    website: "https://www.arenadisco.com",
    description: "Najwiekszy klub LGBT+ w Barcelonie. Dwie sale: Arena Madre + Arena Classic. Drag shows, pop/house/reggaeton."
  },
  { 
    name: "Aire Chicas", 
    type: "Klub", 
    address: "C. de Valencia 236, 08007 Barcelona", 
    city: "Barcelona", 
    district: "Eixample",
    lat: "41.3895", 
    lng: "2.1625",
    website: "https://grupoarena.com",
    description: "Najpopularniejszy klub dla kobiet w Barcelonie. Dwie sale taneczne, bar na tarasie. Lesbijski raj!"
  },
  { 
    name: "Safari Disco Club", 
    type: "Klub", 
    address: "C. de Tarragona 141, 08014 Barcelona", 
    city: "Barcelona", 
    district: "Sants-Montjuic",
    lat: "41.3780", 
    lng: "2.1430",
    website: "https://grupoarena.com",
    description: "Wielki klub taneczny z roznorodna publicznoscia. Weekendowe imprezy trwaja do rana."
  },
  { 
    name: "Punto BCN", 
    type: "Bar", 
    address: "C. de Muntaner 63, 08011 Barcelona", 
    city: "Barcelona", 
    district: "Eixample",
    lat: "41.3865", 
    lng: "2.1593",
    website: "https://grupoarena.com",
    description: "Kultowy gay bar dzialajacy od 1991. Happy hour codziennie. Swietna atmosfera na rozpoczecie wieczoru."
  },
  { 
    name: "Boys Bar", 
    type: "Bar", 
    address: "C. del Consell de Cent 255, 08011 Barcelona", 
    city: "Barcelona", 
    district: "Eixample",
    lat: "41.3873", 
    lng: "2.1618",
    description: "Popularny bar dla mezczyzn w sercu Gaixample. Striptizy w piatki, latino nights w srody."
  },
  { 
    name: "The Black Room", 
    type: "Klub", 
    address: "Rambla de Catalunya 2-4, 08007 Barcelona", 
    city: "Barcelona", 
    district: "Eixample",
    lat: "41.3876", 
    lng: "2.1699",
    description: "Imprezy organizowane w City Hall. Niedzielne wieczory sa legenda Barcelony."
  },
  { 
    name: "GinGin Gay Bar", 
    type: "Bar", 
    address: "C. del Consell de Cent 273, 08011 Barcelona", 
    city: "Barcelona", 
    district: "Eixample",
    lat: "41.3878", 
    lng: "2.1598",
    description: "Przytulny bar koktajlowy w Gaixample. Happy hour 2x1 we wtorki. Swietne drinki!"
  },
  { 
    name: "Moeem", 
    type: "Bar", 
    address: "C. de Casanova 75, 08011 Barcelona", 
    city: "Barcelona", 
    district: "Eixample",
    lat: "41.3858", 
    lng: "2.1564",
    description: "Nowoczesny bar dla mlodszej publicznosci. Muzyka pop i R&B. Codziennie od 18:00."
  },
  { 
    name: "Bacon Bear Bar", 
    type: "Bar", 
    address: "C. de Casanova 64, 08011 Barcelona", 
    city: "Barcelona", 
    district: "Eixample",
    lat: "41.3862", 
    lng: "2.1560",
    description: "Bear bar w stylu amerykanskim. Przyjazna atmosfera dla wszystkich. Chill muzyka i cold piwo."
  },
  { 
    name: "La Carrá", 
    type: "Bar", 
    address: "C. del Consell de Cent 263, 08011 Barcelona", 
    city: "Barcelona", 
    district: "Eixample",
    lat: "41.3875", 
    lng: "2.1610",
    description: "Bar holdujacy legendarnej Raffaelli Carra. Wloska muzyka, campowe klimaty. Trzeba zobaczyc!"
  },
  { 
    name: "El Cangrejo", 
    type: "Bar", 
    address: "C. de Montserrat 9, 08001 Barcelona", 
    city: "Barcelona", 
    district: "El Raval",
    lat: "41.3815", 
    lng: "2.1725",
    description: "Kultowy bar retro z muzyka lat 80. Drag shows w weekendy. Instytucja Barcelony!"
  },
  { 
    name: "Strass Bar", 
    type: "Bar", 
    address: "C. de la Diputacio 139, 08015 Barcelona", 
    city: "Barcelona", 
    district: "Eixample",
    lat: "41.3840", 
    lng: "2.1630",
    description: "Drag show codziennie wieczorem. Bingo w niedziele. Najbardziej szalone show w miescie!"
  },
  { 
    name: "Madame Jasmine", 
    type: "Bar", 
    address: "C. de Villarroel 87, 08011 Barcelona", 
    city: "Barcelona", 
    district: "Eixample",
    lat: "41.3860", 
    lng: "2.1525",
    description: "Bar z queerowym charakterem. Genderfuck house vibes. Alternatywna scena LGBT+"
  },
  { 
    name: "La Federica", 
    type: "Bar", 
    address: "C. de Salva 3, 08004 Barcelona", 
    city: "Barcelona", 
    district: "Poble Sec",
    lat: "41.3735", 
    lng: "2.1645",
    description: "Vintage bar z dekorem retro. Koktajle i muzyka z lat 60-80. Artystyczna atmosfera."
  },
  { 
    name: "Berlin Dark Barcelona", 
    type: "Klub", 
    address: "Passatge de Prunera 18, 08004 Barcelona", 
    city: "Barcelona", 
    district: "El Poble-sec",
    lat: "41.3733", 
    lng: "2.1606",
    website: "https://berlindark.com",
    description: "Popularny klub z barem, dark roomem i innymi udogodnieniami. Otwarte glownie wieczorami i w nocy."
  },
];

const POLISH_VENUES = [
  // WARSZAWA
  { 
    name: "Lodi Dodi", 
    type: "Bar", 
    address: "ul. Wilcza 23, 00-544 Warszawa", 
    city: "Warszawa", 
    district: "Srodmiescie",
    lat: "52.2290", 
    lng: "21.0191",
    website: "https://lodidodi.pl",
    description: "Kultowy bar koktajlowy z dark roomem. 3 poziomy: bar, lounge, piwnica. Otwarte od 19:00."
  },
  { 
    name: "Crush Club", 
    type: "Klub", 
    address: "Plac Mirowski 1, 00-138 Warszawa", 
    city: "Warszawa", 
    district: "Srodmiescie",
    lat: "52.2383", 
    lng: "20.9953",
    website: "https://www.instagram.com/crushclub_warsaw",
    description: "Nastepca kultowego Klubu Galeria. Podziemia Hali Mirowskiej. Drag shows i imprezy tematyczne."
  },
  { 
    name: "GLAM Club", 
    type: "Klub", 
    address: "ul. Zurawia 22, 00-515 Warszawa", 
    city: "Warszawa", 
    district: "Srodmiescie",
    lat: "52.2280", 
    lng: "21.0180",
    website: "https://www.instagram.com/glam.warszawa",
    description: "Jeden z najstarszych gay klubow w Warszawie od 2010. Drag shows, imprezy tematyczne, bingo."
  },
  { 
    name: "Metropolis", 
    type: "Klub", 
    address: "ul. Henryka Sienkiewicza 7, 00-013 Warszawa", 
    city: "Warszawa", 
    district: "Srodmiescie",
    lat: "52.2315", 
    lng: "21.0133",
    website: "https://www.instagram.com/metropoliswarszawa",
    description: "Topowy gay klub w centrum Warszawy. Dwa parkiety - pop/disco i techno. Pt-Sb do 6 rano."
  },
  { 
    name: "Ramona Bar", 
    type: "Bar", 
    address: "ul. Widok 18, 00-023 Warszawa", 
    city: "Warszawa", 
    district: "Srodmiescie",
    lat: "52.2305", 
    lng: "21.0153",
    website: "https://www.ramonabar.pl",
    description: "Gay bar i restauracja z polska kuchnia. Retro wystroj, ogrodek. Otwarty od 13:00."
  },
  { 
    name: "Sauna Galla", 
    type: "Sauna", 
    address: "ul. Ptasia 2, 00-138 Warszawa", 
    city: "Warszawa", 
    district: "Srodmiescie",
    lat: "52.2383", 
    lng: "20.9987",
    website: "https://www.saunagalla.pl",
    description: "Legendarna gay sauna od 1997. Sauna finska, laznia parowa, dark roomy. Niedziele mieszane."
  },
  { 
    name: "Sauna Heaven", 
    type: "Sauna", 
    address: "ul. Walicow 13, 00-865 Warszawa", 
    city: "Warszawa", 
    district: "Wola",
    lat: "52.2376", 
    lng: "20.9928",
    website: "https://www.heavensauna.pl",
    description: "Popularna gay sauna z barem, kabinetami, dark roomem. Imprezy tematyczne co tydzien. Sb-Nd 24h."
  },
  { 
    name: "Sauna The Fire", 
    type: "Sauna", 
    address: "ul. Twarda 44, 00-831 Warszawa", 
    city: "Warszawa", 
    district: "Srodmiescie",
    lat: "52.2348", 
    lng: "20.9963",
    website: "https://www.saunathefire.pl",
    description: "Najwieksza gay sauna w Europie Srodkowej - ponad 380m2. Labirynt, bar z kominkiem, masaze."
  },
  { 
    name: "Instytut", 
    type: "Bar", 
    address: "ul. Prosta 2/14, 00-850 Warszawa", 
    city: "Warszawa", 
    district: "Srodmiescie",
    lat: "52.2310", 
    lng: "20.9940",
    website: "https://instytut.bar",
    description: "Gay bar i cruise klub z labiryntem (200m2). Imprezy tematyczne, dark room. Codziennie od 20:00."
  },
  { 
    name: "La Pose", 
    type: "Klub", 
    address: "ul. Mazowiecka 6/8, 00-048 Warszawa", 
    city: "Warszawa", 
    district: "Srodmiescie",
    lat: "52.2395", 
    lng: "21.0155",
    website: "https://lapose.pl",
    description: "Klub, brasseria i scena artystyczna queeru. 3 pietra - restauracja, bar koktajlowy, parkiet. Drag, ballroom, burleska."
  },
  { 
    name: "Miedzy Nami", 
    type: "Kawiarnia", 
    address: "ul. Bracka 20, 00-028 Warszawa", 
    city: "Warszawa", 
    district: "Srodmiescie",
    lat: "52.2318", 
    lng: "21.0166",
    website: "https://www.miedzynamicafe.com",
    description: "Kultowa gay-friendly kawiarnia od lat 90. Restauracja, bar, galeria sztuki. Sniadania, lunche, koktajle wieczorem."
  },
  { 
    name: "Plan B", 
    type: "Bar", 
    address: "al. Wyzwolenia 18, 00-999 Warszawa", 
    city: "Warszawa", 
    district: "Srodmiescie",
    lat: "52.2280", 
    lng: "21.0200",
    description: "Klub i bar w centrum Warszawy. Imprezy taneczne, DJ-e, koktajle."
  },
  // KRAKOW
  { 
    name: "Club Papuga", 
    type: "Klub", 
    address: "ul. Jozefa Dietla 64, 31-039 Krakow", 
    city: "Krakow", 
    district: "Kazimierz",
    lat: "50.0567", 
    lng: "19.9474",
    website: "https://www.instagram.com/papuga_club_krk",
    description: "Glowny gay klub w Krakowie. 2 bary, 2 parkiety, drag shows, karaoke w czwartki. Cz-Sb."
  },
  { 
    name: "Eszeweria", 
    type: "Bar", 
    address: "ul. Jozefa 9, 31-056 Krakow", 
    city: "Krakow", 
    district: "Kazimierz",
    lat: "50.0515", 
    lng: "19.9462",
    description: "Kultowa bohemska kawiarnia prowadzona przez gejowska pare. Swiecce, antyki, ogrodek. Gay-friendly."
  },
  { 
    name: "BlueXL Men's Club", 
    type: "Klub", 
    address: "ul. Jozefa Dietla 85, 31-070 Krakow", 
    city: "Krakow", 
    district: "Kazimierz",
    lat: "50.0553", 
    lng: "19.9503",
    website: "https://www.bluexl.pl",
    description: "Cruising bar i klub tylko dla mezczyzn. Dark roomy, kabiny. Cz-Nd od 20:00."
  },
  { 
    name: "Klub Ciemnia", 
    type: "Klub", 
    address: "ul. Krowoderska 31, 31-142 Krakow", 
    city: "Krakow", 
    district: "Stare Miasto",
    lat: "50.0680", 
    lng: "19.9340",
    description: "Gay klub z muzyka techno. Imprezy do pozna. Alternatywna atmosfera."
  },
  // WROCLAW
  { 
    name: "HAH Art & Music Club Wroclaw", 
    type: "Klub", 
    address: "ul. Olawska 11, 50-105 Wroclaw", 
    city: "Wroclaw", 
    district: "Stare Miasto",
    lat: "51.1079", 
    lng: "17.0385",
    website: "https://www.hah.com.pl",
    description: "Oddzial sieci HAH we Wroclawiu. Kilka sal z rozna muzyka. Imprezy tematyczne, drag shows."
  },
  { 
    name: "Cactus Club", 
    type: "Klub", 
    address: "ul. Aleksandra Zelwerowicza 18a, 53-676 Wroclaw", 
    city: "Wroclaw", 
    district: "Krzyki",
    lat: "51.0930", 
    lng: "17.0250",
    website: "https://cactus.wroclaw.pl",
    description: "Cruising i dance klub - 450m2. Bar, kino, dark roomy, labirynt. Wt-Sb od 20:00."
  },
  // POZNAN
  { 
    name: "HAH Art & Music Club Poznan", 
    type: "Klub", 
    address: "ul. Male Garbary 6, 61-756 Poznan", 
    city: "Poznan", 
    district: "Stare Miasto",
    lat: "52.4115", 
    lng: "16.9345",
    website: "https://www.hah.com.pl",
    description: "Gay klub w zabytkowej gorzelni. 6 sal: Abyss, Purgatory, Hell, Gimela, Pandemonium, Pink. Wt, Cz-Sb."
  },
  { 
    name: "Dark Angels", 
    type: "Klub", 
    address: "ul. Garbary 54, 60-850 Poznan", 
    city: "Poznan", 
    district: "Stare Miasto",
    lat: "52.4085", 
    lng: "16.9380",
    website: "https://www.clubdarkangels.com",
    description: "Cruising/fetish klub od 2011. Naked parties, leather meetings, Military Weekend. Piatki dla kobiet."
  },
  { 
    name: "Klub Pokusa", 
    type: "Klub", 
    address: "ul. Swiety Marcin 23, 61-804 Poznan", 
    city: "Poznan", 
    district: "Centrum",
    lat: "52.4060", 
    lng: "16.9180",
    description: "Klub taneczny w centrum Poznania. Imprezy weekendowe, DJs, koktajle."
  },
  // KATOWICE
  { 
    name: "HAH Katowice", 
    type: "Klub", 
    address: "ul. Sobieskiego 11, 40-078 Katowice", 
    city: "Katowice", 
    district: "Srodmiescie",
    lat: "50.2618", 
    lng: "19.0121",
    website: "https://www.katowice.hah.com.pl",
    description: "Oddzial sieci HAH w Katowicach. Drag shows, soundsystem parties. Cz-Sb od 22:00."
  },
  { 
    name: "Intacto", 
    type: "Klub", 
    address: "ul. Dabrowskiego 3, 40-032 Katowice", 
    city: "Katowice", 
    district: "Srodmiescie",
    lat: "50.2605", 
    lng: "19.0185",
    website: "https://www.intacto.art.pl",
    description: "Gay-friendly klub/galeria. Klimatyczne wnetrze ze swiecami. Imprezy tematyczne w weekendy."
  },
  // GDANSK / SOPOT
  { 
    name: "HAH Sopot", 
    type: "Klub", 
    address: "al. Franciszka Mamuszki 21, 81-718 Sopot", 
    city: "Sopot", 
    district: "Centrum",
    lat: "54.4446", 
    lng: "18.5641",
    website: "https://www.sopot.hah.com.pl",
    description: "Gay-friendly klub na plazy w Sopocie. 3 sale: Heaven, Purgatory, Hell. Drag shows, karaoke."
  },
  { 
    name: "HAH Gdansk", 
    type: "Klub", 
    address: "ul. Targ Weglowy 3, 80-836 Gdansk", 
    city: "Gdansk", 
    district: "Stare Miasto",
    lat: "54.3510", 
    lng: "18.6510",
    description: "Oddzial sieci HAH w Gdansku. Imprezy taneczne, drag shows w weekendy."
  },
  // LODZ
  { 
    name: "Ganimedes", 
    type: "Klub", 
    address: "al. Marszalka Jozefa Pilsudskiego 6, 90-051 Lodz", 
    city: "Lodz", 
    district: "Centrum",
    lat: "51.7720", 
    lng: "19.4550",
    description: "Jedyny gay klub w Lodzi. Imprezy taneczne, drag shows, karaoke. Pt-Sb od 22:00."
  },
];

type EventData = {
  venueName: string;
  dayOfWeek: number;
  eventName: string;
  startTime: string;
  description: string;
};

const BARCELONA_EVENTS: EventData[] = [
  { venueName: "Arena Experience", dayOfWeek: 0, eventName: "Arena Madre + Classic", startTime: "00:30", description: "https://www.arenadisco.com" },
  { venueName: "Arena Experience", dayOfWeek: 1, eventName: "Arena Madre + Classic", startTime: "00:30", description: "https://www.arenadisco.com" },
  { venueName: "Arena Experience", dayOfWeek: 2, eventName: "Arena Madre + Classic", startTime: "00:30", description: "https://www.arenadisco.com" },
  { venueName: "Arena Experience", dayOfWeek: 3, eventName: "Arena Madre + Classic", startTime: "00:30", description: "https://www.arenadisco.com" },
  { venueName: "Arena Experience", dayOfWeek: 4, eventName: "Arena Madre + Classic", startTime: "00:30", description: "https://www.arenadisco.com" },
  { venueName: "Arena Experience", dayOfWeek: 5, eventName: "Arena Madre + Classic", startTime: "00:30", description: "https://www.arenadisco.com" },
  { venueName: "Arena Experience", dayOfWeek: 6, eventName: "Arena Madre + Classic", startTime: "00:30", description: "https://www.arenadisco.com" },
  { venueName: "Aire Chicas", dayOfWeek: 0, eventName: "Lesbian Club", startTime: "23:00", description: "https://grupoarena.com" },
  { venueName: "Aire Chicas", dayOfWeek: 1, eventName: "Lesbian Club", startTime: "23:00", description: "https://grupoarena.com" },
  { venueName: "Aire Chicas", dayOfWeek: 2, eventName: "Lesbian Club", startTime: "23:00", description: "https://grupoarena.com" },
  { venueName: "Aire Chicas", dayOfWeek: 3, eventName: "Lesbian Club", startTime: "23:00", description: "https://grupoarena.com" },
  { venueName: "Aire Chicas", dayOfWeek: 4, eventName: "Lesbian Club", startTime: "23:00", description: "https://grupoarena.com" },
  { venueName: "Aire Chicas", dayOfWeek: 5, eventName: "Lesbian Club", startTime: "23:00", description: "https://grupoarena.com" },
  { venueName: "Aire Chicas", dayOfWeek: 6, eventName: "Lesbian Club", startTime: "23:00", description: "https://grupoarena.com" },
  { venueName: "Safari Disco Club", dayOfWeek: 0, eventName: "Sunday Night Party", startTime: "23:30", description: "https://grupoarena.com" },
  { venueName: "Safari Disco Club", dayOfWeek: 5, eventName: "Weekend Party", startTime: "23:30", description: "https://grupoarena.com" },
  { venueName: "Safari Disco Club", dayOfWeek: 6, eventName: "Weekend Party", startTime: "23:30", description: "https://grupoarena.com" },
  { venueName: "Punto BCN", dayOfWeek: 0, eventName: "Bar otwarty", startTime: "17:00", description: "https://www.puntobcn.com" },
  { venueName: "Punto BCN", dayOfWeek: 1, eventName: "Bar otwarty", startTime: "17:00", description: "https://www.puntobcn.com" },
  { venueName: "Punto BCN", dayOfWeek: 2, eventName: "Bar otwarty", startTime: "17:00", description: "https://www.puntobcn.com" },
  { venueName: "Punto BCN", dayOfWeek: 3, eventName: "Happy Hour 2x1", startTime: "18:00", description: "https://www.puntobcn.com" },
  { venueName: "Punto BCN", dayOfWeek: 4, eventName: "Bar otwarty", startTime: "17:00", description: "https://www.puntobcn.com" },
  { venueName: "Punto BCN", dayOfWeek: 5, eventName: "Bar otwarty", startTime: "17:00", description: "https://www.puntobcn.com" },
  { venueName: "Punto BCN", dayOfWeek: 6, eventName: "Bar otwarty", startTime: "17:00", description: "https://www.puntobcn.com" },
  { venueName: "Boys Bar", dayOfWeek: 0, eventName: "Bar otwarty", startTime: "18:00", description: "https://www.facebook.com/BoysBarBCN/" },
  { venueName: "Boys Bar", dayOfWeek: 1, eventName: "Bar otwarty", startTime: "18:00", description: "https://www.facebook.com/BoysBarBCN/" },
  { venueName: "Boys Bar", dayOfWeek: 2, eventName: "Bar otwarty", startTime: "18:00", description: "https://www.facebook.com/BoysBarBCN/" },
  { venueName: "Boys Bar", dayOfWeek: 3, eventName: "Latino Night", startTime: "20:00", description: "https://www.facebook.com/BoysBarBCN/" },
  { venueName: "Boys Bar", dayOfWeek: 4, eventName: "Bar otwarty", startTime: "18:00", description: "https://www.facebook.com/BoysBarBCN/" },
  { venueName: "Boys Bar", dayOfWeek: 5, eventName: "Strippers Night", startTime: "22:00", description: "https://www.facebook.com/BoysBarBCN/" },
  { venueName: "Boys Bar", dayOfWeek: 6, eventName: "Live DJs & Fiesta", startTime: "22:00", description: "https://www.facebook.com/BoysBarBCN/" },
  { venueName: "The Black Room", dayOfWeek: 0, eventName: "Sunday Night Party @ City Hall", startTime: "23:00", description: "https://www.facebook.com/theblackroombarcelona/" },
  { venueName: "GinGin Gay Bar", dayOfWeek: 0, eventName: "Bar otwarty", startTime: "17:00", description: "https://www.instagram.com/ginginbcn/" },
  { venueName: "GinGin Gay Bar", dayOfWeek: 1, eventName: "Bar otwarty", startTime: "17:00", description: "https://www.instagram.com/ginginbcn/" },
  { venueName: "GinGin Gay Bar", dayOfWeek: 2, eventName: "Happy Hour 2x1", startTime: "17:00", description: "https://www.instagram.com/ginginbcn/" },
  { venueName: "GinGin Gay Bar", dayOfWeek: 3, eventName: "Bar otwarty", startTime: "17:00", description: "https://www.instagram.com/ginginbcn/" },
  { venueName: "GinGin Gay Bar", dayOfWeek: 4, eventName: "Bar otwarty", startTime: "17:00", description: "https://www.instagram.com/ginginbcn/" },
  { venueName: "GinGin Gay Bar", dayOfWeek: 5, eventName: "Bar otwarty", startTime: "17:00", description: "https://www.instagram.com/ginginbcn/" },
  { venueName: "GinGin Gay Bar", dayOfWeek: 6, eventName: "Bar otwarty", startTime: "17:00", description: "https://www.instagram.com/ginginbcn/" },
  { venueName: "Moeem", dayOfWeek: 0, eventName: "Bar otwarty", startTime: "18:00", description: "https://www.instagram.com/moeem.bcn/" },
  { venueName: "Moeem", dayOfWeek: 1, eventName: "Bar otwarty", startTime: "18:00", description: "https://www.instagram.com/moeem.bcn/" },
  { venueName: "Moeem", dayOfWeek: 2, eventName: "Bar otwarty", startTime: "18:00", description: "https://www.instagram.com/moeem.bcn/" },
  { venueName: "Moeem", dayOfWeek: 3, eventName: "Bar otwarty", startTime: "18:00", description: "https://www.instagram.com/moeem.bcn/" },
  { venueName: "Moeem", dayOfWeek: 4, eventName: "Bar otwarty", startTime: "18:00", description: "https://www.instagram.com/moeem.bcn/" },
  { venueName: "Moeem", dayOfWeek: 5, eventName: "Bar otwarty", startTime: "18:00", description: "https://www.instagram.com/moeem.bcn/" },
  { venueName: "Moeem", dayOfWeek: 6, eventName: "Bar otwarty", startTime: "18:00", description: "https://www.instagram.com/moeem.bcn/" },
  { venueName: "Bacon Bear Bar", dayOfWeek: 0, eventName: "Bear Bar", startTime: "18:00", description: "https://www.facebook.com/baconbearbar/" },
  { venueName: "Bacon Bear Bar", dayOfWeek: 1, eventName: "Bear Bar", startTime: "18:00", description: "https://www.facebook.com/baconbearbar/" },
  { venueName: "Bacon Bear Bar", dayOfWeek: 2, eventName: "Bear Bar", startTime: "18:00", description: "https://www.facebook.com/baconbearbar/" },
  { venueName: "Bacon Bear Bar", dayOfWeek: 3, eventName: "Bear Bar", startTime: "18:00", description: "https://www.facebook.com/baconbearbar/" },
  { venueName: "Bacon Bear Bar", dayOfWeek: 4, eventName: "Bear Bar", startTime: "18:00", description: "https://www.facebook.com/baconbearbar/" },
  { venueName: "Bacon Bear Bar", dayOfWeek: 5, eventName: "Bear Bar", startTime: "18:00", description: "https://www.facebook.com/baconbearbar/" },
  { venueName: "Bacon Bear Bar", dayOfWeek: 6, eventName: "Bear Bar", startTime: "18:00", description: "https://www.facebook.com/baconbearbar/" },
  { venueName: "La Carrá", dayOfWeek: 0, eventName: "Raffaella Carrà tribute", startTime: "17:00", description: "https://www.instagram.com/lacarra_bcn/" },
  { venueName: "La Carrá", dayOfWeek: 1, eventName: "Raffaella Carrà tribute", startTime: "17:00", description: "https://www.instagram.com/lacarra_bcn/" },
  { venueName: "La Carrá", dayOfWeek: 2, eventName: "Raffaella Carrà tribute", startTime: "17:00", description: "https://www.instagram.com/lacarra_bcn/" },
  { venueName: "La Carrá", dayOfWeek: 3, eventName: "Raffaella Carrà tribute", startTime: "17:00", description: "https://www.instagram.com/lacarra_bcn/" },
  { venueName: "La Carrá", dayOfWeek: 4, eventName: "Raffaella Carrà tribute", startTime: "17:00", description: "https://www.instagram.com/lacarra_bcn/" },
  { venueName: "La Carrá", dayOfWeek: 5, eventName: "Raffaella Carrà tribute", startTime: "17:00", description: "https://www.instagram.com/lacarra_bcn/" },
  { venueName: "La Carrá", dayOfWeek: 6, eventName: "Raffaella Carrà tribute", startTime: "17:00", description: "https://www.instagram.com/lacarra_bcn/" },
  { venueName: "El Cangrejo", dayOfWeek: 5, eventName: "80s Night & Drag Shows", startTime: "22:00", description: "https://www.facebook.com/elcangrejobcn/" },
  { venueName: "El Cangrejo", dayOfWeek: 6, eventName: "80s Night & Drag Shows", startTime: "22:00", description: "https://www.facebook.com/elcangrejobcn/" },
  { venueName: "Strass Bar", dayOfWeek: 0, eventName: "Sunday Bingo + Drag Show", startTime: "23:30", description: "https://www.instagram.com/strassbar/" },
  { venueName: "Strass Bar", dayOfWeek: 1, eventName: "Drag Shows", startTime: "23:30", description: "https://www.instagram.com/strassbar/" },
  { venueName: "Strass Bar", dayOfWeek: 2, eventName: "Drag Shows", startTime: "23:30", description: "https://www.instagram.com/strassbar/" },
  { venueName: "Strass Bar", dayOfWeek: 3, eventName: "Drag Shows", startTime: "23:30", description: "https://www.instagram.com/strassbar/" },
  { venueName: "Strass Bar", dayOfWeek: 4, eventName: "Drag Shows", startTime: "23:30", description: "https://www.instagram.com/strassbar/" },
  { venueName: "Strass Bar", dayOfWeek: 5, eventName: "Drag Shows", startTime: "23:30", description: "https://www.instagram.com/strassbar/" },
  { venueName: "Strass Bar", dayOfWeek: 6, eventName: "Drag Shows", startTime: "23:30", description: "https://www.instagram.com/strassbar/" },
  { venueName: "Madame Jasmine", dayOfWeek: 0, eventName: "Genderfuck House", startTime: "20:00", description: "https://www.instagram.com/madamejasmine.bcn/" },
  { venueName: "Madame Jasmine", dayOfWeek: 1, eventName: "Genderfuck House", startTime: "20:00", description: "https://www.instagram.com/madamejasmine.bcn/" },
  { venueName: "Madame Jasmine", dayOfWeek: 2, eventName: "Genderfuck House", startTime: "20:00", description: "https://www.instagram.com/madamejasmine.bcn/" },
  { venueName: "Madame Jasmine", dayOfWeek: 3, eventName: "Genderfuck House", startTime: "20:00", description: "https://www.instagram.com/madamejasmine.bcn/" },
  { venueName: "Madame Jasmine", dayOfWeek: 4, eventName: "Genderfuck House", startTime: "20:00", description: "https://www.instagram.com/madamejasmine.bcn/" },
  { venueName: "Madame Jasmine", dayOfWeek: 5, eventName: "Genderfuck House", startTime: "20:00", description: "https://www.instagram.com/madamejasmine.bcn/" },
  { venueName: "Madame Jasmine", dayOfWeek: 6, eventName: "Genderfuck House", startTime: "20:00", description: "https://www.instagram.com/madamejasmine.bcn/" },
  { venueName: "La Federica", dayOfWeek: 0, eventName: "Weekend Events", startTime: "19:00", description: "https://www.instagram.com/lafederica.bar/" },
  { venueName: "La Federica", dayOfWeek: 2, eventName: "Vintage Bar", startTime: "19:00", description: "https://www.instagram.com/lafederica.bar/" },
  { venueName: "La Federica", dayOfWeek: 3, eventName: "Vintage Bar", startTime: "19:00", description: "https://www.instagram.com/lafederica.bar/" },
  { venueName: "La Federica", dayOfWeek: 4, eventName: "Vintage Bar", startTime: "19:00", description: "https://www.instagram.com/lafederica.bar/" },
  { venueName: "La Federica", dayOfWeek: 5, eventName: "Vintage Bar", startTime: "19:00", description: "https://www.instagram.com/lafederica.bar/" },
  { venueName: "La Federica", dayOfWeek: 6, eventName: "Weekend Events", startTime: "19:00", description: "https://www.instagram.com/lafederica.bar/" },
  { venueName: "Berlin Dark Barcelona", dayOfWeek: 0, eventName: "Sunday Session", startTime: "21:30", description: "https://berlindark.com/" },
  { venueName: "Berlin Dark Barcelona", dayOfWeek: 2, eventName: "Underwear Party", startTime: "22:00", description: "https://berlindark.com/" },
  { venueName: "Berlin Dark Barcelona", dayOfWeek: 3, eventName: "Club Bastards (Mixed)", startTime: "21:30", description: "https://berlindark.com/" },
  { venueName: "Berlin Dark Barcelona", dayOfWeek: 4, eventName: "Naked Party", startTime: "21:30", description: "https://berlindark.com/" },
  { venueName: "Berlin Dark Barcelona", dayOfWeek: 5, eventName: "Darkness Night", startTime: "23:30", description: "https://berlindark.com/" },
  { venueName: "Berlin Dark Barcelona", dayOfWeek: 6, eventName: "Fetish Night", startTime: "23:30", description: "https://berlindark.com/" },
];

export async function seedVenuesAndEvents() {
  console.log("[seed-venues] === SEED VENUES STARTING ===");
  
  try {
    const venueMap = new Map<string, number>();
    
    // Process all venues (Barcelona + Polish)
    const ALL_VENUES = [...BARCELONA_VENUES, ...POLISH_VENUES];
    console.log(`[seed-venues] Processing ${ALL_VENUES.length} venues...`);
    
    for (const venue of ALL_VENUES) {
      const [existing] = await db
        .select()
        .from(venues)
        .where(eq(venues.name, venue.name));
      
      if (!existing) {
        const [inserted] = await db
          .insert(venues)
          .values({ ...venue, isActive: true })
          .returning({ id: venues.id });
        venueMap.set(venue.name, inserted.id);
        console.log(`[seed-venues] Inserted venue: ${venue.name}`);
      } else {
        await db
          .update(venues)
          .set({
            address: venue.address,
            district: venue.district,
            lat: venue.lat,
            lng: venue.lng,
            website: (venue as any).website || existing.website,
            description: venue.description || existing.description,
          })
          .where(eq(venues.id, existing.id));
        venueMap.set(venue.name, existing.id);
        console.log(`[seed-venues] Updated venue: ${venue.name}`);
      }
    }
    
    let eventsInserted = 0;
    for (const event of BARCELONA_EVENTS) {
      const venueId = venueMap.get(event.venueName);
      if (!venueId) continue;
      
      const [existing] = await db
        .select()
        .from(recurringEvents)
        .where(eq(recurringEvents.venueId, venueId));
      
      if (!existing) {
        await db.insert(recurringEvents).values({
          venueId,
          dayOfWeek: event.dayOfWeek,
          eventName: event.eventName,
          startTime: event.startTime,
          description: event.description,
          isActive: true,
        });
        eventsInserted++;
      }
    }
    
    console.log(`[seed-venues] Updated/inserted ${eventsInserted} events`);
    console.log("[seed-venues] === SEED VENUES COMPLETE ===");
  } catch (error: any) {
    console.error("[seed-venues] Error:", error?.message);
  }
}
