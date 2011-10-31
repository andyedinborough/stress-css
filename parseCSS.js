var parseCSS = (function(){  
  'use strict';
  
  Reader.prototype.readQuotedUntil = function(chars){
    var result = '', block;
    if(typeof chars == 'string') chars = [chars];
    chars.push('"', "'", '/*');
    
    while(block = this.readUntil(chars)){
      result += block.value;
      if(block.next === '"' || block.next === "'"){
        result += block.next;
        block = this.readUntil(block.next);
        result += block.value + block.next;
      } else if(block.next === '/*') {
        this.readUntil('*/');
      } else break;
    }
    
    return { value: result, next: block.next };
  };  
  
  function getOrAddMedia(sheet, name){
    return sheet[name] || (sheet[name] = { name: name, rules: [] });
  }
  
  function parseProperties(text){
    var props = [], rdr = new Reader(text), block;
    
    while((block = rdr.readQuotedUntil(':')).next) {
      props.push({
        name: block.value.trim(),
        value: rdr.readQuotedUntil(';').value.trim()
      });     
    }
    
    return props;
  }
      
  return function parse(css){    
    var rdr = new Reader(css), sheet = {}, media, block, temp;
    
    while(true){
      block = rdr.readQuotedUntil(['{', '}']);
      block.value = block.value.trim();
      
      if(block.next === '{'){
          if(block.value.toLowerCase().substr(0,6) === '@media'){
            temp = block.value.substr(6).trim();
            media = getOrAddMedia(sheet, temp);
          } else {
            if(!media) {
              media = getOrAddMedia(sheet, 'all');
            }

            media.rules.push({
              selector: block.value, 
              properties: parseProperties(rdr.readQuotedUntil('}').value)
            });
          }
        
      } else {
        media = undefined;
        if(!block.next) {
          break; 
        }
      }
    }    
    
    return sheet;
  };  
})(); 