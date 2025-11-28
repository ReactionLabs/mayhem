/**
 * Message Renderer Component
 * Renders Harry's messages with proper formatting, markdown support, and clean display
 */

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageRendererProps {
  content: string;
  type?: 'text' | 'action' | 'result';
  className?: string;
}

export const MessageRenderer: React.FC<MessageRendererProps> = ({ content, type, className }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract JSON blocks and format them
  const formatContent = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Match JSON code blocks
    const jsonBlockRegex = /```json\n([\s\S]*?)```/g;
    let match;

    while ((match = jsonBlockRegex.exec(text)) !== null) {
      // Add text before the JSON block
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        parts.push(formatMarkdown(beforeText));
      }

      // Add formatted JSON
      try {
        const jsonData = JSON.parse(match[1]);
        const formattedJson = JSON.stringify(jsonData, null, 2);
        parts.push(
          <div key={`json-${match.index}`} className="my-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">Wallet Details</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={() => copyToClipboard(formattedJson)}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
            <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto border">
              <code>{formattedJson}</code>
            </pre>
          </div>
        );
      } catch {
        // If JSON parsing fails, just show as code block
        parts.push(
          <pre key={`json-${match.index}`} className="bg-muted p-3 rounded-md text-xs overflow-x-auto my-2">
            <code>{match[1]}</code>
          </pre>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(formatMarkdown(text.slice(lastIndex)));
    }

    return parts.length > 0 ? parts : [formatMarkdown(text)];
  };

  // Simple markdown formatter
  const formatMarkdown = (text: string): React.ReactNode => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, index) => {
      // Headers
      if (line.startsWith('## ')) {
        elements.push(
          <h3 key={index} className="text-base font-semibold mt-3 mb-2 first:mt-0">
            {line.replace('## ', '')}
          </h3>
        );
      } else if (line.startsWith('**') && line.endsWith('**')) {
        // Bold text
        const boldText = line.replace(/\*\*/g, '');
        elements.push(
          <p key={index} className="font-semibold my-1">
            {boldText}
          </p>
        );
      } else if (line.trim().startsWith('- ')) {
        // List items
        const listText = line.replace(/^-\s*/, '');
        elements.push(
          <li key={index} className="ml-4 my-1">
            {formatInlineMarkdown(listText)}
          </li>
        );
      } else if (line.trim().startsWith('⚠️') || line.trim().startsWith('✅') || line.trim().startsWith('🚀')) {
        // Emoji lines
        elements.push(
          <p key={index} className="my-2 flex items-start gap-2">
            <span className="text-lg">{line.match(/[⚠️✅🚀🎯📈🎨💬🤖]/)?.[0]}</span>
            <span>{formatInlineMarkdown(line.replace(/[⚠️✅🚀🎯📈🎨💬🤖]\s*/, ''))}</span>
          </p>
        );
      } else if (line.trim().startsWith('🔗')) {
        // Links
        const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          elements.push(
            <a
              key={index}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1 my-2"
            >
              {linkMatch[1]}
              <ExternalLink className="w-3 h-3" />
            </a>
          );
        } else {
          elements.push(<p key={index} className="my-1">{formatInlineMarkdown(line)}</p>);
        }
      } else if (line.trim() === '') {
        elements.push(<br key={index} />);
      } else {
        elements.push(
          <p key={index} className="my-1">
            {formatInlineMarkdown(line)}
          </p>
        );
      }
    });

    return <div>{elements}</div>;
  };

  // Format inline markdown (bold, code, links)
  const formatInlineMarkdown = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Match inline code
    const codeRegex = /`([^`]+)`/g;
    let match;

    while ((match = codeRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      parts.push(
        <code key={`code-${match.index}`} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
          {match[1]}
        </code>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? <>{parts}</> : text;
  };

  return (
    <div className={cn('text-sm', className)}>
      {formatContent(content)}
    </div>
  );
};

