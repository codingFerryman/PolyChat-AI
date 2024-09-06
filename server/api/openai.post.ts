import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
});

export default defineEventHandler(async (event) => {
    const { messages, params } = await readBody(event);
    if (!messages || messages.length === 0 || !params) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing messages or LLM params',
        });
    }

    const config = {
        max_tokens: params.maxTokens,
        temperature: params.temperature,
        top_p: params.topP,
        frequency_penalty: params.frequencyPenalty,
        presence_penalty: params.presencePenalty,
        stream: false, // TODO: support streaming
        // stream: params.stream,
    };


    try {
        const result = await client.chat.completions.create({
            model: params.model.slice(8),
            messages: params.systemPrompt
                ? [{ role: 'system', content: params.systemPrompt }, ...messages]
                : messages,
            ...config,
        });

        return result.choices[0]['message']['content'];

        // return params.stream
        //     ? sendStream(event, result as ReadableStream)
        //     : result.choices[0]['message']['content'];
    } catch (error) {
        console.error(error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Error processing request',
        });
    }
});
