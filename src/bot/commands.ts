import type TelegramBot from "node-telegram-bot-api";

export async function setBotCommands(bot: TelegramBot) {
  await bot.setMyCommands([
    { command: "today", description: "የዛሬ መብራት መቋረጥ ሰዓት" },
    { command: "tomorrow", description: "የነገ መብራት መቋረጥ ሰዓት" },
    { command: "next", description: "ቀጣይ መብራት መቋረጥ" },
    { command: "settoday", description: "የዛሬን ሰዓት አስቀምጥ (12:30/1:30 የኢትዮጵያ ሰዓት)" },
    { command: "status", description: "የተቀመጠውን መለኪያ አሳይ" },
    { command: "reset", description: "የተቀመጠውን ሰሌዳ ሰርዝ" }
  ]);
}
