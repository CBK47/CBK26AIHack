import { db } from "./db";
import { tricks, shopItems, sessionTricks, userTricks } from "@shared/schema";

const seedTricksRaw = [
  { name: "Cascade", description: "The basic 3-ball pattern where balls cross in a figure-eight.", tip: "Focus on a consistent peak height at eye level.", siteswap: "3", difficulty: 1, objectsCount: 3, propType: "balls", prereqNames: [] as string[] },
  { name: "Reverse Cascade", description: "Similar to Cascade, but balls are thrown over the top from the outside.", tip: "Think \"outside-in\" for your throws.", siteswap: "3", difficulty: 2, objectsCount: 3, propType: "balls", prereqNames: ["Cascade"] },
  { name: "Columns", description: "Two balls thrown together on the outside, one in the middle.", tip: "Keep the middle ball perfectly vertical.", siteswap: "3", difficulty: 2, objectsCount: 3, propType: "balls", prereqNames: ["Cascade"] },
  { name: "Tennis", description: "One ball (the tennis ball) passes back and forth over a cascade.", tip: "Follow the tennis ball with your eyes slightly.", siteswap: "3", difficulty: 2, objectsCount: 3, propType: "balls", prereqNames: ["Cascade"] },
  { name: "Over the Top", description: "A single ball is thrown over the rest of the cascade.", tip: "Make the \"over\" throw a bit higher than the rest.", siteswap: "3", difficulty: 2, objectsCount: 3, propType: "balls", prereqNames: ["Cascade"] },
  { name: "Juggle to the Edge", description: "Wide throws that push the boundaries of your reach.", tip: "Great for training recovery from bad throws.", siteswap: "3", difficulty: 2, objectsCount: 3, propType: "balls", prereqNames: ["Cascade"] },
  { name: "Two in One Hand", description: "Juggling two balls in just the right or left hand.", tip: "Throw in a circular motion (inside-out).", siteswap: "4", difficulty: 2, objectsCount: 2, propType: "balls", prereqNames: [] as string[] },
  { name: "Half-Shower", description: "One hand throws high arcs, the other throws lower arcs.", tip: "The hands follow two different circular paths.", siteswap: "3", difficulty: 2, objectsCount: 3, propType: "balls", prereqNames: ["Cascade"] },
  { name: "Windmill", description: "All throws cross in one direction, mimicking a rotating blade.", tip: "Keep your arms crossed and fluid.", siteswap: "3", difficulty: 3, objectsCount: 3, propType: "balls", prereqNames: ["Cascade"] },
  { name: "The Claw", description: "Catching the balls from above with a downward snatching motion.", tip: "Snap your wrist down quickly.", siteswap: "3", difficulty: 3, objectsCount: 3, propType: "balls", prereqNames: ["Cascade"] },
  { name: "Mills Mess", description: "A famous cross-armed pattern that looks like a tangled mess.", tip: "Focus on the \"scooping\" motion of the hands.", siteswap: "3", difficulty: 3, objectsCount: 3, propType: "balls", prereqNames: ["Cascade", "Reverse Cascade"] },
  { name: "The Box", description: "A synchronous pattern where balls form a square shape.", tip: "The horizontal \"zip\" pass must be very fast.", siteswap: "(4,2x)(2x,4)", difficulty: 4, objectsCount: 3, propType: "balls", prereqNames: ["Columns"] },
  { name: "4-Ball Fountain", description: "The standard 4-ball pattern where hands juggle independently.", tip: "Practice 2-in-1-hand until solid first.", siteswap: "4", difficulty: 3, objectsCount: 4, propType: "balls", prereqNames: ["Two in One Hand"] },
  { name: "Fake Columns", description: "A 2-ball trick that looks like 3 balls using a \"fake\" hand movement.", tip: "Move your empty hand as if it has a ball.", siteswap: "3", difficulty: 3, objectsCount: 2, propType: "balls", prereqNames: ["Columns"] },
  { name: "Shower", description: "Balls follow a circular path: high arc from one hand, fast pass from the other.", tip: "The \"1\" pass (the zip) is the most important part.", siteswap: "51", difficulty: 3, objectsCount: 3, propType: "balls", prereqNames: ["Cascade"] },
  { name: "Burkes Barrage", description: "An advanced version of the Mills Mess with extra arm movement.", tip: "Lead with your elbow on the crossing throw.", siteswap: "3", difficulty: 3, objectsCount: 3, propType: "balls", prereqNames: ["Mills Mess"] },
  { name: "441", description: "A fast 3-ball pattern with two high throws and one fast pass.", tip: "The \"1\" happens right after the second \"4\".", siteswap: "441", difficulty: 3, objectsCount: 3, propType: "balls", prereqNames: ["Cascade"] },
  { name: "531", description: "A rhythmic trick with a high, medium, and low throw.", tip: "The \"5\" is the peak, the \"1\" is the floor.", siteswap: "531", difficulty: 3, objectsCount: 3, propType: "balls", prereqNames: ["Cascade"] },
  { name: "The Machine", description: "A mechanical looking trick where one ball is carried by the hand.", tip: "Keep the carried ball moving in a straight vertical line.", siteswap: "3", difficulty: 3, objectsCount: 3, propType: "balls", prereqNames: ["Cascade"] },
  { name: "Robot", description: "Similar to the machine but with jerky, robotic movements.", tip: "Exaggerate the stops and starts.", siteswap: "3", difficulty: 3, objectsCount: 3, propType: "balls", prereqNames: ["The Machine"] },
  { name: "5-Ball Cascade", description: "The ultimate milestone for most jugglers.", tip: "Lower your 3-ball height to speed up your hands.", siteswap: "5", difficulty: 4, objectsCount: 5, propType: "balls", prereqNames: ["Cascade", "Two in One Hand"] },
  { name: "Rubensteins Revenge", description: "A complex flourish-filled pattern with many arm crosses.", tip: "Master Mills Mess perfectly before trying this.", siteswap: "3", difficulty: 4, objectsCount: 3, propType: "balls", prereqNames: ["Mills Mess"] },
  { name: "4-Ball Half-Shower", description: "4 balls in a circular path but with staggered heights.", tip: "Requires very high accuracy.", siteswap: "53", difficulty: 4, objectsCount: 4, propType: "balls", prereqNames: ["4-Ball Fountain"] },
  { name: "744", description: "A 5-ball siteswap done with only 3 balls and two \"holes\".", tip: "The \"7\" is a very high throw.", siteswap: "744", difficulty: 4, objectsCount: 5, propType: "balls", prereqNames: ["5-Ball Cascade"] },
  { name: "Boston Mess", description: "A version of Mills Mess where the balls stay in columns.", tip: "Keep the hand swaps fast and tight.", siteswap: "3", difficulty: 4, objectsCount: 3, propType: "balls", prereqNames: ["Mills Mess"] },
  { name: "Inverted Box", description: "The box pattern but with the vertical throws crossing over.", tip: "Extremely difficult hand-eye coordination.", siteswap: "3", difficulty: 4, objectsCount: 3, propType: "balls", prereqNames: ["The Box"] },
  { name: "Backcrosses (3B)", description: "Throwing every ball behind your back.", tip: "Aim for your opposite shoulder.", siteswap: "3", difficulty: 4, objectsCount: 3, propType: "balls", prereqNames: ["Cascade"] },
  { name: "Under the Leg", description: "Throwing a ball under your leg while maintaining the pattern.", tip: "Lift your knee high and lean slightly.", siteswap: "3", difficulty: 4, objectsCount: 3, propType: "balls", prereqNames: ["Cascade"] },
  { name: "Neck Catch", description: "Catching a high throw on the back of your neck.", tip: "Lean forward and create a \"pocket\" with your shoulders.", siteswap: "3", difficulty: 4, objectsCount: 3, propType: "balls", prereqNames: ["Cascade"] },
  { name: "Penguin Catches", description: "Catching with your palms facing outward.", tip: "Requires flexible wrists.", siteswap: "3", difficulty: 4, objectsCount: 3, propType: "balls", prereqNames: ["Cascade"] },
  { name: "6-Ball Fountain", description: "Independent 3-ball fountains in each hand.", tip: "Sync the beats to keep it stable.", siteswap: "6", difficulty: 5, objectsCount: 6, propType: "balls", prereqNames: ["4-Ball Fountain"] },
  { name: "7-Ball Cascade", description: "The gold standard for professional numbers jugglers.", tip: "Requires immense physical endurance.", siteswap: "7", difficulty: 5, objectsCount: 7, propType: "balls", prereqNames: ["5-Ball Cascade"] },
  { name: "97531", description: "A 5-ball tower where all balls land in order.", tip: "The \"9\" must be thrown very high and straight.", siteswap: "97531", difficulty: 5, objectsCount: 5, propType: "balls", prereqNames: ["5-Ball Cascade"] },
  { name: "5551", description: "A 4-ball pattern with three high throws and one zip.", tip: "The \"1\" pass is very fast.", siteswap: "5551", difficulty: 5, objectsCount: 4, propType: "balls", prereqNames: ["4-Ball Fountain"] },
  { name: "55550", description: "4 balls in a 5-ball rhythm with one empty spot.", tip: "Great for practicing 5-ball timing.", siteswap: "55550", difficulty: 4, objectsCount: 4, propType: "balls", prereqNames: ["4-Ball Fountain"] },
  { name: "The Library", description: "A complex 3-ball pattern involving many carry movements.", tip: "Named after the Library of Juggling.", siteswap: "3", difficulty: 5, objectsCount: 3, propType: "balls", prereqNames: ["Mills Mess", "Burkes Barrage"] },
  { name: "Chops", description: "Fast, downward movements that \"chop\" the ball out of the air.", tip: "Use your whole arm for the chopping motion.", siteswap: "3", difficulty: 4, objectsCount: 3, propType: "balls", prereqNames: ["Cascade"] },
  { name: "Pirouette", description: "Throwing all balls up and spinning 360 degrees.", tip: "Spot a point on the wall to stay balanced.", siteswap: "3", difficulty: 5, objectsCount: 3, propType: "balls", prereqNames: ["Cascade"] },
  { name: "Blind Catches", description: "Catching balls behind your head without looking.", tip: "Trust your muscle memory for the throw.", siteswap: "3", difficulty: 5, objectsCount: 3, propType: "balls", prereqNames: ["Cascade"] },
  { name: "Foot Catch", description: "Stalling a ball on your foot and kicking it back up.", tip: "Keep your foot flat like a platform.", siteswap: "3", difficulty: 4, objectsCount: 3, propType: "balls", prereqNames: ["Cascade"] },
];

