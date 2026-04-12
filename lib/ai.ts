import OpenAI from 'openai'

export const nvidia = new OpenAI({
  apiKey:  process.env.NVIDIA_API_KEY!,
  baseURL: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
})

export const MODEL = process.env.NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct'

export async function askAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await nvidia.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt },
    ],
    max_tokens: 1024,
    temperature: 0.7,
  })
  return res.choices[0]?.message?.content || ''
}
