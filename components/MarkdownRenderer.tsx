import React from 'react';

const renderContentWithMarkdown = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentTableRows: string[][] | null = null;
    let tableHeader: string[] | null = null;

    const renderLine = (line: string) => {
        // Basic bold support
        return line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    };

    const flushTable = (key: string | number) => {
        if (currentTableRows && tableHeader) {
            elements.push(
                <table key={`table-${key}`} className="w-full my-4 border-collapse text-sm">
                    <thead>
                        <tr className="border-b-2 border-brand-secondary">
                            {tableHeader.map((header, index) => (
                                <th key={index} className="p-2 text-left font-semibold text-brand-text-muted" dangerouslySetInnerHTML={{ __html: renderLine(header) }} />
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {currentTableRows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-b border-brand-secondary/50 last:border-b-0">
                                {row.map((cell, cellIndex) => (
                                    <td key={cellIndex} className="p-2 align-top" dangerouslySetInnerHTML={{ __html: renderLine(cell) }} />
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }
        currentTableRows = null;
        tableHeader = null;
    };

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
            const cells = trimmedLine.slice(1, -1).split('|').map(cell => cell.trim());
            
            // Check for separator line e.g. |:---|:---|
            if (cells.every(cell => /^-+$/.test(cell.replace(/:/g, '')))) {
                // This is a separator line. If we have a header, we continue, otherwise we treat as normal text.
                if (!tableHeader) {
                    flushTable(index);
                    elements.push(<p key={index} className="my-1" dangerouslySetInnerHTML={{ __html: renderLine(line) }} />);
                }
            } else if (!tableHeader) { // This must be the header
                flushTable(index);
                tableHeader = cells;
                currentTableRows = [];
            } else { // This is a body row
                if (currentTableRows) {
                    currentTableRows.push(cells);
                }
            }
        } else {
            flushTable(index);
            if (trimmedLine) {
                elements.push(<p key={index} className="my-1" dangerouslySetInnerHTML={{ __html: renderLine(line) }} />);
            }
        }
    });

    flushTable('end'); // Flush any remaining table at the end

    return elements;
};


const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    if (!content) return null;
    return <>{renderContentWithMarkdown(content)}</>;
};

export default MarkdownRenderer;
