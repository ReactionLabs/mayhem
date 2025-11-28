import { useState, useCallback } from 'react';

type StreamingOptions = {
  agentType?: 'harry' | 'trading' | 'vision';
  context?: Record<string, any>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
};

export function useStreamingChat() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streamChat = useCallback(
    async (
      message: string,
      onChunk: (content: string) => void,
      onComplete: () => void,
      options: StreamingOptions = {}
    ) => {
      setIsStreaming(true);
      setError(null);

      try {
        const response = await fetch('/api/agent-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            agentType: options.agentType || 'harry',
            context: options.context || {},
            model: options.model || 'gpt-4',
            temperature: options.temperature || 0.7,
            max_tokens: options.max_tokens || 1000,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            onComplete();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.error) {
                  setError(data.error);
                  onComplete();
                  return;
                }

                if (data.content) {
                  onChunk(data.content);
                }

                if (data.done) {
                  onComplete();
                  return;
                }
              } catch (e) {
                // Skip invalid JSON
                if (process.env.NODE_ENV === 'development') {
                  console.warn('Failed to parse SSE data:', line);
                }
              }
            }
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        onComplete();
      } finally {
        setIsStreaming(false);
      }
    },
    []
  );

  return {
    streamChat,
    isStreaming,
    error,
  };
}

