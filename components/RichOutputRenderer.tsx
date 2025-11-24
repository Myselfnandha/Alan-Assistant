
import React from 'react';
import { Copy, Check, Terminal, Table } from 'lucide-react';

/**
 * LAYER 9: OUTPUT GENERATION
 * Renders raw text as structured Holographic UI components.
 * Supports: Markdown Tables, Code Blocks, Lists, Key-Value Badges.
 */

interface RichOutputRendererProps {
  content: string;
}

export const RichOutputRenderer: React.FC<RichOutputRendererProps> = ({ content }) => {
  
  // Helper to copy code to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Split content by code blocks first to handle them safely
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 text-sm leading-relaxed font-display text-alan-secondary/90">
      {parts.map((part, index) => {
        // 1. CODE BLOCKS
        if (part.startsWith('```') && part.endsWith('```')) {
          const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
          const lang = match ? match[1] : '';
          const code = match ? match[2] : part.slice(3, -3);
          
          return (
            <div key={index} className="my-4 rounded-md overflow-hidden border border-alan-primary/30 bg-black/60 shadow-[0_0_15px_rgba(0,240,255,0.05)]">
              <div className="flex justify-between items-center px-3 py-1 bg-alan-primary/10 border-b border-alan-primary/20">
                <div className="flex items-center gap-2 text-xs font-mono text-alan-primary">
                   <Terminal size={12} />
                   <span className="uppercase">{lang || 'SCRIPT'}</span>
                </div>
                <button 
                   onClick={() => copyToClipboard(code)} 
                   className="text-alan-secondary/50 hover:text-alan-primary transition-colors"
                   title="Copy to Clipboard"
                >
                   <Copy size={12} />
                </button>
              </div>
              <div className="p-3 overflow-x-auto">
                 <pre className="font-mono text-xs text-alan-success/90 whitespace-pre">{code}</pre>
              </div>
            </div>
          );
        }

        // 2. PARSE TEXT CONTENT (Tables, Lists, formatting)
        // We assume non-code parts might contain tables or formatted text.
        // Simple line-by-line parser for tables.
        const lines = part.split('\n');
        const elements: React.ReactNode[] = [];
        let inTable = false;
        let tableRows: string[][] = [];
        let tableHeader: string[] = [];

        lines.forEach((line, lineIdx) => {
            // TABLE DETECTION (Simple Pipe Check)
            if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
                const rowData = line.split('|').map(c => c.trim()).filter(c => c !== '');
                
                // Separator line (ignore but use to confirm table start)
                if (line.includes('---')) {
                    return; // Skip separator
                }

                if (!inTable) {
                    inTable = true;
                    tableHeader = rowData;
                } else {
                    tableRows.push(rowData);
                }
                
                // If next line is not table or EOF, render table
                const nextLine = lines[lineIdx + 1];
                if (!nextLine || !nextLine.trim().startsWith('|')) {
                    elements.push(
                        <div key={`table-${index}-${lineIdx}`} className="my-3 overflow-x-auto">
                            <table className="w-full border-collapse text-xs font-mono">
                                <thead>
                                    <tr className="bg-alan-primary/10 text-alan-primary border-b border-alan-primary/30">
                                        {tableHeader.map((h, i) => (
                                            <th key={i} className="p-2 text-left uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableRows.map((row, rI) => (
                                        <tr key={rI} className="border-b border-alan-primary/10 hover:bg-alan-primary/5 transition-colors">
                                            {row.map((cell, cI) => (
                                                <td key={cI} className="p-2 text-alan-secondary">{cell}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                    inTable = false;
                    tableRows = [];
                    tableHeader = [];
                }
                return;
            }

            // REGULAR TEXT
            if (line.trim() === '') {
                elements.push(<br key={`br-${index}-${lineIdx}`} />);
                return;
            }

            // List Item
            if (line.trim().startsWith('- ')) {
                 elements.push(
                    <div key={`li-${index}-${lineIdx}`} className="flex items-start gap-2 pl-2 my-1">
                        <span className="text-alan-primary mt-1.5 text-[8px]">●</span>
                        <span dangerouslySetInnerHTML={{ __html: parseInlineFormatting(line.substring(2)) }} />
                    </div>
                 );
                 return;
            }
            
            // Numbered List
            if (/^\d+\.\s/.test(line.trim())) {
                elements.push(
                   <div key={`nli-${index}-${lineIdx}`} className="flex items-start gap-2 pl-2 my-1">
                       <span className="text-alan-primary font-mono text-xs">{line.trim().split('.')[0]}.</span>
                       <span dangerouslySetInnerHTML={{ __html: parseInlineFormatting(line.replace(/^\d+\.\s/, '')) }} />
                   </div>
                );
                return;
            }

            // Paragraph (default)
            elements.push(
                <p key={`p-${index}-${lineIdx}`} className="mb-1" dangerouslySetInnerHTML={{ __html: parseInlineFormatting(line) }} />
            );
        });

        return <div key={index}>{elements}</div>;
      })}
    </div>
  );
};

// Simple inline formatter for **bold**, *italic*, [TAGS]
const parseInlineFormatting = (text: string): string => {
    let formatted = text;
    
    // Bold **text**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-alan-primary">$1</span>');
    
    // Italic *text*
    formatted = formatted.replace(/\*(.*?)\*/g, '<span class="italic text-alan-secondary/80">$1</span>');
    
    // Technical Tags [STATUS]
    formatted = formatted.replace(/\[([A-Z0-9_\s]+)\]/g, '<span class="text-[10px] font-mono bg-alan-primary/10 text-alan-primary px-1 rounded border border-alan-primary/20 tracking-wider">$1</span>');
    
    // Key-Value pairs (Key: Value) at start of line
    formatted = formatted.replace(/^([A-Za-z\s]+):/g, '<span class="text-alan-primary/80 font-bold uppercase text-xs">$1:</span>');

    return formatted;
};
