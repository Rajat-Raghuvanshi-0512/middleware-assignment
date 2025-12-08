import { render, screen, fireEvent } from '../../../helpers/render';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole('button', { name: 'Click me' })
    ).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button', { name: 'Click me' });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    expect(
      screen.getByRole('button', { name: 'Disabled Button' })
    ).toBeDisabled();
  });

  it('should apply default variant styles', () => {
    const { container } = render(<Button>Default</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-primary');
  });

  it('should apply destructive variant styles', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-destructive');
  });

  it('should apply outline variant styles', () => {
    const { container } = render(<Button variant="outline">Outline</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('border');
  });

  it('should apply secondary variant styles', () => {
    const { container } = render(
      <Button variant="secondary">Secondary</Button>
    );
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-secondary');
  });

  it('should apply ghost variant styles', () => {
    const { container } = render(<Button variant="ghost">Ghost</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('hover:bg-accent');
  });

  it('should apply link variant styles', () => {
    const { container } = render(<Button variant="link">Link</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('underline-offset-4');
  });

  it('should apply size variants', () => {
    const { container: smContainer } = render(<Button size="sm">Small</Button>);
    expect(smContainer.querySelector('button')).toHaveClass('h-8');

    const { container: lgContainer } = render(<Button size="lg">Large</Button>);
    expect(lgContainer.querySelector('button')).toHaveClass('h-10');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <Button className="custom-class">Custom</Button>
    );
    const button = container.querySelector('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should render as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    expect(
      screen.getByRole('link', { name: 'Link Button' })
    ).toBeInTheDocument();
  });

  it('should pass through other props', () => {
    render(
      <Button type="submit" aria-label="Submit form">
        Submit
      </Button>
    );
    const button = screen.getByRole('button', { name: 'Submit form' });
    expect(button).toHaveAttribute('type', 'submit');
  });
});
