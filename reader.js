var Reader = function(){  
  'use strict';
  
  var reader = function(text){
    this.text = (text || '') + '';
    this.position = -1;
    this.length = this.text.length;
  } 
    
  reader.prototype.read = function(len){
    var value = this.peek(len);
    this.position = Math.min(this.length, this.position + (len || 1));
    return value;
  };
    
  reader.prototype.peek = function(len){
    if((this.position+1)>=this.length) return undefined;
    return this.text.substr(this.position + 1, len || 1);
  }
  
  reader.prototype.seek = function(offset, pos){
    this.position = Math.max(0,
      Math.min(this.length,
        (pos === 0 ? 0 : pos === 2 ? this.length : this.position) + 
        (offset || 1)
        )
      );      
    return this.position === this.length;
  }
  
    
  reader.prototype.readUntil = function(chars){
    if(typeof chars === 'string') chars = [chars];
    var l, rdr = this, cache = [], len = chars.length, result = { value: '', next: '' };
    
    function predicate(chr) {
      l = chr.length;
      result.next = cache[l] || (cache[l] = rdr.peek(l));
      return result.next === chr;
    }
    
    while(true) {
      cache.length = 0;
      if(chars.some(predicate)){
        this.seek(l);
        return result;
      }
      
      result.next = this.read();
      if(result.next) {
        result.value += result.next;
      } else break;
    } 
    
    return result;
  };
  
  return reader;
}();