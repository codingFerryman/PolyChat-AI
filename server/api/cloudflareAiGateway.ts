// noinspection JSUnusedGlobalSymbols

import axios from 'axios';

export default defineEventHandler(async (event) => {
    const {messages, params} = await readBody(event);
    if (!messages || messages.length === 0 || !params) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing messages or LLM params',
        });
    }

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const gatewayId = process.env.CLOUDFLARE_AI_GATEWAY_ID;
    const cloudflareToken = process.env.CLOUDFLARE_AI_TOKEN;
    const openAiToken = process.env.OPENAI_API_KEY;

    const config = {
        max_tokens: params.maxTokens,
        temperature: params.temperature,
        top_p: params.topP,
        top_k: params.topK,
        frequency_penalty: params.frequencyPenalty,
        presence_penalty: params.presencePenalty,
        stream: params.stream,
    };

    let endpoint = "";
    let data = {};

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': '',
    };

    if (params.model.startsWith('@cf')) {
        endpoint = 'workers-ai/v1/chat/completions';
        headers['Authorization'] = `Bearer ${cloudflareToken}`;
        data = {
            model: params.model,
            messages: messages,
            ...config,
        };
    } else if (params.model.startsWith('@openai')) {
        endpoint = 'openai/chat/completions';
        headers['Authorization'] = `Bearer ${openAiToken}`;
        data = {
            model: params.model.split('/').pop(),
            messages: messages,
            ...config,
        };
    }

    const url = `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/${endpoint}`;

    try {
        const response = await axios.post(url, data, {
            headers,
            responseType: params.stream ? 'stream' : 'json',
        });

        if (params.stream) {
            const stream = response.data;
            return sendStream(event, stream);
        } else {
            const responseData = response.data;

            // Since the response is an array of responses, extract the first item
            if (params.model.startsWith('@cf') && Array.isArray(responseData) && responseData.length > 0) {
                return responseData[0];
            } else if (params.model.startsWith('@openai') && typeof responseData === 'object') {
                return responseData['choices'][0]['message']['content'];
            } else {
                throw new Error('Invalid service provider or response data');
            }
        }
    } catch (error) {
        console.error(error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Error processing request',
        });
    }
});
