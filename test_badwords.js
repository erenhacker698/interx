
const BAD_WORDS = [
    "nigger", "faggot", "chink", "kike", "dyke", "tranny",
    "potta", "thevidiya", "dvd", "ommala", "kuthi", "koothi", "otha", "pool", "poolu", "oka", "okara", "okaporen", "thevidiyaaaa", "thevidiyaa", "thevidiyaaa",
    "punda", "okalaoli", "oombu",
    "fuck", "shit", "bitch", "ass", "damn", "nude", "porn", "sex", "xxx", "onlyfans",
    "kys", "killyourself", "goddie", "youshoulddie", "ihateyou", "gobacktoyour", "youpeopleare", "allofyouare",
    "freenitro", "discordgift", "steamgift", "claimnow", "limitedoffer", "clickhere", "bitly", "tinyurl", "tme", "giveawayended"
];

function testDetection(content) {
    const normalized = content.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // Unicode normalization
        .replace(/[0oO]/g, "o")
        .replace(/[1iI!lL|]/g, "i")
        .replace(/[3eE]/g, "e")
        .replace(/[4aA@]/g, "a")
        .replace(/[5sS$]/g, "s")
        .replace(/[7tT]/g, "t")
        .replace(/[8bB]/g, "b")
        .replace(/[\W_]+/g, ""); // Strip non-alphanumeric

    const foundBadWord = BAD_WORDS.find(word => normalized.includes(word));
    console.log(`Input: "${content}" -> Normalized: "${normalized}" -> Detected: ${foundBadWord || "None"}`);
    return !!foundBadWord;
}

const testCases = [
    "F@CK",
    "s h i t",
    "f.u.c.k",
    "b1tch",
    "a$$",
    "p0rn",
    "3xpla1n n0" // Should not detect "sex" if it's not a substring, but wait, 3xp -> exp...
];

testCases.forEach(testDetection);