export async function seedDatabase() {
  await seedShopItems();

  const existing = await db.select().from(tricks);

  const hasNewTricks = seedTricksRaw.some(
    st => !existing.find(e => e.name === st.name)
  );

  if (existing.length >= seedTricksRaw.length && !hasNewTricks) {
    console.log(`Database already has ${existing.length} tricks, skipping seed.`);
    return;
  }

  if (existing.length > 0) {
    console.log("Clearing old trick data and reseeding...");
    await db.delete(sessionTricks);
    await db.delete(userTricks);
    await db.delete(tricks);
  }

  console.log(`Seeding database with ${seedTricksRaw.length} tricks...`);
  const nameToId: Record<string, number> = {};
  for (const raw of seedTricksRaw) {
    const prereqIds = raw.prereqNames
      .map(name => nameToId[name])
      .filter(Boolean);
    const prerequisites = prereqIds.length > 0 ? prereqIds.join(",") : null;
    const { prereqNames, ...trickData } = raw;
    const [inserted] = await db.insert(tricks).values({ ...trickData, prerequisites, videoUrl: null }).returning();
    nameToId[raw.name] = inserted.id;
  }
  console.log("Seed complete.");
}

const shopItemsSeed = [
  {
    name: "Midnight Purple",
    type: "theme",
    description: "A deep, rich purple theme for night-time practice sessions.",
    price: 50,
    requirement: null,
    data: JSON.stringify({ hue: 280 }),
  },
  {
    name: "Electric Lime",
    type: "theme",
    description: "A bold, energizing lime green theme to power up your juggling.",
    price: 50,
    requirement: null,
    data: JSON.stringify({ hue: 80 }),
  },
  {
    name: "Pro Metronome",
    type: "feature",
    description: "An adjustable BPM metronome with audio beats to perfect your rhythm and timing.",
    price: 100,
    requirement: null,
    data: null,
  },
  {
    name: "Mills Mess",
    type: "trick",
    description: "A legendary advanced pattern where arms cross and uncross while balls weave in a complex figure-eight motion.",
    price: 200,
    requirement: "Level 5",
    data: JSON.stringify({
      siteswap: "3",
      difficulty: 4,
      objectsCount: 3,
      propType: "balls",
      tip: "Focus on the arm crossing pattern first without balls.",
      prereqNames: ["Reverse Cascade", "The Claw"],
    }),
  },
];

async function seedShopItems() {
  const existing = await db.select().from(shopItems);
  if (existing.length >= shopItemsSeed.length) {
    return;
  }
  for (const item of shopItemsSeed) {
    const exists = existing.find(e => e.name === item.name);
    if (!exists) {
      await db.insert(shopItems).values(item);
    }
  }
  console.log("Shop items seeded.");
}
