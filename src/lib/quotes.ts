const quotes: string[] = [
    "Recovery is not a race. You don't have to feel guilty if it takes you longer than you thought it would.",
    "The only person you are destined to become is the person you decide to be. — Ralph Waldo Emerson",
    "Fall seven times, stand up eight. — Japanese Proverb",
    "You are braver than you believe, stronger than you seem, and smarter than you think. — A.A. Milne",
    "Every day is a new beginning. Take a deep breath, smile, and start again.",
    "Progress, not perfection, is what we should be asking of ourselves. — Julia Cameron",
    "The greatest glory in living lies not in never falling, but in rising every time we fall. — Nelson Mandela",
    "It does not matter how slowly you go as long as you do not stop. — Confucius",
    "Strength does not come from physical capacity. It comes from an indomitable will. — Mahatma Gandhi",
    "You don't have to see the whole staircase, just take the first step. — Martin Luther King Jr.",
    "Believe you can and you're halfway there. — Theodore Roosevelt",
    "The secret of getting ahead is getting started. — Mark Twain",
    "Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time. — Thomas Edison",
    "What lies behind us and what lies before us are tiny matters compared to what lies within us. — Ralph Waldo Emerson",
    "One day at a time. This is enough. Do not look back and grieve over the past. — Og Mandino",
    "You are not your addiction. You are a human being with unique strengths waiting to be unleashed.",
    "Courage isn't having the strength to go on — it is going on when you don't have strength. — Napoleon Bonaparte",
    "Be not afraid of going slowly, be afraid only of standing still. — Chinese Proverb",
    "The comeback is always stronger than the setback.",
    "Your past does not define your future. Your actions do.",
    "Healing is not linear. Be patient with yourself.",
    "Every moment is a fresh beginning. — T.S. Eliot",
    "Rock bottom became the solid foundation on which I rebuilt my life. — J.K. Rowling",
    "Stars can't shine without darkness.",
    "You were given this life because you are strong enough to live it.",
    "Tough times never last, but tough people do. — Robert H. Schuller",
    "The only impossible journey is the one you never begin. — Tony Robbins",
    "Don't count the days. Make the days count. — Muhammad Ali",
    "What we achieve inwardly will change outer reality. — Plutarch",
    "Success is the sum of small efforts, repeated day in and day out. — Robert Collier",
];

export function getQuoteOfTheDay(): string {
    const today = new Date();
    const dayOfYear = Math.floor(
        (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return quotes[dayOfYear % quotes.length];
}
