import React from 'react';

// Mock for react-markdown - renders content as text for testing
const ReactMarkdown = ({ children, components, ...props }: any) => {
  // For testing, we'll render the content as-is
  // In real usage, react-markdown would parse the markdown
  const content = typeof children === 'string' ? children : String(children);

  // If custom components are provided, use them (for testing component props)
  if (components) {
    // This is a simplified mock - in real tests, you might want to test
    // that the right components are passed to react-markdown
    return <div data-testid="react-markdown">{content}</div>;
  }

  return <div data-testid="react-markdown">{content}</div>;
};

export default ReactMarkdown;
