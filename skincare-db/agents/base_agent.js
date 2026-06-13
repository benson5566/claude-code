/**
 * BaseAgent — wraps the Anthropic SDK tool-use loop.
 * Each specialist agent extends this class.
 */

const Anthropic = require('@anthropic-ai/sdk');
const { runTool } = require('./tools');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

class BaseAgent {
  /**
   * @param {object} opts
   * @param {string}   opts.name        — Display name for logging
   * @param {string}   opts.model       — Model ID
   * @param {string}   opts.systemPrompt
   * @param {object[]} opts.tools       — Tool definitions this agent can use
   */
  constructor({ name, model, systemPrompt, tools = [] }) {
    this.name         = name;
    this.model        = model;
    this.systemPrompt = systemPrompt;
    this.tools        = tools;
  }

  log(msg) {
    console.log(`[${this.name}] ${msg}`);
  }

  /**
   * Run a single agentic turn until end_turn.
   * Returns the final text content block(s) joined as a string.
   */
  async run(userMessage, extraContext = '') {
    const messages = [
      { role: 'user', content: extraContext ? `${extraContext}\n\n${userMessage}` : userMessage },
    ];

    this.log(`開始執行 — "${userMessage.slice(0, 80)}..."`);

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const response = await client.messages.create({
        model:      this.model,
        max_tokens: 8096,
        thinking:   { type: 'adaptive' },
        system:     this.systemPrompt,
        tools:      this.tools,
        messages,
      });

      // Accumulate the assistant turn
      messages.push({ role: 'assistant', content: response.content });

      if (response.stop_reason === 'end_turn') {
        const text = response.content
          .filter(b => b.type === 'text')
          .map(b => b.text)
          .join('\n');
        this.log('完成');
        return text;
      }

      if (response.stop_reason === 'tool_use') {
        const toolResults = [];
        for (const block of response.content) {
          if (block.type !== 'tool_use') continue;
          this.log(`呼叫工具: ${block.name}`);
          const result = await runTool(block.name, block.input);
          toolResults.push({
            type:        'tool_result',
            tool_use_id: block.id,
            content:     JSON.stringify(result),
          });
        }
        messages.push({ role: 'user', content: toolResults });
        continue;
      }

      // Unexpected stop reason
      this.log(`意外的 stop_reason: ${response.stop_reason}`);
      break;
    }

    return '';
  }
}

module.exports = BaseAgent;
