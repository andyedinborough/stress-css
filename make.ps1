function minify-js($js) {
    $web =  new-object System.Net.WebClient
    $js = [System.Uri]::EscapeDataString($js)
    $web.Headers.Add("content-type", "application/x-www-form-urlencoded")
    $post = "output_format=text&output_info=compiled_code&compilation_level=SIMPLE_OPTIMIZATIONS&js_code=$js"
    $js = $web.UploadString("http://closure-compiler.appspot.com/compile", $post)
    return $js
}

function build-parser() {
    $parseCSS = read-text parseCSS.js
    $reader = read-text reader.js
    
    $all = "var parseCSS = (function(){ 
        $reader
        $parseCSS 
        return parseCSS; 
})();"

    write-text bin\\parseCSS.js $all
    $allmin = minify-js $all   
    write-text bin\\parseCSS.min.js $allmin
}

function read-text ($fn){
    return [System.IO.File]::ReadAllText((absolute-ref $fn))
}

function write-text ($fn, $text){
    [System.IO.File]::WriteAllText((absolute-ref $fn), $text)
}

function absolute-ref ($fn) {
    return [System.IO.Path]::Combine([System.Environment]::CurrentDirectory, $fn)
}

build-parser