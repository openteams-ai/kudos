// Shared rewards catalog — the single source of truth for the redeemable
// rewards store, imported by both seed.ts and demo-seed.ts so the two never
// drift apart. Emoji tiles deliberately stand in for brand logos (no real
// trademarks in a judged demo).
//
// Costs form an affordability ladder. Kudos pay the receiver 10 pts each and
// the monthly give-allowance is 100 pts, so entry-level swag lands around
// 30 pts (attainable in month one) and aspirational items — an Extra Day Off,
// a $100 airline voucher — sit at 500 pts to save toward.
export type RewardSeed = {
  name: string;
  cost: number;
  category: string;
  emoji: string;
  description: string;
};

export const REWARDS: RewardSeed[] = [
  // Company Swag — the everyday entry tier.
  { name: "Sticker Pack", cost: 30, category: "Company Swag", emoji: "🎨", description: "A pack of laptop-worthy stickers to show off your team pride." },
  { name: "Enamel Pin Set", cost: 45, category: "Company Swag", emoji: "📌", description: "Collectible enamel pins to jazz up your bag or lanyard." },
  { name: "Quality Tee", cost: 90, category: "Company Swag", emoji: "👕", description: "A soft, breathable tee you'll actually reach for on laundry day." },
  { name: "Insulated Water Bottle", cost: 120, category: "Company Swag", emoji: "🚰", description: "Keeps your coffee hot and your water cold through the longest standup." },
  { name: "Desk Plant", cost: 140, category: "Company Swag", emoji: "🪴", description: "A low-maintenance little green friend to brighten your workspace." },
  { name: "Branded Backpack", cost: 260, category: "Company Swag", emoji: "🎒", description: "A rugged everyday backpack with room for your laptop and then some." },
  { name: "Cozy Hoodie", cost: 280, category: "Company Swag", emoji: "🧥", description: "The impossibly soft hoodie that becomes your go-to for every chilly meeting." },

  // Gift Cards — mostly generic-but-plausible, one recognizable name.
  { name: "Donut & Coffee $10", cost: 60, category: "Gift Cards", emoji: "🍩", description: "A little morning pick-me-up on the house." },
  { name: "Ride Share $20", cost: 130, category: "Gift Cards", emoji: "🚗", description: "Skip the parking hunt with a $20 ride-share credit." },
  { name: "Coffee House $25", cost: 150, category: "Gift Cards", emoji: "☕", description: "Twenty-five dollars of espresso-fueled productivity, on us." },
  { name: "Food Delivery $25", cost: 150, category: "Gift Cards", emoji: "🍔", description: "Dinner delivered to your door — no cooking required." },
  { name: "Amazon $25", cost: 160, category: "Gift Cards", emoji: "📦", description: "A $25 Amazon gift card for whatever's on your wishlist." },
  { name: "Streaming Service — 3 Months", cost: 200, category: "Gift Cards", emoji: "🎬", description: "Three months of binge-worthy shows and movies." },
  { name: "Bookstore $50", cost: 280, category: "Gift Cards", emoji: "📚", description: "Fifty dollars to lose yourself in a fresh stack of books." },
  { name: "Airline Voucher $100", cost: 500, category: "Gift Cards", emoji: "✈️", description: "A $100 flight voucher to kick-start your next getaway." },

  // Experiences — treat-yourself moments and rare access.
  { name: "Team Lunch on the Company", cost: 220, category: "Experiences", emoji: "🍕", description: "Treat the whole team to lunch, courtesy of the company." },
  { name: "Premium Parking Spot (1 Month)", cost: 300, category: "Experiences", emoji: "🅿️", description: "The best spot in the lot, reserved just for you for a whole month." },
  { name: "Conference Day Pass", cost: 350, category: "Experiences", emoji: "🎟️", description: "A day pass to the industry conference of your choice." },
  { name: "Lunch with the CEO", cost: 400, category: "Experiences", emoji: "🍽️", description: "A relaxed one-on-one lunch with the CEO — questions welcome." },

  // Time Off — the crowd favorites; Extra Day Off is the aspirational summit.
  { name: "Late Start Monday", cost: 180, category: "Time Off", emoji: "☀️", description: "Ease into the week with a slow, guilt-free Monday morning." },
  { name: "Leave 2 Hours Early Friday", cost: 200, category: "Time Off", emoji: "🎉", description: "Kick off your weekend two hours early this Friday." },
  { name: "Extra Day Off", cost: 500, category: "Time Off", emoji: "🏝️", description: "A whole extra day of paid time off to spend however you like." },

  // Charity — turn recognition into good in the world.
  { name: "Donate $10 to Charity", cost: 100, category: "Charity", emoji: "❤️", description: "We'll donate $10 to a charity of your choice in your honor." },
  { name: "Plant 10 Trees", cost: 120, category: "Charity", emoji: "🌳", description: "We'll plant ten trees in your name — good for the planet, good for the soul." },
  { name: "Donate $25 to Charity", cost: 250, category: "Charity", emoji: "💝", description: "We'll donate $25 to the cause you care about most." },
  { name: "Donate $50 to Charity", cost: 500, category: "Charity", emoji: "🌍", description: "We'll make a $50 donation to a charity of your choosing." },
];
