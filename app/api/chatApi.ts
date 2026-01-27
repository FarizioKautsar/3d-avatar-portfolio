import OpenAI, { APIError } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // apiKey: 'ERROR_TEST',
});

export async function fetchFromOpenAi(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []
) {
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL as string,
      messages,
      temperature: 0.6,
    });
    console.log("OpenAI Completion: RETURNING", completion);
    return completion;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('An error occurred while fetching from OpenAI:', error);
      // Handle the error further if needed, e.g., throw it again
      throw error;
    } else {
      // Handle other types of errors
      console.error('An unknown error occurred while fetching from OpenAI:', error);
      // Throw a new error or handle the situation accordingly
      throw new Error('Unknown error occurred');
    }
  }
}

export function handleError(error: unknown) {
  if (error instanceof APIError) {
    return Response.json(
      { ...error, message: error.message },
      { status: error.status }
    );
  } else if (error instanceof Error) {
    console.error("An error occurred while fetching from OpenAI:", error);
    // Handle the error further if needed, e.g., throw it again
    return Response.json({ ...error, message: error.message }, { status: 500 });
  } else {
    // Handle other types of errors
    // Throw a new error or handle the situation accordingly
    throw new Error("Unknown error occurred");
  }
}
