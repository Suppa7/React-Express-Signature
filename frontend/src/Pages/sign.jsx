import React, { useRef, useState, useEffect} from "react";
import SignatureCanvas from "react-signature-canvas";
import '../index.css' //แก้ css แก้ที่ไฟล์นี้

function SignaturePad() {
  const signRef = useRef();
  const [url, setUrl] = useState("");

  //logic ปุ่ม clear
  const handleClear = () => {
    signRef.current.clear();
     drawLogo(); //วาดโลโก้ขึ้นใหม่ทุกครั้งทีกด clear
  };
  //สำหรับสร้าง logo 
  const drawLogo = () => {
    const canvas = signRef.current.getCanvas(); 
    const ctx = canvas.getContext("2d");
    const logo = new Image();
    logo.src = "/liblogo.png"; // โหลดภาพ logo จาก public
    logo.onload = () => {
      ctx.drawImage(logo, 15, 15, 300, 60); // ปรับตำแหน่งและขนาดโลโก้
    };
  };
  useEffect(() => {
    if (signRef.current) {
      drawLogo();
    }
  }, []);

  //logic ปุ่ม upload ภาพ 
  const handleUpload = async () => {
    //เช็กภาพว่าว่างหรือไม่
    if (!signRef.current.isEmpty()) {
      signRef.current.getCanvas().toBlob(async (blob) => {
        try { 
          const formData = new FormData();
          formData.append("signature", blob, "signature.png");
      
          const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

          const res = await fetch(`${baseUrl}/upload`, {
            method: "POST",
            body: formData,
          });

          if (!res.ok) throw new Error("Network response was not ok");

          const data = await res.json();
          console.log("Image URL in server:", data.url);

          alert("อัปโหลดสำเร็จ!");
          // รีเฟรชหน้า
          window.location.reload();
        } catch (error) {
          console.error("Upload error:", error);
          alert("เกิดข้อผิดพลาดในการอัปโหลด กรุณาลองใหม่อีกครั้ง");
        }
      });
    } else {
      alert("กรุณาเซ็นก่อนอัปโหลด");
    }
  };

  //สิ่งที่เป็น html สำหรับการแสดงในหน้าเว็บ
  return (
    <div>
      <div>
        <h1>Welcome to Khunying Long Athakravusunthorn</h1>
        <h2>Exhibition Room</h2>
      </div>
      <div className="divsign" style={{ border: "2px solid #003C71", width: 1200, height: 800, backgroundColor: "white", borderRadius: "5px" }}>
        <SignatureCanvas
          penColor="red"
          canvasProps={{ width: 1200, height: 800, className: "sigCanvas" }}
          ref={signRef}
        />
      </div>
      <div className="btnbox">
        <button onClick={handleClear} className="btn btn-clear">Clear</button>
        <button onClick={handleUpload} className="btn btn-upload">Upload</button>
      </div>
    </div>
  );
}

export default SignaturePad;
