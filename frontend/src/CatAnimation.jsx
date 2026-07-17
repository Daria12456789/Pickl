import React from 'react';
import './CatAnimation.css';
import catSprite from './assets/cat_sleep.png'; // Adjust path to where you save the image

const CatAnimation = () => {
  return (
    <div className="cat-container">
      <div 
        className="cat-sleeping-sprite" 
        style={{ backgroundImage: `url(${catSprite})` }}
      />
    </div>
  );
};

export default CatAnimation;
