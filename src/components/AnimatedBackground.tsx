import React from 'react';
import { NeuralNoise } from './ui/neural-noise';

export const AnimatedBackground: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  if (darkMode) {
    return (
      <div className="fixed inset-0 z-[-1] pointer-events-none bg-black">
        <NeuralNoise color={[1.0, 0.384, 0.169]} opacity={0.8} speed={0.001} />
      </div>
    );
  }

  // Modo claro: fundo #FAF7F5 com grade sutil alaranjada/neutra idêntica à imagem
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none" style={{ backgroundColor: '#FAF7F5' }}>
      {/* Grade quadriculada em tom alaranjado sutil */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255, 84, 36, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 84, 36, 0.08) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
    </div>
  );
};
