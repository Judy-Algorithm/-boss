export function bubblePosition({anchorX,anchorY,width,height,bubbleWidth,bubbleHeight,top=8,bottom=8}){
 const margin=10,x=Math.max(margin,Math.min(width-bubbleWidth-margin,anchorX-bubbleWidth/2));
 const y=Math.max(top,Math.min(height-bottom-bubbleHeight,anchorY-bubbleHeight-10));
 return {x,y,tail:Math.max(12,Math.min(bubbleWidth-12,anchorX-x))};
}
