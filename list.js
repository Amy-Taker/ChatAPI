import * as dotenv from 'dotenv'
dotenv.config({path: "./.env.local"});

import OpenAI from "openai";
const openai = new OpenAI({apiKey: process.env.VITE_API_KEY}); //

async function main() {
  const myAssistants = await openai.beta.assistants.list({
    order: "desc",
    limit: "20",
  });

  console.log(myAssistants.data);
}

main();