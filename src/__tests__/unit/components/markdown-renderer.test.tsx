import { render, screen } from '../../helpers/render';
import { MarkdownRenderer } from '@/components/markdown-renderer';

describe('MarkdownRenderer', () => {
  it('should render content', () => {
    render(<MarkdownRenderer content="Hello world" />);
    expect(screen.getByTestId('react-markdown')).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('should render markdown content', () => {
    render(<MarkdownRenderer content="# Heading 1\n## Heading 2" />);
    expect(screen.getByTestId('react-markdown')).toBeInTheDocument();
    // The mock renders content as text, so we check for the content
    expect(screen.getByText(/# Heading 1/i)).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <MarkdownRenderer content="Test" className="custom-class" />
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('should handle empty content', () => {
    render(<MarkdownRenderer content="" />);
    expect(screen.getByTestId('react-markdown')).toBeInTheDocument();
  });

  it('should pass content to react-markdown', () => {
    const content = 'Test markdown content';
    render(<MarkdownRenderer content={content} />);
    expect(screen.getByText(content)).toBeInTheDocument();
  });

  it('should render with isUserMessage prop', () => {
    const { container } = render(
      <MarkdownRenderer content="Test" isUserMessage={false} />
    );
    expect(container.querySelector('.markdown-content')).toBeInTheDocument();
  });
});

