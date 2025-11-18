
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center p-4 md:p-6 border-b border-brand-secondary">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
        Product Design Whiteboard Practice
      </h1>
      <p className="mt-2 text-sm sm:text-base text-brand-text-muted max-w-2xl mx-auto">
        Sharpen your product thinking skills with an AI interviewer modeled after FAANG standards.
      </p>
    </header>
  );
};

export default Header;
