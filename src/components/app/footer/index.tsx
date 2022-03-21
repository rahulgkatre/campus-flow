
interface FooterProps {
  className?: string;
}

export function AppFooter({className = ''}: FooterProps) {
    return (
      <footer className={`w-full flex flex-col items-center z-0 bg-cyan-400 py-3 flex-shrink-0 mt-auto print:hidden ${className}`}>
        <div className="container d-flex flex-column align-items-center">
          <p className="text-white text-center block md:hidden">Created by Mudit Gupta.</p>
          <p className="text-white text-center hidden md:block">Created with React + TS by Mudit Gupta. Last updated Jan 27, 2021.</p>
        </div>
      </footer>
    );
}
