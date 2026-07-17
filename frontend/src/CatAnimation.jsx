import React from 'react';
import './CatAnimation.css';

const CatAnimation = () => {
  return (
    <div className="cat-container">
      <div 
        className="cat-sleeping-sprite" 
        style={{ backgroundImage: `url('/assets/cat_sleep.png')` }}
      />
    </div>
  );
};

export default CatAnimation;
