var parseCSS = (function(){  
	
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
	
	function Sheet(){ 
		this.media = {};
	}
	Sheet.prototype.toString = function(){
		var media = this.media;
		return Object.keys(media).map(function(name){
			return media[name];
		}).join('\n\n');
	};
	Sheet.prototype.getMedia = function(name){
		return this.media[name] || (this.media[name] = new Media(this, name));
	};  
	
	function Media(sheet, name){
		this.sheet = sheet;
		this.name = name;
		this.rules = [];
	}
	Media.prototype.toString = function(){
		var isall = this.name === 'all';
		return (isall ? '' : ('@media ' + this.name + ' {\n')) +
			this.rules
				.filter(function(rule){ return !rule.disabled; })        
				.join('\n') +
			(isall ? '' : '\n}');      
	};
	
	function Import(media, url){
		this.url = url;
		this.media = media;
	}
	Import.prototype.toString = function(){
		var tab = this.media.name === 'all' ? '' : '  ';
		return tab + '@import url("' + this.url + '");';
	};
	
	function Rule (media, selector, properties){
		this.media = media;
		this.selector = selector;
		this.disabled = false;
		this.properties = properties;
	}
	Rule.prototype.toString = function(){
		var tab = this.media.name === 'all' ? '' : '  ';
		return tab + this.selector + ' {' + this.properties.map(function(prop){
			return '\n  ' + tab + prop.name + ': ' + prop.value + ';';
		}).join('')  + '\n' + tab + '}';
	};
	
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
	
	function parseImport(text){
		var rdr = new Reader(text), block = rdr.readUntil('('), peek = rdr.peek();
		if(peek === '"' || peek === "'"){
			block = rdr.readUntil(peek);
		} else {
			block = rdr.readUntil(')');
		}
		
		return { url: block.value, media: (rdr.readAll() || 'all').trim() };
	}
			
	return function parse(css){    
		var rdr = new Reader(css), sheet = new Sheet(), media, block, temp;
		
		while(true){
			block = rdr.readQuotedUntil(['{', '}', ';']);
			block.value = block.value.trim();
			temp = block.value.toLowerCase();
			
			if(block.next === '{'){
					if(temp.substr(0,6) === '@media'){
						media = sheet.getMedia(block.value.substr(6).trim().toLowerCase());
					} else {
						if(!media) {
							media = sheet.getMedia('all');
						}

						media.rules.push(new Rule(
							media, block.value, 
							parseProperties(rdr.readQuotedUntil('}').value)
						));
					}
					
			} else if(block.next === ';') {
				if(temp.substr(0,7) === '@import') {
					var importd = parseImport(block.value), tempmedia = sheet.getMedia(importd.media);
					tempmedia.rules.push(new Import(tempmedia, importd.url));
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