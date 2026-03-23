import { db } from "./db";
import { places, users } from "@shared/schema";
import { count, eq } from "drizzle-orm";

const PLACES_DATA = [
  { name: "Klub Przystań", type: "Klub", address: "ul. Warmińskiego 17 (podwórze)", city: "Bydgoszcz", hours: "Weekend", imageUrl: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&auto=format&fit=crop&q=60" },
  { name: "Cukarna Fabryka", type: "Bar", address: "Wrzeszcz", city: "Gdańsk", hours: "Codziennie", imageUrl: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&auto=format&fit=crop&q=60" },
  { name: "CzystaCisza", type: "Bar/Restauracja", address: "ul. Szafarnia", city: "Gdańsk", hours: "Codziennie", imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=60" },
  { name: "Cubo", type: "Klub", address: "ul. Wały Piastowskie", city: "Gdańsk", hours: "Pt-Sb", imageUrl: "https://images.unsplash.com/photo-1571204829887-3b8d69e4094d?w=800&auto=format&fit=crop&q=60" },
  { name: "Parlament", type: "Klub", address: "Centrum Gdańska", city: "Gdańsk", hours: "Weekend", imageUrl: "https://images.unsplash.com/photo-1545224144-b38cd309ef69?w=800&auto=format&fit=crop&q=60" },
  { name: "Kwadraty", type: "Klub", address: "Centrum Gdyni", city: "Gdynia", hours: "Weekend", imageUrl: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&auto=format&fit=crop&q=60" },
  { name: "Intacto", type: "Bar/Klub", address: "ul. Dąbrowskiego 3", city: "Katowice", hours: "Pn-Czw 11:00-00:00, Pt-Sb 11:00-02:00, Nd 16:00-00:00", imageUrl: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&auto=format&fit=crop&q=60" },
  { name: "HAH Katowice", type: "Klub", address: "ul. Sobieskiego 11", city: "Katowice", hours: "Weekend", imageUrl: "https://images.unsplash.com/photo-1571204829887-3b8d69e4094d?w=800&auto=format&fit=crop&q=60" },
  { name: "Private Club Scena", type: "Klub", address: "ul. Mariacka 18a", city: "Katowice", hours: "Codziennie od 19:00", imageUrl: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&auto=format&fit=crop&q=60" },
  { name: "Eszeweria", type: "Bar", address: "Kazimierz", city: "Kraków", hours: "Codziennie", imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=60" },
  { name: "BlueXL Men's Club", type: "Cruise Club", address: "Kazimierz", city: "Kraków", hours: "Różne", imageUrl: "https://images.unsplash.com/photo-1571204829887-3b8d69e4094d?w=800&auto=format&fit=crop&q=60" },
  { name: "Cafe Philo", type: "Kawiarnia", address: "Różne lokalizacje", city: "Kraków", hours: "Codziennie", imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=60" },
  { name: "Bracka 4", type: "Klub", address: "ul. Bracka 4 (podziemia)", city: "Kraków", hours: "Weekend", imageUrl: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&auto=format&fit=crop&q=60" },
  { name: "Club Papuga", type: "Klub", address: "ul. Józefa Dietla 64", city: "Kraków", hours: "Czw 21:00-04:00, Pt-Sb 22:00-06:00", imageUrl: "https://images.unsplash.com/photo-1545224144-b38cd309ef69?w=800&auto=format&fit=crop&q=60" },
  { name: "Klub Ciemnia", type: "Klub", address: "ul. Krowoderska 31", city: "Kraków", hours: "Pn-Czw 18:00-05:00, Pt-Sb 18:00-14:00", imageUrl: "https://images.unsplash.com/photo-1571204829887-3b8d69e4094d?w=800&auto=format&fit=crop&q=60" },
  { name: "ZOO Klub", type: "Klub", address: "ul. Józefa 6 (Kazimierz)", city: "Kraków", hours: "Weekend", imageUrl: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&auto=format&fit=crop&q=60" },
  { name: "LaF", type: "Klub/Bar", address: "Kazimierz", city: "Kraków", hours: "Różne", imageUrl: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&auto=format&fit=crop&q=60" },
  { name: "Sauna Spartakus", type: "Sauna", address: "ul. Konopnickiej 20 (Wieliczka)", city: "Kraków", hours: "12:00-23:00, Nd 14:00-21:00", imageUrl: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&auto=format&fit=crop&q=60" },
  { name: "Klub", type: "Bar/Klub", address: "ul. Świderska 2/4, 05-400", city: "Otwock", hours: "Weekend", imageUrl: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&auto=format&fit=crop&q=60" },
  { name: "Dark Angels", type: "Bar", address: "ul. Garbary 54, 60-850", city: "Poznań", hours: "Różne", imageUrl: "https://images.unsplash.com/photo-1571204829887-3b8d69e4094d?w=800&auto=format&fit=crop&q=60" },
  { name: "HAH Art & Music Club Poznań", type: "Klub", address: "ul. Małe Garbary 6", city: "Poznań", hours: "Weekendy + wieczory w tygodniu", imageUrl: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&auto=format&fit=crop&q=60" },
  { name: "Klub Pokusa", type: "Klub", address: "ul. Święty Marcin 23, 61-804", city: "Poznań", hours: "Weekend", imageUrl: "https://images.unsplash.com/photo-1545224144-b38cd309ef69?w=800&auto=format&fit=crop&q=60" },
  { name: "Narraganset", type: "Klub", address: "Centrum Poznania", city: "Poznań", hours: "Weekend", imageUrl: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&auto=format&fit=crop&q=60" },
  { name: "HAH Sopot", type: "Klub", address: "al. Franciszka Mamuszki 21", city: "Sopot", hours: "Weekend głównie", imageUrl: "https://images.unsplash.com/photo-1571204829887-3b8d69e4094d?w=800&auto=format&fit=crop&q=60" },
  { name: "Joy Club", type: "Klub", address: "ul. Armii Krajowej 111", city: "Sopot", hours: "Pt-Sb", imageUrl: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&auto=format&fit=crop&q=60" },
  { name: "Mezalians Cafe", type: "Kawiarnia", address: "Centrum Szczecina", city: "Szczecin", hours: "Codziennie", imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=60" },
  { name: "Elefunk The Club", type: "Klub", address: "Centrum (Plac Grunwaldzki)", city: "Szczecin", hours: "Weekend", imageUrl: "https://images.unsplash.com/photo-1545224144-b38cd309ef69?w=800&auto=format&fit=crop&q=60" },
  { name: "Love Club", type: "Klub", address: "ul. Tkacka 8", city: "Szczecin", hours: "Weekend", imageUrl: "https://images.unsplash.com/photo-1571204829887-3b8d69e4094d?w=800&auto=format&fit=crop&q=60" },
  { name: "Mojo Power Club", type: "Klub", address: "Centrum (Plac Grunwaldzki)", city: "Szczecin", hours: "Weekend", imageUrl: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&auto=format&fit=crop&q=60" },
  { name: "Lodi Dodi", type: "Bar", address: "ul. Wilcza 23/00, 00-544", city: "Warszawa", hours: "Codziennie", imageUrl: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&auto=format&fit=crop&q=60" },
  { name: "Plan B", type: "Bar", address: "Różne lokalizacje", city: "Warszawa", hours: "Do późna, jedzenie po północy", imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=60" },
  { name: "Ramona Bar", type: "Bar/Kawiarnia", address: "ul. Widok 18/1, 00-023", city: "Warszawa", hours: "Codziennie", imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=60" },
  { name: "Między Nami Cafe", type: "Kawiarnia/Księgarnia", address: "Różne lokalizacje", city: "Warszawa", hours: "Wczesne/mid-wieczory", imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=60" },
  { name: "Club Galeria", type: "Klub", address: "Plac Mirowski 1, 00-138", city: "Warszawa", hours: "Pt-Sb", imageUrl: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&auto=format&fit=crop&q=60" },
  { name: "Crush Club Warsaw", type: "Klub", address: "Plac Mirowski 1 (Hala Mirowska), 00-138", city: "Warszawa", hours: "Śr-Nd od 20:00", imageUrl: "https://images.unsplash.com/photo-1545224144-b38cd309ef69?w=800&auto=format&fit=crop&q=60" },
  { name: "GLAM Club", type: "Klub", address: "ul. Żurawia 22 (Centrum)", city: "Warszawa", hours: "Weekend", imageUrl: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&auto=format&fit=crop&q=60" },
  { name: "Królik Klub", type: "Klub", address: "ul. Świętokrzyska 18, 00-052", city: "Warszawa", hours: "Weekend", imageUrl: "https://images.unsplash.com/photo-1571204829887-3b8d69e4094d?w=800&auto=format&fit=crop&q=60" },
  { name: "Metropolis", type: "Klub", address: "ul. Henryka Sienkiewicza 7", city: "Warszawa", hours: "Weekend", imageUrl: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&auto=format&fit=crop&q=60" },
  { name: "Sauna Heaven", type: "Sauna", address: "ul. Waliców 13", city: "Warszawa", hours: "Przedłużone w weekendy", imageUrl: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&auto=format&fit=crop&q=60" },
  { name: "Sauna The Fire", type: "Sauna", address: "ul. Twarda 44", city: "Warszawa", hours: "Codziennie od 17:00", imageUrl: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&auto=format&fit=crop&q=60" },
  { name: "Sauna Galla", type: "Sauna/Siłownia", address: "ul. Ptasia 2, 00-138", city: "Warszawa", hours: "Codziennie 14:00-23:00", imageUrl: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&auto=format&fit=crop&q=60" },
  { name: "HAH Art & Music Club Wrocław", type: "Klub", address: "ul. Oławska 11, 50-105", city: "Wrocław", hours: "Weekendy + tygodniowo", imageUrl: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&auto=format&fit=crop&q=60" },
  { name: "Cactus Club", type: "Klub", address: "ul. Zelwerowicza 18a", city: "Wrocław", hours: "Codziennie", imageUrl: "https://images.unsplash.com/photo-1571204829887-3b8d69e4094d?w=800&auto=format&fit=crop&q=60" },
  { name: "Ganimedes", type: "Klub/Sauna", address: "al. Marszałka Józefa Piłsudskiego 6", city: "Łódź", hours: "Codziennie", imageUrl: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&auto=format&fit=crop&q=60" },
  { name: "Kino Bizarriusz", type: "Kino", address: "ul. Hoża 41 (wejście od ul. Poznańskiej 16)", city: "Warszawa", hours: "Pn-Czw 14-23, Pt-Sb 20-03, Nd 14-23", imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=60" },
];

const ADMIN_EMAIL = "bizekwaw@gmail.com";

export async function seedDatabase() {
  console.log("[seed] === SEED DATABASE STARTING ===");
  console.log("[seed] NODE_ENV:", process.env.NODE_ENV);
  console.log("[seed] DATABASE_URL exists:", !!process.env.DATABASE_URL);
  
  try {
    const [{ value: placesCount }] = await db.select({ value: count() }).from(places);
    console.log(`[seed] Current places count: ${placesCount}`);
    
    if (placesCount < 10) {
      console.log(`[seed] Found only ${placesCount} places, seeding database with ${PLACES_DATA.length} places...`);
      
      await db.delete(places);
      console.log("[seed] Deleted old places");
      
      await db.insert(places).values(PLACES_DATA);
      console.log(`[seed] Successfully inserted ${PLACES_DATA.length} places`);
      
      const [{ value: newCount }] = await db.select({ value: count() }).from(places);
      console.log(`[seed] Verification: now have ${newCount} places`);
    } else {
      console.log(`[seed] Database already has ${placesCount} places, skipping seed`);
    }

    const [adminUser] = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL));
    if (adminUser) {
      if (!adminUser.isAdmin) {
        await db.update(users).set({ isAdmin: true }).where(eq(users.email, ADMIN_EMAIL));
        console.log(`[seed] Set ${ADMIN_EMAIL} as admin`);
      } else {
        console.log(`[seed] ${ADMIN_EMAIL} is already admin`);
      }
    } else {
      console.log(`[seed] Admin user ${ADMIN_EMAIL} not found in database yet`);
    }
    
    console.log("[seed] === SEED DATABASE COMPLETE ===");
  } catch (error: any) {
    console.error("[seed] === SEED DATABASE ERROR ===");
    console.error("[seed] Error message:", error?.message);
    console.error("[seed] Error stack:", error?.stack);
  }
}
