// Original raster notebook studies, drawn on Canvas, never SVG.
export function drawFish(canvas,fish,known=true){
 const dpr=Math.min(devicePixelRatio||1,2);canvas.width=240*dpr;canvas.height=120*dpr;
 const c=canvas.getContext('2d');c.scale(dpr,dpr);c.clearRect(0,0,240,120);
 const color=known?fish.color:'#c1c4b6';c.save();c.translate(120,62);c.rotate(-.08);
 c.shadowColor='#43574518';c.shadowBlur=10;c.shadowOffsetY=8;
 const wide=fish.shape===3?46:fish.shape===4?64:58;const tall=fish.shape===1?19:fish.shape===3?30:24;
 c.fillStyle=color;c.beginPath();c.moveTo(-wide+9,0);c.lineTo(-wide-29,-25);c.quadraticCurveTo(-wide-34,0,-wide-29,25);c.closePath();c.fill();
 c.beginPath();c.ellipse(0,0,wide,tall,0,0,Math.PI*2);c.fill();c.shadowBlur=0;c.shadowOffsetY=0;
 c.fillStyle=known?'#eef0dba8':'#c9ccbd';c.beginPath();c.ellipse(4,9,wide*.74,tall*.42,0,0,Math.PI);c.fill();
 c.fillStyle=known?fish.color:'#b2b7ab';c.beginPath();c.moveTo(-20,-tall+3);c.quadraticCurveTo(-12,-tall-22,8,-tall-5);c.lineTo(23,-tall+4);c.fill();
 c.fillStyle=known?'#f4e4d48c':'#aeb5a6';c.beginPath();c.moveTo(-4,6);c.quadraticCurveTo(-22,32,14,24);c.lineTo(22,7);c.fill();
 if(known){c.fillStyle='#374b48';c.beginPath();c.arc(wide*.62,-4,3.4,0,Math.PI*2);c.fill();c.fillStyle='#fff9e9';c.beginPath();c.arc(wide*.62+.9,-5,1.3,0,Math.PI*2);c.fill();c.strokeStyle='#677c704a';c.lineWidth=1.3;c.beginPath();c.ellipse(wide*.48,2,4,10,.2,-1.3,1.3);c.stroke();if(fish.stars>=5){c.fillStyle='#fff9e1a0';for(let i=0;i<5;i++){c.beginPath();c.arc(-25+i*11,-4-(i%2)*6,1.8,0,Math.PI*2);c.fill();}}}
 c.restore();
}
