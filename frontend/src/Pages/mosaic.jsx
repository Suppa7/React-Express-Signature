import React, { useEffect, useState } from 'react';
import '../SignatureMosaic.css' 

//สำหรับแก้ไขจำนวนช่องทั้งหมด โดยคิดจากขนาดการแสดงผล 1920*1080 หากแก้ในส่วนนี้ต้องแก้ในส่วนของขนาดภาพใน SignatureMosaic.css ด้วย
const ROWS = 9;
const COLS = 16;
const TOTAL_TILES = ROWS * COLS;

const SignatureMosaic = () => {
  const [tiles, setTiles] = useState([]);
  const [signatures, setSignatures] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
  const initialTiles = Array.from({ length: TOTAL_TILES }, (_, i) => ({
    id: i,
    signed: false,
    imageUrl: null
  }));

  fetch(import.meta.env.VITE_API_URL + '/signatures')
    .then(res => res.json())
    .then(data => {
      const images = data; // [{ id, image }]
      const mappingKey = 'tileImageMapping';
      let mapping = JSON.parse(localStorage.getItem(mappingKey)) || {};

      // กรองเฉพาะ mapping ที่ยังมีรูปจริง
      const updatedMapping = {};
      const existingIdsSet = new Set(images.map(img => String(img.id)));

      for (const [imgId, tileIndex] of Object.entries(mapping)) {
        if (existingIdsSet.has(imgId)) {
          updatedMapping[imgId] = tileIndex;
        }
      }

      // ถ้าจำนวนใน mapping ไม่เท่ากับจำนวนรูป → แสดงว่ามีรูปเพิ่มหรือลบ
      const isChanged = Object.keys(updatedMapping).length !== images.length;
      mapping = updatedMapping;

      // ถ้ามีการเปลี่ยนแปลงรูป → สร้าง mapping ใหม่เฉพาะสำหรับรูปใหม่
      if (isChanged) {
        // หา id ที่ยังไม่มีใน mapping (แสดงว่าคือรูปใหม่)
        const existingIds = Object.keys(mapping);
        const newImages = images.filter(img => !existingIds.includes(String(img.id)));

        // หา index ของ tile ที่ยังไม่ถูกใช้
        const usedIndexes = new Set(Object.values(mapping));
        let availableIndexes = [...Array(TOTAL_TILES).keys()].filter(i => !usedIndexes.has(i));

        // วางรูปใหม่ลงในตำแหน่งว่าง
        for (let img of newImages) {
          if (availableIndexes.length === 0) break;
          const randomIndex = Math.floor(Math.random() * availableIndexes.length);
          const tileIndex = availableIndexes.splice(randomIndex, 1)[0];
          mapping[img.id] = tileIndex;
        }

        // บันทึก mapping ใหม่
        localStorage.setItem(mappingKey, JSON.stringify(mapping));
      }

      // ใช้ mapping ในการอัปเดต tile
      const updated = [...initialTiles];
      for (let img of images) {
        const tileIndex = mapping[img.id];
        if (tileIndex != null && tileIndex < TOTAL_TILES) {
          updated[tileIndex] = {
            ...updated[tileIndex],
            signed: true,
            imageUrl: img.image
          };
        }
      }

      setTiles(updated);
      setSignatures(images);
      console.log(`${images.length} tiles are signed out of ${TOTAL_TILES}`);
    });
}, []);



  const handleTileClick = (imageUrl) => {
    if (imageUrl) {
      setSelectedImage(imageUrl);
      setPopupOpen(true);
    }
  };

  const closePopup = () => {
    setPopupOpen(false);
    setTimeout(() => setSelectedImage(null), 500);
  };

  return (
    <>
      <div id="mosaic">
        {tiles.map((tile, index) => {
          const row = Math.floor(index / COLS);
          const col = index % COLS;
          const backgroundPosition = `-${col * 120}px -${row * 120}px`; //ขนาดภาพ

          return (
            <div key={index} className={`tile ${tile.signed ? 'signed' : ''}`} onClick={() => handleTileClick(tile.imageUrl)}>
              <div className="background-layer" style={{ backgroundPosition }} />
              {tile.signed && (
                <div className="overlay" style={{ backgroundImage: `url(${tile.imageUrl})` }} />
              )}
            </div>
          );
        })}
      </div>

      {popupOpen && selectedImage && (
        <div className="popup-overlay active" onClick={closePopup}>
          <div className="simple-popup" onClick={(e) => e.stopPropagation()}>  
            <img src={selectedImage} alt="Signature" className="popup-image" />
          </div>
        </div>
      )}
    </>
  );
};

export default SignatureMosaic;

